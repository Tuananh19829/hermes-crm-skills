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

## 4. Quy trình 1 module — SEED TRƯỚC, ĐỌC SAU

**Quan trọng**: nếu chỉ test với sentinel UUID → chỉ verify handler có/không, KHÔNG verify data thật. Phải seed data trước rồi mới test READ trên data đó.

### Bước 1 — Phân loại skill trong module thành 3 nhóm
- **WRITE/SEED**: `create_*`, `add_*` (tạo data mới)
- **UPDATE**: `update_*`, `bulk_*`, `assign_*` (cần id từ bước SEED)
- **READ**: `list_*`, `get_*`, `search_*`, `find_*`, `count_*`, `report_*`, `*_detail` (đọc data đã seed)
- **DELETE**: `delete_*`, `remove_*` (chạy CUỐI để dọn)

### Bước 2 — Chạy theo thứ tự: SEED → UPDATE → READ → DELETE

```
PHASE 1 (SEED): chạy WRITE skill, args mẫu data thật (vd name="VIP Test", color="#ff0000")
                → lưu lại id trả về vào ENV/file tạm: SEEDED_GROUP_ID, SEEDED_CUSTOMER_ID, ...
PHASE 2 (UPDATE): chạy UPDATE skill với id đã seed (KHÔNG dùng sentinel)
PHASE 3 (READ):   chạy READ skill — list/get/search trên data vừa seed
                → verify response CHỨA tên/id seeded (vd "VIP Test" phải xuất hiện trong list)
PHASE 4 (DELETE): xoá data seed để dọn workspace
```

### Bước 3 — Loop fix cho cả 4 phase

```
LẶP:
  cho mỗi phase 1→4:
    cho mỗi skill chưa xanh:
      ask(prompt) — chờ tối đa 90s, sleep 15–30s
      phân loại verdict
      nếu PASS + có data → lưu id seed (phase 1), tick xanh
      nếu PHASE 3 (READ) "PASS" nhưng KHÔNG thấy seeded data → BUG, đánh dấu DATA_MISSING
      append vào e2e_reports/<module>_<YYYYMMDD>.md
  nếu có fail:
    NO_SKILL    → wire handler + cập nhật _index.json + _tool_spec_anthropic_implemented.json
    ERROR       → fix code /opt/crm/agent-tools-hermes.js
    DECLINE     → sửa description _index.json
    DATA_MISSING → kiểm tra handler READ có filter đúng workspace/group không
    restart appcrm-api, chạy lại
  nếu 100% xanh + READ thấy được seed data → push report → BÁO ANH "module X: X/Y PASS, seed verified" → DỪNG
  nếu 5 vòng không tiến triển → ghi <module>_BLOCKED.md → BÁO ANH → DỪNG
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

**Bắt đầu** với module `customer_groups`:

1. Phân loại 7 skill: SEED=`create_customer_group`; UPDATE=`update_customer_group`,`add_member_to_group`,`remove_member_from_group`; READ=`get_customer_group_detail`,`list_group_members`; DELETE=`delete_customer_group`
2. **Sửa script `test_via_hermes.mjs`** để hỗ trợ 4 phase + lưu seed id (hoặc viết wrapper `test_seed_then_read.mjs`)
3. Chạy lần lượt 4 phase
4. Fix bug đến khi: SEED tạo được, READ thấy data vừa seed, DELETE xoá được
5. Push report → báo anh "customer_groups: 7/7 PASS, seed verified" → DỪNG.
