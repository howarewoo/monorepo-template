#!/usr/bin/env python3
"""Owner-only local run storage. Workflow admission remains the caller's responsibility."""

import argparse
from contextlib import ExitStack
import fcntl
import json
import os
from pathlib import PurePath
import re
import stat
import subprocess
import sys
import uuid


FILES = {"manifest": "manifest.json", "spec": "project-spec.md", "plan": "execution-plan.md"}
IDENTITY = ("manifestVersion", "runId", "repoRoot", "workflow", "canonicalRepository")
DIR_FLAGS = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
FILE_FLAGS = os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK


class StoreError(Exception):
    pass


def require(condition, message):
    if not condition:
        raise StoreError(message)


def inode(info):
    return info.st_dev, info.st_ino


def directory(stack, path, parent=None):
    fd = os.open(path, DIR_FLAGS, dir_fd=parent)
    stack.callback(os.close, fd)
    return fd


def repository(stack, root):
    fd = directory(stack, "/")
    for part in PurePath(root).parts[1:]:
        fd = directory(stack, part, fd)
    return fd


def private(info, mode, device, name):
    kind = stat.S_ISDIR if mode == 0o700 else stat.S_ISREG
    require(kind(info.st_mode) and info.st_uid == os.geteuid()
            and stat.S_IMODE(info.st_mode) == mode and info.st_dev == device,
            f"unsafe owner, mode, type, or filesystem: {name}")
    if mode == 0o600:
        require(info.st_nlink == 1, f"hard-linked file: {name}")


def file_bytes(run_fd, name):
    fd = os.open(name, FILE_FLAGS, dir_fd=run_fd)
    with os.fdopen(fd, "rb") as stream:
        before = os.fstat(stream.fileno())
        private(before, 0o600, os.fstat(run_fd).st_dev, name)
        data = stream.read()
        after = os.fstat(stream.fileno())
        private(after, 0o600, os.fstat(run_fd).st_dev, name)
        require((before.st_size, before.st_mtime_ns, before.st_ctime_ns)
                == (after.st_size, after.st_mtime_ns, after.st_ctime_ns),
                f"file changed while reading: {name}")
        return data


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, f"duplicate JSON key: {key}")
        result[key] = value
    return result


def invalid_constant(value):
    raise StoreError(f"non-JSON constant: {value}")


def manifest(data, root, run_id):
    value = json.loads(data.decode("utf-8"), object_pairs_hook=unique_object,
                       parse_constant=invalid_constant)
    require(isinstance(value, dict), "manifest must be a JSON object")
    require(type(value.get("manifestVersion")) is int and value["manifestVersion"] == 1,
            "unsupported manifestVersion; retain the run unchanged")
    require(value.get("runId") == run_id and value.get("repoRoot") == root,
            "manifest runId/repoRoot does not match the exact run/repository")
    revision = value.get("manifestRevision")
    require(type(revision) is int and revision >= 0, "manifestRevision must be a nonnegative integer")
    return value


class RunStore:
    def __init__(self, stack, root, run_id, create):
        self.root, self.run_id = root, run_id
        self.root_fd = repository(stack, root)
        git_env = {key: value for key, value in os.environ.items() if not key.startswith("GIT_")}

        def git(*args):
            result = subprocess.run(["git", "-C", root, *args], env=git_env,
                                    capture_output=True, check=False)
            require(result.returncode == 0, f"Git admission failed: {' '.join(args)}")
            return result.stdout

        require(os.fsdecode(git("rev-parse", "--show-toplevel")).rstrip("\n") == root,
                "--repo must be the canonical Git worktree root")
        git("check-ignore", "--quiet", "--", ".woostack/tmp/")
        require(not git("ls-files", "-z", "--", ".woostack/tmp/"),
                ".woostack/tmp/ contains tracked files")
        self.run_fd = self.open_run(stack, create)
        if create:
            entries = os.listdir(self.run_fd)
            require(not entries or ".lock" in entries, "existing run has no lock; retain for explicit recovery")
            try:
                lock_fd = os.open(".lock", os.O_RDWR | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                                  0o600, dir_fd=self.run_fd)
            except FileExistsError:
                pass
            else:
                with os.fdopen(lock_fd, "wb") as stream:
                    os.fchmod(stream.fileno(), 0o600)
                    os.fsync(stream.fileno())
                os.fsync(self.run_fd)
        self.lock_fd = os.open(".lock", FILE_FLAGS, dir_fd=self.run_fd)
        stack.callback(os.close, self.lock_fd)
        private(os.fstat(self.lock_fd), 0o600, os.fstat(self.run_fd).st_dev, ".lock")
        fcntl.flock(self.lock_fd, fcntl.LOCK_EX)
        self.reopen()

    def open_run(self, stack, create=False):
        parent = repository(stack, self.root)
        require(inode(os.fstat(parent)) == inode(os.fstat(self.root_fd)), "repository path changed")
        for part in (".woostack", "tmp", "runs", self.run_id):
            if create:
                try:
                    os.mkdir(part, 0o700, dir_fd=parent)
                except FileExistsError:
                    pass
                else:
                    os.fsync(parent)
            parent = directory(stack, part, parent)
            info = os.fstat(parent)
            require(info.st_uid == os.geteuid() and not (stat.S_IMODE(info.st_mode) & 0o022),
                    f"foreign-owned or group/world-writable directory: {part}")
        private(info, 0o700, os.fstat(self.root_fd).st_dev, self.run_id)
        return parent

    def reopen(self):
        with ExitStack() as stack:
            fd = self.open_run(stack)
            require(inode(os.fstat(fd)) == inode(os.fstat(self.run_fd)), "run directory changed")
            lock = os.open(".lock", FILE_FLAGS, dir_fd=fd)
            stack.callback(os.close, lock)
            private(os.fstat(lock), 0o600, os.fstat(fd).st_dev, ".lock")
            require(inode(os.fstat(lock)) == inode(os.fstat(self.lock_fd)), "run lock changed")

    def snapshot(self):
        self.reopen()
        entries = set(os.listdir(self.run_fd))
        unexpected = entries - set(FILES.values()) - {".lock"}
        require(not unexpected, f"unexpected entries; retain for explicit recovery: {sorted(unexpected)}")
        return {name: file_bytes(self.run_fd, name) for name in FILES.values() if name in entries}

    def write(self, name, data, replace):
        temporary = f".tmp-{uuid.uuid4().hex}"
        fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                     0o600, dir_fd=self.run_fd)
        created = os.fstat(fd)
        try:
            with os.fdopen(fd, "wb") as stream:
                os.fchmod(stream.fileno(), 0o600)
                stream.write(data)
                stream.flush()
                os.fsync(stream.fileno())
            self.reopen()
            if not replace:
                try:
                    os.stat(name, dir_fd=self.run_fd, follow_symlinks=False)
                except FileNotFoundError:
                    pass
                else:
                    raise StoreError(f"write-once artifact already exists: {name}")
            os.rename(temporary, name, src_dir_fd=self.run_fd, dst_dir_fd=self.run_fd)
            os.fsync(self.run_fd)
        finally:
            try:
                pending = os.stat(temporary, dir_fd=self.run_fd, follow_symlinks=False)
            except FileNotFoundError:
                pass
            else:
                require(inode(pending) == inode(created), "temporary file changed; retain for recovery")
                os.unlink(temporary, dir_fd=self.run_fd)
                os.fsync(self.run_fd)


def run(args, data):
    require(".." not in PurePath(args.repo).parts, "repository path traversal is forbidden")
    root = os.path.abspath(args.repo)
    require(re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*", args.run) is not None,
            "run ID must be one exact safe path component")
    incoming = manifest(data, root, args.run) if args.command in ("init", "update") else None
    if args.command in ("write-spec", "write-plan"):
        require(data.decode("utf-8").strip(), "final Markdown must not be empty")
    with ExitStack() as stack:
        store = RunStore(stack, root, args.run, args.command == "init")
        before = store.snapshot()
        current = manifest(before[FILES["manifest"]], root, args.run) if FILES["manifest"] in before else None
        if args.command == "init":
            require(not before, "run already contains artifacts; read and recover, never reinitialize")
            name = FILES["manifest"]
        else:
            require(current is not None, "manifest missing; retain the run for explicit recovery")
            if args.command == "read":
                name = FILES[args.artifact]
                require(name in before, f"artifact not written: {name}")
                return before[name]
            if args.command == "update":
                require(current["manifestRevision"] == args.expected_revision,
                        "stale manifest revision; read and reconcile before another update")
                require(incoming["manifestRevision"] == args.expected_revision + 1,
                        "replacement manifestRevision must equal expected revision + 1")
                require(all((key in current, current.get(key)) == (key in incoming, incoming.get(key))
                            for key in IDENTITY), "immutable run/repository identity changed")
                name = FILES["manifest"]
            else:
                name = FILES["spec" if args.command == "write-spec" else "plan"]
                require(name not in before, f"write-once artifact already exists: {name}")
        store.write(name, data, args.command == "update")
        after = store.snapshot()
        require(after.get(name) == data and all(after.get(key) == value for key, value in before.items()
                                               if key != name), "independent read-back mismatch")
        manifest(after[FILES["manifest"]], root, args.run)
        return after[name]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True)
    parser.add_argument("--run", required=True)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("init", help="create manifest from complete JSON stdin")
    reader = commands.add_parser("read", help="read independently admitted bytes")
    reader.add_argument("--artifact", choices=FILES, default="manifest")
    update = commands.add_parser("update", help="replace manifest from complete JSON stdin")
    update.add_argument("--expected-revision", required=True, type=int)
    commands.add_parser("write-spec", help="write final specification from Markdown stdin once")
    commands.add_parser("write-plan", help="write final execution plan from Markdown stdin once")
    args = parser.parse_args()
    os.umask(0o077)
    try:
        data = b"" if args.command == "read" else sys.stdin.buffer.read()
        sys.stdout.buffer.write(run(args, data))
        sys.stdout.buffer.flush()
    except (StoreError, OSError, ValueError) as error:
        print(f"run-store: {error}. Stop; a write may already be committed. Read the same run before "
              "reconciling; never delete or blindly replay it.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
