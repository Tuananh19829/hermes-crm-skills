---
name: update_workspace_info
description: Cập nhật thông tin cơ sở (tên, địa chỉ, giờ hoạt động, SĐT)
triggers:
  - "cập nhật cơ sở"
  - "đổi địa chỉ"
  - "cập nhật giờ mở cửa"
  - "update workspace"
  - "sửa thông tin spa"
endpoint: POST /internal/skills/update_workspace_info
---

# Skill: update_workspace_info

## Khi nào dùng
- User (ADMIN) muốn thay đổi thông tin cơ sở
- Cập nhật giờ hoạt động (nghỉ lễ, đổi giờ mùa hè)
- Đổi địa chỉ, SĐT, email liên hệ
- CHỈ truyền các field cần thay đổi (partial update)
- KHÔNG dùng nếu user không có quyền ADMIN

## Cách dùng
1. Xác nhận user có quyền ADMIN (server kiểm tra)
2. Trích xuất thông tin cần thay đổi từ yêu cầu
3. Hỏi user xác nhận trước khi thực hiện (thông tin quan trọng)
4. Chỉ gửi các field thay đổi, không gửi toàn bộ

## Ví dụ
User: "Đổi giờ đóng cửa thứ 6 thành 22h"
→ Xác nhận: "Sẽ đổi giờ đóng cửa thứ Sáu từ 21:00 → 22:00, xác nhận?" → `{"working_hours": {"fri": {"open": "08:00", "close": "22:00"}}}`

User: "Cập nhật địa chỉ mới: 456 Lê Lợi, Q.1"
→ `{"address": "456 Lê Lợi, P. Bến Nghé, Q.1, TP.HCM"}`

User: "Đổi SĐT liên hệ thành 028 5555 6666"
→ `{"phone": "028 5555 6666"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "updated_fields": ["address", "phone"],
    "updated_at": "2026-04-22T10:00:00Z",
    "updated_by": "uuid_admin"
  }
}
```

## Lỗi thường gặp
- `PERMISSION_DENIED`: chỉ ADMIN được cập nhật thông tin cơ sở → hướng dẫn liên hệ admin
- `INVALID_TIME_FORMAT`: giờ mở/đóng cửa phải đúng định dạng HH:MM (24h)
- `CLOSE_BEFORE_OPEN`: giờ đóng cửa phải sau giờ mở cửa
