# Hermes CRM Skills Pack

Skill manifests cho AI agent (Claude / GPT / Hermes Hub) tích hợp với CRM Spaclaw.

**Current version**: `3.3.0` (2026-05-06)
**Total skills**: 723
**Implemented (handler wired)**: 32 — see `_implemented.json`

---

## 📁 Cấu trúc

```
.
├── README.md                                    Tài liệu này
├── _master_manifest.json                        Consolidated 723 skills
├── _implemented.json                            Whitelist 32 skill có handler
├── _tool_spec_anthropic.json                    Full tool spec cho Claude (723)
├── _tool_spec_anthropic_implemented.json        Filtered (32 — KHUYẾN NGHỊ DÙNG)
├── _tool_spec_openai.json                       Full tool spec cho GPT (723)
├── _tool_spec_openai_implemented.json           Filtered (32)
├── 24 module folders/                           Per-module manifest gốc
│   ├── academy/_index.json
│   ├── ads/_index.json + _extensions.json
│   ├── customer_groups/
│   │   ├── _index.json                          Spec v1.1.0 (refined 2026-05-06)
│   │   └── HANDLER_PATCH.js                     7 case Node.js sẵn paste vào routes.js
│   └── ...
└── handoff_crm_fix_*.md                         Báo cáo fix module
```

---

## 🚀 Hub deploy

### Bước 1: Clone repo
```bash
git clone https://github.com/<your-acc>/hermes-crm-skills.git
cd hermes-crm-skills
```

### Bước 2: Đọc manifest
```python
import json

# Cho Claude API
with open('_tool_spec_anthropic_implemented.json') as f:
    spec = json.load(f)

import anthropic
client = anthropic.Anthropic()
response = client.messages.create(
    model="claude-sonnet-4-6",
    tools=spec['tools'],          # 32 tools đã wire handler
    messages=[{"role": "user", "content": "Tạo nhóm KH VIP"}]
)
```

### Bước 3: Khi CRM AI fix module mới
```bash
git pull
# _implemented.json sẽ được bump
# _tool_spec_*_implemented.json sẽ thêm tools mới
```

---

## 🔄 Workflow phối hợp Hub ↔ CRM AI

1. **Hub** chạy E2E test 723 skill qua `/ask`
2. **Hub** gửi báo cáo lỗi theo từng module cho CRM AI
3. **CRM AI** fix:
   - Refine description/triggers trong `<module>/_index.json`
   - Tạo `<module>/HANDLER_PATCH.js` (Node.js + Prisma raw SQL)
   - Bump `backend_status: "implemented"` cho từng skill
   - Thêm tên handler vào `_implemented.json`
   - Update version `_master_manifest.json`
   - Commit + push vào git
4. **Hub** pull → apply patch → re-test → ack

---

## 📊 Module status

Xem `_implemented.json` field `by_module_status`:

- ✅ `customer_groups` ALL_IMPLEMENTED (7/7) — fixed 2026-05-06
- ⚠️ `crm` PARTIAL (15/19)
- ⚠️ `customers` PARTIAL
- ❌ Others NOT_STARTED

---

## ⚠️ Quan trọng

- HTTP transport: **100% POST** (Hermes RPC, dù skill có semantic GET)
- Auth: 3 headers (`X-Internal-Secret`, `X-User-Id`, `X-Group-Id`)
- Backend handler bind-mount tại VPS: `/opt/crm/agent-tools-hermes.js`
- Skill chỉ chạy được khi backend đã wire handler — Hub nên dùng `_tool_spec_*_implemented.json` để LLM không hallucinate skill chưa có handler
