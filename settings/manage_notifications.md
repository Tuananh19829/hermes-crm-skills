---
name: manage_notifications
description: Bật/tắt thông báo hệ thống (lịch hẹn mới, thanh toán, kho hàng thấp...)
triggers:
  - "thông báo"
  - "notification"
  - "bật thông báo"
  - "tắt thông báo"
  - "cài đặt thông báo"
  - "cảnh báo kho"
  - "nhắc lịch hẹn"
  - "alert"
endpoint: POST /internal/skills/manage_notifications
---

# Skill: manage_notifications

## Khi nào dùng
- User muốn xem cấu hình thông báo hiện tại (kênh, loại sự kiện)
- User muốn bật/tắt loại thông báo cụ thể (lịch hẹn mới, thanh toán, kho thấp...)
- User muốn chọn kênh nhận thông báo (email, Zalo, in-app)
- User phàn nàn về việc nhận quá nhiều hoặc không nhận được thông báo
- Cần cấu hình ngưỡng cảnh báo kho hàng

## Cách dùng
- `action: "get"` — Xem toàn bộ cấu hình thông báo
- `action: "update"` — Bật/tắt thông báo, cần `notifications` (object key-value)
- `action: "set_channel"` — Cấu hình kênh nhận, cần `channel` + `enabled`
- `action: "set_threshold"` — Đặt ngưỡng cảnh báo, cần `threshold_type` + `value`
- Các loại thông báo: `new_appointment`, `appointment_reminder`, `payment_received`, `low_stock`, `new_customer`, `task_due`, `staff_checkin`

## Ví dụ
User: "Xem cấu hình thông báo hiện tại"
→ `{"action": "get"}`

User: "Tắt thông báo nhân viên check-in"
→ `{"action": "update", "notifications": {"staff_checkin": false}}`

User: "Bật thông báo khi kho hàng sắp hết"
→ `{"action": "update", "notifications": {"low_stock": true}}`

User: "Tắt nhận thông báo qua email, chỉ dùng Zalo"
→ `{"action": "set_channel", "channel": "email", "enabled": false}`

User: "Đặt cảnh báo kho khi còn dưới 5 sản phẩm"
→ `{"action": "set_threshold", "threshold_type": "low_stock", "value": 5}`

## Output format
```json
{
  "ok": true,
  "action": "get",
  "data": {
    "channels": {
      "in_app": true,
      "email": true,
      "zalo": false
    },
    "notifications": {
      "new_appointment": {"enabled": true, "channels": ["in_app", "email"]},
      "appointment_reminder": {"enabled": true, "channels": ["in_app", "zalo"], "advance_minutes": 60},
      "payment_received": {"enabled": true, "channels": ["in_app"]},
      "low_stock": {"enabled": true, "channels": ["in_app", "email"], "threshold": 5},
      "new_customer": {"enabled": false, "channels": []},
      "task_due": {"enabled": true, "channels": ["in_app"]},
      "staff_checkin": {"enabled": false, "channels": []}
    }
  }
}
```

Khi update thành công:
```json
{
  "ok": true,
  "action": "update",
  "updated": ["low_stock"],
  "message": "Đã bật thông báo kho hàng thấp"
}
```

## Lỗi thường gặp
- `INVALID_NOTIFICATION_TYPE`: Loại thông báo không hợp lệ → liệt kê các loại hợp lệ
- `INVALID_CHANNEL`: Kênh không hỗ trợ (phải là in_app, email, zalo)
- `ZALO_NOT_CONNECTED`: Zalo chưa được kết nối → hướng dẫn vào Settings → Tích hợp Zalo
- `INVALID_THRESHOLD_VALUE`: Ngưỡng phải là số nguyên dương
- `PERMISSION_DENIED`: Chỉ OWNER/ADMIN mới được thay đổi cài đặt thông báo workspace
