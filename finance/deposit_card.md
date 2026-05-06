---
name: deposit_card
description: Nạp tiền hoặc buổi vào thẻ dịch vụ cho khách hàng. Dùng khi user nói "nạp 1tr vào thẻ kh X", "thêm 5 buổi thẻ da", "top-up thẻ KH".
triggers:
  - "nạp thẻ"
  - "top-up thẻ"
  - "deposit card"
  - "nạp tiền thẻ"
  - "thêm buổi thẻ"
  - "nạp vào thẻ dịch vụ"
endpoint: POST /internal/skills/deposit_card
---

# Skill: deposit_card

## Khi nào dùng
- Khách hàng muốn nạp thêm tiền vào thẻ VALUE (thẻ tiền)
- Thêm buổi vào thẻ SESSION (thẻ buổi)
- Cần `card_id` trước — gọi `list_service_cards` để lấy nếu chưa có
- LUÔN xác nhận với user trước khi nạp (số tiền/buổi, phương thức thanh toán)
- Thao tác này tạo phiếu thu trong sổ quỹ tự động

## Cách dùng
1. Lấy `card_id` từ `list_service_cards`
2. Xác định `amount`:
   - Thẻ VALUE: `amount` = số tiền VND cần nạp
   - Thẻ SESSION: `amount` = số buổi cần thêm (ví dụ: 5)
3. Hỏi phương thức thanh toán nếu user không nói rõ
4. Xác nhận với user trước khi thực hiện

## Ví dụ

User: "Nạp 2 triệu vào thẻ tích luỹ của chị Mai"
→ Lấy card_id thẻ VALUE của Mai → `{"card_id": "card-uuid-1", "amount": 2000000, "payment_method": "CASH"}`

User: "Thêm 5 buổi vào thẻ Peel da của kh A chuyển khoản"
→ Lấy card_id thẻ SESSION Peel da → `{"card_id": "card-uuid-2", "amount": 5, "payment_method": "TRANSFER"}`

User: "Top-up thẻ 1 triệu qua Momo"
→ `{"card_id": "card-uuid", "amount": 1000000, "payment_method": "MOMO"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "deposit_id": "dep-uuid",
    "card_id": "card-uuid-1",
    "card_type": "VALUE",
    "person": { "id": "uuid-mai", "name": "Nguyễn Thị Mai" },
    "amount_deposited": 2000000,
    "payment_method": "CASH",
    "date": "2026-04-22",
    "balance_after": {
      "balance": 4500000,
      "note": "Số dư thẻ sau khi nạp"
    },
    "cashbook_entry_id": "entry-uuid"
  }
}
```

Với thẻ SESSION:
```json
{
  "ok": true,
  "data": {
    "deposit_id": "dep-uuid",
    "card_id": "card-uuid-2",
    "card_type": "SESSION",
    "person": { "id": "uuid-a", "name": "Khách A" },
    "amount_deposited": 5,
    "payment_method": "TRANSFER",
    "date": "2026-04-22",
    "balance_after": {
      "sessions_remaining": 12,
      "note": "Số buổi còn lại sau khi nạp"
    },
    "cashbook_entry_id": "entry-uuid"
  }
}
```

## Lỗi thường gặp
- `CARD_NOT_FOUND`: card_id sai hoặc thẻ bị huỷ → gọi `list_service_cards` để lấy lại
- `CARD_EXPIRED`: thẻ hết hạn, không thể nạp thêm → hướng dẫn gia hạn hoặc tạo thẻ mới
- `AMOUNT_INVALID`: số tiền/buổi phải > 0
- Mỗi lần nạp thẻ tự động tạo phiếu thu trong sổ quỹ (trường `cashbook_entry_id`)
