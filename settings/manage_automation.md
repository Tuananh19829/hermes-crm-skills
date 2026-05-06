---
name: manage_automation
description: Xem/tạo/xóa quy tắc tự động hóa (nhắc lịch, gửi Zalo sinh nhật, follow-up)
triggers:
  - "tự động hóa"
  - "automation"
  - "quy tắc tự động"
  - "nhắc lịch tự động"
  - "gửi Zalo tự động"
  - "sinh nhật tự động"
  - "follow-up"
  - "tạo rule"
  - "workflow"
endpoint: POST /internal/skills/manage_automation
---

# Skill: manage_automation

## Khi nào dùng
- User muốn xem danh sách quy tắc tự động hóa đang chạy
- User muốn tạo quy tắc mới (nhắc lịch hẹn, chúc sinh nhật qua Zalo, follow-up sau liệu trình...)
- User muốn bật/tắt hoặc xóa một quy tắc tự động
- User hỏi "quy tắc nào đang gửi Zalo tự động?"
- Cần kiểm tra lịch sử thực thi của một rule

## Cách dùng
- `action: "list"` — Xem danh sách tất cả rule tự động
- `action: "get"` — Xem chi tiết rule, cần `rule_id`
- `action: "create"` — Tạo rule mới, cần `trigger`, `conditions`, `actions`
- `action: "update"` — Cập nhật rule, cần `rule_id` + các trường cần đổi
- `action: "toggle"` — Bật/tắt rule, cần `rule_id` + `enabled`
- `action: "delete"` — Xóa rule, cần `rule_id`
- `action: "get_history"` — Xem lịch sử thực thi, cần `rule_id`
- Trigger types: `before_appointment`, `after_appointment`, `birthday`, `after_invoice_paid`, `no_visit_days`, `low_course_sessions`

## Ví dụ
User: "Danh sách các quy tắc tự động đang bật"
→ `{"action": "list", "filter": "active"}`

User: "Tạo quy tắc nhắc lịch hẹn trước 2 tiếng qua Zalo"
→ `{"action": "create", "name": "Nhắc lịch hẹn 2h", "trigger": "before_appointment", "trigger_config": {"minutes_before": 120}, "actions": [{"type": "send_zalo", "template": "appointment_reminder"}]}`

User: "Tạo quy tắc chúc sinh nhật khách hàng mỗi ngày lúc 8h sáng"
→ `{"action": "create", "name": "Chúc sinh nhật", "trigger": "birthday", "trigger_config": {"send_at": "08:00"}, "actions": [{"type": "send_zalo", "template": "happy_birthday"}]}`

User: "Tắt rule follow-up sau liệu trình"
→ `{"action": "toggle", "rule_id": "rule_xyz", "enabled": false}`

User: "Xem lịch sử gửi của rule nhắc lịch hẹn"
→ `{"action": "get_history", "rule_id": "rule_abc", "limit": 20}`

## Output format
```json
{
  "ok": true,
  "action": "list",
  "data": {
    "rules": [
      {
        "id": "rule_001",
        "name": "Nhắc lịch hẹn 2h",
        "trigger": "before_appointment",
        "trigger_config": {"minutes_before": 120},
        "actions": [{"type": "send_zalo", "template": "appointment_reminder"}],
        "enabled": true,
        "last_run": "2026-04-22T08:00:00Z",
        "run_count": 142
      },
      {
        "id": "rule_002",
        "name": "Chúc sinh nhật",
        "trigger": "birthday",
        "trigger_config": {"send_at": "08:00"},
        "actions": [{"type": "send_zalo", "template": "happy_birthday"}],
        "enabled": true,
        "last_run": "2026-04-22T08:00:00Z",
        "run_count": 38
      }
    ],
    "total": 2,
    "active_count": 2
  }
}
```

Khi tạo rule thành công:
```json
{
  "ok": true,
  "action": "create",
  "data": {
    "id": "rule_new003",
    "name": "Nhắc lịch hẹn 2h",
    "enabled": true,
    "created_at": "2026-04-22T10:00:00Z"
  },
  "message": "Đã tạo quy tắc tự động hóa thành công"
}
```

## Lỗi thường gặp
- `INVALID_TRIGGER_TYPE`: Loại trigger không hợp lệ → liệt kê các trigger hợp lệ
- `ZALO_NOT_CONNECTED`: Zalo OA chưa kết nối → hướng dẫn vào Settings → Tích hợp Zalo
- `TEMPLATE_NOT_FOUND`: Template Zalo chưa tạo → hướng dẫn vào Settings → Mẫu tin nhắn
- `RULE_NOT_FOUND`: `rule_id` không tồn tại
- `DUPLICATE_RULE_NAME`: Tên rule đã tồn tại → yêu cầu đặt tên khác
- `PERMISSION_DENIED`: Chỉ OWNER/ADMIN/MANAGER mới được tạo và quản lý quy tắc tự động
