---
name: manage_security
description: Đổi mật khẩu, bật/tắt 2FA, xem phiên đăng nhập, thu hồi session. CHỈ OWNER/ADMIN cho thao tác workspace.
triggers:
  - "bảo mật"
  - "security"
  - "đổi mật khẩu"
  - "2FA"
  - "xác thực hai yếu tố"
  - "phiên đăng nhập"
  - "thu hồi session"
  - "đăng xuất thiết bị"
  - "đổi password"
endpoint: POST /internal/skills/manage_security
---

# Skill: manage_security

## Khi nào dùng
- User muốn đổi mật khẩu tài khoản
- User muốn bật hoặc tắt xác thực hai yếu tố (2FA/TOTP)
- User muốn xem danh sách các thiết bị/phiên đang đăng nhập
- User muốn thu hồi một phiên đăng nhập cụ thể (thiết bị lạ, mất điện thoại...)
- User muốn đăng xuất tất cả thiết bị khác
- **Thao tác bật 2FA bắt buộc workspace: chỉ OWNER/ADMIN mới được**
- **Xem phiên đăng nhập của người khác: chỉ OWNER/ADMIN mới được**

## Cách dùng
- `action: "get_security_status"` — Xem trạng thái bảo mật hiện tại (2FA, sessions)
- `action: "change_password"` — Đổi mật khẩu, cần `current_password` + `new_password`
- `action: "enable_2fa"` — Bắt đầu luồng bật 2FA, trả về QR code setup
- `action: "disable_2fa"` — Tắt 2FA, cần `totp_code` xác nhận
- `action: "list_sessions"` — Xem danh sách phiên đăng nhập (của chính mình, hoặc `user_id` nếu là OWNER/ADMIN)
- `action: "revoke_session"` — Thu hồi phiên, cần `session_id`
- `action: "revoke_all_sessions"` — Thu hồi tất cả phiên khác (giữ lại phiên hiện tại)
- `action: "require_2fa_workspace"` — Bắt buộc 2FA toàn workspace, **CHỈ OWNER/ADMIN**

## Ví dụ
User: "Xem trạng thái bảo mật tài khoản"
→ `{"action": "get_security_status"}`

User: "Đổi mật khẩu"
→ `{"action": "change_password", "current_password": "***", "new_password": "***"}`

User: "Bật xác thực 2 yếu tố"
→ `{"action": "enable_2fa"}`

User: "Xem các thiết bị đang đăng nhập"
→ `{"action": "list_sessions"}`

User: "Thu hồi đăng nhập thiết bị lạ session_xyz"
→ `{"action": "revoke_session", "session_id": "sess_xyz"}`

User: "Đăng xuất tất cả thiết bị khác"
→ `{"action": "revoke_all_sessions"}`

User: "Bắt buộc toàn bộ nhân viên phải bật 2FA" (chỉ OWNER/ADMIN)
→ `{"action": "require_2fa_workspace", "enabled": true}`

## Output format
```json
{
  "ok": true,
  "action": "get_security_status",
  "data": {
    "two_factor_enabled": false,
    "two_factor_required_by_workspace": false,
    "password_last_changed": "2026-01-15T10:00:00Z",
    "active_sessions": 3,
    "recent_login": {
      "ip": "113.160.12.45",
      "device": "Chrome / Windows 10",
      "location": "TP.HCM, Việt Nam",
      "logged_in_at": "2026-04-22T08:30:00Z"
    }
  }
}
```

Danh sách phiên:
```json
{
  "ok": true,
  "action": "list_sessions",
  "data": {
    "sessions": [
      {
        "id": "sess_current",
        "device": "Chrome / Windows 10",
        "ip": "113.160.12.45",
        "location": "TP.HCM, Việt Nam",
        "logged_in_at": "2026-04-22T08:30:00Z",
        "is_current": true
      },
      {
        "id": "sess_mobile01",
        "device": "Safari / iPhone 15",
        "ip": "27.72.88.100",
        "location": "Hà Nội, Việt Nam",
        "logged_in_at": "2026-04-20T14:20:00Z",
        "is_current": false
      }
    ],
    "total": 2
  }
}
```

Khi bật 2FA:
```json
{
  "ok": true,
  "action": "enable_2fa",
  "data": {
    "qr_url": "otpauth://totp/Spaclaw:nguyenvana@gmail.com?secret=BASE32SECRET&issuer=Spaclaw",
    "qr_image_url": "https://crm.spaclaw.pro/api/auth/2fa/qr?token=eyJhb...",
    "backup_codes": ["12345678", "87654321", "11223344", "44332211", "99887766"],
    "note": "Quét mã QR bằng Google Authenticator hoặc Authy, sau đó nhập mã 6 số để xác nhận"
  }
}
```

## Lỗi thường gặp
- `WRONG_CURRENT_PASSWORD`: Mật khẩu hiện tại không đúng → yêu cầu nhập lại
- `PASSWORD_TOO_WEAK`: Mật khẩu mới không đủ mạnh (cần 8+ ký tự, có chữ hoa, số)
- `2FA_ALREADY_ENABLED`: 2FA đã bật rồi → hướng dẫn cách tắt nếu cần
- `INVALID_TOTP_CODE`: Mã TOTP không hợp lệ hoặc đã hết hạn
- `SESSION_NOT_FOUND`: `session_id` không tồn tại hoặc đã hết hạn
- `CANNOT_REVOKE_CURRENT_SESSION`: Không thể tự thu hồi phiên hiện tại → dùng `revoke_all_sessions`
- `PERMISSION_DENIED`: **Xem session của người khác hoặc bật 2FA bắt buộc workspace chỉ dành cho OWNER/ADMIN**
