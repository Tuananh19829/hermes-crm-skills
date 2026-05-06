---
name: search_products
description: Tìm sản phẩm theo tên, mã SKU, danh mục hoặc mức tồn kho. Dùng khi user hỏi "tìm sản phẩm X", "hàng nào còn tồn", "SKU ABC", "danh mục dưỡng da".
triggers:
  - "tìm sản phẩm"
  - "search sp"
  - "sp nào còn"
  - "sku"
  - "tồn kho sp"
  - "danh mục sản phẩm"
  - "hàng còn không"
  - "kiểm tra tồn"
endpoint: POST /internal/skills/search_products
---

# Skill: search_products

## Khi nào dùng
- User muốn tìm sản phẩm theo tên hoặc mã SKU
- User hỏi sản phẩm nào còn hàng / sắp hết hàng
- User muốn lọc sản phẩm theo danh mục, nhà cung cấp
- Bước đầu tiên trước khi tạo phiếu nhập/xuất (cần product_id)

## Cách dùng
1. Trích keyword từ câu hỏi user (tên sản phẩm, SKU)
2. Nếu user hỏi "còn hàng" → `filter.in_stock_only: true`
3. Nếu user hỏi "sắp hết" → `filter.low_stock: true`
4. Nếu user đề cập danh mục → `filter.category_name`
5. Nếu user đề cập kho cụ thể → `filter.warehouse_id`

## Ví dụ

User: "Tìm sản phẩm kem dưỡng"
→ `{"query": "kem dưỡng", "limit": 20}`

User: "SKU SP-001 là gì?"
→ `{"query": "SP-001", "limit": 5}`

User: "Sản phẩm nào còn hàng trong danh mục chăm sóc da?"
→ `{"query": "", "filter": {"category_name": "chăm sóc da", "in_stock_only": true}, "limit": 30}`

User: "Hàng nào sắp hết?"
→ `{"query": "", "filter": {"low_stock": true}, "limit": 50}`

User: "Tìm sản phẩm của NCC Lương Linh (supplier_id: sup-123)"
→ `{"query": "", "filter": {"supplier_id": "sup-123"}, "limit": 30}`

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 8,
    "products": [
      {
        "id": "prod-uuid",
        "name": "Kem dưỡng ẩm ban đêm",
        "sku": "KDA-001",
        "category": { "id": "cat-uuid", "name": "Chăm sóc da" },
        "unit": "hộp",
        "price": 350000,
        "cost_price": 180000,
        "stock": {
          "total": 45,
          "by_warehouse": [
            { "warehouse_id": "wh-001", "name": "Kho chính", "quantity": 30 },
            { "warehouse_id": "wh-002", "name": "Chi nhánh Q7", "quantity": 15 }
          ],
          "min_stock": 10,
          "is_low_stock": false
        },
        "supplier": { "id": "sup-123", "name": "Công ty Lương Linh" },
        "updated_at": "2026-04-20T10:00:00Z"
      }
    ]
  }
}
```

## Lỗi thường gặp
- Kết quả rỗng: thử bỏ filter, kiểm tra lại tên hoặc SKU
- Quá nhiều kết quả: thêm `filter.category_name` hoặc `filter.in_stock_only: true` để thu hẹp
- `WAREHOUSE_NOT_FOUND`: warehouse_id không tồn tại → bỏ filter warehouse
