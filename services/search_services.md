---
name: search_services
description: Tìm dịch vụ theo tên, danh mục hoặc khoảng giá. Dùng khi user hỏi "dịch vụ nào về da", "DV giá dưới 500k", "spa có dịch vụ gì".
triggers:
  - "tìm dịch vụ"
  - "dịch vụ nào"
  - "search service"
  - "dv có gì"
  - "liệu pháp"
  - "spa dịch vụ"
  - "giá dịch vụ"
endpoint: POST /internal/skills/search_services
---

# Skill: search_services

## Khi nào dùng
- User hỏi có những dịch vụ gì, tìm dịch vụ theo tên/mô tả
- User hỏi dịch vụ thuộc loại cụ thể (da mặt, massage, laser...)
- User lọc dịch vụ theo khoảng giá
- TRƯỚC khi gọi `get_service_detail`, thường dùng skill này để có `service_id`
- KHÔNG dùng nếu user hỏi về gói/combo → dùng `list_bundles`
- KHÔNG dùng nếu user hỏi về liệu trình của khách cụ thể → dùng `search_treatments`

## Cách dùng
1. Trích từ khoá từ câu hỏi user (tên dịch vụ, loại da, bộ phận cơ thể...)
2. Nếu user đề cập danh mục → tra `list_service_categories` trước để lấy `category_id`
3. Nếu user nói giá → điền `price_min`/`price_max`
4. Luôn để `active_only: true` trừ khi user hỏi dịch vụ đã ngừng

## Ví dụ

User: "Spa mình có dịch vụ nào về da mặt?"
→ `{"query": "da mặt", "active_only": true}`

User: "Tìm dịch vụ giá dưới 500 ngàn"
→ `{"price_max": 500000, "active_only": true}`

User: "Có dịch vụ triệt lông không?"
→ `{"query": "triệt lông", "active_only": true}`

User: "Dịch vụ nhóm Laser giá từ 1tr đến 3tr"
→ `{"query": "laser", "price_min": 1000000, "price_max": 3000000}`

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 5,
    "services": [
      {
        "id": "uuid",
        "name": "Peel da tế bào chết",
        "category": { "id": "uuid-cat", "name": "Chăm sóc da" },
        "price": 350000,
        "duration_minutes": 60,
        "is_active": true,
        "description": "Loại bỏ tế bào chết, làm sáng da"
      }
    ]
  }
}
```

## Lỗi thường gặp
- Kết quả rỗng: thử bỏ filter giá hoặc đổi từ khoá tổng quát hơn
- `NO_WORKSPACE`: workspace chưa được khởi tạo
- Nếu cần biết danh mục trước → gọi `list_service_categories` rồi mới search
