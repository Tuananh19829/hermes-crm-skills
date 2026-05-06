---
name: list_academy_courses
description: Danh sách khóa học nội bộ dành cho nhân viên trong hệ thống Academy
triggers:
  - "khóa học"
  - "academy"
  - "training"
  - "danh sách học"
  - "list courses"
  - "nội dung học"
  - "khoá học nv"
endpoint: POST /internal/skills/list_academy_courses
---

# Skill: list_academy_courses

## Khi nào dùng
- NV muốn biết có khóa học gì trong hệ thống Academy
- Quản lý muốn xem nội dung training hiện có
- Cần xem `course_id` trước khi dùng `track_academy_attendance`

## Danh mục (category)
| Value | Mô tả |
|-------|-------|
| `telesale` | Kỹ năng telesale, chốt sales qua điện thoại |
| `service` | Quy trình thực hiện dịch vụ |
| `product` | Kiến thức sản phẩm, nguyên liệu |
| `soft_skill` | Kỹ năng mềm: giao tiếp, xử lý khiếu nại |

## Cách dùng
1. Gọi với `status: active` (mặc định) để xem khóa học đang mở
2. Lọc theo `category` nếu user hỏi về lĩnh vực cụ thể
3. Trình bày danh sách ngắn gọn với tên, mô tả, số bài học

## Ví dụ
User: "Có khóa học telesale nào không?"
→ `{"category": "telesale", "status": "active"}`

User: "Danh sách tất cả training của công ty"
→ `{"status": "active"}`

User: "Học gì về xử lý khiếu nại?"
→ `{"category": "soft_skill"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 8,
    "courses": [
      {
        "id": "uuid_course",
        "title": "Telesale nâng cao: Kỹ thuật chốt sales qua điện thoại",
        "category": "telesale",
        "status": "active",
        "lesson_count": 12,
        "duration_minutes": 180,
        "enrolled_count": 15,
        "completion_rate": 0.67,
        "instructor": "Nguyễn Văn Quản Lý",
        "created_at": "2026-03-01"
      }
    ]
  }
}
```

## Lỗi thường gặp
- Danh sách rỗng với category cụ thể: chưa có khóa học danh mục đó → gợi ý NV xem danh mục khác
- `NO_ACADEMY_MODULE`: workspace chưa bật module Academy → liên hệ admin
- `status: draft`: khóa học chưa phát hành → chỉ xem được khi bỏ filter `active_only`
