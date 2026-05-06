---
name: get_account_profile
description: Xem/cập nhật hồ sơ cá nhân (tên, avatar, email, SĐT, ngôn ngữ)
triggers:
  - "hồ sơ cá nhân"
  - "account profile"
  - "thông tin cá nhân"
  - "đổi tên"
  - "cập nhật avatar"
  - "đổi email"
  - "đổi số điện thoại"
  - "ngôn ngữ"
  - "profile"
endpoint: POST /internal/skills/get_account_profile
---

# Skill: get_account_profile

## Khi nào dùng
- User muốn xem thông tin hồ sơ cá nhân hiện tại
- User muốn đổi tên hiển thị, ảnh đại diện
- User muốn cập nhật email hoặc số điện thoại liên lạc
- User muốn thay đổi ngôn ngữ giao diện (Tiếng Việt / English)
- User hỏi "tôi đang đăng nhập bằng tài khoản nào?"

## Cách dùng
- `action: "get"` — Xem hồ sơ cá nhân hiện tại (không cần tham số)
- `action: "update"` — Cập nhật thông tin, truyền các trường cần đổi
- Các trường có thể cập nhật: `display_name`, `avatar_url`, `phone`, `language`
- `language` hợp lệ: `"vi"` (Tiếng Việt), `"en"` (English)
- Email không thể đổi trực tiếp, phải qua luồng xác minh riêng

## Ví dụ
User: "Xem thông tin tài khoản của tôi"
→ `{"action": "get"}`

User: "Đổi tên hiển thị thành Nguyễn Thị Lan"
→ `{"action": "update", "display_name": "Nguyễn Thị Lan"}`

User: "Đổi số điện thoại thành 0912345678"
→ `{"action": "update", "phone": "0912345678"}`

User: "Chuyển giao diện sang tiếng Anh"
→ `{"action": "update", "language": "en"}`

User: "Cập nhật ảnh đại diện"
→ `{"action": "update", "avatar_url": "https://cdn.spaclaw.pro/avatars/user_123.jpg"}`

## Output format
```json
{
  "ok": true,
  "action": "get",
  "data": {
    "user_id": "user_abc123",
    "display_name": "Nguyễn Văn A",
    "email": "nguyenvana@gmail.com",
    "phone": "0901234567",
    "avatar_url": "https://cdn.spaclaw.pro/avatars/user_abc123.jpg",
    "language": "vi",
    "role": "manager",
    "workspace_id": "ws_xyz789",
    "joined_at": "2025-12-01T08:00:00Z",
    "last_login": "2026-04-22T09:15:00Z"
  }
}
```

Khi update thành công:
```json
{
  "ok": true,
  "action": "update",
  "updated_fields": ["display_name", "phone"],
  "message": "Đã cập nhật hồ sơ cá nhân"
}
```

## Lỗi thường gặp
- `PHONE_ALREADY_USED`: Số điện thoại đã được dùng bởi tài khoản khác
- `INVALID_PHONE_FORMAT`: SĐT không đúng định dạng Việt Nam (10 số, bắt đầu bằng 0)
- `INVALID_LANGUAGE`: Ngôn ngữ không hỗ trợ (chỉ `vi` hoặc `en`)
- `AVATAR_URL_UNREACHABLE`: URL ảnh không truy cập được → yêu cầu upload qua CDN trước
- `EMAIL_CHANGE_NOT_ALLOWED`: Email phải đổi qua luồng xác minh → hướng dẫn vào Settings → Bảo mật
