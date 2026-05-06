---
name: get_timesheet
description: Xem bảng chấm công nhân viên theo tháng, phân loại đúng giờ, đi muộn, vắng mặt, về sớm
triggers:
  - "chấm công"
  - "điểm danh"
  - "đi muộn"
  - "vắng mặt"
  - "về sớm"
  - "bảng công"
  - "công tháng"
  - "nghỉ không phép"
  - "nghỉ có phép"
  - "timesheet"
endpoint: POST /internal/skills/get_timesheet
---

# Skill: get_timesheet

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem bảng chấm công của một nhân viên trong tháng
- Kiểm tra số ngày đi muộn, vắng mặt, về sớm
- Xem tổng số công thực tế để tính lương
- Tra cứu các ngày nghỉ phép / nghỉ không phép
- Quản lý kỷ luật hoặc xác nhận lương cuối tháng

## Cách dùng

Cần cung cấp `staff_id` và `month`. Nếu không truyền `month` sẽ mặc định tháng hiện tại.

**Request body:**
```json
{
  "staff_id": "string",
  "month": "2026-04",
  "department_id": "string | null"
}
```

- `month`: định dạng `YYYY-MM`, mặc định tháng hiện tại
- `department_id`: nếu muốn lấy chấm công toàn phòng ban (không cần `staff_id`)
- Chỉ cần 1 trong 2: `staff_id` hoặc `department_id`

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Chấm công tháng 4 của một nhân viên:**
```json
{
  "staff_id": "staff_abc123",
  "month": "2026-04"
}
```

**Chấm công toàn phòng lễ tân tháng này:**
```json
{
  "department_id": "dept_le_tan",
  "month": "2026-04"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "staff_id": "staff_abc123",
    "full_name": "Nguyễn Thị Hoa",
    "month": "2026-04",
    "summary": {
      "total_working_days": 26,
      "present_days": 22,
      "late_days": 2,
      "absent_days": 1,
      "leave_with_permission": 1,
      "leave_without_permission": 0,
      "early_leave_days": 1,
      "total_late_minutes": 35,
      "total_early_minutes": 20
    },
    "records": [
      {
        "date": "2026-04-01",
        "day_of_week": "Thứ Tư",
        "shift": "Ca sáng (08:00–14:00)",
        "check_in": "08:02",
        "check_out": "14:05",
        "status": "on_time",
        "late_minutes": 0,
        "note": ""
      },
      {
        "date": "2026-04-07",
        "day_of_week": "Thứ Hai",
        "shift": "Ca sáng (08:00–14:00)",
        "check_in": "08:22",
        "check_out": "13:55",
        "status": "late_early",
        "late_minutes": 22,
        "early_minutes": 5,
        "note": "Kẹt xe"
      },
      {
        "date": "2026-04-14",
        "day_of_week": "Thứ Hai",
        "shift": "Ca sáng (08:00–14:00)",
        "check_in": null,
        "check_out": null,
        "status": "absent_with_permission",
        "note": "Nghỉ phép có lý do"
      }
    ]
  }
}
```

**Giá trị `status` có thể có:**
- `on_time` — đúng giờ
- `late` — đi muộn
- `early_leave` — về sớm
- `late_early` — cả đi muộn lẫn về sớm
- `absent_with_permission` — vắng có phép
- `absent_without_permission` — vắng không phép
- `day_off` — ngày nghỉ / không có ca

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `STAFF_NOT_FOUND` | `staff_id` không tồn tại | Dùng `list_staff` để lấy ID đúng |
| `INVALID_MONTH_FORMAT` | `month` sai định dạng | Dùng `YYYY-MM` |
| `NO_TIMESHEET_DATA` | Chưa có dữ liệu chấm công tháng này | Kiểm tra lại tháng hoặc thông báo cho người dùng |
| `MISSING_IDENTIFIER` | Không có cả `staff_id` lẫn `department_id` | Cung cấp ít nhất một trong hai |
