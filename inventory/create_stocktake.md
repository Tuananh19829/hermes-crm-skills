---
name: create_stocktake
description: Tạo phiên kiểm kho - chọn kho, danh mục hoặc toàn bộ, nhập số liệu thực tế để đối chiếu với sổ sách. Dùng khi user muốn kiểm kê, đối chiếu tồn kho.
triggers:
  - "kiểm kho"
  - "kiểm kê"
  - "stocktake"
  - "đếm hàng"
  - "đối chiếu tồn kho"
  - "tạo phiên kiểm kê"
  - "inventory check"
  - "kiểm tra kho"
endpoint: POST /internal/skills/create_stocktake
---

# Skill: create_stocktake

## Khi nào dùng
- Cuối tháng/quý kiểm kê hàng hóa định kỳ
- Phát hiện chênh lệch giữa số sách và thực tế
- User muốn tạo phiên kiểm để nhân viên kho đếm và điền vào
- Sau kiểm kê, hệ thống tự điều chỉnh tồn kho theo số liệu thực tế

## Cách dùng

### Tạo phiên trắng (nhân viên điền sau)
1. Chỉ cần `warehouse_id` và tùy chọn `category_ids`
2. Bỏ trống `items` → hệ thống tạo phiên với toàn bộ sản phẩm cần kiểm
3. Nhân viên sẽ vào app điền số liệu thực tế

### Tạo phiên có sẵn số liệu (nhập trực tiếp)
1. Chuẩn bị danh sách `items` với `product_id` và `actual_quantity`
2. Gọi endpoint → hệ thống tính chênh lệch và điều chỉnh tồn kho ngay

## Ví dụ

User: "Tạo phiên kiểm kho chính (wh-001)"
→ ```json
{
  "warehouse_id": "wh-001",
  "note": "Kiểm kê định kỳ tháng 4/2026"
}
```

User: "Kiểm kê danh mục chăm sóc da (cat-001) tại kho Q7 (wh-002)"
→ ```json
{
  "warehouse_id": "wh-002",
  "category_ids": ["cat-001"],
  "note": "Kiểm kê danh mục chăm sóc da"
}
```

User: "Kiểm kho: kem dưỡng (prod-001) đếm được 42 hộp, serum (prod-002) đếm được 38 chai"
→ ```json
{
  "warehouse_id": "wh-001",
  "stocktake_date": "2026-04-22",
  "note": "Kiểm kê cuối tháng 4",
  "items": [
    {"product_id": "prod-001", "actual_quantity": 42},
    {"product_id": "prod-002", "actual_quantity": 38}
  ]
}
```

User: "Kiểm kê kho Q7, mặt nạ (prod-003) thực tế còn 18, ghi chú 2 hộp bị hỏng vỏ"
→ ```json
{
  "warehouse_id": "wh-002",
  "items": [
    {
      "product_id": "prod-003",
      "actual_quantity": 18,
      "note": "2 hộp hỏng vỏ, vẫn dùng được nhưng không bán được"
    }
  ]
}
```

## Output format
```json
{
  "ok": true,
  "data": {
    "stocktake_id": "st-uuid",
    "stocktake_code": "STK-2026-0007",
    "warehouse": { "id": "wh-001", "name": "Kho chính" },
    "stocktake_date": "2026-04-22",
    "status": "completed",
    "note": "Kiểm kê cuối tháng 4",
    "items_checked": 2,
    "discrepancies": [
      {
        "product_id": "prod-001",
        "product_name": "Kem dưỡng ẩm ban đêm",
        "system_quantity": 45,
        "actual_quantity": 42,
        "difference": -3,
        "adjusted": true,
        "stock_after": 42
      },
      {
        "product_id": "prod-002",
        "product_name": "Serum vitamin C",
        "system_quantity": 38,
        "actual_quantity": 38,
        "difference": 0,
        "adjusted": false,
        "stock_after": 38
      }
    ],
    "total_discrepancy": -3,
    "created_at": "2026-04-22T14:00:00Z",
    "message": "Đã hoàn thành kiểm kê STK-2026-0007. Phát hiện 1 chênh lệch, đã điều chỉnh tồn kho."
  }
}
```

## Lỗi thường gặp
- `WAREHOUSE_NOT_FOUND`: warehouse_id không tồn tại
- `PRODUCT_NOT_FOUND`: Một hoặc nhiều product_id trong `items` không tồn tại → dùng `search_products` để kiểm tra
- `ACTIVE_STOCKTAKE_EXISTS`: Đã có phiên kiểm kho đang chạy tại kho này → cần hoàn thành hoặc hủy phiên cũ trước
- `INVALID_QUANTITY`: `actual_quantity` phải là số nguyên không âm (có thể bằng 0)
