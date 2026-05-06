---
name: manage_bank_accounts
description: Xem/thêm/xóa tài khoản ngân hàng (MB Bank, Vietcombank, VietQR)
triggers:
  - "tài khoản ngân hàng"
  - "bank account"
  - "thêm ngân hàng"
  - "xóa ngân hàng"
  - "VietQR"
  - "số tài khoản"
  - "chuyển khoản"
  - "MB Bank"
  - "Vietcombank"
endpoint: POST /internal/skills/manage_bank_accounts
---

# Skill: manage_bank_accounts

## Khi nào dùng
- User muốn xem danh sách tài khoản ngân hàng đã cấu hình
- User muốn thêm tài khoản ngân hàng mới để nhận thanh toán
- User muốn xóa tài khoản ngân hàng không còn dùng
- Cần lấy thông tin VietQR để in lên hóa đơn hoặc gửi cho khách
- Kiểm tra thông tin chuyển khoản trước khi gửi thanh toán cho khách

## Cách dùng
- `action: "list"` — Xem danh sách tài khoản ngân hàng
- `action: "add"` — Thêm tài khoản mới, cần `bank_name`, `account_number`, `account_name`
- `action: "remove"` — Xóa tài khoản, cần `account_id`
- `action: "set_default"` — Đặt tài khoản mặc định, cần `account_id`
- Trường `vietqr_enabled` bật để tự động sinh VietQR khi tạo hóa đơn

## Ví dụ
User: "Hiện tại mình có tài khoản ngân hàng nào?"
→ `{"action": "list"}`

User: "Thêm tài khoản MB Bank số 12345678, chủ khoản Nguyen Van A"
→ `{"action": "add", "bank_name": "MB Bank", "account_number": "12345678", "account_name": "NGUYEN VAN A", "vietqr_enabled": true}`

User: "Xóa tài khoản Vietcombank cũ đi"
→ `{"action": "remove", "account_id": "acc_abc123"}`

User: "Đặt MB Bank làm tài khoản mặc định"
→ `{"action": "set_default", "account_id": "acc_mb001"}`

## Output format
```json
{
  "ok": true,
  "action": "list",
  "data": {
    "accounts": [
      {
        "id": "acc_mb001",
        "bank_name": "MB Bank",
        "bank_code": "MB",
        "account_number": "12345678",
        "account_name": "NGUYEN VAN A",
        "is_default": true,
        "vietqr_enabled": true,
        "vietqr_url": "https://img.vietqr.io/image/MB-12345678-compact2.png?accountName=NGUYEN%20VAN%20A"
      },
      {
        "id": "acc_vcb002",
        "bank_name": "Vietcombank",
        "bank_code": "VCB",
        "account_number": "9876543210",
        "account_name": "NGUYEN VAN A",
        "is_default": false,
        "vietqr_enabled": true,
        "vietqr_url": "https://img.vietqr.io/image/VCB-9876543210-compact2.png?accountName=NGUYEN%20VAN%20A"
      }
    ],
    "total": 2
  }
}
```

Khi thêm thành công:
```json
{
  "ok": true,
  "action": "add",
  "data": {
    "id": "acc_new789",
    "bank_name": "MB Bank",
    "account_number": "12345678",
    "account_name": "NGUYEN VAN A",
    "is_default": false,
    "vietqr_enabled": true
  },
  "message": "Đã thêm tài khoản MB Bank thành công"
}
```

## Lỗi thường gặp
- `ACCOUNT_NOT_FOUND`: `account_id` không tồn tại → liệt kê lại để user chọn đúng
- `DUPLICATE_ACCOUNT`: Số tài khoản đã được đăng ký → thông báo đã có
- `INVALID_BANK_CODE`: Tên ngân hàng không hỗ trợ → gợi ý danh sách ngân hàng hợp lệ
- `CANNOT_DELETE_DEFAULT`: Không thể xóa tài khoản mặc định → yêu cầu đặt tài khoản khác làm mặc định trước
- `PERMISSION_DENIED`: Chỉ OWNER/ADMIN mới được thêm/xóa tài khoản ngân hàng
