---
name: list_bundles
description: Liệt kê combo/gói dịch vụ đang bán. Dùng khi user hỏi "có gói nào không", "combo dịch vụ", "gói ưu đãi", "bán gói da mặt".
triggers:
  - "gói dịch vụ"
  - "combo dv"
  - "bundle"
  - "gói ưu đãi"
  - "liệt kê gói"
  - "bán gói"
  - "service bundle"
endpoint: POST /internal/skills/list_bundles
---

# Skill: list_bundles

## Khi nào dùng
- User hỏi spa đang bán những gói/combo gì
- User muốn tư vấn khách mua gói giá tốt hơn dịch vụ lẻ
- Lọc gói theo danh mục hoặc khoảng giá
- KHÔNG nhầm với `search_treatments` (liệu trình KH đã mua) — skill này trả về gói đang RAO BÁN

## Cách dùng
1. Mặc định `active_only: true` — chỉ lấy gói đang kinh doanh
2. Nếu user hỏi theo loại → tìm `category_id` qua `list_service_categories` trước
3. Nếu user hỏi theo giá → điền `price_min`/`price_max`

## Ví dụ

User: "Spa có gói combo nào đang bán?"
→ `{"active_only": true}`

User: "Có gói chăm sóc da giá dưới 2 triệu không?"
→ `{"query": "da", "price_max": 2000000}`

User: "Gói nào dành cho khách mới?"
→ `{"query": "khách mới"}`

User: "Liệt kê tất cả combo massage"
→ `{"query": "massage"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 4,
    "bundles": [
      {
        "id": "bundle-uuid",
        "name": "Combo Da Sáng 10 Buổi",
        "description": "Trọn gói Peel AHA + Điện di serum + Mặt nạ dưỡng",
        "price": 1800000,
        "original_price": 2500000,
        "discount_pct": 28,
        "total_sessions": 10,
        "validity_days": 180,
        "services_included": [
          { "service_id": "svc-1", "name": "Peel da AHA", "sessions": 5 },
          { "service_id": "svc-2", "name": "Điện di serum C", "sessions": 5 }
        ],
        "is_active": true,
        "category": { "id": "uuid-cat", "name": "Chăm sóc da" }
      }
    ]
  }
}
```

## Lỗi thường gặp
- Kết quả rỗng: workspace chưa tạo gói nào → hướng dẫn vào Dịch vụ > Gói combo để tạo
- Nếu user muốn mua gói cho KH → sau khi chọn bundle, tạo đơn hàng bằng `search_orders` + flow tạo đơn
- `NO_WORKSPACE`: workspace chưa khởi tạo
