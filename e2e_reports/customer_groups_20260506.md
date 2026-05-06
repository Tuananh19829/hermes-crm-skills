# Module `customer_groups` — báo cáo lỗi skill (2026-05-06T11:08:57Z)

**Tổng**: 7 | **PASS**: 0 | **Lỗi**: 7

## ❌ LỖI (7)

| Skill | Verdict | Có handler? | Lý do | Snippet |
|---|---|---|---|---|
| `get_customer_group_detail` | NO_SKILL | ❌ chưa wire | LLM nói skill không tồn tại | Không gọi được skill `get_customer_group_detail`. - Mình đã tra trong app `crm` và kiểm tra trực tiếp tên skill này, nhưng hệ thống trả về `SKILL_NOT_FOUND`. - Danh sách skill CRM hiện tại không có ` |
| `create_customer_group` | NO_SKILL | ❌ chưa wire | LLM nói skill không tồn tại | Không gọi được skill `create_customer_group` trong app `crm`. - `spaclaw_list_skills` không tìm thấy skill nào khớp `create_customer_group` - `spaclaw_view_skill` trả về `SKILL_NOT_FOUND` cho `create |
| `update_customer_group` | NO_SKILL | ❌ chưa wire | LLM nói skill không tồn tại | Không gọi được skill theo yêu cầu vì `update_customer_group` hiện không tồn tại trong app `crm` (và cũng không thấy trong `zalo`). - Đã kiểm tra bằng `spaclaw_list_skills` với từ khóa `update_custome |
| `delete_customer_group` | NO_SKILL | ❌ chưa wire | LLM nói skill không tồn tại | Không gọi được skill. - Đã kiểm tra skill `delete_customer_group` trong app `crm` nhưng hệ thống trả về `SKILL_NOT_FOUND`. - Tìm thêm theo các từ khóa gần nghĩa như `xóa nhóm KH`, `delete group`, `cu |
| `add_member_to_group` | TIMEOUT | ❌ chưa wire | no reply |  |
| `remove_member_from_group` | NO_SKILL | ❌ chưa wire | LLM nói skill không tồn tại | Không gọi được vì skill `remove_member_from_group` không tồn tại trong app `zalo`. - `spaclaw_list_skills` với truy vấn `remove_member_from_group` trả về `0` skill - `spaclaw_view_skill` cho `remove_ |
| `list_group_members` | NO_SKILL | ❌ chưa wire | LLM nói skill không tồn tại | Không gọi được skill vì trong app `crm` hiện không tồn tại skill `list_group_members`. - Đã kiểm tra danh sách skill trong `crm`: không có skill khớp `list_group_members` - Đã thử xem chi tiết trực t |
