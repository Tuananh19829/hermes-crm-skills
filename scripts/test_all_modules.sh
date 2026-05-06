#!/usr/bin/env bash
# Chạy test_via_hermes.mjs cho TẤT CẢ module CRM, sequential, log + summary cuối
# Usage:
#   EMAIL=... PASSWORD=... WORKSPACE_ID=... ./scripts/test_all_modules.sh
#
# Output:
#   e2e_reports/<module>_<date>.md  (per module)
#   e2e_reports/_BATCH_SUMMARY_<date>.md  (tổng hợp)

set -uo pipefail
cd "$(dirname "$0")/.."

DATE=$(date +%Y%m%d)
SUMMARY="e2e_reports/_BATCH_SUMMARY_${DATE}.md"
mkdir -p e2e_reports

# Modules theo độ ưu tiên (skill ít trước, dễ phát hiện bug nhanh)
MODULES=(
  customer_groups   # đã PASS, sanity check
  orders            # 5
  customers         # 8
  finance           # 9
  pos               # 10
  funnel            # 10
  loyalty           # 10
  services          # 10
  inventory         # 11
  notifications     # 12
  hr                # 15
  crm               # 15
  cskh              # 16
  reports           # 16
  settings          # 16
  documents         # 17
  academy           # 18
  ads               # 19
  ai_assistant      # 20
  marketing         # 21
  cards_deposits    # 22
  sale              # 23
  telesale          # 32
  integrations      # 46
)

echo "# Batch test summary — $DATE" > "$SUMMARY"
echo "" >> "$SUMMARY"
echo "| Module | Total | PASS | PASS_VAL | NO_SKILL | ERROR | DECLINE | AMBIG | TIMEOUT |" >> "$SUMMARY"
echo "|---|---|---|---|---|---|---|---|---|" >> "$SUMMARY"

for mod in "${MODULES[@]}"; do
  echo ""
  echo "==================================================================="
  echo "[$(date +%H:%M:%S)] MODULE: $mod"
  echo "==================================================================="

  # Skip mega_stubs (293 stub NOT_IMPLEMENTED)
  [[ "$mod" == "mega_stubs" ]] && continue

  # Run, capture output
  if node scripts/test_via_hermes.mjs --module="$mod" 2>&1 | tee "/tmp/last_${mod}.log"; then
    :
  else
    echo "[WARN] module $mod exited non-zero"
  fi

  # Parse counts from log
  REPORT="e2e_reports/${mod}_${DATE}.md"
  if [[ -f "$REPORT" ]]; then
    TOTAL=$(grep -c '^| `' "$REPORT" || echo 0)
    PASS=$(grep -c '| PASS |' "$REPORT" || echo 0)
    PASSV=$(grep -c '| PASS_VALIDATION |' "$REPORT" || echo 0)
    NOSK=$(grep -c '| NO_SKILL |' "$REPORT" || echo 0)
    ERR=$(grep -c '| ERROR |' "$REPORT" || echo 0)
    DEC=$(grep -c '| DECLINE |' "$REPORT" || echo 0)
    AMB=$(grep -c '| AMBIG |' "$REPORT" || echo 0)
    TO=$(grep -c '| TIMEOUT |' "$REPORT" || echo 0)
    echo "| $mod | $TOTAL | $PASS | $PASSV | $NOSK | $ERR | $DEC | $AMB | $TO |" >> "$SUMMARY"
  else
    echo "| $mod | - | - | - | - | - | - | - | (no report) |" >> "$SUMMARY"
  fi

  # Sleep 30s giữa 2 module để Hermes nghỉ
  sleep 30
done

echo ""
echo "============================================="
echo "DONE. Summary: $SUMMARY"
echo "============================================="
cat "$SUMMARY"
