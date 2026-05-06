#!/bin/bash
# Apply loyalty handler patch (10 cases)
set -e
MODULE="loyalty"
ROUTES_FILE="/opt/crm/agent-tools-hermes.js"
BACKUP_FILE="/opt/crm/agent-tools-hermes.js.bak-${MODULE}-$(date +%Y%m%d-%H%M%S)"
PATCH_URL="https://raw.githubusercontent.com/Tuananh19829/hermes-crm-skills/main/${MODULE}/HANDLER_PATCH.js"
TMP_PATCH="/tmp/${MODULE}_full.js"
TMP_BLOCK="/tmp/${MODULE}_cases_only.js"
FIRST_CASE="case 'loyalty_summary':"

echo "=== [${MODULE}] Pre-flight ==="
[ -f "$ROUTES_FILE" ] || { echo "ERROR: $ROUTES_FILE missing"; exit 1; }
EXISTING=$(grep -c "case 'loyalty_summary'" "$ROUTES_FILE" 2>/dev/null || echo "0")
[ "$EXISTING" -gt 0 ] 2>/dev/null && { echo "WARN: already applied"; exit 0; }

sudo cp "$ROUTES_FILE" "$BACKUP_FILE"
echo "Backup: $BACKUP_FILE"

curl -sL "$PATCH_URL" -o "$TMP_PATCH"
[ -s "$TMP_PATCH" ] || { echo "ERROR: pull failed"; exit 1; }

START_LINE=$(grep -n "^${FIRST_CASE}" "$TMP_PATCH" | head -1 | cut -d: -f1)
[ -z "$START_LINE" ] && { echo "ERROR: marker not found"; exit 1; }
tail -n +$START_LINE "$TMP_PATCH" > "$TMP_BLOCK"
echo "Extracted $(wc -l < "$TMP_BLOCK") dòng"

sudo cp "$ROUTES_FILE" /tmp/routes_pre_${MODULE}.js
awk -v patch_file="$TMP_BLOCK" '
  BEGIN { while ((getline line < patch_file) > 0) patch_block = patch_block line "\n"; close(patch_file); inserted=0 }
  /switch\s*\(\s*action\s*\)/ { in_switch=1 }
  in_switch && !inserted && /^[[:space:]]*default[[:space:]]*:/ { print patch_block; inserted=1 }
  { print }
  END { if (!inserted) { print "ERROR: no default" > "/dev/stderr"; exit 1 } }
' /tmp/routes_pre_${MODULE}.js > /tmp/routes_patched_${MODULE}.js

NEW=$(grep -c "case 'loyalty_summary'" /tmp/routes_patched_${MODULE}.js)
[ "$NEW" = "1" ] || { echo "ERROR: insert failed"; exit 1; }
sudo mv /tmp/routes_patched_${MODULE}.js "$ROUTES_FILE"

docker restart appcrm-api
sleep 4

echo "=== Verify ==="
for s in loyalty_summary update_loyalty_tier delete_loyalty_tier assign_loyalty_tier count_loyalty_customers list_loyalty_history manage_loyalty_label manage_loyalty_source list_loyalty_labels list_loyalty_sources; do
    LIVE=$(docker exec appcrm-api node -e "const fs=require('fs');const r=new RegExp(\"case '${s}'\",'g');const m=fs.readFileSync('/app/dist/modules/agent-tools/routes.js','utf8').match(r);console.log(m?m.length:0);" 2>/dev/null)
    echo "  $s: $LIVE"
done

echo "✅ DONE — loyalty 10 handlers LIVE"
echo "Backup: $BACKUP_FILE"
