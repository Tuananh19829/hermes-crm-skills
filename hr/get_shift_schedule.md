---
name: get_shift_schedule
description: Xem lịch phân ca làm việc của nhân viên theo ngày hoặc tuần cụ thể
triggers:
  - "lịch ca"
  - "phân ca"
  - "ca làm việc"
  - "lịch làm việc"
  - "ai làm ca sáng"
  - "ai trực hôm nay"
  - "ca tuần này"
  - "xem ca"
  - "lịch trực"
endpoint: POST /internal/skills/get_shift_schedule
---

# Skill: get_shift_schedule

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem lịch phân ca của một nhân viên theo ngày hoặc tuần
- Kiểm tra ai đang trực ca trong ngày hôm nay / tuần này
- Xem toàn bộ lịch ca của một phòng ban trong khoảng thời gian
- Tìm nhân viên đang làm ca để điều phối công việc
- Kiểm tra trước khi tạo lịch hẹn xem nhân viên có ca không

## Cách dùng

Có thể lọc theo nhân viên hoặc theo phòng ban. Nếu không truyền `staff_id` sẽ trả về lịch của toàn bộ nhân viên.

**Request body:**
```json
{
  "staff_id": "string | null",
  "department_id": "string | null",
  "date": "2026-04-22",
  "view": "day | week",
  "week_start": "2026-04-21"
}
```

- `date`: ngày cụ thể (dùng khi `view = "day"`), định dạng `YYYY-MM-DD`
- `view`: `"day"` — xem theo ngày, `"week"` — xem theo tuần
- `week_start`: ngày đầu tuần (thứ Hai), dùng khi `view = "week"`
- Nếu cả `date` và `week_start` đều bỏ qua, mặc định là hôm nay / tuần hiện tại

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Ai đang trực hôm nay:**
```json
{
  "date": "2026-04-22",
  "view": "day"
}
```

**Lịch ca tuần này của phòng lễ tân:**
```json
{
  "department_id": "dept_le_tan",
  "view": "week",
  "week_start": "2026-04-21"
}
```

**Lịch ca tuần này của một nhân viên cụ thể:**
```json
{
  "staff_id": "staff_abc123",
  "view": "week",
  "week_start": "2026-04-21"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "view": "week",
    "week_start": "2026-04-21",
    "week_end": "2026-04-27",
    "schedule": [
      {
        "date": "2026-04-21",
        "day_of_week": "Thứ Hai",
        "shifts": [
          {
            "shift_id": "shift_sang",
            "shift_name": "Ca sáng",
            "start_time": "08:00",
            "end_time": "14:00",
            "staff": [
              {
                "staff_id": "staff_abc123",
                "full_name": "Nguyễn Thị Hoa",
                "role": "Lễ tân"
              },
              {
                "staff_id": "staff_def456",
                "full_name": "Trần Văn Bình",
                "role": "Lễ tân"
              }
            ]
          },
          {
            "shift_id": "shift_chieu",
            "shift_name": "Ca chiều",
            "start_time": "14:00",
            "end_time": "20:00",
            "staff": [
              {
                "staff_id": "staff_ghi789",
                "full_name": "Lê Thị Mai",
                "role": "KTV"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_DATE_FORMAT` | `date` hoặc `week_start` sai định dạng | Dùng `YYYY-MM-DD` |
| `STAFF_NOT_FOUND` | `staff_id` không tồn tại | Dùng `list_staff` để lấy ID đúng |
| `INVALID_DEPARTMENT` | `department_id` không tồn tại | Dùng `list_departments` để lấy ID |
| `INVALID_VIEW` | `view` không phải `day` hoặc `week` | Chỉ chấp nhận `"day"` hoặc `"week"` |
| `NO_SCHEDULE_FOUND` | Chưa có lịch phân ca cho khoảng thời gian này | Thông báo cho người dùng chưa có lịch |
