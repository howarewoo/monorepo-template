#!/usr/bin/env python3
"""Render the finalized finding set; receipt and fresh GitHub reads precede this step."""
import json
import os
from pathlib import Path
import re
import sys

outdir = Path(os.environ["OUTDIR"])
body_path = Path(sys.argv[1])
findings = json.loads((outdir / "findings.json").read_text())
priors = json.loads((outdir / "prior-findings.json").read_text())
meta = json.loads((outdir / "meta.json").read_text())
head = os.environ["HEAD_SHA"]
if not re.fullmatch(r"[0-9a-f]{40}(?:[0-9a-f]{24})?", head) or meta.get("headRefOid") != head:
    raise SystemExit("review payload: reviewed head does not match prefetched identity")
if not isinstance(findings, list) or not isinstance(priors, list):
    raise SystemExit("review payload: findings and prior threads must be arrays")
if any(not isinstance(prior, dict) or prior.get("status") not in {"open", "resolved"} for prior in priors):
    raise SystemExit("review payload: malformed prior thread")
for finding in findings:
    if not isinstance(finding, dict):
        raise SystemExit("review payload: malformed finalized finding")
    if any(not isinstance(finding.get(key), str) or not finding[key].strip()
           for key in ("file", "title", "description", "fix", "angle", "severity")):
        raise SystemExit("review payload: missing finding text")
    if any(not isinstance(finding.get(key), bool) for key in ("blocking", "nit", "inline")):
        raise SystemExit("review payload: finding has not been finalized")
    line = finding.get("line")
    end = finding.get("end_line")
    if isinstance(line, bool) or not isinstance(line, int) or line <= 0:
        raise SystemExit("review payload: invalid line")
    if end is not None and (isinstance(end, bool) or not isinstance(end, int) or end <= line):
        raise SystemExit("review payload: invalid range")

body = body_path.read_text()
event = "REQUEST_CHANGES" if (any(f["blocking"] for f in findings)
    or any(p["status"] == "open" for p in priors)) else "APPROVE"
author = os.environ.get("IMPLEMENTATION_AUTHOR_GITHUB_USER_ID", "")
actor = os.environ.get("AUTH_GITHUB_USER_ID", "")
if not (re.fullmatch(r"[1-9][0-9]*", author) and re.fullmatch(r"[1-9][0-9]*", actor) and actor != author):
    body = body.rstrip() + (
        "\n\n_Review event delivered as COMMENT because distinct native GitHub "
        "implementation-author and reviewer principal IDs were not both proven. "
        "The status line above carries the actual verdict._\n"
    )
    event = "COMMENT"

comments = []
general = []
for finding in findings:
    title = finding["title"].strip()
    if finding["nit"] and not title.lower().startswith("nit:"):
        title = f"Nit: {title}"
    text = f"**{title}**\n\n{finding['description'].strip()}"
    deferred = re.sub(r"[`_*\[\]<>\n\r]", "", (finding.get("deferred_to") or "").strip())
    if deferred:
        text += f"\n\n_Deferred to {deferred}; non-blocking._"
    text += f"\n\nFix: {finding['fix'].strip()}"
    suggestion = finding.get("suggestion")
    if finding.get("fix_type") == "suggestion" and suggestion:
        # Preserve replacement text in general comments, but never offer an
        # apply-suggestion action without a resolved inline location.
        safe = "\n".join(line.replace("`", "'") if re.match(r"^\s*`{3,}", line) else line
                         for line in suggestion.splitlines())
        fence = "suggestion" if finding["inline"] else "text"
        text += f"\n\n```{fence}\n{safe}\n```"
    severity = finding["severity"]
    if severity not in {"HIGH", "MEDIUM", "LOW"}:
        raise SystemExit("review payload: invalid severity")
    if finding["nit"]:
        severity += " · NIT"
    elif finding["blocking"]:
        severity += " · BLOCKING"
    angle = finding["angle"]
    if not re.fullmatch(r"[a-z]+(?:-[a-z]+)*", angle):
        raise SystemExit("review payload: invalid angle")
    text += f"\n\n<sub>— <strong>{severity}</strong> · <code>{angle}</code></sub>"
    if not finding["inline"]:
        location = json.dumps({key: finding[key] for key in ("file", "line", "end_line") if key in finding})
        location = location.replace("`", "\\u0060")
        general.append(f"{text}\n\nReported location (not inline): `{location}`")
        continue
    comment = {"path": finding["file"], "line": finding["line"], "side": "RIGHT", "body": text}
    if finding.get("end_line") is not None:
        comment.update(start_line=finding["line"], start_side="RIGHT", line=finding["end_line"])
    comments.append(comment)
if general:
    body += "\n\n## Findings without inline anchors\n\n" + "\n\n---\n\n".join(general)
json.dump({"commit_id": head, "body": body, "event": event, "comments": comments}, sys.stdout)
sys.stdout.write("\n")
