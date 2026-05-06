---
name: list_zalo_templates
description: Danh sách template Zalo (ZNS) đã cấu hình trong workspace
triggers:
  - "template zalo"
  - "zalo template"
  - "list template"
  - "zns template"
  - "mẫu tin zalo"
endpoint: POST /internal/skills/list_zalo_templates
---

# Skill: list_zalo_templates

## Khi nào dùng
- User muốn biết có template Zalo nào để gửi
- Cần xem `template_id` trước khi gọi `send_zalo_message` hoặc `send_zalo_broadcast`
- Xem các biến (placeholders) của từng template để điền dữ liệu

## Cách dùng
1. Gọi với `active_only: true` (mặc định) để chỉ xem template đang hoạt động
2. Trình bày danh sách template cùng mô tả và các biến cần điền
3. Nếu user hỏi template cụ thể → lọc từ danh sách trả về

## Ví dụ
User: "Có template Zalo nào nhắc lịch không?"
→ `{"active_only": true}` → lọc kết quả có từ "lịch" hoặc "appointment"

User: "Danh sách tất cả template kể cả chưa bật"
→ `{"active_only": false}`

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 5,
    "templates": [
      {
        "id": "appointment_reminder",
        "name": "Nhắc lịch hẹn",
        "status": "active",
        "type": "ZNS",
        "variables": ["customer_name", "appointment_time", "branch_name"],
        "preview": "Kính gửi {customer_name}, lịch hẹn của bạn lúc {appointment_time} tại {branch_name}. Vui lòng đến đúng giờ."
      },
      {
        "id": "birthday_greeting",
        "name": "Chúc mừng sinh nhật",
        "status": "active",
        "type": "ZNS",
        "variables": ["customer_name", "promo_code"],
        "preview": "Chúc mừng sinh nhật {customer_name}! Tặng bạn mã giảm giá {promo_code} nhân dịp đặc biệt."
      }
    ]
  }
}
```

## Lỗi thường gặp
- `NO_ZALO_INTEGRATION`: chưa cấu hình Zalo OA → Settings → Zalo
- Danh sách rỗng: chưa có template nào được phê duyệt → vào Zalo Business để tạo ZNS template
- Template `PENDING`: đang chờ Zalo duyệt, chưa dùng được
