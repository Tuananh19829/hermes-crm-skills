---
name: inventory_report
description: Báo cáo xuất nhập tồn kho vật tư, sản phẩm theo kỳ: số lượng nhập, xuất dùng, tồn cuối kỳ và cảnh báo hàng sắp hết
triggers:
  - "báo cáo kho"
  - "xuất nhập kho"
  - "tồn kho"
  - "inventory report"
  - "hàng tồn"
  - "vật tư tháng"
  - "nhập kho tháng này"
  - "xuất kho"
  - "sắp hết hàng"
  - "cảnh báo kho"
endpoint: POST /internal/skills/inventory_report
---

# Skill: inventory_report

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem báo cáo xuất nhập tồn kho theo tháng hoặc kỳ
- Kiểm tra lượng vật tư đã dùng và còn lại
- Tìm sản phẩm sắp hết để đặt hàng bổ sung
- Phân tích chi phí vật tư theo dịch vụ
- Xem lịch sử nhập xuất của một sản phẩm cụ thể
- Đối chiếu tồn kho thực tế với hệ thống

## Cách dùng

**Request body:**
```json
{
  "period": "month | quarter | custom",
  "month": "2026-04",
  "start_date": "2026-04-01",
  "end_date": "2026-04-22",
  "category_id": "string | null",
  "product_id": "string | null",
  "alert_low_stock": true,
  "low_stock_threshold": 10,
  "report_type": "summary | movement | low_stock"
}
```

- `category_id`: lọc theo nhóm hàng (vật tư, sản phẩm bán, mỹ phẩm...)
- `product_id`: xem chi tiết một sản phẩm cụ thể
- `alert_low_stock`: (mặc định `true`) bao gồm danh sách hàng sắp hết
- `low_stock_threshold`: ngưỡng số lượng coi là "sắp hết" (mặc định 10 đơn vị)
- `report_type`: `"summary"` = tổng hợp, `"movement"` = biến động nhập xuất, `"low_stock"` = chỉ hàng sắp hết

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Tổng hợp kho tháng 4:**
```json
{
  "period": "month",
  "month": "2026-04",
  "report_type": "summary"
}
```

**Danh sách hàng sắp hết:**
```json
{
  "period": "month",
  "month": "2026-04",
  "report_type": "low_stock",
  "low_stock_threshold": 5
}
```

**Biến động nhập xuất vật tư tiêu hao:**
```json
{
  "period": "month",
  "month": "2026-04",
  "category_id": "cat_vat_tu_tieu_hao",
  "report_type": "movement"
}
```

**Chi tiết một sản phẩm:**
```json
{
  "period": "month",
  "month": "2026-04",
  "product_id": "prod_serum_abc",
  "report_type": "movement"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "period": "month",
    "month": "2026-04",
    "report_type": "summary",
    "overview": {
      "total_products": 85,
      "total_import_value": 28500000,
      "total_export_value": 22000000,
      "total_ending_stock_value": 145000000,
      "low_stock_count": 7
    },
    "categories": [
      {
        "category_id": "cat_vat_tu_tieu_hao",
        "category_name": "Vật tư tiêu hao",
        "products_count": 32,
        "total_imported_qty": 520,
        "total_exported_qty": 480,
        "ending_stock_qty": 240,
        "import_value": 12000000,
        "export_value": 11000000
      },
      {
        "category_id": "cat_sp_ban",
        "category_name": "Sản phẩm bán",
        "products_count": 53,
        "total_imported_qty": 200,
        "total_exported_qty": 145,
        "ending_stock_qty": 180,
        "import_value": 16500000,
        "export_value": 11000000
      }
    ],
    "low_stock_alerts": [
      {
        "product_id": "prod_serum_abc",
        "product_name": "Serum ABC",
        "current_qty": 3,
        "unit": "chai",
        "threshold": 10,
        "last_import_date": "2026-03-15"
      }
    ],
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_PERIOD` | `period` không hợp lệ | Dùng: `month`, `quarter`, `custom` |
| `PRODUCT_NOT_FOUND` | `product_id` không tồn tại | Bỏ qua hoặc kiểm tra danh mục sản phẩm |
| `CATEGORY_NOT_FOUND` | `category_id` không tồn tại | Bỏ qua để xem tất cả danh mục |
| `INVALID_REPORT_TYPE` | `report_type` không hợp lệ | Dùng: `summary`, `movement`, `low_stock` |
| `NO_INVENTORY_DATA` | Không có dữ liệu kho trong kỳ | Kiểm tra lại khoảng thời gian |
