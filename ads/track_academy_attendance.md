---
name: track_academy_attendance
description: Điểm danh hoặc xem tiến độ học của nhân viên trong Academy
triggers:
  - "điểm danh"
  - "tiến độ học"
  - "attendance"
  - "track academy"
  - "nv học đến đâu"
  - "training progress"
endpoint: POST /internal/skills/track_academy_attendance
---

# Skill: track_academy_attendance

## Khi nào dùng
- NV muốn check in / điểm danh vào buổi học
- Quản lý muốn xem tiến độ học của NV (hoàn thành bao nhiêu bài)
- Xem tỉ lệ hoàn thành khóa học của cá nhân
- KHÔNG dùng để xem danh sách khóa học → dùng `list_academy_courses`

## Action
| Value | Mô tả |
|-------|-------|
| `check_in` | Điểm danh vào buổi học hiện tại |
| `view_progress` | Xem tiến độ hoàn thành khóa học (mặc định) |

## Cách dùng
1. Nếu NV tự điểm danh → bỏ `staff_id` (server tự resolve từ token)
2. Nếu quản lý xem NV khác → truyền `staff_id` UUID của NV đó
3. Nếu không có `course_id` → xem tiến độ tất cả khóa học đã đăng ký
4. Check-in chỉ hợp lệ trong giờ học đã lên lịch

## Ví dụ
User: "Điểm danh buổi học telesale hôm nay"
→ `{"course_id": "uuid_course", "action": "check_in"}`

User: "Tôi học đến đâu rồi?"
→ `{"action": "view_progress"}`

User: "NV Hoa học khóa soft_skill đến đâu?"
→ `{"staff_id": "uuid_hoa", "course_id": "uuid_soft_skill", "action": "view_progress"}`

## Output format (view_progress)
```json
{
  "ok": true,
  "data": {
    "staff_id": "uuid",
    "staff_name": "Nguyễn Thị Hoa",
    "courses": [
      {
        "course_id": "uuid",
        "title": "Telesale nâng cao",
        "enrolled_at": "2026-04-01",
        "progress": 0.75,
        "completed_lessons": 9,
        "total_lessons": 12,
        "last_activity": "2026-04-20T09:00:00Z",
        "status": "IN_PROGRESS"
      }
    ]
  }
}
```

## Output format (check_in)
```json
{
  "ok": true,
  "data": {
    "attendance_id": "uuid",
    "course_id": "uuid",
    "staff_id": "uuid",
    "checked_in_at": "2026-04-22T08:05:00Z",
    "lesson": "Bài 10: Xử lý phản đối khi telesale"
  }
}
```

## Lỗi thường gặp
- `NO_ACTIVE_SESSION`: không có buổi học nào đang diễn ra để check in
- `ALREADY_CHECKED_IN`: đã điểm danh buổi này rồi
- `COURSE_NOT_ENROLLED`: NV chưa đăng ký khóa học này → liên hệ quản lý để thêm
- `PERMISSION_DENIED`: NV thường không xem tiến độ của người khác → chỉ manager/admin được xem
