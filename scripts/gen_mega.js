#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const PRESENT = new Set(['find_customer','create_lead','update_lead_status','add_note','search_orders','report_revenue','list_campaigns','link_ads_lead','bulk_tag','create_appointment','update_appointment_status','create_bundle','list_loyalty_tiers','create_loyalty_tier','list_appointments']);

const modules = process.argv.slice(2);
const all = [];
const allNames = [];
for (const m of modules) {
    const idx = path.join(ROOT, m, '_index.json');
    if (!fs.existsSync(idx)) continue;
    const data = JSON.parse(fs.readFileSync(idx, 'utf8'));
    const skills = (data.skills || []).map(s => s.name).filter(n => !PRESENT.has(n) && !allNames.includes(n));
    if (!skills.length) continue;
    all.push(`// === ${m} (${skills.length}) ===\n` + skills.map(name => `case '${name}': {
    res.json({ ok: false, error: { code: 'NOT_IMPLEMENTED', module: '${m}', skill: '${name}' } });
    return;
}`).join('\n\n'));
    allNames.push(...skills);
}
const handler = `// Mega stub patch (${allNames.length} skills across ${modules.length} modules)\n\n` + all.join('\n\n') + '\n';
fs.writeFileSync(path.join(ROOT, 'mega_stubs', 'HANDLER_PATCH.js'), handler);

const firstSkill = allNames[0];
const apply = `#!/bin/bash
set -e
MODULE="mega_stubs"
ROUTES_FILE="/opt/crm/agent-tools-hermes.js"
BACKUP_FILE="/opt/crm/agent-tools-hermes.js.bak-\${MODULE}-$(date +%Y%m%d-%H%M%S)"
PATCH_URL="https://raw.githubusercontent.com/Tuananh19829/hermes-crm-skills/main/mega_stubs/HANDLER_PATCH.js"
TMP_PATCH="/tmp/\${MODULE}_full.js"
TMP_BLOCK="/tmp/\${MODULE}_cases_only.js"
FIRST_CASE="case '${firstSkill}':"

[ -f "$ROUTES_FILE" ] || exit 1
EXISTING=$(grep -c "case '${firstSkill}'" "$ROUTES_FILE" 2>/dev/null || echo "0")
[ "$EXISTING" -gt 0 ] 2>/dev/null && { echo "WARN: applied"; exit 0; }
sudo cp "$ROUTES_FILE" "$BACKUP_FILE"
curl -sL "$PATCH_URL" -o "$TMP_PATCH"
START_LINE=$(grep -n "^\${FIRST_CASE}" "$TMP_PATCH" | head -1 | cut -d: -f1)
[ -z "$START_LINE" ] && exit 1
tail -n +$START_LINE "$TMP_PATCH" > "$TMP_BLOCK"
sudo cp "$ROUTES_FILE" /tmp/routes_pre_\${MODULE}.js
awk -v patch_file="$TMP_BLOCK" '
  BEGIN { while ((getline line < patch_file) > 0) patch_block = patch_block line "\\n"; close(patch_file); inserted=0 }
  /switch\\s*\\(\\s*action\\s*\\)/ { in_switch=1 }
  in_switch && !inserted && /^[[:space:]]*default[[:space:]]*:/ { print patch_block; inserted=1 }
  { print }
  END { if (!inserted) exit 1 }
' /tmp/routes_pre_\${MODULE}.js > /tmp/routes_patched_\${MODULE}.js
NEW=$(grep -c "case '${firstSkill}'" /tmp/routes_patched_\${MODULE}.js)
[ "$NEW" = "1" ] || exit 1
sudo mv /tmp/routes_patched_\${MODULE}.js "$ROUTES_FILE"
docker restart appcrm-api
sleep 5
TOTAL=$(docker exec appcrm-api node -e "const fs=require('fs');console.log((fs.readFileSync('/app/dist/modules/agent-tools/routes.js','utf8').match(/case '/g) || []).length);" 2>/dev/null)
echo "Total cases LIVE: $TOTAL"
echo "✅ mega_stubs ${allNames.length} cases inserted | Backup: $BACKUP_FILE"
`;
fs.writeFileSync(path.join(ROOT, 'mega_stubs', 'APPLY_PATCH.sh'), apply);

console.log(`OK: ${allNames.length} stubs across ${modules.length} modules. First=${firstSkill}`);
console.log(`Modules included: ${modules.filter(m => fs.existsSync(path.join(ROOT, m, '_index.json'))).join(', ')}`);
