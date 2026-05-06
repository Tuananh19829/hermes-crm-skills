---
name: pos_create_invoice
description: Tạo hóa đơn POS từ giỏ hàng (KH + items + voucher + chi nhánh + staff). Atomic transaction, KHÔNG xử lý payment ở bước này.
triggers:
  - "tạo hóa đơn"
  - "tạo invoice"
  - "lập bill"
  - "thu ngân tạo bill"
  - "POS bán hàng"
  - "xuất bill"
  - "checkout giỏ hàng"
endpoint: POST /internal/skills/pos_create_invoice
risk_level: high
---

# Skill: pos_create_invoice

## Khi nào dùng
- User mở POS, chọn KH + thêm DV/SP vào giỏ + bấm "Lập bill"
- Tạo invoice từ lịch hẹn nhưng chưa thanh toán ngay (dùng `pos_complete_appointment` nếu muốn gộp 2 bước)
- Bill nháp (DRAFT) khi NV chuẩn bị bill cho ca sau

## Cách dùng
1. Lấy `person_id` (gọi `find_customer` nếu chỉ có SĐT)
2. Build `items[]`:
   - `SERVICE` → ref_id = service.id, lấy giá từ `get_service_detail`
   - `PRODUCT` → ref_id = product.id
   - `PACKAGE` → ref_id = bundle/package.id
   - `TREATMENT_SESSION` → 1 buổi từ liệu trình đã mua → unit_price = 0 (đã trả khi mua gói)
3. `staff_id` per item — BẮT BUỘC nếu DV có commission_rate > 0 (để chia hoa hồng)
4. `voucher_code` (optional) — backend tự validate + tính discount
5. `status = ISSUED` để phát hành ngay; `DRAFT` nếu cần sửa thêm

## Logic backend
- **Transaction**: tất cả chạy trong 1 Prisma `$transaction`
- Tính `subtotal = SUM(items.amount)` (default amount = qty × unit_price)
- Áp voucher → trừ vào `discount`
- `total = subtotal - discount`
- `paid_amount = 0`, `debt_amount = total`
- Nếu `appointment_id` truyền vào → set `Invoice.appointmentId` (unique 1-1)
- Trừ tồn kho cho item kind=PRODUCT (StockMovement)
- Tạo `CommissionEntry` cho item có staff_id (status=PENDING, settle khi PAID)
- Audit log: `pos.invoice.created`

## Ví dụ

User: "Lập bill cho KH Mai 0901xxx, DV massage 500k NV Hoa làm, sản phẩm kem dưỡng 250k"
→
```json
{
  "person_id": "uuid-mai",
  "items": [
    { "kind": "SERVICE", "ref_id": "uuid-massage", "name_snapshot": "Massage Body", "qty": 1, "unit_price": 500000, "staff_id": "uuid-hoa" },
    { "kind": "PRODUCT", "ref_id": "uuid-kem", "name_snapshot": "Kem dưỡng XYZ", "qty": 1, "unit_price": 250000 }
  ],
  "status": "ISSUED"
}
```

User: "Tạo bill từ lịch hẹn LH-456 cho KH này, tặng voucher BIRTHDAY10"
→
```json
{
  "person_id": "uuid-mai",
  "appointment_id": "uuid-lh-456",
  "items": [
    { "kind": "SERVICE", "ref_id": "uuid-dv", "qty": 1, "unit_price": 500000, "staff_id": "uuid-hoa" }
  ],
  "voucher_code": "BIRTHDAY10",
  "status": "ISSUED"
}
```

## Output
```json
{
  "ok": true,
  "data": {
    "id": "uuid-invoice",
    "code": "INV-2026-05-0001",
    "person_id": "uuid-mai",
    "appointment_id": "uuid-lh-456",
    "subtotal": 750000,
    "discount": 75000,
    "total": 675000,
    "paid_amount": 0,
    "debt_amount": 675000,
    "status": "ISSUED",
    "issued_at": "2026-05-06T15:00:00+07:00",
    "items_count": 2,
    "voucher_applied": "BIRTHDAY10"
  }
}
```

## Lỗi thường gặp
- `PERSON_NOT_FOUND` — person_id không thuộc workspace
- `ITEM_REF_NOT_FOUND` — ref_id của 1 item không tồn tại
- `STOCK_INSUFFICIENT` — sản phẩm không đủ tồn → trả về sản phẩm thiếu
- `VOUCHER_INVALID` — voucher hết hạn / không đủ min_order_value / KH đã dùng
- `APPOINTMENT_ALREADY_INVOICED` — appointment_id đã có invoice khác (unique)
- `BRANCH_FORBIDDEN` — branch_id user không có quyền
