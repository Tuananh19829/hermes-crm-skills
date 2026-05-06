---
name: view_invoice
description: Chi tiết 1 hóa đơn — items, payments, voucher, thẻ/deposit đã trừ, commission, appointment liên quan.
triggers:
  - "xem hóa đơn"
  - "chi tiết bill"
  - "view invoice"
  - "bill INV"
  - "hóa đơn id"
  - "tra cứu hóa đơn"
endpoint: POST /internal/skills/view_invoice
risk_level: read
---

# Skill: view_invoice

## Khi nào dùng
- User hỏi chi tiết 1 bill: "xem INV-2026-05-0001", "chi tiết hóa đơn ID xyz"
- In lại bill → cần đầy đủ items + payments
- Đối soát công nợ → cần xem payment history

## Tham số
- Required: `invoice_id` (UUID)
- Optional: `include[]` để chọn section cần (tối ưu payload)
  - `items` — line items
  - `payments` — lịch sử thanh toán
  - `voucher` — voucher đã apply
  - `card_deductions` — chi tiết trừ thẻ DV
  - `deposit_deductions` — chi tiết trừ deposit
  - `commissions` — commission entries
  - `appointment` — lịch hẹn liên quan (nếu có)

## Output
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "code": "INV-2026-05-0001",
    "person": { "id": "uuid", "name": "Trần Mai", "phone": "0901xxx" },
    "branch": { "id": "uuid", "name": "Hà Đông" },
    "subtotal": 750000,
    "discount": 75000,
    "total": 675000,
    "paid_amount": 675000,
    "debt_amount": 0,
    "status": "PAID",
    "issued_at": "2026-05-06T15:00:00+07:00",
    "items": [
      {
        "id": "uuid",
        "kind": "SERVICE",
        "ref_id": "uuid-massage",
        "name_snapshot": "Massage Body",
        "qty": 1,
        "unit_price": 500000,
        "amount": 500000,
        "staff": { "id": "uuid", "name": "Nguyễn Hoa" }
      }
    ],
    "payments": [
      { "method": "SERVICE_CARD", "amount": 500000, "card_id": "uuid", "paid_at": "..." },
      { "method": "CASH", "amount": 175000, "paid_at": "..." }
    ],
    "voucher": { "code": "BIRTHDAY10", "discount_amount": 75000 },
    "appointment": { "id": "uuid-lh", "start_at": "...", "status": "COMPLETED" },
    "commissions": [
      { "staff_id": "uuid", "staff_name": "Nguyễn Hoa", "amount": 75000, "rate": 0.15, "status": "APPROVED" }
    ]
  }
}
```

## Lỗi
- `INVOICE_NOT_FOUND`
- `INVOICE_FORBIDDEN` — invoice ở chi nhánh khác user không có quyền xem
