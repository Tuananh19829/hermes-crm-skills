# Prompt cho CRM AI: Tự test skill CRM + tự fix

Mày là AI quản lý app CRM. Việc của mày:

1. **Tạo tài khoản test** (nếu chưa có) → lấy JWT + workspace_id.
2. **Viết script** test tất cả skill — gọi qua **Hermes /ask** (E2E thật, có LLM), sleep 15–30s/skill (Hermes chậm, ~30–50s/turn).
3. **Note kết quả ra report theo module**.
4. **Bug → tự fix → chạy lại → đến khi xanh**. Không ping Hub.

---

## 1. Tài khoản + workspace test

Có sẵn:
- Email: `daotaokinhdoanhspa@gmail.com` / pass đã set sẵn (hỏi anh nếu chưa biết)
- workspace_id (My Salon): `52b399db-ff89-4f75-a780-4c85477a0c24`

Nếu cần tạo mới:
```bash
curl -s -X POST https://api-auth.spaclaw.pro/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"crm-test-<random>@spaclaw.local","password":"Test@1234","fullName":"CRM Test","companyName":"CRM Test Salon"}'
```

Login lấy JWT:
```bash
TOKEN=$(curl -s -X POST https://api-auth.spaclaw.pro/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"daotaokinhdoanhspa@gmail.com","password":"<pass>"}' | jq -r '.token')
```

Lấy workspace_id (nếu mới tạo):
```bash
WS=$(curl -s https://api-core.spaclaw.pro/api/bff/workspace-groups \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.items[0].id')
```

---

## 2. Gọi Hermes agent CRM (E2E qua LLM)

```bash
ask () {
  curl -s -X POST "https://api-core.spaclaw.pro/api/v1/hermes/companies/$WS/agents/crm/ask" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"message\":\"$1\"}" \
    --max-time 90
}

# Ví dụ test 1 skill
ask "Hãy gọi skill list_customers với limit=5. KHÔNG hỏi lại, gọi luôn."
sleep 20    # Hermes/LLM cooldown 15–30s tránh rate limit
```

---

## 3. Verdict (regex trên trường `data.response`)

| Pattern trong response | Verdict | Hành động |
|---|---|---|
| `đã gọi`, `kết quả`, `"ok":true`, có data thật | ✅ PASS | Tiếp |
| `GROUP_NOT_FOUND`, `CUSTOMER_NOT_FOUND`, `MISSING_PARAM` | ✅ PASS_VALIDATION | Tiếp (handler đúng) |
| `skill không tồn tại`, `không tìm thấy skill`, `skill_not_found` | ❌ NO_SKILL | Wire handler + đảm bảo có trong `_index.json` + `_tool_spec_anthropic_implemented.json` |
| `error`, `500`, stack trace | ❌ ERROR | `docker logs appcrm-api --tail 100`, fix |
| `tôi không`, `cannot`, `không có quyền` | ⚠ DECLINE | Sửa prompt skill rõ hơn trong `_index.json` |
| Khác | ⚠ AMBIG | Đọc snippet, phân loại tay |

---

## 4. Loop tự động

```
DANH_SÁCH = đọc _index.json mỗi module trong repo này
LẶP:
  cho mỗi module:
    cho mỗi skill chưa xanh:
      ask(prompt)       # 30–50s
      sleep(20)         # cooldown
      phân loại verdict
      append vào e2e_reports/<module>_<YYYYMMDD>.md (bảng skill | verdict | duration | snippet)
    nếu module 100% xanh → tick, sang module kế
    nếu có fail:
      NO_SKILL → wire handler / cập nhật _index.json + _tool_spec_anthropic_implemented.json
      ERROR    → fix code trong /opt/crm/agent-tools-hermes.js
      DECLINE  → sửa description trong _index.json rõ hơn
      restart appcrm-api: cd /opt/crm && docker compose -p appcrm restart api
      chạy lại module đó
  nếu cả pack xanh → DỪNG
  nếu 5 vòng module nào đó không tiến triển → ghi e2e_reports/<module>_BLOCKED.md, DỪNG module đó, sang module kế
```

---

## 5. Fix ở đâu (chỉ trong appcrm-api)

- Handler: `/opt/crm/agent-tools-hermes.js` (bind-mount → `/app/dist/modules/agent-tools/routes.js`) — sửa thẳng, không rebuild
- Mirror tên skill: `_index.json` của module + `_tool_spec_anthropic_implemented.json` (whitelist LLM thấy)
- Restart: `cd /opt/crm && docker compose -p appcrm restart api`
- **KHÔNG động** `/opt/hermes/` trên Hub VPS, KHÔNG sửa Hub `_index.json` canonical

---

## 6. Output (per module)

`e2e_reports/<module>_<YYYYMMDD>.md`:
```markdown
# <module> — <date>
**Account**: <email> | **Workspace**: <ws_id>
**Kết quả**: X/Y PASS

| Skill | Verdict | Duration | Snippet |
|---|---|---|---|
| ... | PASS | 32s | ... |
```

Push lên repo này sau mỗi module.

---

**Bắt đầu**: viết `scripts/test_via_hermes.mjs` (Node) — đọc tất cả `_index.json`, login lấy JWT, lặp skill: `ask()` + `sleep(20)` + judge + ghi report. Rồi tự loop fix tới khi pack xanh.
