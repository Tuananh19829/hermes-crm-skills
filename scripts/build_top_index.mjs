#!/usr/bin/env node
// Build top-level _index.json for `crm` app from per-module _index.json files,
// filtered to names listed in _tool_spec_anthropic_implemented.json.
// Hermes loader (spaclaw_skills.py:load_skill_index) reads ONE file per app:
//   SKILLS_ROOT/{app}/_index.json
// so we must consolidate.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MODULES = [
  'academy','ads','ai_assistant','cards_deposits','crm','cskh',
  'customer_groups','customers','documents','finance','funnel','hr',
  'integrations','inventory','loyalty','marketing','notifications',
  'orders','pos','reports','sale','services','settings','telesale'
];

const implementedSpec = JSON.parse(
  fs.readFileSync(path.join(ROOT, '_tool_spec_anthropic_implemented.json'), 'utf8')
);
const allowed = new Set((implementedSpec.tools || implementedSpec).map(t => t.name || t.function?.name));

const skills = [];
const seen = new Set();
const moduleHits = {};

for (const m of MODULES) {
  for (const fname of ['_index.json', '_extensions.json']) {
    const p = path.join(ROOT, m, fname);
    if (!fs.existsSync(p)) continue;
    const idx = JSON.parse(fs.readFileSync(p, 'utf8'));
    let hit = 0;
    for (const s of idx.skills || []) {
      if (!s || typeof s.name !== 'string') continue;
      if (!allowed.has(s.name)) continue;
      if (seen.has(s.name)) continue;
      seen.add(s.name);
      skills.push({ ...s, module: m });
      hit++;
    }
    if (hit) moduleHits[`${m}/${fname}`] = hit;
  }
}

const missing = [...allowed].filter(n => !seen.has(n));

const out = {
  app: 'crm',
  version: '3.3.0',
  base_url: 'https://crm.spaclaw.pro',
  auth: {
    header_secret: 'X-Internal-Secret',
    header_user: 'X-User-Id',
    header_group: 'X-Group-Id',
    secret_env_on_agent_server: 'CRM_INTERNAL_SECRET'
  },
  _generated_by: 'scripts/build_top_index.mjs',
  _generated_at: new Date().toISOString(),
  _whitelist: '_tool_spec_anthropic_implemented.json',
  _module_hits: moduleHits,
  _missing_implemented: missing,
  skills
};

const dest = path.join(ROOT, '_index.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log(`[build_top_index] wrote ${dest}`);
console.log(`  skills: ${skills.length}/${allowed.size} implemented`);
console.log(`  module hits:`, moduleHits);
if (missing.length) console.log(`  MISSING (in whitelist but no per-module entry):`, missing);
