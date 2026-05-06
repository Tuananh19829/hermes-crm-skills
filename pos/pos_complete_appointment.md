---
name: pos_complete_appointment
description: Hoàn thành lịch hẹn + tạo invoice (+ optional thanh toán) trong 1 transaction. Fix bug bug_appointment_payment_context.
triggers:
  - "hoàn thành lịch hẹn"
  - "kết thúc DV và tính tiền"
  - "complete appointment"
  - "checkout lịch hẹn"
  - "POS hoàn thành"
  - "kh xong DV"
endpoint: POST /internal/skills/pos_complete_appointment
risk_level: high
---

# Skill: pos_complete_appointment

## Khi nào dùng
- KH vừa làm xong DV theo lịch hẹn → NV bấm "Hoàn thành + Thanh toán"
- Gộp 3 thao tác: `update_appointment_status` + `pos_create_invoice` + `pos_add_payment` thành 1 call atomic
- Thay thế flow cũ qua `PaymentConfirmModal` → sessionStorage → POSPage (đã có bug context)

## Cách dùng
1. `appointment_id` (bắt buộc) — UUID lịch hẹn cần hoàn thành
2. `extra_items` (optional) — nếu KH mua thêm sản phẩm/gói khi đang làm DV
3. `discount` + `voucher_code` (optional)
4. `payment` object (optional):
   - Có → tự ghi nhận payment ngay → invoice status = PAID/PARTIAL
   - Không → tạo invoice DRAFT, KH thanh toán sau

## Logic backend
**Atomic transaction:**
1. Validate appointment thuộc workspace + status != COMPLETED/CANCELLED
2. Lấy `appointment.services[]` → convert thành invoice items (kind=SERVICE, staff_id từ appointment.staff)
3. Merge với `extra_items` nếu có
4. Tạo Invoice (gọi internal logic của `pos_create_invoice`)
5. Update `appointment.status = COMPLETED`, link `appointment.invoice_id`
6. Nếu có `payment` → gọi internal logic của `pos_add_payment`
7. Audit: `pos.appointment.completed` + `pos.invoice.created` + (optional) `pos.payment.created`

## Ví dụ

User: "KH Mai làm xong DV lịch LH-456, thu 500k tiền mặt"
→
```json
{
  "appointment_id": "uuid-lh-456",
  "payment": { "method": "CASH", "amount": 500000 }
}
```

User: "KH xong DV, dùng thẻ trừ 500k + bán thêm kem dưỡng 250k tiền mặt"
→
```json
{
  "appointment_id": "uuid-lh-456",
  "extra_items": [
    { "kind": "PRODUCT", "ref_id": "uuid-kem", "name_snapshot": "Kem dưỡng", "qty": 1, "unit_price": 250000 }
  ],
  "payment": { "method": "SERVICE_CARD", "amount": 500000, "card_id": "uuid-card" }
}
```
→ Tạo invoice 750k, payment thẻ 500k → debt 250k → KH thanh toán 250k thêm bằng `pos_add_payment` riêng.

## Output
```json
{
  "ok": true,
  "data": {
    "appointment_id": "uuid-lh-456",
    "appointment_status": "COMPLETED",
    "invoice": {
      "id": "uuid-inv",
      "code": "INV-2026-05-0001",
      "total": 500000,
      "paid_amount": 500000,
      "debt_amount": 0,
      "status": "PAID"
    },
    "payment_id": "uuid-payment"
  }
}
```

## Lỗi
- `APPOINTMENT_NOT_FOUND`
- `APPOINTMENT_ALREADY_COMPLETED` — đã hoàn thành rồi
- `APPOINTMENT_CANCELLED` — đã huỷ → không thể complete
- `APPOINTMENT_ALREADY_INVOICED` — đã có invoice rồi (trừ khi force=true)
- Các lỗi nested từ `pos_create_invoice` và `pos_add_payment`
