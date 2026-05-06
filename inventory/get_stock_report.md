---
name: get_stock_report
description: Báo cáo xuất nhập tồn kho - tổng tồn, giá trị kho, số lượng nhập/xuất theo kỳ, sản phẩm sắp hết. Dùng khi user hỏi "báo cáo kho", "tồn kho tháng này", "hàng nào sắp hết".
triggers:
  - "báo cáo kho"
  - "tồn kho"
  - "xuất nhập tồn"
  - "stock report"
  - "kho hàng tháng"
  - "hàng sắp hết"
  - "giá trị kho"
  - "inventory report"
endpoint: POST /internal/skills/get_stock_report
---

# Skill: get_stock_report

## Khi nào dùng
- User muốn xem tổng quan tình trạng kho hàng
- User hỏi hàng hóa nào nhập/xuất nhiều nhất trong kỳ
- User cần biết giá trị tồn kho để báo cáo tài chính
- User muốn xem danh sách sản phẩm sắp hết để lên kế hoạch nhập hàng

## Cách dùng
1. Chọn `report_type` phù hợp:
   - `summary`: tổng quan nhanh (số sản phẩm, tổng tồn, cảnh báo)
   - `movement`: xuất nhập theo kỳ thời gian (cần từ-đến hoặc period)
   - `low_stock`: chỉ sản phẩm sắp hết (tùy chỉnh ngưỡng)
   - `valuation`: giá trị tồn kho theo giá nhập
2. Nếu user nói "tháng này" → `period: "month"`
3. Nếu user nói "tuần này" → `period: "week"`
4. Nếu user đề cập kho cụ thể → thêm `warehouse_id`
5. Nếu user đề cập danh mục → thêm `category_id`

## Ví dụ

User: "Báo cáo kho tháng này"
→ `{"report_type": "movement", "period": "month"}`

User: "Hàng nào sắp hết?"
→ `{"report_type": "low_stock", "low_stock_threshold": 10}`

User: "Giá trị kho hiện tại bao nhiêu?"
→ `{"report_type": "valuation"}`

User: "Tổng quan kho chính (wh-001)"
→ `{"report_type": "summary", "warehouse_id": "wh-001"}`

User: "Xuất nhập tồn danh mục chăm sóc da từ 01/04 đến 22/04"
→ `{"report_type": "movement", "category_id": "cat-uuid", "from_date": "2026-04-01", "to_date": "2026-04-22"}`

## Output format

### report_type = summary
```json
{
  "ok": true,
  "data": {
    "report_type": "summary",
    "generated_at": "2026-04-22T11:00:00Z",
    "total_products": 124,
    "total_skus": 204,
    "total_stock_quantity": 3850,
    "total_stock_value": 285000000,
    "low_stock_count": 8,
    "out_of_stock_count": 2,
    "warehouses": [
      { "id": "wh-001", "name": "Kho chính", "stock_quantity": 2500 },
      { "id": "wh-002", "name": "Chi nhánh Q7", "stock_quantity": 1350 }
    ]
  }
}
```

### report_type = movement
```json
{
  "ok": true,
  "data": {
    "report_type": "movement",
    "period": { "from": "2026-04-01", "to": "2026-04-22" },
    "total_imported": 350,
    "total_exported": 210,
    "total_transferred": 80,
    "net_change": 140,
    "top_imported": [
      { "product_name": "Kem dưỡng ẩm ban đêm", "sku": "KDA-001", "quantity": 120 }
    ],
    "top_exported": [
      { "product_name": "Serum vitamin C", "sku": "SVC-002", "quantity": 95 }
    ]
  }
}
```

### report_type = low_stock
```json
{
  "ok": true,
  "data": {
    "report_type": "low_stock",
    "threshold": 10,
    "count": 3,
    "products": [
      {
        "id": "prod-uuid",
        "name": "Mặt nạ collagen",
        "sku": "MNC-005",
        "current_stock": 4,
        "min_stock": 10,
        "last_imported_at": "2026-03-20T00:00:00Z",
        "supplier": { "id": "sup-001", "name": "NCC Mỹ phẩm Thanh Hà" }
      }
    ]
  }
}
```

## Lỗi thường gặp
- `INVALID_DATE_RANGE`: `from_date` lớn hơn `to_date` → đảo lại thứ tự
- `WAREHOUSE_NOT_FOUND`: warehouse_id không tồn tại → bỏ filter kho
- Kết quả rỗng với `low_stock`: tất cả hàng còn đủ → thông báo tình trạng tốt
