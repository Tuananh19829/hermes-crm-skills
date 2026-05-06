---
name: send_zalo_message
description: Gửi tin nhắn Zalo cho 1 khách hàng cụ thể (text hoặc ZNS template)
triggers:
  - "gửi zalo"
  - "nhắn zalo"
  - "send zalo"
  - "zalo kh"
  - "nhắn tin zalo"
  - "zalo message"
endpoint: POST /internal/skills/send_zalo_message
---

# Skill: send_zalo_message

## Khi nào dùng
- User muốn gửi tin nhắn Zalo cho 1 khách hàng cụ thể
- Gửi thông báo lịch hẹn, nhắc lịch, chúc mừng sinh nhật qua Zalo
- Gửi theo template ZNS đã cấu hình
- KHÔNG dùng để gửi hàng loạt → dùng `send_zalo_broadcast`
- Khách hàng phải đã liên kết Zalo trong CRM (có zalo_user_id)

## Cách dùng
1. Xác nhận person_id của khách từ ngữ cảnh hoặc tìm bằng `find_customer`
2. Nếu user cung cấp nội dung text → dùng field `message`
3. Nếu user muốn dùng template → dùng `template_id` + `template_data`
4. Kiểm tra output xem tin có được gửi thành công không

## Ví dụ
User: "Nhắn Zalo kh Lan là 'Lịch hẹn của bạn là 3h chiều thứ 6 tại cơ sở'"
→ `{"person_id": "uuid_lan", "message": "Lịch hẹn của bạn là 3h chiều thứ 6 tại cơ sở"}`

User: "Gửi ZNS nhắc lịch cho kh B dùng template appointment_reminder"
→ `{"person_id": "uuid_b", "template_id": "appointment_reminder", "template_data": {"time": "15:00", "date": "25/04/2026"}}`

## Output format
```json
{
  "ok": true,
  "data": {
    "message_id": "zalo_msg_uuid",
    "person_id": "uuid",
    "sent_at": "2026-04-22T10:00:00Z",
    "status": "SENT",
    "channel": "zalo"
  }
}
```

## Lỗi thường gặp
- `ZALO_NOT_LINKED`: khách chưa liên kết tài khoản Zalo → thông báo cần follow OA trước
- `NO_ZALO_INTEGRATION`: workspace chưa cấu hình Zalo OA → vào Settings → Zalo
- `TEMPLATE_NOT_FOUND`: template_id không tồn tại → dùng `list_zalo_templates` để xem danh sách
- `ZNS_QUOTA_EXCEEDED`: hết quota ZNS tháng này → dùng tin nhắn text thường
