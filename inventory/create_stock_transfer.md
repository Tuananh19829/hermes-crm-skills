---
name: create_stock_transfer
description: Tạo phiếu chuyển kho giữa các chi nhánh hoặc kho - chọn kho nguồn, kho đích, sản phẩm và số lượng. Dùng khi user muốn điều chuyển hàng giữa các kho.
triggers:
  - "chuyển kho"
  - "điều chuyển hàng"
  - "transfer kho"
  - "chuyển hàng chi nhánh"
  - "phiếu chuyển kho"
  - "di chuyển hàng"
  - "kho nguồn kho đích"
endpoint: POST /internal/skills/create_stock_transfer
---

# Skill: create_stock_transfer

## Khi nào dùng
- User muốn chuyển hàng từ kho/chi nhánh này sang kho/chi nhánh khác
- Điều phối hàng khi kho này dư, kho khác thiếu
- KHÔNG dùng để xuất bán → tạo đơn hàng thay thế
- KHÔNG dùng để ghi nhận hàng hỏng/nội bộ → dùng `create_export_stock`

## Cách dùng
1. Xác định kho nguồn (`from_warehouse_id`) và kho đích (`to_warehouse_id`)
2. Thu thập danh sách sản phẩm cần chuyển với số lượng
3. Dùng `search_products` để lấy `product_id` và kiểm tra tồn kho nguồn
4. Gọi endpoint — hệ thống tự trừ tồn kho nguồn và cộng vào kho đích

## Ví dụ

User: "Chuyển 20 hộp kem dưỡng (prod-001) từ kho chính (wh-001) sang chi nhánh Q7 (wh-002)"
→ ```json
{
  "from_warehouse_id": "wh-001",
  "to_warehouse_id": "wh-002",
  "items": [
    {"product_id": "prod-001", "quantity": 20}
  ]
}
```

User: "Điều chuyển hàng từ kho Q7 (wh-002) sang kho chính (wh-001): 10 chai serum (prod-002), 15 mặt nạ (prod-003). Ghi chú: bổ sung hàng cuối tháng"
→ ```json
{
  "from_warehouse_id": "wh-002",
  "to_warehouse_id": "wh-001",
  "note": "Bổ sung hàng cuối tháng",
  "items": [
    {"product_id": "prod-002", "quantity": 10},
    {"product_id": "prod-003", "quantity": 15}
  ]
}
```

User: "Ngày mai chuyển 50 gói mặt nạ từ kho chính sang Q7"
→ ```json
{
  "from_warehouse_id": "wh-001",
  "to_warehouse_id": "wh-002",
  "transfer_date": "2026-04-23",
  "items": [
    {"product_id": "prod-003", "quantity": 50}
  ]
}
```

## Output format
```json
{
  "ok": true,
  "data": {
    "transfer_id": "tr-uuid",
    "transfer_code": "TRF-2026-0018",
    "from_warehouse": { "id": "wh-001", "name": "Kho chính" },
    "to_warehouse": { "id": "wh-002", "name": "Chi nhánh Q7" },
    "note": "Bổ sung hàng cuối tháng",
    "transfer_date": "2026-04-22",
    "items": [
      {
        "product_id": "prod-001",
        "product_name": "Kem dưỡng ẩm ban đêm",
        "quantity": 20,
        "from_stock_before": 80,
        "from_stock_after": 60,
        "to_stock_before": 15,
        "to_stock_after": 35
      }
    ],
    "created_at": "2026-04-22T11:00:00Z",
    "message": "Đã tạo phiếu chuyển kho TRF-2026-0018 thành công"
  }
}
```

## Lỗi thường gặp
- `SAME_WAREHOUSE`: `from_warehouse_id` và `to_warehouse_id` giống nhau → yêu cầu user chọn kho khác nhau
- `INSUFFICIENT_STOCK`: Số lượng chuyển lớn hơn tồn kho nguồn → dùng `search_products` kiểm tra tồn
- `WAREHOUSE_NOT_FOUND`: warehouse_id không tồn tại → dùng `get_stock_report` để lấy danh sách kho hợp lệ
- `PRODUCT_NOT_FOUND`: product_id không tồn tại → dùng `search_products` để tìm
