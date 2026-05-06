---
name: create_export_stock
description: Tạo phiếu xuất kho nội bộ hoặc xuất bán - chọn kho, sản phẩm, số lượng, lý do xuất. Dùng khi user muốn ghi nhận xuất kho cho sử dụng nội bộ, tặng mẫu, hỏng/hủy.
triggers:
  - "xuất kho"
  - "tạo phiếu xuất"
  - "export stock"
  - "xuất hàng nội bộ"
  - "phiếu xuất kho"
  - "hủy hàng"
  - "xuất mẫu"
  - "ghi nhận xuất"
endpoint: POST /internal/skills/create_export_stock
---

# Skill: create_export_stock

## Khi nào dùng
- User muốn ghi nhận xuất kho mà KHÔNG qua đơn hàng bán:
  - Sử dụng nội bộ (vật tư cho dịch vụ, văn phòng phẩm)
  - Tặng mẫu thử cho khách
  - Hủy hàng hỏng/hết hạn
- KHÔNG dùng cho hàng bán → xuất bán đã được ghi nhận tự động khi tạo đơn hàng
- KHÔNG dùng cho chuyển kho → dùng `create_stock_transfer`

## Cách dùng
1. Xác định kho xuất (`warehouse_id`)
2. Chọn lý do xuất (`reason`):
   - `internal_use`: sử dụng nội bộ (ví dụ: vật tư liệu trình)
   - `sample`: tặng mẫu thử
   - `damaged`: hàng hỏng
   - `expired`: hàng hết hạn
   - `other`: lý do khác (cần ghi rõ `note`)
3. Thu thập danh sách sản phẩm và số lượng cần xuất
4. Dùng `search_products` để lấy `product_id` nếu user chỉ biết tên
5. Kiểm tra tồn kho đủ không trước khi gọi

## Ví dụ

User: "Xuất 5 chai serum (prod-002) từ kho chính cho nội bộ dùng trong liệu trình"
→ ```json
{
  "warehouse_id": "wh-001",
  "reason": "internal_use",
  "note": "Vật tư liệu trình chăm sóc da tuần 17",
  "items": [
    {"product_id": "prod-002", "quantity": 5}
  ]
}
```

User: "Hủy 3 hộp kem hết hạn (prod-001) trong kho Q7"
→ ```json
{
  "warehouse_id": "wh-002",
  "reason": "expired",
  "note": "Kem dưỡng ẩm hết hạn 31/03/2026",
  "items": [
    {"product_id": "prod-001", "quantity": 3}
  ]
}
```

User: "Xuất 10 gói mẫu (prod-005) tặng khách hội thảo ngày 22/4"
→ ```json
{
  "warehouse_id": "wh-001",
  "reason": "sample",
  "export_date": "2026-04-22",
  "note": "Tặng khách tham dự hội thảo skincare 22/04",
  "items": [
    {"product_id": "prod-005", "quantity": 10}
  ]
}
```

## Output format
```json
{
  "ok": true,
  "data": {
    "export_id": "exp-uuid",
    "export_code": "EXP-2026-0041",
    "warehouse": { "id": "wh-001", "name": "Kho chính" },
    "reason": "internal_use",
    "note": "Vật tư liệu trình chăm sóc da tuần 17",
    "export_date": "2026-04-22",
    "items": [
      {
        "product_id": "prod-002",
        "product_name": "Serum vitamin C",
        "quantity": 5,
        "stock_before": 45,
        "stock_after": 40
      }
    ],
    "created_at": "2026-04-22T10:30:00Z",
    "message": "Đã tạo phiếu xuất EXP-2026-0041 thành công"
  }
}
```

## Lỗi thường gặp
- `INSUFFICIENT_STOCK`: Số lượng xuất lớn hơn tồn kho hiện có → kiểm tra `search_products` để xem tồn
- `WAREHOUSE_NOT_FOUND`: warehouse_id không tồn tại
- `PRODUCT_NOT_FOUND`: product_id không tồn tại → dùng `search_products` để tìm
- `INVALID_REASON`: reason không thuộc danh sách cho phép → chọn lại trong [internal_use, sample, damaged, expired, other]
