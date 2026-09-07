#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." && pwd)"
ROOT="$(cd "$DIR/../../.." && pwd)"
source "$ROOT/skills/woostack-init/scripts/tests/assert.sh"
SCRIPT="$DIR/build-review-payload.py"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
export OUTDIR="$work/review" HEAD_SHA=1111111111111111111111111111111111111111
export AUTH_GITHUB_USER_ID=2002 IMPLEMENTATION_AUTHOR_GITHUB_USER_ID=1001
mkdir -p "$OUTDIR"
printf 'Review verdict\n' > "$work/body.txt"
printf '[]\n' > "$OUTDIR/prior-findings.json"
jq -n --arg sha "$HEAD_SHA" '{headRefOid:$sha}' > "$OUTDIR/meta.json"
cat > "$OUTDIR/findings.json" <<'JSON'
[
  {"angle":"bugs","file":"src/app.ts","line":2,"title":"Single anchor","description":"Single defect","fix":"Repair single","severity":"HIGH","blocking":false,"nit":false,"inline":true,"fix_type":"prose"},
  {"angle":"bugs","file":"src/app.ts","line":10,"end_line":12,"title":"Range anchor","description":"Range defect","fix":"Repair range","severity":"HIGH","blocking":false,"nit":false,"inline":true,"fix_type":"prose"},
  {"angle":"security","file":"src/app.ts","line":99,"title":"General blocker","description":"Preserve this evidence","fix":"Repair unsafe return","severity":"HIGH","blocking":true,"nit":false,"inline":false,"fix_type":"suggestion","suggestion":"return safeValue;"}
]
JSON
python3 "$SCRIPT" "$work/body.txt" > "$work/payload.json"
assert_eq "$(jq -c '.comments[0] | {path,line,side}' "$work/payload.json")" '{"path":"src/app.ts","line":2,"side":"RIGHT"}' "single anchor maps to GitHub"
assert_eq "$(jq -r '.comments[0] | has("start_line") or has("start_side")' "$work/payload.json")" "false" "single anchor has no range fields"
assert_eq "$(jq -c '.comments[1] | {path,start_line,start_side,line,side}' "$work/payload.json")" '{"path":"src/app.ts","start_line":10,"start_side":"RIGHT","line":12,"side":"RIGHT"}' "valid range maps to GitHub"
assert_eq "$(jq '.comments | length' "$work/payload.json")" "2" "general finding is not posted to invalid inline location"
assert_contains "$(jq -r '.body' "$work/payload.json")" 'Preserve this evidence' "general body preserves finding evidence"
assert_contains "$(jq -r '.body' "$work/payload.json")" 'Repair unsafe return' "general body preserves recommended fix"
assert_contains "$(jq -r '.body' "$work/payload.json")" 'return safeValue;' "general body preserves suggested replacement text"
assert_not_contains "$(jq -r '.body' "$work/payload.json")" '```suggestion' "general finding cannot offer an unanchored apply action"
assert_eq "$(jq -r '.event' "$work/payload.json")" "REQUEST_CHANGES" "unanchored blocker still requests changes"

jq 'map(select(.blocking == false))' "$OUTDIR/findings.json" > "$work/nonblocking.json"
mv "$work/nonblocking.json" "$OUTDIR/findings.json"
python3 "$SCRIPT" "$work/body.txt" > "$work/payload.json"
assert_eq "$(jq -r '.event' "$work/payload.json")" "APPROVE" "accepted nonblocking findings do not withhold approval"
AUTH_GITHUB_USER_ID=1001 python3 "$SCRIPT" "$work/body.txt" > "$work/same.json"
assert_eq "$(jq -r '.event' "$work/same.json")" "COMMENT" "same native actor cannot self-approve"
assert_eq "$(jq '.comments | length' "$work/same.json")" "2" "same-actor downgrade preserves findings"
IMPLEMENTATION_AUTHOR_GITHUB_USER_ID= AUTH_LOGIN=another-reviewer \
  python3 "$SCRIPT" "$work/body.txt" > "$work/missing.json"
assert_eq "$(jq -r '.event' "$work/missing.json")" "COMMENT" "login does not replace missing native identity"
printf '[{"status":"open"}]\n' > "$OUTDIR/prior-findings.json"
python3 "$SCRIPT" "$work/body.txt" > "$work/prior.json"
assert_eq "$(jq -r '.event' "$work/prior.json")" "REQUEST_CHANGES" "open prior thread remains an event floor"

rc=0; HEAD_SHA=2222222222222222222222222222222222222222 \
  python3 "$SCRIPT" "$work/body.txt" > "$work/stale.json" 2>/dev/null || rc=$?
assert_exit 1 "$rc" "stale head cannot render a postable payload"
printf 'not JSON\n' > "$OUTDIR/findings.json"
rc=0; python3 "$SCRIPT" "$work/body.txt" > "$work/malformed.json" 2>/dev/null || rc=$?
assert_exit 1 "$rc" "malformed findings cannot become empty approval"
printf '[{}]\n' > "$OUTDIR/findings.json"
rc=0; python3 "$SCRIPT" "$work/body.txt" > "$work/schema.json" 2>/dev/null || rc=$?
assert_exit 1 "$rc" "invalid finding schema blocks payload"
finish
