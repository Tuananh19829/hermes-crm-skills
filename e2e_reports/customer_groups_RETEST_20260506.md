# Re-test customer_groups (post-fix v3.3.0) — 2026-05-06T12:20:53Z

**Kết quả**: 0/7 skill nhận diện được handler

| Skill | Verdict | Duration | Reason | Snippet |
|---|---|---|---|---|
| `get_customer_group_detail` | NO_SKILL | 25618ms | LLM nói skill không tồn tại | Không gọi được skill vì `get_customer_group_detail` hiện không tồn tại trong app `crm`. - `spaclaw_list_skills` với từ khóa `get_customer_group_detail` và `customer group detail`  |
| `create_customer_group` | DECLINE | 54741ms | LLM từ chối | Mình đã kiểm tra skill trong app `crm`, nhưng không có skill `create_customer_group` để gọi trực tiếp. - Không tìm thấy `create_customer_group` trong `crm` - Skill gần nhất hiện c |
| `list_group_members` | NO_SKILL | 32543ms | LLM nói skill không tồn tại | Không gọi được vì skill `list_group_members` hiện không tồn tại trong app `zalo`. - `spaclaw_list_skills` không trả về skill nào khớp `list_group_members` - `spaclaw_view_skill` t |
| `add_member_to_group` | DECLINE | 59574ms | LLM từ chối | Mình đã kiểm tra các skill khả dụng nhưng hiện không có skill tên `add_member_to_group`, nên chưa thể gọi trực tiếp được. - Đã tra trong các app khả dụng như `crm`, `zalo`, `page` |
| `remove_member_from_group` | NO_SKILL | 33622ms | LLM nói skill không tồn tại | Mình đã thử gọi đúng quy trình nhưng hiện tại không có skill `remove_member_from_group` trong app `zalo`. - Đã tìm theo `remove_member_from_group` và `remove member group` nhưng k |
| `update_customer_group` | NO_SKILL | 51248ms | LLM nói skill không tồn tại | Không thể gọi được `update_customer_group` vì skill này hiện không tồn tại trong index khả dụng. - Mình đã kiểm tra các app có thể dùng; không thấy `update_customer_group` - Ở `cr |
| `delete_customer_group` | NO_SKILL | 29169ms | LLM nói skill không tồn tại | Không thể gọi được vì skill `delete_customer_group` hiện không tồn tại trong các app mình kiểm tra (`crm`, `ads`, `page`, `zalo`). - Mình đã tra cứu skill và thử xem chi tiết skil |

## Verdict legend
- **PASS** = handler chạy + trả data
- **PASS_VALIDATION** = handler có, args mẫu thiếu nên 400/404 đúng kỳ vọng (group_not_found, customer_not_found, missing_param)
- **NO_SKILL** = backend chưa wire (vẫn còn lỗi)
- **TIMEOUT/ERROR/DECLINE/AMBIG** = cần debug