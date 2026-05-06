---
name: search_orders
description: Tìm đơn hàng theo khách/thời gian/trạng thái. Dùng khi user hỏi về đơn hàng.
triggers:
  - "tìm đơn"
  - "đơn hàng"
  - "search order"
  - "đơn của kh"
  - "đơn tháng này"
endpoint: POST /internal/skills/search_orders
---

# Skill: search_orders

## Khi nào dùng
- User hỏi về đơn hàng của 1 khách hoặc tổng hợp đơn theo kỳ/trạng thái

## Status đơn hàng
PENDING → CONFIRMED → COMPLETED / CANCELLED / DELIVERED

## Ví dụ
User: "Đơn hàng của kh Mai tháng này"
→ Tìm person_id của Mai, rồi `{"person_id": "uuid", "from_date": "2026-04-01", "to_date": "2026-04-30"}`

User: "Đơn chờ xử lý hôm nay"
→ `{"status": "PENDING", "from_date": "2026-04-21"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 3,
    "orders": [
      {
        "id": "uuid",
        "code": "ORD-2026-001",
        "status": "COMPLETED",
        "buyer_name": "Nguyễn Thị Mai",
        "buyer_phone": "0901xxx67",
        "total": 1500000,
        "paid_amount": 1500000,
        "debt_amount": 0,
        "channel": "WALK_IN",
        "created_at": "2026-04-18T10:00:00Z"
      }
    ]
  }
}
```
