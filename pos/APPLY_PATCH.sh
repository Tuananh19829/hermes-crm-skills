#!/bin/bash
set -e
MODULE="pos"
ROUTES_FILE="/opt/crm/agent-tools-hermes.js"
BACKUP_FILE="/opt/crm/agent-tools-hermes.js.bak-${MODULE}-$(date +%Y%m%d-%H%M%S)"
PATCH_URL="https://raw.githubusercontent.com/Tuananh19829/hermes-crm-skills/main/${MODULE}/HANDLER_PATCH.js"
TMP_PATCH="/tmp/${MODULE}_full.js"
TMP_BLOCK="/tmp/${MODULE}_cases_only.js"
FIRST_CASE="case 'pos_create_invoice':"

[ -f "$ROUTES_FILE" ] || exit 1
EXISTING=$(grep -c "case 'pos_create_invoice'" "$ROUTES_FILE" 2>/dev/null || echo "0")
[ "$EXISTING" -gt 0 ] 2>/dev/null && { echo "WARN: applied"; exit 0; }
sudo cp "$ROUTES_FILE" "$BACKUP_FILE"
curl -sL "$PATCH_URL" -o "$TMP_PATCH"
START_LINE=$(grep -n "^${FIRST_CASE}" "$TMP_PATCH" | head -1 | cut -d: -f1)
[ -z "$START_LINE" ] && exit 1
tail -n +$START_LINE "$TMP_PATCH" > "$TMP_BLOCK"
sudo cp "$ROUTES_FILE" /tmp/routes_pre_${MODULE}.js
awk -v patch_file="$TMP_BLOCK" '
  BEGIN { while ((getline line < patch_file) > 0) patch_block = patch_block line "\n"; close(patch_file); inserted=0 }
  /switch\s*\(\s*action\s*\)/ { in_switch=1 }
  in_switch && !inserted && /^[[:space:]]*default[[:space:]]*:/ { print patch_block; inserted=1 }
  { print }
  END { if (!inserted) exit 1 }
' /tmp/routes_pre_${MODULE}.js > /tmp/routes_patched_${MODULE}.js
NEW=$(grep -c "case 'pos_create_invoice'" /tmp/routes_patched_${MODULE}.js)
[ "$NEW" = "1" ] || exit 1
sudo mv /tmp/routes_patched_${MODULE}.js "$ROUTES_FILE"
docker restart appcrm-api
sleep 4
for s in pos_create_invoice pos_add_payment list_invoices view_invoice pos_complete_appointment apply_voucher_to_invoice update_invoice void_invoice print_invoice dashboard_overview; do
    LIVE=$(docker exec appcrm-api node -e "const fs=require('fs');const r=new RegExp(\"case '${s}'\",'g');const m=fs.readFileSync('/app/dist/modules/agent-tools/routes.js','utf8').match(r);console.log(m?m.length:0);" 2>/dev/null)
    echo "  $s: $LIVE"
done
echo "✅ pos 10 LIVE | Backup: $BACKUP_FILE"
