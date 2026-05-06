---
name: zalo_config
description: Xem và cập nhật cấu hình Zalo OA (Official Account ID, ZNS quota còn lại, cài đặt auto-reply)
triggers:
  - "cấu hình zalo"
  - "zalo oa"
  - "zalo official account"
  - "zns quota"
  - "auto reply zalo"
  - "zalo config"
  - "cài đặt zalo"
  - "zalo settings"
  - "quota zns còn bao nhiêu"
  - "cập nhật zalo oa"
endpoint: POST /internal/skills/zalo_config
---

# Skill: zalo_config

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem thông tin Zalo OA đang kết nối với CRM
- Kiểm tra quota ZNS còn lại trong tháng
- Bật/tắt hoặc cập nhật nội dung auto-reply Zalo
- Cập nhật Access Token Zalo OA khi token hết hạn
- Xem danh sách template ZNS đã đăng ký và trạng thái phê duyệt

## Cách dùng

**Request body:**
```json
{
  "action": "get | update | verify | get_quota | get_templates",
  "config": {
    "oa_id": "zalo-oa-id",
    "access_token": "new-zalo-access-token",
    "refresh_token": "refresh-token",
    "auto_reply": {
      "enabled": true,
      "greeting_message": "Xin chào! Cảm ơn bạn đã nhắn tin cho Spaclaw Spa...",
      "out_of_hours_message": "Ngoài giờ làm việc (8h-21h). Chúng tôi sẽ phản hồi sớm!",
      "business_hours": {
        "start": "08:00",
        "end": "21:00",
        "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      }
    }
  }
}
```

- `action`: `"get"` = xem cấu hình, `"update"` = cập nhật, `"verify"` = kiểm tra kết nối, `"get_quota"` = xem quota ZNS, `"get_templates"` = xem template ZNS
- `config`: dữ liệu cấu hình cần cập nhật (bắt buộc khi `action = "update"`)

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Xem cấu hình Zalo OA:**
```json
{
  "action": "get"
}
```

**Kiểm tra quota ZNS:**
```json
{
  "action": "get_quota"
}
```

**Cập nhật auto-reply:**
```json
{
  "action": "update",
  "config": {
    "auto_reply": {
      "enabled": true,
      "greeting_message": "Xin chào! Em là trợ lý ảo của Spaclaw Spa. Anh/chị cần hỗ trợ gì ạ?",
      "out_of_hours_message": "Ngoài giờ làm việc (8h-21h). Chúng tôi sẽ phản hồi sớm nhất có thể!",
      "business_hours": {
        "start": "08:00",
        "end": "21:00",
        "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      }
    }
  }
}
```

**Cập nhật Access Token:**
```json
{
  "action": "update",
  "config": {
    "access_token": "new-access-token-xyz",
    "refresh_token": "new-refresh-token-abc"
  }
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "zalo_oa": {
      "oa_id": "1234567890",
      "oa_name": "Spaclaw Spa Official",
      "oa_avatar": "https://...",
      "connected": true,
      "token_expires_at": "2026-05-22T00:00:00Z",
      "followers": 2840,
      "last_sync_at": "2026-04-22T08:00:00Z"
    },
    "auto_reply": {
      "enabled": true,
      "greeting_message": "Xin chào! Em là trợ lý ảo của Spaclaw Spa...",
      "out_of_hours_message": "Ngoài giờ làm việc...",
      "business_hours": {
        "start": "08:00",
        "end": "21:00",
        "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      }
    },
    "zns_quota": {
      "monthly_limit": 10000,
      "used": 3420,
      "remaining": 6580,
      "reset_date": "2026-05-01",
      "usage_pct": 34.2
    },
    "templates": [
      {
        "template_id": "tmpl-001",
        "name": "Nhắc lịch hẹn",
        "status": "APPROVED",
        "type": "ZNS",
        "usage_count": 1240
      },
      {
        "template_id": "tmpl-002",
        "name": "Xác nhận đặt lịch",
        "status": "APPROVED",
        "type": "ZNS",
        "usage_count": 890
      }
    ]
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_ACTION` | `action` không hợp lệ | Dùng: `get`, `update`, `verify`, `get_quota`, `get_templates` |
| `ZALO_NOT_CONNECTED` | Chưa kết nối Zalo OA | Dùng `manage_ads_settings` để kết nối trước |
| `TOKEN_EXPIRED` | Access Token Zalo đã hết hạn | Cập nhật token mới qua `action = "update"` |
| `MISSING_CONFIG` | Thiếu `config` khi `action = "update"` | Cung cấp dữ liệu cấu hình cần thay đổi |
| `PERMISSION_DENIED` | Không có quyền sửa cấu hình Zalo | Chỉ Admin mới được phép |
| `ZNS_QUOTA_EXCEEDED` | Đã dùng hết quota ZNS tháng này | Chờ sang tháng hoặc liên hệ Zalo để tăng quota |
