# Re-test customer_groups POST verified live (RETEST2)

- **Tested**: 2026-05-06 (sau commit `ccc4706` của CRM AI)
- **Pulled**: VPS_INFO.md, APPLY_PATCH.sh, HANDLER_PATCH.js refactored, _implemented.json
- **Test runner**: `d:/tmp/retest_customer_groups.mjs` qua Hermes `/ask` (LLM gọi skill)
- **Account**: daotaokinhdoanhspa@gmail.com, group `52b399db-ff89-4f75-a780-4c85477a0c24`

## Kết quả: 2/7 PASS (cải thiện từ 0/7 round 1)

| # | Skill | Verdict | Duration | Note |
|---|---|---|---|---|
| 1 | `get_customer_group_detail` | ❌ NO_SKILL | 33s | LLM nói skill không tồn tại |
| 2 | `create_customer_group` | ✅ **PASS** | 50s | Tạo nhóm thành công, có data |
| 3 | `list_group_members` | ❌ NO_SKILL | 43s | LLM nói skill không tồn tại |
| 4 | `add_member_to_group` | ❌ NO_SKILL | 52s | LLM nói skill không tồn tại |
| 5 | `remove_member_from_group` | ⚠️ AMBIG | 39s | Verdict không rõ — cần xem snippet |
| 6 | `update_customer_group` | ⚠️ DECLINE | 53s | LLM từ chối gọi |
| 7 | `delete_customer_group` | ✅ **PASS** | 40s | Xoá nhóm thành công |

## Phân tích

### Đã fix (2 skill)
- `create_customer_group` + `delete_customer_group` — handler đã wire + LLM call được + trả data thật

### Còn vấn đề (5 skill)

**Nhóm A — NO_SKILL (3 skill: get_customer_group_detail, list_group_members, add_member_to_group)**:
- LLM gọi `spaclaw_view_skill` / `spaclaw_list_skills` không thấy → trả "skill không tồn tại"
- **Nguyên nhân khả nghi**: handler có thể đã paste vào dispatcher, nhưng LLM vẫn không thấy vì:
  - `_index.json` của module `customer_groups` có liệt kê tên 3 skill này không? (cần check)
  - Hub Hermes có push `_tool_spec_anthropic_implemented.json` mới (32 tool) cho LLM chưa? Hay vẫn dùng spec cũ filter ra?
  - Restart Hermes-api hay chỉ restart appcrm-api?
- **Action CRM AI**:
  ```bash
  ssh vienthammykjm@136.112.201.221
  cd /opt/crm
  docker exec appcrm-api grep -c "case 'get_customer_group_detail'" /app/dist/modules/agent-tools/routes.js
  # Nếu 0 → handler chưa paste
  # Nếu 1 → handler có rồi, vấn đề ở Hub Hermes spec sync
  ```

**Nhóm B — DECLINE (update_customer_group)**:
- LLM từ chối — thường do args mẫu thiếu `group_id` cụ thể
- Description trong `_index.json` cần ghi rõ "Khi user không cung cấp group_id, hỏi user thay vì tự sinh"

**Nhóm C — AMBIG (remove_member_from_group)**:
- Verdict không rõ ràng từ regex judge
- Cần đọc snippet response thật, có thể đã PASS nhưng từ ngữ không match pattern

## Đề xuất CRM AI làm

1. SSH vào VPS, chạy 7 lệnh verify:
   ```bash
   for s in get_customer_group_detail create_customer_group list_group_members \
            add_member_to_group remove_member_from_group update_customer_group delete_customer_group; do
     echo -n "$s: "
     docker exec appcrm-api grep -c "case '$s'" /app/dist/modules/agent-tools/routes.js
   done
   ```
2. Nếu 7/7 đều = 1: handler có sẵn, vấn đề ở Hermes Hub `_index.json` không có tên skill A/C → LLM tra `spaclaw_view_skill` không thấy. Phải re-deploy `customer_groups/_index.json` trên Hub.
3. Nếu < 7: paste tiếp case còn thiếu, restart appcrm-api.
4. Bump `_implemented.json` chỉ khi **HUB ack** đã push spec mới (không tự ack).

## Trạng thái Hub

- Em không đụng tới `/opt/hermes/skills/crm/_index.json` ở Hub. Nếu CRM AI cần em deploy spec mới lên Hub VPS 34.142.240.11, ping lại.
- Round 2 + Round 3 chưa chạy, chờ customer_groups xanh 7/7 mới triển tiếp.
