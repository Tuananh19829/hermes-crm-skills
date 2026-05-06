---
name: manage_ads_settings
description: Xem và cập nhật cấu hình kết nối tài khoản Ads (Facebook Page, Ad Account, Google Ads ID) vào CRM
triggers:
  - "cấu hình ads"
  - "kết nối facebook ads"
  - "kết nối google ads"
  - "ads settings"
  - "manage ads settings"
  - "tài khoản quảng cáo"
  - "facebook page id"
  - "ad account id"
  - "cập nhật cấu hình ads"
  - "liên kết ads"
endpoint: POST /internal/skills/manage_ads_settings
---

# Skill: manage_ads_settings

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem cấu hình kết nối tài khoản Ads hiện tại của workspace
- Cập nhật Facebook Page ID, Ad Account ID, Facebook Access Token
- Cập nhật Google Ads Customer ID và credentials
- Kiểm tra trạng thái kết nối từng tài khoản Ads
- Ngắt kết nối hoặc refresh token cho tài khoản Ads

## Cách dùng

**Request body:**
```json
{
  "action": "get | update | disconnect | verify",
  "platform": "facebook | google | zalo | tiktok",
  "config": {
    "facebook": {
      "page_id": "123456789",
      "ad_account_id": "act_987654321",
      "access_token": "EAABzbz...",
      "pixel_id": "111222333"
    },
    "google": {
      "customer_id": "123-456-7890",
      "developer_token": "dev-token-xyz",
      "refresh_token": "1//refresh-token"
    },
    "zalo": {
      "oa_id": "zalo-oa-id",
      "access_token": "zalo-access-token"
    },
    "tiktok": {
      "advertiser_id": "tiktok-adv-id",
      "access_token": "tiktok-access-token"
    }
  }
}
```

- `action`: `"get"` = xem cấu hình, `"update"` = cập nhật, `"disconnect"` = ngắt kết nối, `"verify"` = kiểm tra kết nối
- `platform`: nền tảng Ads cụ thể (bỏ trống khi `action = "get"` để xem tất cả)
- `config`: dữ liệu cấu hình (bắt buộc khi `action = "update"`)

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Xem toàn bộ cấu hình Ads:**
```json
{
  "action": "get"
}
```

**Cập nhật kết nối Facebook:**
```json
{
  "action": "update",
  "platform": "facebook",
  "config": {
    "facebook": {
      "page_id": "123456789",
      "ad_account_id": "act_987654321",
      "access_token": "EAABzbz...",
      "pixel_id": "111222333"
    }
  }
}
```

**Kiểm tra kết nối Google Ads:**
```json
{
  "action": "verify",
  "platform": "google"
}
```

**Ngắt kết nối TikTok:**
```json
{
  "action": "disconnect",
  "platform": "tiktok"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "platforms": [
      {
        "platform": "facebook",
        "connected": true,
        "page_id": "123456789",
        "page_name": "Spa Spaclaw Official",
        "ad_account_id": "act_987654321",
        "pixel_id": "111222333",
        "token_expires_at": "2026-06-01T00:00:00Z",
        "last_sync_at": "2026-04-22T08:00:00Z",
        "status": "active"
      },
      {
        "platform": "google",
        "connected": true,
        "customer_id": "123-456-7890",
        "last_sync_at": "2026-04-22T08:30:00Z",
        "status": "active"
      },
      {
        "platform": "zalo",
        "connected": false,
        "status": "disconnected"
      },
      {
        "platform": "tiktok",
        "connected": false,
        "status": "disconnected"
      }
    ],
    "verify_result": {
      "platform": "google",
      "status": "ok",
      "message": "Kết nối Google Ads hoạt động bình thường",
      "campaigns_accessible": 5
    }
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_ACTION` | `action` không hợp lệ | Dùng: `get`, `update`, `disconnect`, `verify` |
| `INVALID_PLATFORM` | `platform` không hợp lệ | Dùng: `facebook`, `google`, `zalo`, `tiktok` |
| `INVALID_TOKEN` | Access token không hợp lệ hoặc đã hết hạn | Tạo lại token từ Business Manager / Google Ads |
| `MISSING_CONFIG` | Thiếu thông tin cấu hình khi `action = "update"` | Cung cấp đầy đủ thông tin trong `config` |
| `PERMISSION_DENIED` | Không có quyền sửa cấu hình Ads | Chỉ Admin mới được phép |
| `PLATFORM_NOT_CONNECTED` | Nền tảng chưa kết nối khi `verify` hoặc `disconnect` | Dùng `action = "update"` để kết nối trước |
