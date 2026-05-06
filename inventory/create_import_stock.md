---
name: create_import_stock
description: Tạo phiếu nhập kho từ nhà cung cấp - chọn NCC, danh sách sản phẩm, số lượng, giá nhập. Dùng khi user muốn nhập hàng, thêm stock từ NCC.
triggers:
  - "nhập kho"
  - "tạo phiếu nhập"
  - "nhập hàng từ ncc"
  - "import stock"
  - "đặt hàng ncc"
  - "phiếu nhập kho"
  - "nhập sản phẩm"
  - "thêm hàng vào kho"
endpoint: POST /internal/skills/create_import_stock
---

# Skill: create_import_stock

## Khi nào dùng
- User muốn ghi nhận lô hàng nhập từ nhà cung cấp
- User muốn cập nhật tồn kho sau khi nhận hàng
- Luôn cần: kho nhận (`warehouse_id`) và danh sách hàng (`items`)
- `supplier_id` không bắt buộc nhưng nên có để theo dõi lịch sử mua hàng

## Cách dùng
1. Xác định kho nhận hàng (`warehouse_id`)
2. Xác định NCC nếu có (`supplier_id`) — dùng `manage_suppliers` để tìm ID
3. Thu thập danh sách sản phẩm: `product_id` + `quantity` + giá nhập
4. Dùng `search_products` để lấy `product_id` nếu user chỉ biết tên
5. Gọi endpoint — hệ thống tự tăng tồn kho và ghi nhận lịch sử

## Ví dụ

User: "Nhập 100 hộp kem dưỡng (prod-001) vào kho chính (wh-001), giá nhập 180k/hộp"
→ ```json
{
  "warehouse_id": "wh-001",
  "items": [
    {"product_id": "prod-001", "quantity": 100, "unit_price": 180000}
  ]
}
```

User: "Nhập hàng từ NCC Thanh Hà (sup-001), kho Q7 (wh-002): 50 hộp kem (prod-001), 30 chai serum (prod-002)"
→ ```json
{
  "warehouse_id": "wh-002",
  "supplier_id": "sup-001",
  "items": [
    {"product_id": "prod-001", "quantity": 50, "unit_price": 180000},
    {"product_id": "prod-002", "quantity": 30, "unit_price": 250000}
  ]
}
```

User: "Tạo phiếu nhập kho chính, hóa đơn NCC số HD2026-042, ngày 21/4"
→ ```json
{
  "warehouse_id": "wh-001",
  "supplier_invoice_no": "HD2026-042",
  "import_date": "2026-04-21",
  "items": [...]
}
```

## Output format
```json
{
  "ok": true,
  "data": {
    "import_id": "imp-uuid",
    "import_code": "IMP-2026-0089",
    "warehouse": { "id": "wh-001", "name": "Kho chính" },
    "supplier": { "id": "sup-001", "name": "Công ty Thanh Hà" },
    "supplier_invoice_no": "HD2026-042",
    "import_date": "2026-04-21",
    "items_count": 2,
    "total_quantity": 80,
    "total_value": 16500000,
    "items": [
      {
        "product_id": "prod-001",
        "product_name": "Kem dưỡng ẩm ban đêm",
        "quantity": 50,
        "unit_price": 180000,
        "subtotal": 9000000,
        "stock_after": 80
      }
    ],
    "created_at": "2026-04-22T10:00:00Z",
    "message": "Đã tạo phiếu nhập IMP-2026-0089 thành công"
  }
}
```

## Lỗi thường gặp
- `WAREHOUSE_NOT_FOUND`: warehouse_id không tồn tại → dùng `get_stock_report` để lấy danh sách kho
- `PRODUCT_NOT_FOUND`: product_id không tồn tại → dùng `search_products` để tìm ID đúng
- `SUPPLIER_NOT_FOUND`: supplier_id không tồn tại → dùng `manage_suppliers` để tìm NCC
- `INVALID_QUANTITY`: số lượng phải là số nguyên dương
