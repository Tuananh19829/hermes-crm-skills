---
name: manage_fixed_assets
description: Xem danh sách hoặc tạo tài sản cố định (thiết bị, nội thất, máy móc) với thông tin khấu hao hàng tháng. Dùng khi user hỏi về tài sản spa, máy móc, muốn ghi nhận mua thiết bị mới.
triggers:
  - "tài sản cố định"
  - "thiết bị spa"
  - "máy móc"
  - "fixed asset"
  - "khấu hao"
  - "thêm thiết bị"
  - "tạo tài sản"
  - "danh sách tài sản"
  - "nội thất"
  - "máy laser"
  - "thiết bị làm đẹp"
endpoint: POST /internal/skills/manage_fixed_assets
---

# Skill: manage_fixed_assets

## Khi nào dùng
- User muốn xem danh sách tài sản cố định hiện có (máy laser, giường spa, máy điều trị...)
- User muốn ghi nhận mua thiết bị/nội thất mới vào hệ thống để theo dõi khấu hao
- User hỏi về chi phí khấu hao hàng tháng của thiết bị nào đó
- User muốn xem tình trạng, giá trị còn lại của tài sản cố định
- KHÔNG dùng cho hàng hoá tiêu hao → dùng `search_products` và `create_import_stock`

## Cách dùng
1. action=`list`: lấy danh sách tài sản, lọc theo `category` (equipment/furniture/vehicle) hoặc `location_id`
2. action=`get`: xem chi tiết 1 tài sản, trả về lịch sử khấu hao theo tháng
3. action=`create`: cần ít nhất `name`, `purchase_price`, `purchase_date`; nên có `useful_life_months` để tính khấu hao tuyến tính
4. Khấu hao hàng tháng = (purchase_price - residual_value) / useful_life_months

## Ví dụ

User: "Có những thiết bị nào trong spa?"
→ `{"action": "list", "filter": {"category": "equipment"}}`

User: "Xem thông tin máy laser id asset-abc123"
→ `{"action": "get", "asset_id": "asset-abc123"}`

User: "Thêm máy laser Diode mua ngày 01/04/2026, giá 120 triệu, khấu hao 60 tháng, giá trị còn lại 10 triệu"
→ `{"action": "create", "asset_data": {"name": "Máy laser Diode", "category": "equipment", "purchase_price": 120000000, "purchase_date": "2026-04-01", "useful_life_months": 60, "residual_value": 10000000}}`

User: "Thêm bộ bàn ghế phòng chờ, giá 15 triệu, mua hôm nay, khấu hao 36 tháng"
→ `{"action": "create", "asset_data": {"name": "Bộ bàn ghế phòng chờ", "category": "furniture", "purchase_price": 15000000, "purchase_date": "2026-04-22", "useful_life_months": 36}}`

## Output format
```json
{
  "ok": true,
  "data": {
    "action": "list",
    "total": 4,
    "assets": [
      {
        "id": "uuid",
        "name": "Máy laser Diode",
        "category": "equipment",
        "purchase_price": 120000000,
        "purchase_date": "2026-04-01",
        "useful_life_months": 60,
        "residual_value": 10000000,
        "monthly_depreciation": 1833333,
        "current_book_value": 118166667,
        "location": { "id": "uuid-loc", "name": "Phòng trị liệu 1" },
        "status": "active"
      }
    ]
  }
}
```

## Lỗi thường gặp
- `INVALID_PURCHASE_DATE`: Ngày mua không hợp lệ — dùng format YYYY-MM-DD
- `RESIDUAL_VALUE_EXCEEDS_PURCHASE`: Giá trị còn lại phải nhỏ hơn giá mua
- `USEFUL_LIFE_REQUIRED`: Nếu không có useful_life_months, hệ thống không tính được khấu hao — hỏi user thời gian sử dụng ước tính
- Nếu user không đề cập `residual_value`, mặc định = 0 (khấu hao hoàn toàn)
