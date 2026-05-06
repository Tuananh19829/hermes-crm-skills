---
name: pos_add_payment
description: Ghi nhận thanh toán cho hóa đơn. QUAN TRỌNG — tự trừ thẻ DV / deposit / điểm khi method tương ứng (fix bug bug_backend_payment_deduct).
triggers:
  - "ghi nhận thanh toán"
  - "thu tiền hóa đơn"
  - "add payment"
  - "thanh toán bill"
  - "trừ thẻ KH"
  - "POS thanh toán"
  - "tiền mặt"
  - "chuyển khoản"
  - "quẹt thẻ"
  - "dùng điểm thanh toán"
endpoint: POST /internal/skills/pos_add_payment
risk_level: high
---

# Skill: pos_add_payment

## Khi nào dùng
- KH thanh toán bill (1 phần hoặc toàn bộ)
- Có thể gọi nhiều lần cho 1 invoice (split payment: 1 phần tiền mặt, 1 phần chuyển khoản, 1 phần thẻ DV)
- Method `SERVICE_CARD` / `DEPOSIT` / `LOYALTY_POINTS` → backend TỰ TRỪ số dư thẻ/deposit/điểm

## ⚠️ Fix bug cũ
Theo memory `bug_backend_payment_deduct`: trước đây `addPayment` chỉ ghi `Payment` row mà KHÔNG trừ `card.remaining` / `deposit.balance`. Skill này phải xử lý đúng:

| method | Hành động bổ sung |
|---|---|
| CASH / TRANSFER / CARD / VIETQR / MOMO | Chỉ ghi Payment + cập nhật invoice |
| SERVICE_CARD | + Trừ `service_cards.remaining` (hoặc `usedSessions`++) + ghi `card_movements` |
| DEPOSIT | + Trừ `deposits.balance` + ghi `deposit_movements` |
| LOYALTY_POINTS | + Trừ `loyalty_points` + ghi `loyalty_history` (action=REDEEM) |

## Cách dùng
1. `invoice_id` từ output `pos_create_invoice` hoặc `list_invoices`
2. Chọn `method` phù hợp với KH đưa
3. Nếu `method = SERVICE_CARD` → BẮT BUỘC `card_id`
4. Nếu `method = DEPOSIT` → BẮT BUỘC `deposit_id`
5. Nếu `method = LOYALTY_POINTS` → BẮT BUỘC `loyalty_points` (số điểm dùng)

## Logic backend
- **Transaction**: 1 Prisma `$transaction` cho atomic
- Validate `amount <= invoice.debt_amount`
- Validate số dư thẻ/deposit/điểm đủ
- Insert `Payment` row
- Update `Invoice`:
  - `paid_amount += amount`
  - `debt_amount = total - paid_amount`
  - `status = PAID` nếu `debt_amount == 0`, else `PARTIAL`
- Trừ thẻ/deposit/điểm tương ứng
- Nếu invoice → status=PAID → settle CommissionEntry liên quan (PENDING → APPROVED)
- Audit log: `pos.payment.created`

## Ví dụ

User: "KH Mai trả 300k tiền mặt cho bill INV-001"
→
```json
{ "invoice_id": "uuid-inv-001", "method": "CASH", "amount": 300000 }
```

User: "Trừ thẻ DV của KH 500k cho bill này"
→
```json
{
  "invoice_id": "uuid-inv-001",
  "method": "SERVICE_CARD",
  "amount": 500000,
  "card_id": "uuid-card-mai-da"
}
```

User: "Dùng 200 điểm thưởng + 200k tiền mặt"
→ 2 calls liên tiếp:
```json
{ "invoice_id": "uuid-inv-001", "method": "LOYALTY_POINTS", "amount": 200000, "loyalty_points": 200 }
{ "invoice_id": "uuid-inv-001", "method": "CASH", "amount": 200000 }
```
(giả định 1 điểm = 1000đ, ratio config workspace-level)

## Output
```json
{
  "ok": true,
  "data": {
    "payment_id": "uuid-payment",
    "invoice_id": "uuid-inv-001",
    "method": "SERVICE_CARD",
    "amount": 500000,
    "paid_at": "2026-05-06T15:30:00+07:00",
    "invoice_status_after": "PARTIAL",
    "invoice_paid_amount": 500000,
    "invoice_debt_amount": 175000,
    "card_remaining_after": 1500000
  }
}
```

## Lỗi thường gặp
- `INVOICE_NOT_FOUND` / `INVOICE_VOID` / `INVOICE_ALREADY_PAID`
- `AMOUNT_EXCEED_DEBT` — `amount > invoice.debt_amount` → gợi ý dùng đúng số nợ còn
- `CARD_INSUFFICIENT` — thẻ DV không đủ số dư → gợi ý nạp thêm hoặc method khác
- `CARD_EXPIRED` — thẻ hết hạn
- `DEPOSIT_INSUFFICIENT`
- `POINTS_INSUFFICIENT`
- `POINTS_RATIO_NOT_CONFIGURED` — workspace chưa config tỉ lệ điểm → tiền
