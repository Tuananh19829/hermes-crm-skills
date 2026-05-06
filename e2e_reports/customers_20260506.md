# customers — 20260506
**Account**: daotaokinhdoanhspa@gmail.com | **Workspace**: 52b399db-ff89-4f75-a780-4c85477a0c24
**Kết quả**: 3/8 PASS

| Skill | Verdict | Duration | Reason | Snippet |
|---|---|---|---|---|
| `search_customers` | NO_SKILL | 37206ms | LLM nói skill không tồn tại | Mình đã thử tìm skill `search_customers` trên các app khả dụng (`crm`, `zalo`, `ads`, `page`, thêm `photo`/`video` để kiểm tra), nhưng không có skill  |
| `get_customer_detail` | PASS_VALIDATION | 29316ms | handler có, validate đúng | Đã gọi thử `get_customer_detail` và hệ thống trả lỗi đúng kiểu mong đợi với args mẫu thiếu `id`: - Skill: `get_customer_detail` - App: `crm` - Kết quả |
| `create_customer` | PASS_VALIDATION | 35613ms | handler có, validate đúng | Đã gọi `create_customer` luôn. Kết quả: - Lỗi trả về: `MISSING_PARAMS` - Chi tiết: `full_name & phone required` Nếu bạn muốn, mình có thể gọi lại ngay |
| `update_customer` | NO_SKILL | 42331ms | LLM nói skill không tồn tại | Đã gọi thử luôn theo yêu cầu. - `spaclaw_view_skill` với `crm/update_customer` trả `SKILL_NOT_FOUND` - Mình cũng dò index skill liên quan trong `crm`, |
| `get_loyalty_points` | NO_SKILL | 36777ms | LLM nói skill không tồn tại | Đã gọi thử theo yêu cầu. Kết quả: - `spaclaw_view_skill` với `get_loyalty_points` trong app `crm` trả `SKILL_NOT_FOUND` - Mình cũng đã dò skill liên q |
| `manage_vouchers` | NO_SKILL | 24907ms | LLM nói skill không tồn tại | Mình đã gọi kiểm tra trực tiếp cho `manage_vouchers`, nhưng skill này hiện không tồn tại trong app `zalo`. - `spaclaw_list_skills(query="manage_vouche |
| `list_customer_groups` | PASS_VALIDATION | 57893ms | handler có, validate đúng | Mình đã gọi tìm skill trong app `crm`, nhưng hiện không có skill tên `list_customer_groups` và cũng không thấy skill tương tự để chạy thử với args mẫu |
| `customer_care_list` | NO_SKILL | 25362ms | LLM nói skill không tồn tại | Mình đã thử gọi theo đúng flow bắt buộc: - Tra skill `customer_care_list` trong app `crm`: không có kết quả - Xem chi tiết skill `customer_care_list`: |