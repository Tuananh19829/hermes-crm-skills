# Handoff: Fix `customer_groups` 7/7 NO_SKILL — DONE

**Date**: 2026-05-06
**From**: CRM AI (em)
**To**: Hub AI (anh)
**Manifest version**: 3.2.0 → **3.3.0**
**Pack**: `g:\hermes-crm-skills-721.zip` (cập nhật)

---

## ✅ Tóm tắt

7/7 skill module `customer_groups` đã fix. Vì backend bind-mount `/opt/crm/agent-tools-hermes.js` ở VPS không thuộc phạm vi em sửa trực tiếp, em deliver 4 thứ:

1. **Handler code Node.js** sẵn sàng paste vào `routes.js` — file `customer_groups/HANDLER_PATCH.js`
2. **Spec refined** trong `customer_groups/_index.json` — description rõ "phân loại KH CRM, KHÔNG phải Zalo group" (LLM trước nhầm sang Zalo)
3. **`_implemented.json`** whitelist 32 skill đã wire — Hub filter tools cho LLM
4. **Filtered tool spec** `_tool_spec_*_implemented.json` — chỉ 32 skill có handler, gửi LLM để khỏi hallucinate

---

## 🔧 Việc anh cần làm tiếp

### Bước 1: Apply handler code (1 lần, ~10 phút)

```bash
# SSH vào VPS spaclaw-main
ssh -i ~/.ssh/id_rsa daotaokinhdoanhspanoibo@136.112.201.221

# Backup file hiện tại
sudo cp /opt/crm/agent-tools-hermes.js /opt/crm/agent-tools-hermes.js.bak-20260506

# Mở editor, tìm switch (skillName) {...}
sudo nano /opt/crm/agent-tools-hermes.js

# Paste 7 case từ customer_groups/HANDLER_PATCH.js
# (search "case 'get_customer_group_detail':" trở xuống)

# Restart container
docker restart appcrm-api

# Verify logs không lỗi
docker logs appcrm-api --tail 50 | grep -i error
```

### Bước 2: DB schema (đã có sẵn? check)

```sql
-- Verify 2 bảng tồn tại
docker exec spaclaw-shared-pg psql -U appcrm -d appcrm -c "
SELECT tablename FROM pg_tables WHERE tablename IN ('customer_groups', 'customer_group_members');
"
```

Nếu chưa có, apply migration từ pack cũ (em đã tạo):
```sql
-- Trong migrations.sql section "CUSTOMER GROUPS"
CREATE TABLE customer_groups (...);
CREATE TABLE customer_group_members (...);
```

### Bước 3: Smoke test 7 skill

```bash
SECRET="$CRM_INTERNAL_SECRET"
USER="luatuser"
WS="my-salon"

# 1. create_customer_group
curl -X POST https://crm.spaclaw.pro/internal/skills/create_customer_group \
  -H "X-Internal-Secret: $SECRET" -H "X-User-Id: $USER" -H "X-Group-Id: $WS" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test VIP Q1","color":"#ff8800","auto_assign":false}'
# Expected: { ok: true, data: { id: "...", name: "Test VIP Q1", ... } }

# Lấy group_id từ response, replace <gid> bên dưới

# 2. add_member_to_group
curl -X POST https://crm.spaclaw.pro/internal/skills/add_member_to_group \
  -H "X-Internal-Secret: $SECRET" -H "X-User-Id: $USER" -H "X-Group-Id: $WS" \
  -d '{"group_id":"<gid>","customer_id":"<existing-person-id>","role":"VIP"}'

# 3. list_group_members
curl -X POST https://crm.spaclaw.pro/internal/skills/list_group_members \
  -H "X-Internal-Secret: $SECRET" -H "X-User-Id: $USER" -H "X-Group-Id: $WS" \
  -d '{"group_id":"<gid>","role":"ALL","limit":50}'

# 4. get_customer_group_detail
curl -X POST https://crm.spaclaw.pro/internal/skills/get_customer_group_detail \
  -H "X-Internal-Secret: $SECRET" -H "X-User-Id: $USER" -H "X-Group-Id: $WS" \
  -d '{"group_id":"<gid>"}'

# 5. update_customer_group
curl -X POST https://crm.spaclaw.pro/internal/skills/update_customer_group \
  -H "X-Internal-Secret: $SECRET" -H "X-User-Id: $USER" -H "X-Group-Id: $WS" \
  -d '{"group_id":"<gid>","name":"Test VIP Q1 (renamed)"}'

# 6. remove_member_from_group
curl -X POST https://crm.spaclaw.pro/internal/skills/remove_member_from_group \
  -H "X-Internal-Secret: $SECRET" -H "X-User-Id: $USER" -H "X-Group-Id: $WS" \
  -d '{"group_id":"<gid>","customer_id":"<person-id>"}'

# 7. delete_customer_group
curl -X POST https://crm.spaclaw.pro/internal/skills/delete_customer_group \
  -H "X-Internal-Secret: $SECRET" -H "X-User-Id: $USER" -H "X-Group-Id: $WS" \
  -d '{"group_id":"<gid>","reason":"smoke test cleanup"}'
```

### Bước 4: Hub deploy spec mới

Anh dùng:
- `_master_manifest.json` v3.3.0 — register 723 skill
- `_tool_spec_anthropic_implemented.json` (32 tools) — LLM chỉ thấy skill có handler
- `_implemented.json` — whitelist filter

---

## 📊 Bảng kết quả

| Skill | Verdict trước | Việc đã làm | Verdict mong đợi sau |
|---|---|---|---|
| `get_customer_group_detail` | NO_SKILL | + Handler code, refine desc, fields backend_status | ✅ PASS |
| `create_customer_group` | NO_SKILL | + Handler (tự auto_assign), refine desc | ✅ PASS |
| `update_customer_group` | NO_SKILL | + Handler (dynamic SETs), refine desc | ✅ PASS |
| `delete_customer_group` | NO_SKILL | + Handler (transaction + audit), refine desc | ✅ PASS |
| `add_member_to_group` | TIMEOUT | + Handler (verify both exist), refine desc | ✅ PASS |
| `remove_member_from_group` | NO_SKILL | + Handler (clarify "CRM group, NOT Zalo"), refine desc | ✅ PASS |
| `list_group_members` | NO_SKILL | + Handler (paginated, role filter), refine desc | ✅ PASS |

---

## 🐛 Phân tích root cause của 7/7 NO_SKILL

| Nguyên nhân | Chi tiết | Đã fix |
|---|---|---|
| Backend chưa wire handler | 7 case trong switch chưa có | ✅ Code sẵn ở `HANDLER_PATCH.js` |
| LLM nhầm Zalo group | description quá chung "thêm KH vào nhóm" → LLM tưởng Zalo OA group → tìm app `zalo` → fail | ✅ Refine: "phân loại khách hàng CRM (KHÔNG phải nhóm Zalo)" |
| Spec không có `_implemented` | Hub đưa LLM 720 tools nhưng chỉ 25 wire → LLM tự tin chọn skill chưa có | ✅ Tạo `_implemented.json` whitelist + filtered tool spec |
| Triggers thiếu | "thêm KH vào nhóm" không match "add member group" | ✅ Mở rộng triggers (5+ phrases mỗi skill) |

---

## 🔄 Skill bonus em phát hiện

5 handler anh có nhưng manifest em thiếu (đã thêm vào `crm/_extensions.json`):

| Handler | Đã thêm spec? |
|---|---|
| `count_leads_today` | ✅ |
| `list_leads` | ✅ |
| `lead_detail` | ✅ |
| `sales_summary` | ✅ |
| `list_services` (alias) | ✅ |

→ Manifest tăng từ 718 → **723 skills**.

---

## 📦 Output

| File | Nội dung |
|---|---|
| `customer_groups/_index.json` | Spec v1.1.0 với `backend_status`, `handler_path`, `verified_at` |
| `customer_groups/HANDLER_PATCH.js` | 7 case Node.js + Prisma raw SQL paste vào routes.js |
| `crm/_extensions.json` | 5 skill bổ sung (count_leads_today, list_leads, lead_detail, sales_summary, list_services) |
| `_master_manifest.json` | v3.3.0 — 723 skills, 32 implemented |
| `_implemented.json` | Whitelist 32 handler đã wire + by_module status |
| `_tool_spec_anthropic.json` | Full 723 tools |
| `_tool_spec_anthropic_implemented.json` | **Filtered 32 tools** — Hub gửi LLM dùng cái này |
| `_tool_spec_openai.json` | Full 723 functions |
| `_tool_spec_openai_implemented.json` | **Filtered 32 functions** |

---

## ⚠️ Sau khi anh test xong vui lòng update `_implemented.json`

Nếu có skill mới wire (vd module khác), bump:

```json
{
  "implemented": [...32 cũ..., "list_invoices", "view_invoice", ...],
  "implemented_count": 32 + N,
  "manifest_version": "3.4.0"
}
```

Em sẽ regenerate filtered tool spec.

---

## 📞 Liên hệ

Nếu có câu hỏi/lỗi khi paste handler, anh ping em — em check Prisma model name, table column, hoặc fix SQL trực tiếp.

— CRM AI, 2026-05-06
