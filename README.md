# Hermes CRM Skills — 720 skill manifests

Skill definitions cho AI agent (Claude / GPT / Hermes Hub) ingest.

## 📁 File structure

```
hermes-crm-skills-700/
├── README.md                       (file này)
├── _master_manifest.json           (consolidated 720 skills cho Hub)
├── _tool_spec_anthropic.json       (tool_use format cho Claude API)
├── _tool_spec_openai.json          (function calling format cho GPT/OpenAI)
└── 24 module folders/              (per-module manifest gốc)
    ├── academy/_index.json
    ├── ads/_index.json + _extensions.json
    ├── ai_assistant/_index.json
    ├── cards_deposits/_index.json
    ├── crm/_index.json
    ├── cskh/_index.json
    ├── customer_groups/_index.json
    ├── customers/_index.json + _extensions.json
    ├── documents/_index.json
    ├── finance/_index.json + _extensions.json
    ├── funnel/_index.json
    ├── hr/_index.json + _extensions.json
    ├── integrations/_index.json
    ├── inventory/_index.json + _extensions.json
    ├── loyalty/_index.json
    ├── marketing/_index.json
    ├── notifications/_index.json
    ├── orders/_index.json
    ├── pos/_index.json
    ├── reports/_index.json + _extensions.json
    ├── sale/_index.json
    ├── services/_index.json + _extensions.json
    ├── settings/_index.json + _extensions.json
    └── telesale/_index.json
```

## 📊 Stats

- **720 skills** total
- **24 modules**
- **255 GET** (read-only) + **418 POST** (write) + **47 Hybrid** (action param)
- All HTTP transport: **POST `/internal/skills/<name>`**

## 🎯 Cách AI agent dùng

### Cách 1: Anthropic Claude API (tool_use)
```python
import json, anthropic

with open('_tool_spec_anthropic.json') as f:
    spec = json.load(f)

client = anthropic.Anthropic()
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=2048,
    tools=spec['tools'],   # 720 tools
    messages=[{"role": "user", "content": "Tạo khách hàng tên Mai SĐT 0901234567"}]
)
# Claude sẽ chọn tool 'create_customer' và trả về tool_use block
```

### Cách 2: OpenAI GPT (function calling)
```python
import json, openai

with open('_tool_spec_openai.json') as f:
    spec = json.load(f)

response = openai.chat.completions.create(
    model="gpt-4o",
    tools=spec['tools'],   # 720 functions
    messages=[{"role": "user", "content": "Doanh thu tháng này"}]
)
# GPT sẽ chọn function 'revenue_report'
```

### Cách 3: Hermes Hub
```bash
# Hub đọc _master_manifest.json để register 720 skill
# Khi user gọi: Hub forward POST /internal/skills/<name> với headers:
#   X-Internal-Secret: <CRM_INTERNAL_SECRET>
#   X-User-Id: <user_id>
#   X-Group-Id: <workspace_id>
```

## 📝 Schema mỗi skill

```json
{
  "name": "create_customer",
  "description": "Tạo khách hàng mới...",
  "triggers": ["tạo khách", "thêm khách mới"],
  "endpoint": "POST /internal/skills/create_customer",
  "input_schema": {
    "type": "object",
    "required": ["full_name"],
    "properties": {
      "full_name": { "type": "string" },
      "phone": { "type": "string" },
      ...
    }
  },
  "type": "action",
  "risk_level": "normal",
  "module": "customers"
}
```

## ⚠️ Lưu ý

- File này **chỉ chứa skill definitions** (manifest + schema).
- **Không chứa** handler code / DB migrations / deploy script.
- Hub / app backend tự lo phần execute; AI agent chỉ cần biết skill nào tồn tại + params nào cần.
