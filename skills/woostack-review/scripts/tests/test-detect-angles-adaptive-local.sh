#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$(cd "$DIR/../../.." && pwd)"
source "$ROOT/skills/woostack-init/scripts/tests/assert.sh"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
repo="$work/repo"; mkdir -p "$repo/src" "$repo/tests" "$work/bin"
unset GITHUB_ACTIONS GITHUB_OUTPUT INPUT_DISABLE_ANGLES
export CI=false
cat > "$work/bin/gh" <<'SH'
#!/usr/bin/env bash
if [ "${1:-}" = api ] && [ "${2:-}" = user ]; then printf 'tester\n'; exit 0; fi
printf 'unexpected gh invocation: %s\n' "$*" >&2
exit 97
SH
chmod +x "$work/bin/gh"
git -C "$repo" init -q
git -C "$repo" config user.email test@example.com
git -C "$repo" config user.name "Test User"
printf 'const previous = 1;\n' > "$repo/src/value.js"
printf 'const previous = 1;\n' > "$repo/tests/value.test.js"
printf 'Previous behavior\n' > "$repo/README.md"
git -C "$repo" add .; git -C "$repo" commit -q -m base
python3 - "$repo" <<'PY'
from pathlib import Path
import sys
repo = Path(sys.argv[1])
for name in ('src/value.js', 'tests/value.test.js'):
    (repo / name).write_text(''.join(f'const value{i} = {i};\n' for i in range(12)))
(repo / 'README.md').write_text('Current behavior\n')
PY
git -C "$repo" add .; git -C "$repo" commit -q -m change
meta="$(git -C "$repo" diff --numstat HEAD~1 HEAD | jq -Rn \
  --arg head "$(git -C "$repo" rev-parse HEAD)" \
  '{headRefOid:$head,headRefName:"feature/value",baseRefName:"main",title:"value change",body:"",author:{login:"human"},files:[inputs|split("\t")|{path:.[2],additions:(.[0]|tonumber),deletions:(.[1]|tonumber)}]}')"
diff="$(git -C "$repo" diff --no-ext-diff HEAD~1 HEAD)"
export OUTDIR="$work/prefetched"
(
  cd "$repo"
  PATH="$work/bin:$PATH" PR_NUMBER=1 GITHUB_REPOSITORY=owner/repo GITHUB_WORKSPACE="$repo" \
    WOO_REVIEW_TEST_MODE=1 WOO_REVIEW_FAKE_PR_REVIEWS_JSON='{"reviews":[]}' \
    WOO_REVIEW_FAKE_BOT_COMMENTS=0 WOO_REVIEW_FAKE_META_JSON="$meta" \
    WOO_REVIEW_FAKE_FULL_DIFF="$diff" \
    WOO_REVIEW_FAKE_PRIOR_THREADS_JSON='{"data":{"repository":{"pullRequest":{"reviewThreads":{"nodes":[]}}}}}' \
    bash "$DIR/prefetch.sh"
) > "$work/prefetch.log" 2>&1
printf 'Preserve externally observable results.\n' > "$OUTDIR/rules.md"
printf 'Caller-approved value change.\n' > "$OUTDIR/intent.md"
bash "$DIR/detect-angles.sh" >/dev/null
assert_eq "$(cat "$OUTDIR/angles.txt")" "general" "real local prefetch combines correctness, rules, acceptance, docs, and tests into one reviewer"

# Each exclusion starts from the same completed prefetch, not a bare synthetic diff.
fresh() {
  export OUTDIR="$work/$1"
  mkdir -p "$OUTDIR"
  cp "$work/prefetched/meta.json" "$work/prefetched/diff.txt" \
    "$work/prefetched/rules.md" "$work/prefetched/intent.md" "$OUTDIR/"
  printf '{"angles":{"force":[],"skip":[]}}\n' > "$OUTDIR/config.json"
}
printf '{"angle":"bugs","chunk":null,"runner":"test","model":"test-model","tier":"standard","ts":"t","authority":"advisory-only"}\n' > "$OUTDIR/receipt.general.json"
rc=0; bash "$DIR/verify-receipts.sh" >/dev/null 2>&1 || rc=$?
assert_exit 1 "$rc" "holistic queue cannot borrow another angle receipt"
jq '.angle = "general"' "$OUTDIR/receipt.general.json" > "$work/receipt.json"
mv "$work/receipt.json" "$OUTDIR/receipt.general.json"
bash "$DIR/verify-receipts.sh" >/dev/null
assert_specialists() {
  assert_eq "$(grep -cx general "$OUTDIR/angles.txt" || true)" "0" "$1 retains specialists"
  assert_contains "$(cat "$OUTDIR/angles.txt")" "bugs" "$1 retains correctness"
  assert_contains "$(cat "$OUTDIR/angles.txt")" "acceptance" "$1 retains contract review"
}
fresh ci
GITHUB_ACTIONS=true bash "$DIR/detect-angles.sh" >/dev/null
assert_specialists CI
fresh audit
jq '.baseRefName = "audit"' "$OUTDIR/meta.json" > "$work/meta.json"; mv "$work/meta.json" "$OUTDIR/meta.json"
bash "$DIR/detect-angles.sh" >/dev/null
assert_specialists audit
fresh forced
printf '{"angles":{"force":["simplify"],"skip":[]}}\n' > "$OUTDIR/config.json"
bash "$DIR/detect-angles.sh" >/dev/null
assert_specialists override
assert_contains "$(cat "$OUTDIR/angles.txt")" simplify "forced specialist is not absorbed"
fresh skipped
INPUT_DISABLE_ANGLES=docs bash "$DIR/detect-angles.sh" >/dev/null
assert_specialists skip
assert_eq "$(grep -cx docs "$OUTDIR/angles.txt" || true)" "0" "explicit skip remains effective"
fresh risk
printf '\n+const PASSWORD = value;\n' >> "$OUTDIR/diff.txt"
bash "$DIR/detect-angles.sh" >/dev/null
assert_specialists risk
assert_contains "$(cat "$OUTDIR/angles.txt")" security "security signal retains its specialist"
fresh chunks
printf 'chunk-0\nchunk-1\n' > "$OUTDIR/chunks.txt"
bash "$DIR/detect-angles.sh" >/dev/null
assert_specialists chunking
fresh broad
jq '.files[0].additions = 201' "$OUTDIR/meta.json" > "$work/meta.json"; mv "$work/meta.json" "$OUTDIR/meta.json"
bash "$DIR/detect-angles.sh" >/dev/null
assert_specialists broad
fresh many-files
python3 - "$OUTDIR" <<'PY'
import json, sys
from pathlib import Path
out = Path(sys.argv[1])
meta = json.loads((out / 'meta.json').read_text())
with (out / 'diff.txt').open('a') as diff:
    for index in range(3):
        path = f'src/extra{index}.js'
        meta['files'].append({'path': path, 'additions': 1, 'deletions': 0})
        diff.write(f'diff --git a/{path} b/{path}\n--- /dev/null\n+++ b/{path}\n@@ -0,0 +1 @@\n+const extra = 1;\n')
(out / 'meta.json').write_text(json.dumps(meta))
PY
bash "$DIR/detect-angles.sh" >/dev/null
assert_specialists file-fanout
fresh mismatched-counts
jq '.files[0].additions = 0' "$OUTDIR/meta.json" > "$work/meta.json"; mv "$work/meta.json" "$OUTDIR/meta.json"
bash "$DIR/detect-angles.sh" >/dev/null
assert_specialists mismatched-counts
fresh incomplete
jq 'del(.files[0].additions)' "$OUTDIR/meta.json" > "$work/meta.json"; mv "$work/meta.json" "$OUTDIR/meta.json"
bash "$DIR/detect-angles.sh" >/dev/null
assert_specialists incomplete
fresh mode
printf '\nold mode 100644\nnew mode 100755\n' >> "$OUTDIR/diff.txt"
bash "$DIR/detect-angles.sh" >/dev/null
assert_specialists mode-change
finish
