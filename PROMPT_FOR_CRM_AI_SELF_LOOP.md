# Prompt cho CRM AI: Tự test skill CRM + tự fix

Mày là AI quản lý app CRM. Việc của mày:

1. **Tạo tài khoản test** (nếu chưa có) → lấy JWT + workspace_id.
2. **Viết script** gọi qua **Hermes /ask** (E2E thật, có LLM). Mỗi skill: chờ kết quả ~60s (Hermes chậm), rồi sleep 15–30s sang skill kế.
3. **Làm TỪNG MODULE 1**. Test xong 1 module → fix hết bug → push report → **DỪNG, báo anh** "module X xong, X/Y PASS". Chờ anh nói "tiếp" mới sang module kế.
4. **KHÔNG tự loop hết pack**. KHÔNG ping Hub.

---

## 1. Tài khoản test (DÙNG ACCOUNT NÀY)

- **Email**: `daotaokinhdoanhspa@gmail.com`
- **Password**: hỏi anh (KHÔNG commit pass vào repo)
- **workspace_id (My Salon)**: `52b399db-ff89-4f75-a780-4c85477a0c24`

Account này có sẵn data + đã link app CRM. Không tạo mới.

---

## 2. Script test có sẵn — `scripts/test_via_hermes.mjs`

**Chạy lệnh duy nhất**:
```bash
EMAIL=daotaokinhdoanhspa@gmail.com \
PASSWORD='<hỏi-anh>' \
WORKSPACE_ID=52b399db-ff89-4f75-a780-4c85477a0c24 \
node scripts/test_via_hermes.mjs --module=customer_groups
```

Script tự:
1. Login SSO → lấy JWT
2. Đọc `customer_groups/_index.json` → lấy danh sách skill
3. Với mỗi skill: gọi `POST /api/v1/hermes/companies/$WS/agents/crm/ask` body `{"message":"Hãy gọi skill <name> với args mẫu..."}` (timeout 90s)
4. Sleep 20s giữa 2 skill
5. Phân loại verdict
6. Ghi `e2e_reports/customer_groups_<YYYYMMDD>.md`

Đổi module: `--module=notifications`, `--module=hr`, ...

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

## 4. Quy trình 1 module (làm tuần tự, KHÔNG tự sang module kế)

```
chọn 1 module (anh chỉ định, hoặc bắt đầu từ customer_groups)
LẶP cho module này:
  cho mỗi skill chưa xanh:
    ask(prompt) — chờ tối đa 90s
    sleep 15–30s
    phân loại verdict
    append vào e2e_reports/<module>_<YYYYMMDD>.md
  nếu có fail:
    NO_SKILL → wire handler + cập nhật _index.json + _tool_spec_anthropic_implemented.json
    ERROR    → fix code /opt/crm/agent-tools-hermes.js
    DECLINE  → sửa description _index.json
    restart appcrm-api, chạy lại module
  nếu 100% xanh → push report lên git → BÁO ANH "module X: X/Y PASS, xong" → DỪNG, chờ lệnh
  nếu 5 vòng không tiến triển → ghi <module>_BLOCKED.md → BÁO ANH lý do → DỪNG, chờ lệnh
```

**Tuyệt đối không tự nhảy sang module khác. Báo cáo xong, đợi anh.**

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

**Bắt đầu**: chạy `node scripts/test_via_hermes.mjs --module=customer_groups` → đọc report → fix bug → chạy lại đến khi xanh → push report → báo anh "customer_groups: X/Y PASS, xong" → DỪNG.
