#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$(cd "$DIR/../../.." && pwd)"
source "$ROOT/skills/woostack-init/scripts/tests/assert.sh"
SCRIPT="$DIR/merge-findings.sh"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
export OUTDIR="$work/out"; mkdir -p "$OUTDIR"
printf '[]\n' > "$OUTDIR/findings.bugs.json"
printf 'not JSON\n' > "$OUTDIR/findings.docs.json"
rc=0; bash "$SCRIPT" >/dev/null 2>&1 || rc=$?
assert_exit 1 "$rc" "one malformed worker blocks an otherwise empty review"
printf '{"not":"a finding"}\n' > "$OUTDIR/findings.docs.json"
rc=0; bash "$SCRIPT" >/dev/null 2>&1 || rc=$?
assert_exit 1 "$rc" "non-array output is not silently repaired during merge"
printf '[{"description":"regex \\d"}]\n' > "$OUTDIR/findings.docs.json"
rc=0; bash "$SCRIPT" >/dev/null 2>&1 || rc=$?
assert_exit 1 "$rc" "invalid escape cannot lose a backslash and count as success"
printf '[]\n' > "$OUTDIR/findings.docs.json"
bash "$SCRIPT" >/dev/null
assert_eq "$(jq 'length' "$OUTDIR/raw_findings.json")" "0" "completed empty arrays remain a valid empty candidate set"
printf '{"metrics":true}\n' > "$OUTDIR/config.json"
printf '[]\n' > "$OUTDIR/findings.adjudicator.json"
: > "$OUTDIR/diff.txt"
: > "$OUTDIR/changed-paths.txt"
bash "$DIR/intersect-findings.sh" >/dev/null
rc=0; bash "$SCRIPT" >/dev/null 2>&1 || rc=$?
assert_exit 0 "$rc" "resuming a finalized review does not mistake derived metrics for worker output"
finish
