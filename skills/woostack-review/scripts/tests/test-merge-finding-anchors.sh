#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." && pwd)"
ROOT="$(cd "$DIR/../../.." && pwd)"
source "$ROOT/skills/woostack-init/scripts/tests/assert.sh"
SCRIPT="$DIR/merge-findings.sh"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
export OUTDIR="$work"
printf '{"files":[{"path":"src/app.ts"}]}\n' > "$work/meta.json"

cat > "$work/diff.txt" <<'DIFF'
diff --git a/src/app.ts b/src/app.ts
index 1111111..2222222 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -10,3 +10,4 @@
 const ten = true;
-old eleven
+const eleven = true;
+const elevenB = true;
 const twelve = true;
@@ -30,2 +30,2 @@
 const thirty = true;
+const thirtyOne = true;
DIFF

cat > "$work/findings.bugs.json" <<'JSON'
[
  {"angle":"bugs","file":"src/app.ts","line":11,"end_line":12,"title":"Keep valid range","failure_mode":"The changed branch skips validation","evidence":{"basis":"diff","detail":"The added branch returns before validation","related_files":[]},"confidence":0.95,"description":"The added branch returns before validation and accepts the record.","fix":"Run validation before returning the record.","severity":"HIGH","blocking":true,"fix_type":"prose","suggestion":null},
  {"angle":"bugs","file":"src/app.ts","line":12,"end_line":30,"title":"Degrade invalid range","failure_mode":"The changed branch bypasses authorization","evidence":{"basis":"diff","detail":"The added branch bypasses authorization","related_files":[]},"confidence":0.95,"description":"The added branch bypasses authorization and exposes the record.","fix":"Check authorization before returning the record.","severity":"HIGH","blocking":true,"fix_type":"prose","suggestion":null},
  {"angle":"bugs","file":"src/app.ts","line":31,"title":"Keep single anchor","failure_mode":"The changed branch writes stale state","evidence":{"basis":"diff","detail":"The added write uses stale state","related_files":[]},"confidence":0.9,"description":"The added write uses stale state and overwrites the current value.","fix":"Write the current state value.","severity":"HIGH","blocking":true,"fix_type":"prose","suggestion":null}
]
JSON

bash "$SCRIPT" >"$work/output.txt" 2>&1
cp "$work/raw_findings.json" "$work/findings.adjudicator.json"
bash "$DIR/intersect-findings.sh" >/dev/null
assert_eq "$(jq 'length' "$work/findings.json")" "3" "finalization keeps all accepted findings"
assert_eq "$(jq -r '.[] | select(.title == "Keep valid range") | [.line, .end_line] | @csv' "$work/findings.json")" '11,12' "valid same-hunk range survives"
assert_eq "$(jq -r '.[] | select(.title == "Degrade invalid range") | has("end_line")' "$work/findings.json")" "false" "cross-hunk range degrades to a single location"
assert_eq "$(jq -r '.[] | select(.title == "Degrade invalid range") | .line' "$work/findings.json")" "12" "degraded range retains valid start"
assert_eq "$(jq -r '.[] | select(.title == "Keep single anchor") | has("end_line")' "$work/findings.json")" "false" "single location has no range endpoint"

finish
