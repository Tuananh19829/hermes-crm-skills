---
name: manage_vouchers
description: Tạo voucher mới, áp dụng voucher cho đơn hàng, kiểm tra voucher còn hiệu lực không. Dùng khi user hỏi về mã giảm giá, coupon, voucher tặng sinh nhật.
triggers:
  - "tạo voucher"
  - "áp dụng voucher"
  - "kiểm tra voucher"
  - "mã giảm giá"
  - "coupon"
  - "voucher kh"
  - "tặng voucher"
  - "kiểm tra mã"
endpoint: POST /internal/skills/manage_vouchers
---

# Skill: manage_vouchers

## Khi nào dùng
- User muốn tạo voucher tặng khách (sinh nhật, loyal, đền bù)
- User muốn kiểm tra mã voucher có còn hiệu lực không
- User muốn áp dụng voucher vào đơn hàng
- User muốn xem danh sách voucher của một khách

## Cách dùng

### action = create (tạo voucher mới)
1. Xác định khách (`customer_id`)
2. Xác định loại giảm giá: `percent` (%) hoặc `fixed_amount` (VND)
3. Xác định giá trị, ngày hết hạn và lý do tặng
4. Gọi endpoint — hệ thống tự tạo mã voucher unique

### action = check (kiểm tra voucher)
1. Cần `voucher_code` — mã khách cung cấp
2. Không cần `customer_id` nếu chỉ kiểm tra hiệu lực chung

### action = apply (áp dụng vào đơn hàng)
1. Cần `customer_id`, `voucher_code`, và `order_id`
2. Gọi endpoint — hệ thống tính số tiền giảm và áp dụng

### action = list (danh sách voucher của KH)
1. Cần `customer_id`
2. Trả về tất cả voucher còn hạn của khách

## Ví dụ

User: "Tạo voucher giảm 20% sinh nhật cho kh abc-123, hạn đến 30/4"
→ ```json
{
  "action": "create",
  "customer_id": "abc-123",
  "voucher_config": {
    "type": "percent",
    "value": 20,
    "max_discount": 200000,
    "expires_at": "2026-04-30T23:59:59Z",
    "reason": "sinh nhật"
  }
}
```

User: "Kiểm tra mã SALE2026"
→ `{"action": "check", "voucher_code": "SALE2026"}`

User: "Áp dụng mã BDAYLAN04 vào đơn ord-789 cho kh abc-123"
→ `{"action": "apply", "customer_id": "abc-123", "voucher_code": "BDAYLAN04", "order_id": "ord-789"}`

User: "Kh abc-123 có voucher nào không?"
→ `{"action": "list", "customer_id": "abc-123"}`

## Output format

### action = create
```json
{
  "ok": true,
  "data": {
    "voucher_code": "BDAYLAN04",
    "customer_id": "abc-123",
    "type": "percent",
    "value": 20,
    "max_discount": 200000,
    "min_order_value": null,
    "expires_at": "2026-04-30T23:59:59Z",
    "reason": "sinh nhật",
    "message": "Đã tạo voucher BDAYLAN04 cho khách Nguyễn Thị Lan"
  }
}
```

### action = check
```json
{
  "ok": true,
  "data": {
    "voucher_code": "SALE2026",
    "valid": true,
    "type": "fixed_amount",
    "value": 100000,
    "expires_at": "2026-05-31T23:59:59Z",
    "used": false,
    "customer_name": "Trần Văn Bình"
  }
}
```

### action = apply
```json
{
  "ok": true,
  "data": {
    "order_id": "ord-789",
    "voucher_code": "BDAYLAN04",
    "discount_amount": 180000,
    "order_total_before": 900000,
    "order_total_after": 720000,
    "message": "Đã áp dụng voucher, giảm 180.000đ"
  }
}
```

## Lỗi thường gặp
- `VOUCHER_EXPIRED`: Voucher đã hết hạn sử dụng
- `VOUCHER_USED`: Voucher đã được sử dụng rồi
- `VOUCHER_NOT_FOUND`: Mã không tồn tại → kiểm tra lại mã
- `ORDER_VALUE_TOO_LOW`: Đơn hàng không đạt giá trị tối thiểu để áp dụng voucher
- `VOUCHER_NOT_BELONG_TO_CUSTOMER`: Voucher dành cho KH khác
