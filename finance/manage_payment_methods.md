---
name: manage_payment_methods
description: Xem hoặc tạo phương thức thanh toán được chấp nhận tại spa (tiền mặt, VietQR, POS/thẻ, thẻ dịch vụ, điểm tích lũy). Dùng khi cần biết PTTT nào đang hoạt động hoặc thêm PTTT mới.
triggers:
  - "phương thức thanh toán"
  - "pttt"
  - "thêm pttt"
  - "payment method"
  - "thanh toán bằng gì"
  - "vietqr"
  - "pos thẻ"
  - "tạo pttt"
  - "danh sách thanh toán"
  - "điểm tích lũy thanh toán"
  - "thẻ dịch vụ thanh toán"
endpoint: POST /internal/skills/manage_payment_methods
---

# Skill: manage_payment_methods

## Khi nào dùng
- User hỏi "spa mình nhận thanh toán gì", "có nhận VietQR không", "dùng PTTT nào"
- User muốn thêm phương thức thanh toán mới (ví dụ: thêm ví MoMo, thêm VietQR ngân hàng mới)
- Staff cần biết PTTT nào đang hoạt động để hướng dẫn KH thanh toán
- Admin muốn bật/tắt một PTTT cụ thể
- KHÔNG dùng để thực hiện giao dịch thanh toán — dùng `create_cashbook_entry` hoặc skill thanh toán liên quan

## Cách dùng
1. action=`list`: lấy tất cả PTTT đang hoạt động hoặc toàn bộ (kể cả đã tắt)
2. action=`create`: tạo PTTT mới — cần `name`, `type`; tuỳ chọn `account_number`, `bank_name`, `qr_code_url`
3. action=`toggle`: bật/tắt PTTT — cần `payment_method_id` và `is_active`
4. `type`: enum cố định: `CASH`, `BANK_TRANSFER`, `POS_CARD`, `VIETQR`, `SERVICE_CARD`, `LOYALTY_POINTS`, `EWALLET`, `OTHER`

## Ví dụ

User: "Có những phương thức thanh toán nào đang dùng?"
→ `{"action": "list", "active_only": true}`

User: "Thêm PTTT VietQR ngân hàng Techcombank, số tài khoản 19034567890"
→ `{"action": "create", "payment_method_data": {"name": "VietQR Techcombank", "type": "VIETQR", "bank_name": "Techcombank", "account_number": "19034567890"}}`

User: "Tạo PTTT điểm tích lũy"
→ `{"action": "create", "payment_method_data": {"name": "Điểm tích lũy", "type": "LOYALTY_POINTS"}}`

User: "Tắt phương thức thanh toán MoMo (id: pm-momo)"
→ `{"action": "toggle", "payment_method_id": "pm-momo", "is_active": false}`

## Output format
```json
{
  "ok": true,
  "data": {
    "action": "list",
    "total": 5,
    "payment_methods": [
      {
        "id": "uuid",
        "name": "Tiền mặt",
        "type": "CASH",
        "bank_name": null,
        "account_number": null,
        "qr_code_url": null,
        "is_active": true,
        "is_system_default": true
      },
      {
        "id": "uuid",
        "name": "VietQR Techcombank",
        "type": "VIETQR",
        "bank_name": "Techcombank",
        "account_number": "19034567890",
        "qr_code_url": "https://img.vietqr.io/...",
        "is_active": true,
        "is_system_default": false
      }
    ]
  }
}
```

## Lỗi thường gặp
- `PAYMENT_METHOD_NAME_EXISTS`: Tên PTTT đã tồn tại — kiểm tra list trước khi tạo mới
- `CANNOT_DISABLE_DEFAULT`: Không thể tắt PTTT mặc định hệ thống (Tiền mặt) — cần Admin can thiệp
- `INVALID_TYPE`: type phải thuộc danh sách enum cho phép: CASH, BANK_TRANSFER, POS_CARD, VIETQR, SERVICE_CARD, LOYALTY_POINTS, EWALLET, OTHER
- `PAYMENT_METHOD_NOT_FOUND` (khi toggle): payment_method_id không hợp lệ — gọi list trước
