---
name: get_workspace_info
description: Xem thông tin cơ sở (tên, địa chỉ, giờ hoạt động, liên hệ)
triggers:
  - "thông tin cơ sở"
  - "workspace info"
  - "địa chỉ"
  - "giờ mở cửa"
  - "thông tin spa"
  - "giờ hoạt động"
endpoint: POST /internal/skills/get_workspace_info
---

# Skill: get_workspace_info

## Khi nào dùng
- User hỏi về thông tin cơ bản của cơ sở/clinic/spa
- Cần lấy địa chỉ, SĐT, giờ hoạt động để thông báo cho khách
- Xem cấu hình workspace trước khi gọi các skill liên quan

## Cách dùng
- Không cần tham số đầu vào
- Gọi thẳng endpoint, trình bày thông tin dưới dạng thẻ thông tin gọn

## Ví dụ
User: "Giờ mở cửa của mình là mấy giờ?"
→ `{}`

User: "Địa chỉ spa chính xác là gì?"
→ `{}`

## Output format
```json
{
  "ok": true,
  "data": {
    "name": "Spaclaw Beauty & Spa",
    "address": "123 Nguyễn Trãi, P. Bến Thành, Q.1, TP.HCM",
    "phone": "028 3333 4444",
    "email": "hello@spaclaw.pro",
    "logo_url": "https://cdn.spaclaw.pro/logo.png",
    "working_hours": {
      "mon": {"open": "08:00", "close": "20:00"},
      "tue": {"open": "08:00", "close": "20:00"},
      "wed": {"open": "08:00", "close": "20:00"},
      "thu": {"open": "08:00", "close": "20:00"},
      "fri": {"open": "08:00", "close": "21:00"},
      "sat": {"open": "07:30", "close": "21:00"},
      "sun": {"open": "09:00", "close": "18:00"}
    },
    "timezone": "Asia/Ho_Chi_Minh"
  }
}
```

## Lỗi thường gặp
- `NO_WORKSPACE`: user chưa thuộc workspace nào → hướng dẫn setup CRM
- Thông tin thiếu (null): workspace mới, chưa điền đầy đủ → gợi ý vào Settings → Thông tin cơ sở
