---
name: list_service_categories
description: Liệt kê tất cả danh mục dịch vụ đang hoạt động. Dùng khi user hỏi "có những loại dịch vụ gì", "các nhóm DV", hoặc trước khi search_services theo danh mục.
triggers:
  - "danh mục dịch vụ"
  - "nhóm dịch vụ"
  - "loại dịch vụ"
  - "service categories"
  - "category dv"
endpoint: POST /internal/skills/list_service_categories
---

# Skill: list_service_categories

## Khi nào dùng
- User hỏi tổng quan "có bao nhiêu loại dịch vụ", "mình chia dịch vụ theo nhóm gì"
- Bước chuẩn bị trước khi gọi `search_services` với `category_id`
- Khi cần hiển thị menu/danh sách nhóm dịch vụ cho user chọn
- KHÔNG cần thiết nếu user đã biết tên danh mục cụ thể → search thẳng bằng `search_services`

## Cách dùng
1. Gọi endpoint (không cần tham số bắt buộc)
2. Trả về danh sách category cho user xem hoặc dùng nội bộ để lấy `category_id`
3. Nếu user chọn nhóm → dùng `category_id` tương ứng trong `search_services`

## Ví dụ

User: "Spa có những nhóm dịch vụ gì?"
→ `{}` (gọi không cần params)

User: "Cho tôi xem dịch vụ nhóm Laser"
→ Gọi `list_service_categories` → tìm category "Laser" → lấy `category_id` → gọi `search_services` với `category_id`

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 6,
    "categories": [
      {
        "id": "uuid-cat-1",
        "name": "Chăm sóc da",
        "description": "Các dịch vụ chăm sóc da mặt, body",
        "service_count": 12,
        "is_active": true,
        "sort_order": 1
      },
      {
        "id": "uuid-cat-2",
        "name": "Laser - Ánh sáng",
        "description": "Công nghệ laser, IPL, ánh sáng sinh học",
        "service_count": 7,
        "is_active": true,
        "sort_order": 2
      },
      {
        "id": "uuid-cat-3",
        "name": "Massage - Thư giãn",
        "description": "Massage body, đầu, chân",
        "service_count": 5,
        "is_active": true,
        "sort_order": 3
      }
    ]
  }
}
```

## Lỗi thường gặp
- Kết quả rỗng: workspace chưa tạo danh mục nào → hướng dẫn vào màn hình Dịch vụ > Danh mục để tạo
- `NO_WORKSPACE`: workspace chưa khởi tạo
