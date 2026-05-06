---
name: manage_business_hours
description: Xem/cập nhật giờ hoạt động từng ngày trong tuần và ngày nghỉ lễ
triggers:
  - "giờ hoạt động"
  - "giờ làm việc"
  - "ngày nghỉ lễ"
  - "business hours"
  - "đổi giờ mở cửa"
  - "cập nhật giờ"
  - "ngày nghỉ"
  - "lịch nghỉ"
endpoint: POST /internal/skills/manage_business_hours
---

# Skill: manage_business_hours

## Khi nào dùng
- User muốn xem giờ hoạt động hiện tại của từng ngày trong tuần
- User muốn cập nhật giờ mở/đóng cửa cho một hoặc nhiều ngày
- User muốn thêm/xóa/xem danh sách ngày nghỉ lễ (Tết, 30/4, 2/9...)
- Cần kiểm tra hôm nay có mở cửa không trước khi đặt lịch hẹn

## Cách dùng
- `action: "get"` — Lấy giờ hoạt động hiện tại (không cần tham số thêm)
- `action: "update"` — Cập nhật giờ, cần truyền `working_hours` và/hoặc `holidays`
- `action: "add_holiday"` — Thêm ngày nghỉ lễ, cần truyền `holiday`
- `action: "remove_holiday"` — Xóa ngày nghỉ lễ, cần truyền `holiday_date`
- Ngày trong tuần dùng key: `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`
- Giờ định dạng `HH:mm` (24h)
- Nếu ngày nghỉ, đặt `closed: true`

## Ví dụ
User: "Cho tôi xem giờ làm việc của spa"
→ `{"action": "get"}`

User: "Cập nhật thứ 7 mở lúc 7h, đóng lúc 22h"
→ `{"action": "update", "working_hours": {"sat": {"open": "07:00", "close": "22:00"}}}`

User: "Thêm nghỉ lễ ngày 30/4/2026"
→ `{"action": "add_holiday", "holiday": {"date": "2026-04-30", "name": "Ngày Thống nhất đất nước"}}`

User: "Chủ nhật nghỉ không làm"
→ `{"action": "update", "working_hours": {"sun": {"closed": true}}}`

## Output format
```json
{
  "ok": true,
  "action": "get",
  "data": {
    "working_hours": {
      "mon": {"open": "08:00", "close": "20:00", "closed": false},
      "tue": {"open": "08:00", "close": "20:00", "closed": false},
      "wed": {"open": "08:00", "close": "20:00", "closed": false},
      "thu": {"open": "08:00", "close": "20:00", "closed": false},
      "fri": {"open": "08:00", "close": "21:00", "closed": false},
      "sat": {"open": "07:30", "close": "21:00", "closed": false},
      "sun": {"open": "09:00", "close": "18:00", "closed": false}
    },
    "holidays": [
      {"date": "2026-01-01", "name": "Tết Dương lịch"},
      {"date": "2026-04-30", "name": "Ngày Thống nhất đất nước"},
      {"date": "2026-05-01", "name": "Quốc tế Lao động"}
    ],
    "timezone": "Asia/Ho_Chi_Minh"
  }
}
```

Khi update thành công:
```json
{
  "ok": true,
  "action": "update",
  "updated_fields": ["working_hours.sat"],
  "message": "Đã cập nhật giờ hoạt động thứ Bảy"
}
```

## Lỗi thường gặp
- `INVALID_TIME_FORMAT`: Giờ không đúng định dạng HH:mm → nhắc user nhập lại
- `INVALID_DAY_KEY`: Tên ngày không hợp lệ (phải là mon/tue/wed/thu/fri/sat/sun)
- `HOLIDAY_ALREADY_EXISTS`: Ngày lễ đã có trong danh sách
- `HOLIDAY_NOT_FOUND`: Ngày lễ cần xóa không tồn tại
- `PERMISSION_DENIED`: Chỉ OWNER/ADMIN mới được cập nhật giờ hoạt động
