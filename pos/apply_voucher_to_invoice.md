---
name: apply_voucher_to_invoice
description: Áp voucher cho hóa đơn đã tồn tại (quên áp lúc tạo bill). Tự tính lại discount + total + debt.
triggers:
  - "áp voucher"
  - "apply voucher"
  - "thêm mã giảm giá"
  - "dùng coupon"
  - "trừ voucher vào bill"
endpoint: POST /internal/skills/apply_voucher_to_invoice
risk_level: normal
---

# Skill: apply_voucher_to_invoice

## Khi nào dùng
- NV quên áp voucher khi tạo bill → muốn áp sau (invoice chưa PAID)
- KH đưa voucher sau khi bill đã ISSUED nhưng chưa thanh toán

## Tham số
- Required: `invoice_id`, `voucher_code`
- Optional: `force=true` để ghi đè voucher cũ (cẩn thận, hiếm khi cần)

## Logic backend
**Atomic transaction:**
1. Load invoice — phải `status IN (DRAFT, ISSUED, PARTIAL)`
2. Nếu `paid_amount > 0` và `force=false` → reject (đã thu tiền không nên đổi tổng)
3. Nếu invoice đã có voucher khác → reject trừ khi `force=true`
4. Validate voucher: còn hạn, đủ min_order_value, KH đủ điều kiện, chưa quá usage_limit
5. Tính discount mới (% hoặc fixed)
6. Update invoice:
   - `discount = new_discount`
   - `total = subtotal - discount`
   - `debt_amount = total - paid_amount`
7. Insert `voucher_redemption` row
8. Audit: `pos.voucher.applied`

## Ví dụ

User: "Áp voucher BIRTHDAY10 vào bill INV-001"
→ `{ "invoice_id": "uuid", "voucher_code": "BIRTHDAY10" }`

## Output
```json
{
  "ok": true,
  "data": {
    "invoice_id": "uuid",
    "voucher_code": "BIRTHDAY10",
    "old_discount": 0,
    "new_discount": 75000,
    "old_total": 750000,
    "new_total": 675000,
    "new_debt_amount": 675000
  }
}
```

## Lỗi
- `INVOICE_NOT_FOUND` / `INVOICE_PAID` (đã thu hết, không thể áp) / `INVOICE_VOID`
- `VOUCHER_INVALID` — sai mã / hết hạn / hết lượt
- `VOUCHER_MIN_NOT_MET` — chưa đủ min_order_value
- `VOUCHER_NOT_ELIGIBLE` — KH không thuộc nhóm được áp
- `INVOICE_ALREADY_HAS_VOUCHER` — đã có voucher rồi (gợi ý dùng `force=true`)
