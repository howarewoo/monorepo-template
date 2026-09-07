#!/usr/bin/env bash
set -euo pipefail

# shellcheck source=skills/woostack-review/scripts/resolve-outdir.sh
source "$(dirname "${BASH_SOURCE[0]:-$0}")/resolve-outdir.sh"
MERGED_FILE="$OUTDIR/raw_findings.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"

# Final findings are owned by the sole adjudicator and deterministic finalizer. Adjudicator and
# final artifacts are excluded from candidate merging.
shopt -s nullglob
ALL=("$OUTDIR"/findings.*.json)
FILES=()
for f in "${ALL[@]+"${ALL[@]}"}"; do
  case "$f" in
    "$OUTDIR"/findings.json|"$OUTDIR"/findings.adjudicator.json|"$OUTDIR"/findings.metrics.json) continue ;;
  esac
  FILES+=("$f")
done

if [ ${#FILES[@]} -eq 0 ]; then
  echo "::error::No worker findings found to merge." >&2
  exit 1
fi

# Worker transport recovery belongs to bounded dispatch. Merge accepts serialized
# arrays only: malformed output must never become a successful empty review.
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
: > "$TMP"

merged_count=0
for f in "${FILES[@]}"; do
  if ! [ -s "$f" ] || ! jq -e 'type == "array"' "$f" >/dev/null 2>&1; then
    echo "::error::Malformed/non-array worker findings: $f" >&2
    exit 1
  fi
  cat "$f" >> "$TMP"
  printf '\n' >> "$TMP"
  merged_count=$((merged_count + 1))
done

jq -s 'add // []' "$TMP" > "$MERGED_FILE"

# Admit evidence-bearing candidates; schema failures block the run, while
# unsupported or out-of-scope candidates remain adjudication rejections.
TMP_VALIDATED="$(mktemp)"
trap 'rm -f "$TMP" "$TMP_VALIDATED"' EXIT
python3 - "$MERGED_FILE" "$TMP_VALIDATED" "$OUTDIR" <<'PY'
import json
import math
import os
import re
import sys

source, target, outdir = sys.argv[1:4]
diff_path = ""
for candidate_diff in (
    os.path.join(outdir, "diff.filtered.txt"),
    os.path.join(outdir, "diff.txt"),
):
    if os.path.isfile(candidate_diff):
        diff_path = candidate_diff
        break
allowed_paths = set()
if diff_path:
    with open(diff_path, "r", errors="replace") as diff_file:
        for raw in diff_file:
            if raw.startswith("diff --git "):
                parts = raw.rstrip("\n").split()
                path = parts[3]
                allowed_paths.add(path[2:] if path.startswith("b/") else path)
if os.path.isfile(os.path.join(outdir, "meta.json")):
    try:
        with open(os.path.join(outdir, "meta.json"), "r") as meta_file:
            meta = json.load(meta_file)
        allowed_paths.update(
            item.get("path") for item in meta.get("files", [])
            if isinstance(item, dict) and isinstance(item.get("path"), str)
        )
    except (OSError, ValueError, AttributeError):
        pass
inventory = os.path.join(outdir, "skill-packages.json")
if os.path.isfile(inventory):
    try:
        with open(inventory, "r") as inventory_file:
            inventory_data = json.load(inventory_file)
        def collect_paths(value):
            if isinstance(value, dict):
                for key, child in value.items():
                    if key in {"path", "skillPath", "packagePath"} and isinstance(child, str):
                        allowed_paths.add(child)
                    collect_paths(child)
            elif isinstance(value, list):
                for child in value:
                    collect_paths(child)
        collect_paths(inventory_data)
    except (OSError, ValueError):
        pass
allowed_angles = {
    "bugs", "security", "conventions", "acceptance", "seo", "aeo", "design",
    "database", "tests", "api", "infra", "observability", "i18n", "docs",
    "deps", "skills", "architecture", "comments", "simplify", "production-readiness",
}
allowed_evidence = {"diff", "execution", "contract"}
reject_classes = {
    "tooling", "tooling-owned", "unsupported", "speculative", "pre-existing", "style",
    "style-only", "generic-maintainability", "maintainability",
}
reject_text = re.compile(
    r"\b(?:eslint|biome|prettier|tsc|lint-catchable|style-only|"
    r"pre-existing|speculative|generic maintainability)\b",
    re.IGNORECASE,
)

with open(source, "r") as fh:
    candidates = json.load(fh)

kept = []
rejected = 0
def invalid():
    raise SystemExit("merge-findings: malformed worker candidate")
for candidate in candidates:
    if not isinstance(candidate, dict):
        invalid()
    required = (
        "angle", "file", "line", "title", "description", "failure_mode",
        "evidence", "confidence", "severity", "blocking", "fix_type", "fix",
    )
    if any(key not in candidate for key in required):
        invalid()
    if candidate["angle"] not in allowed_angles:
        invalid()
    if any(not isinstance(candidate[key], str) or not candidate[key].strip()
           for key in ("file", "title", "description", "failure_mode", "fix")):
        invalid()
    line = candidate["line"]
    if isinstance(line, bool) or not isinstance(line, int) or line <= 0:
        invalid()
    if "end_line" in candidate:
        end_line = candidate["end_line"]
        if isinstance(end_line, bool) or not isinstance(end_line, int) or end_line <= line:
            invalid()
    if candidate["severity"] not in {"HIGH", "MEDIUM", "LOW"}:
        invalid()
    if not isinstance(candidate["blocking"], bool):
        invalid()
    if candidate["fix_type"] not in {"suggestion", "prose"}:
        invalid()
    confidence = candidate["confidence"]
    if isinstance(confidence, bool) or not isinstance(confidence, (int, float)):
        invalid()
    if not math.isfinite(confidence) or not 0 <= confidence <= 1:
        invalid()
    evidence = candidate["evidence"]
    if not isinstance(evidence, dict) or evidence.get("basis") not in allowed_evidence:
        invalid()
    if not isinstance(evidence.get("detail"), str) or not evidence["detail"].strip():
        invalid()
    if len(evidence["detail"]) > 2000:
        invalid()
    related = evidence.get("related_files", [])
    if not isinstance(related, list) or any(
        not isinstance(path, str) or not path.strip() for path in related
    ):
        invalid()
    if any(path not in allowed_paths for path in related):
        rejected += 1
        continue

    classes = {
        str(candidate.get(key, "")).strip().lower()
        for key in ("classification", "disposition", "category")
        if candidate.get(key) is not None
    }
    if classes & reject_classes:
        rejected += 1
        continue
    if any(candidate.get(key) is True for key in (
        "tooling_owned", "speculative", "pre_existing", "style_only",
        "generic_maintainability",
    )):
        rejected += 1
        continue
    narrative = " ".join(
        str(candidate.get(key, "")) for key in
        ("title", "description", "failure_mode", "fix")
    )
    if reject_text.search(narrative):
        rejected += 1
        continue

    kept.append(candidate)

with open(target, "w") as fh:
    json.dump(kept, fh)
print(f"merge-findings: candidate admission rejected {rejected} candidate(s)", file=sys.stderr)
PY
mv "$TMP_VALIDATED" "$MERGED_FILE"

# Collapse duplicate candidates at one claimed anchor. Deterministic anchor
# resolution happens only after adjudication; an unanchored accepted finding
# remains available for a general review comment.
BEFORE_COUNT=$(jq 'length' "$MERGED_FILE")
python3 - "$MERGED_FILE" "$MERGED_FILE.deduped" <<'PY'
import json
import sys

source, target = sys.argv[1:3]
with open(source, "r") as fh:
    findings = json.load(fh)

seen = set()
kept = []
for finding in findings:
    key = (finding["file"].strip(), int(str(finding["line"]).strip()))
    if key in seen:
        continue
    seen.add(key)
    kept.append(finding)

with open(target, "w") as fh:
    json.dump(kept, fh)
PY
mv "$MERGED_FILE.deduped" "$MERGED_FILE"
AFTER_COUNT=$(jq 'length' "$MERGED_FILE")

echo "Merged $merged_count finding files into $MERGED_FILE (anchor dedup: $BEFORE_COUNT -> $AFTER_COUNT)"
