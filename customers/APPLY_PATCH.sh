#!/bin/bash
# Insert FIXED customers handlers at TOP of switch (action) — first match wins, overrides buggy cases below.
set -e
MODULE="customers"
ROUTES_FILE="/opt/crm/agent-tools-hermes.js"
BACKUP_FILE="/opt/crm/agent-tools-hermes.js.bak-${MODULE}-fix-$(date +%Y%m%d-%H%M%S)"
PATCH_URL="https://raw.githubusercontent.com/Tuananh19829/hermes-crm-skills/main/${MODULE}/HANDLER_PATCH.js"
TMP_PATCH="/tmp/${MODULE}_full.js"
TMP_BLOCK="/tmp/${MODULE}_block.js"
FIRST_CASE="case 'search_customers':"

[ -f "$ROUTES_FILE" ] || exit 1
curl -sL "$PATCH_URL" -o "$TMP_PATCH"
START_LINE=$(grep -n "^${FIRST_CASE}" "$TMP_PATCH" | head -1 | cut -d: -f1)
[ -z "$START_LINE" ] && { echo "no first case in patch"; exit 1; }
tail -n +$START_LINE "$TMP_PATCH" > "$TMP_BLOCK"

sudo cp "$ROUTES_FILE" "$BACKUP_FILE"
sudo cp "$ROUTES_FILE" /tmp/routes_pre_${MODULE}.js
awk -v patch_file="$TMP_BLOCK" '
  BEGIN { while ((getline line < patch_file) > 0) patch_block = patch_block line "\n"; close(patch_file); inserted=0 }
  /switch[[:space:]]*\([[:space:]]*action[[:space:]]*\)[[:space:]]*\{/ && !inserted { print; print patch_block; inserted=1; next }
  { print }
  END { if (!inserted) exit 1 }
' /tmp/routes_pre_${MODULE}.js > /tmp/routes_patched_${MODULE}.js

NEW=$(grep -c "case 'search_customers'" /tmp/routes_patched_${MODULE}.js)
[ "$NEW" -ge 2 ] || { echo "FAIL: case count $NEW"; exit 1; }
sudo mv /tmp/routes_patched_${MODULE}.js "$ROUTES_FILE"
docker restart appcrm-api
sleep 4
echo "✅ ${MODULE} fix applied (top-of-switch); backup $BACKUP_FILE"
for s in search_customers get_customer_detail create_customer update_customer delete_customer customers_summary list_customer_groups customer_care_list get_loyalty_points manage_vouchers; do
    LIVE=$(docker exec appcrm-api node -e "const fs=require('fs');const r=new RegExp(\"case '${s}'\",'g');const m=fs.readFileSync('/app/dist/modules/agent-tools/routes.js','utf8').match(r);console.log(m?m.length:0);" 2>/dev/null)
    echo "  $s: $LIVE"
done
