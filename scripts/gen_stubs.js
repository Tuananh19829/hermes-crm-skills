#!/usr/bin/env node
// Generate HANDLER_PATCH.js + APPLY_PATCH.sh for remaining modules with NOT_IMPLEMENTED stubs.
// Usage: node scripts/gen_stubs.js <module1> <module2> ...
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function genHandler(skills) {
    return skills.map(name =>
        `case '${name}': {
    res.json({ ok: false, error: { code: 'NOT_IMPLEMENTED', skill: '${name}', message: 'Handler stub - awaiting real implementation' } });
    return;
}`
    ).join('\n\n') + '\n';
}

function genApply(module, firstSkill, allSkills) {
    return `#!/bin/bash
set -e
MODULE="${module}"
ROUTES_FILE="/opt/crm/agent-tools-hermes.js"
BACKUP_FILE="/opt/crm/agent-tools-hermes.js.bak-\${MODULE}-$(date +%Y%m%d-%H%M%S)"
PATCH_URL="https://raw.githubusercontent.com/Tuananh19829/hermes-crm-skills/main/\${MODULE}/HANDLER_PATCH.js"
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
sleep 4
for s in ${allSkills.join(' ')}; do
    LIVE=$(docker exec appcrm-api node -e "const fs=require('fs');const r=new RegExp(\\"case '\${s}'\\",'g');const m=fs.readFileSync('/app/dist/modules/agent-tools/routes.js','utf8').match(r);console.log(m?m.length:0);" 2>/dev/null)
    echo "  \${s}: $LIVE"
done
echo "✅ ${module} ${allSkills.length} LIVE | Backup: $BACKUP_FILE"
`;
}

const modules = process.argv.slice(2);
for (const m of modules) {
    const idxPath = path.join(ROOT, m, '_index.json');
    if (!fs.existsSync(idxPath)) {
        console.error(`SKIP ${m}: no _index.json`);
        continue;
    }
    const data = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
    const PRESENT = new Set(['find_customer','create_lead','update_lead_status','add_note','search_orders','report_revenue','list_campaigns','link_ads_lead','bulk_tag','create_appointment','update_appointment_status','create_bundle','list_loyalty_tiers','create_loyalty_tier','list_appointments']);
    const skills = (data.skills || []).map(s => s.name).filter(n => !PRESENT.has(n));
    if (skills.length === 0) {
        console.error(`SKIP ${m}: 0 skills`);
        continue;
    }
    const handler = `// Module: ${m} (${skills.length} cases - STUBS)\n\n` + genHandler(skills);
    const apply = genApply(m, skills[0], skills);
    fs.writeFileSync(path.join(ROOT, m, 'HANDLER_PATCH.js'), handler);
    fs.writeFileSync(path.join(ROOT, m, 'APPLY_PATCH.sh'), apply);
    console.log(`OK ${m}: ${skills.length} stubs (first=${skills[0]})`);
}
