#!/usr/bin/env node
// Test skill CRM qua Hermes /ask (E2E thật, có LLM)
// Usage:
//   EMAIL=daotaokinhdoanhspa@gmail.com PASSWORD='<pass>' node scripts/test_via_hermes.mjs --module=customer_groups
//   (hoặc set JWT_TOKEN trực tiếp để skip login)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SSO  = 'https://api-auth.spaclaw.pro';
const CORE = 'https://api-core.spaclaw.pro';
const APP  = 'crm';

const TIMEOUT_MS  = 90_000;   // 90s/turn
const COOLDOWN_MS = 20_000;   // 20s giữa 2 skill

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const MODULE = args.module;
if (!MODULE) { console.error('FATAL: thiếu --module=<name>'); process.exit(1); }

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexFile = path.join(REPO, MODULE, '_index.json');
if (!fs.existsSync(indexFile)) { console.error(`FATAL: không thấy ${indexFile}`); process.exit(1); }

async function fetchJson(url, opts = {}, timeout = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch {}
    return { status: res.status, ok: res.ok, json, text };
  } catch (e) { return { status: 0, ok: false, json: null, text: String(e) }; }
  finally { clearTimeout(t); }
}

async function login() {
  if (process.env.JWT_TOKEN) return process.env.JWT_TOKEN;
  if (!process.env.EMAIL || !process.env.PASSWORD) {
    throw new Error('Set EMAIL+PASSWORD hoặc JWT_TOKEN qua env');
  }
  const r = await fetchJson(`${SSO}/api/v1/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.EMAIL, password: process.env.PASSWORD }),
  });
  const tok = r.json?.token || r.json?.access_token;
  if (!tok) throw new Error('Login fail: ' + r.text.slice(0, 200));
  return tok;
}

async function pickWorkspace(token) {
  if (process.env.WORKSPACE_ID) return process.env.WORKSPACE_ID;
  const r = await fetchJson(`${CORE}/api/bff/workspace-groups`, { headers: { Authorization: `Bearer ${token}` } });
  const items = r.json?.data?.items || r.json?.items || [];
  if (!items.length) throw new Error('Không có workspace_group nào cho user này');
  return items[0].id;
}

async function ask(token, ws, message) {
  const t0 = Date.now();
  const r = await fetchJson(`${CORE}/api/v1/hermes/companies/${ws}/agents/${APP}/ask`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return { ...r, durationMs: Date.now() - t0 };
}

function judge(reply) {
  const text = (reply?.data?.response ?? reply?.response ?? reply?.answer ?? '').toString();
  if (!text || text === 'null') return { verdict: 'TIMEOUT', reason: 'response null', text: '' };
  const lo = text.toLowerCase();
  if (/(skill .* không tồn tại|không tìm thấy skill|chưa có skill|skill_not_found)/i.test(text))
    return { verdict: 'NO_SKILL', reason: 'LLM nói skill không tồn tại', text };
  if (/(group_not_found|customer_not_found|missing_param|missing_group_id|not_found)/i.test(lo))
    return { verdict: 'PASS_VALIDATION', reason: 'handler có, validate đúng', text };
  if (/(đã gọi|đã thực hiện|đã tạo|kết quả|"ok": ?true)/i.test(text))
    return { verdict: 'PASS', reason: 'có data', text };
  if (/(error|exception|lỗi nội bộ|500)/i.test(lo))
    return { verdict: 'ERROR', reason: 'backend lỗi', text };
  if (/(không thể|không có quyền|tôi không|cannot)/i.test(lo))
    return { verdict: 'DECLINE', reason: 'LLM từ chối', text };
  return { verdict: 'AMBIG', reason: 'không rõ', text };
}

function buildPrompt(skillName) {
  return `Hãy gọi skill ${skillName} với args mẫu (id không có thật → trả NOT_FOUND/MISSING_PARAM là OK). KHÔNG hỏi lại, gọi luôn.`;
}

async function main() {
  const idx = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
  const skills = (idx.skills || idx.actions || []).map(s => s.name || s.skill || s);
  if (!skills.length) { console.error('FATAL: _index.json rỗng'); process.exit(1); }

  const token = await login();
  const ws = await pickWorkspace(token);
  console.log(`[module] ${MODULE} | ${skills.length} skills`);
  console.log(`[ws] ${ws}`);

  const results = [];
  for (const s of skills) {
    const r = await ask(token, ws, buildPrompt(s));
    const j = judge(r.json);
    const flag = ['PASS', 'PASS_VALIDATION'].includes(j.verdict) ? '✓' : '✗';
    console.log(`  ${flag} [${j.verdict.padEnd(15)}] ${s.padEnd(35)} ${r.durationMs}ms`);
    results.push({ skill: s, verdict: j.verdict, reason: j.reason, durationMs: r.durationMs, snippet: j.text.slice(0, 200) });
    await new Promise(res => setTimeout(res, COOLDOWN_MS));
  }

  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const reportPath = path.join(REPO, 'e2e_reports', `${MODULE}_${date}.md`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const passN = results.filter(r => ['PASS','PASS_VALIDATION'].includes(r.verdict)).length;
  const lines = [
    `# ${MODULE} — ${date}`,
    `**Account**: ${process.env.EMAIL || 'token-only'} | **Workspace**: ${ws}`,
    `**Kết quả**: ${passN}/${results.length} PASS`,
    '',
    '| Skill | Verdict | Duration | Reason | Snippet |',
    '|---|---|---|---|---|',
    ...results.map(r => `| \`${r.skill}\` | ${r.verdict} | ${r.durationMs}ms | ${r.reason} | ${(r.snippet||'').replace(/\|/g,'\\|').replace(/\s+/g,' ').slice(0,150)} |`),
  ];
  fs.writeFileSync(reportPath, lines.join('\n'));
  console.log(`\n[report] ${reportPath}`);
  console.log(`[summary] ${passN}/${results.length} PASS`);
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
