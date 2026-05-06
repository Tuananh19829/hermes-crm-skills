#!/bin/bash
# ============================================================
# AUTO-APPLY customers handler patch on VPS spaclaw-main
# Module: customers (6 core handlers)
# ============================================================
# Usage: SSH vào VPS, paste:
#   bash <(curl -sL https://raw.githubusercontent.com/Tuananh19829/hermes-crm-skills/main/customers/APPLY_PATCH.sh)
# ============================================================

set -e

MODULE="customers"
ROUTES_FILE="/opt/crm/agent-tools-hermes.js"
BACKUP_FILE="/opt/crm/agent-tools-hermes.js.bak-${MODULE}-$(date +%Y%m%d-%H%M%S)"
PATCH_URL="https://raw.githubusercontent.com/Tuananh19829/hermes-crm-skills/main/${MODULE}/HANDLER_PATCH.js"
TMP_PATCH="/tmp/${MODULE}_full.js"
TMP_BLOCK="/tmp/${MODULE}_cases_only.js"

# First case marker (đầu của patch block)
FIRST_CASE="case 'search_customers':"

echo "=== [${MODULE}] Step 1: Pre-flight ==="
[ -f "$ROUTES_FILE" ] || { echo "ERROR: $ROUTES_FILE không tồn tại"; exit 1; }

EXISTING=$(grep -c "case 'search_customers'" "$ROUTES_FILE" 2>/dev/null || echo "0")
if [ "$EXISTING" -gt 0 ] 2>/dev/null; then
    echo "WARN: 'search_customers' đã có ($EXISTING match). Skip để tránh duplicate."
    exit 0
fi

echo "=== [${MODULE}] Step 2: Backup ==="
sudo cp "$ROUTES_FILE" "$BACKUP_FILE"
echo "Backup: $BACKUP_FILE"

echo "=== [${MODULE}] Step 3: Pull patch ==="
curl -sL "$PATCH_URL" -o "$TMP_PATCH"
[ -s "$TMP_PATCH" ] || { echo "ERROR: Pull patch failed"; exit 1; }

echo "=== [${MODULE}] Step 4: Extract case block ==="
START_LINE=$(grep -n "^${FIRST_CASE}" "$TMP_PATCH" | head -1 | cut -d: -f1)
[ -z "$START_LINE" ] && { echo "ERROR: Không tìm thấy ${FIRST_CASE}"; exit 1; }
tail -n +$START_LINE "$TMP_PATCH" > "$TMP_BLOCK"
LINES=$(wc -l < "$TMP_BLOCK")
echo "Extracted $LINES dòng"

echo "=== [${MODULE}] Step 5: Insert vào routes.js ==="
sudo cp "$ROUTES_FILE" /tmp/routes_pre_${MODULE}.js
awk -v patch_file="$TMP_BLOCK" '
  BEGIN {
    while ((getline line < patch_file) > 0) { patch_block = patch_block line "\n" }
    close(patch_file)
    inserted = 0
  }
  /switch\s*\(\s*action\s*\)/ { in_switch = 1 }
  in_switch && !inserted && /^[[:space:]]*default[[:space:]]*:/ {
    print patch_block
    inserted = 1
  }
  { print }
  END {
    if (!inserted) {
      print "ERROR: Không tìm default: trong switch (action)" > "/dev/stderr"
      exit 1
    }
  }
' /tmp/routes_pre_${MODULE}.js > /tmp/routes_patched_${MODULE}.js

NEW_COUNT=$(grep -c "case 'search_customers'" /tmp/routes_patched_${MODULE}.js)
[ "$NEW_COUNT" = "1" ] || { echo "ERROR: Insert thất bại (count=$NEW_COUNT)"; exit 1; }
sudo mv /tmp/routes_patched_${MODULE}.js "$ROUTES_FILE"
echo "Insert thành công"

echo "=== [${MODULE}] Step 6: Restart container ==="
docker restart appcrm-api
sleep 4

echo "=== [${MODULE}] Step 7: Verify live ==="
for s in search_customers update_customer delete_customer customers_summary list_customer_groups customer_care_list; do
    LIVE=$(docker exec appcrm-api node -e "
const fs=require('fs');
const r=new RegExp(\"case '${s}'\",'g');
const m=fs.readFileSync('/app/dist/modules/agent-tools/routes.js','utf8').match(r);
console.log(m?m.length:0);
" 2>/dev/null)
    echo "  $s: $LIVE"
done

echo "=== [${MODULE}] Step 8: Logs ==="
docker logs appcrm-api --tail 15 2>&1 | grep -iE "error|listening|started" | tail -5 || true

echo ""
echo "✅ DONE — customers 6 handlers LIVE"
echo "Backup: $BACKUP_FILE"
echo ""
echo "→ Báo Hub re-test customers module"
echo "→ Rollback nếu cần: sudo cp $BACKUP_FILE $ROUTES_FILE && docker restart appcrm-api"
