---
name: get_loyalty_points
description: Xem điểm tích lũy, lịch sử tích/dùng điểm, quy đổi điểm sang tiền hoặc cộng điểm cho khách. Dùng khi user hỏi "điểm của kh X", "cộng điểm cho kh", "dùng điểm thanh toán".
triggers:
  - "điểm tích lũy"
  - "loyalty point"
  - "cộng điểm"
  - "dùng điểm"
  - "điểm khách"
  - "quy đổi điểm"
  - "trừ điểm"
  - "xem điểm kh"
endpoint: POST /internal/skills/get_loyalty_points
---

# Skill: get_loyalty_points

## Khi nào dùng
- User muốn xem số điểm tích lũy của một khách hàng
- User muốn cộng điểm thủ công (ngoài hệ thống tự động khi mua hàng)
- User muốn dùng/trừ điểm để thanh toán cho đơn hàng
- Xem lịch sử giao dịch điểm của khách

## Cách dùng
1. Xác định `customer_id` (UUID của khách)
2. Chọn `action`:
   - `view`: chỉ xem số dư và lịch sử (mặc định)
   - `earn`: cộng thêm điểm (cần `points` và `reason`)
   - `redeem`: dùng điểm để thanh toán (cần `points`, `reason`, và nên có `order_id`)
3. Kiểm tra số dư trước khi `redeem` — không được trừ quá số điểm hiện có

## Ví dụ

User: "Kh abc-123 còn bao nhiêu điểm?"
→ `{"customer_id": "abc-123", "action": "view"}`

User: "Cộng 200 điểm sinh nhật cho kh abc-123"
→ `{"customer_id": "abc-123", "action": "earn", "points": 200, "reason": "Tặng điểm sinh nhật"}`

User: "Dùng 500 điểm thanh toán đơn ord-456 cho kh abc-123"
→ `{"customer_id": "abc-123", "action": "redeem", "points": 500, "reason": "Dùng điểm thanh toán", "order_id": "ord-456"}`

User: "Cộng điểm cho kh Lan mua đơn ORD-789, giá trị 1.5tr"
→ Tính điểm theo tỉ lệ hệ thống, rồi:
→ `{"customer_id": "uuid-lan", "action": "earn", "points": 150, "reason": "Mua hàng ORD-789", "order_id": "ORD-789"}`

## Output format

### action = view
```json
{
  "ok": true,
  "data": {
    "customer_id": "abc-123",
    "customer_name": "Nguyễn Thị Lan",
    "points_balance": 1250,
    "total_earned": 3000,
    "total_redeemed": 1750,
    "tier": "SILVER",
    "history": [
      {
        "id": "uuid-tx",
        "type": "earn",
        "points": 200,
        "reason": "Tặng điểm sinh nhật",
        "order_id": null,
        "created_at": "2026-04-10T09:00:00Z"
      }
    ]
  }
}
```

### action = earn / redeem
```json
{
  "ok": true,
  "data": {
    "transaction_id": "uuid-tx",
    "customer_id": "abc-123",
    "action": "earn",
    "points_delta": 200,
    "points_balance_after": 1450,
    "message": "Đã cộng 200 điểm. Số dư hiện tại: 1.450 điểm"
  }
}
```

## Lỗi thường gặp
- `INSUFFICIENT_POINTS`: Số điểm muốn dùng lớn hơn số dư → thông báo số dư thực tế
- `NOT_FOUND`: customer_id không tồn tại → kiểm tra lại ID
- `ORDER_NOT_FOUND`: order_id không tồn tại hoặc không thuộc KH này → bỏ order_id nếu không cần
