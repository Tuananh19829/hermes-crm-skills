---
name: create_customer
description: Tạo khách hàng mới với họ tên, SĐT, ngày sinh, địa chỉ, ghi chú. Dùng khi user muốn thêm KH mới vào hệ thống (không phải lead).
triggers:
  - "tạo khách hàng"
  - "thêm khách mới"
  - "đăng ký khách"
  - "create customer"
  - "thêm kh mới"
  - "nhập thông tin kh"
endpoint: POST /internal/skills/create_customer
---

# Skill: create_customer

## Khi nào dùng
- User muốn đăng ký một khách hàng hoàn toàn mới vào hệ thống (đã mua hoặc vừa đến)
- Khác với `create_lead` (khách tiềm năng chưa mua): skill này tạo KH đã xác nhận
- LUÔN hỏi lại nếu thiếu thông tin bắt buộc: `full_name`
- KHÔNG tạo trùng: trước khi tạo, nếu user cung cấp SĐT → dùng `search_customers` kiểm tra trùng

## Cách dùng
1. Thu thập thông tin từ user (tên, SĐT, ngày sinh, v.v.)
2. Kiểm tra trùng SĐT nếu user cung cấp số điện thoại
3. Nếu user đề cập nhóm (VIP, thân thiết) → hỏi group_id hoặc truyền group_name
4. Gọi endpoint với dữ liệu đã có
5. Xác nhận kết quả và cung cấp link/ID khách mới tạo

## Ví dụ

User: "Thêm khách mới: Trần Văn Bình, SĐT 0912345678, sinh 15/5/1988"
→ `{"full_name": "Trần Văn Bình", "phone": "0912345678", "birthday": "1988-05-15"}`

User: "Tạo kh mới tên Hoa, nữ, zalo 0987654321, ghi chú: khách walk-in hỏi dịch vụ trẻ hóa da"
→ `{"full_name": "Hoa", "gender": "FEMALE", "phone": "0987654321", "note": "khách walk-in hỏi dịch vụ trẻ hóa da", "source": "walk_in"}`

User: "Đăng ký kh VIP mới: Lê Thị Mai, 0901234567"
→ `{"full_name": "Lê Thị Mai", "phone": "0901234567", "tags": ["vip"]}`

## Output format
```json
{
  "ok": true,
  "data": {
    "id": "uuid-khach-moi",
    "full_name": "Trần Văn Bình",
    "phone": "0912345678",
    "birthday": "1988-05-15",
    "tags": [],
    "group": null,
    "loyalty_points": 0,
    "created_at": "2026-04-22T10:00:00Z",
    "message": "Đã tạo khách hàng thành công"
  }
}
```

## Lỗi thường gặp
- `DUPLICATE_PHONE`: SĐT đã tồn tại → thông báo cho user và cung cấp link KH đã có
- `INVALID_PHONE`: Định dạng SĐT không hợp lệ → yêu cầu user nhập lại số 10 chữ số
- `INVALID_DATE`: Ngày sinh không đúng định dạng → chuyển sang YYYY-MM-DD trước khi gửi
- `GROUP_NOT_FOUND`: group_id không tồn tại → bỏ trống group_id, thêm sau
