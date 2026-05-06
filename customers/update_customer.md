---
name: update_customer
description: Cập nhật thông tin khách hàng - tên, SĐT, email, địa chỉ, ngày sinh, tag, nhóm, ghi chú. Dùng khi user muốn sửa dữ liệu KH đã có.
triggers:
  - "cập nhật khách"
  - "sửa thông tin kh"
  - "update kh"
  - "đổi sdt khách"
  - "đổi email khách"
  - "chỉnh thông tin kh"
  - "gán tag"
  - "đổi nhóm kh"
endpoint: POST /internal/skills/update_customer
---

# Skill: update_customer

## Khi nào dùng
- User muốn sửa thông tin một khách hàng đã tồn tại trong hệ thống
- Chỉ cập nhật các trường được truyền vào — các trường không truyền giữ nguyên
- Cần có ID khách trước khi gọi → dùng `search_customers` nếu chưa có

## Cách dùng
1. Đảm bảo có `id` của khách (từ `search_customers` hoặc user cung cấp)
2. Chỉ đưa vào payload các trường user muốn thay đổi
3. Nếu user muốn thêm tag (không xóa tag cũ) → `tags_mode: "merge"` (mặc định)
4. Nếu user muốn đặt lại toàn bộ tag → `tags_mode: "replace"`
5. Xác nhận kết quả với user sau khi cập nhật

## Ví dụ

User: "Đổi SĐT kh abc-123 thành 0909111222"
→ `{"id": "abc-123", "phone": "0909111222"}`

User: "Gán tag VIP cho kh abc-123"
→ `{"id": "abc-123", "tags": ["VIP"], "tags_mode": "merge"}`

User: "Chuyển kh abc-123 sang nhóm VIP (group_id: grp-vip-001)"
→ `{"id": "abc-123", "group_id": "grp-vip-001"}`

User: "Sửa địa chỉ kh abc-123: 45 Lê Lợi, Q1, HCM"
→ `{"id": "abc-123", "address": "45 Lê Lợi, Q1, HCM"}`

User: "Đặt lại tag của kh abc-123: chỉ giữ tag [loyal, spa]"
→ `{"id": "abc-123", "tags": ["loyal", "spa"], "tags_mode": "replace"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "id": "abc-123",
    "updated_fields": ["phone", "tags"],
    "message": "Đã cập nhật thông tin khách hàng",
    "updated_at": "2026-04-22T11:00:00Z"
  }
}
```

## Lỗi thường gặp
- `NOT_FOUND`: ID không tồn tại hoặc không thuộc workspace → kiểm tra lại ID
- `DUPLICATE_PHONE`: SĐT mới đã được dùng bởi KH khác → thông báo và không cập nhật
- `INVALID_PHONE`: Định dạng SĐT không hợp lệ → chuyển về 10 số bắt đầu bằng 0
- `GROUP_NOT_FOUND`: group_id không tồn tại → dùng `list_customer_groups` để lấy ID đúng
