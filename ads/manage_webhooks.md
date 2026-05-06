---
name: manage_webhooks
description: Xem, tạo và test webhook kết nối nguồn Ads vào CRM (Facebook Lead Ads, Google Form, Zalo OA)
triggers:
  - "quản lý webhook"
  - "xem webhook"
  - "tạo webhook"
  - "test webhook"
  - "webhook facebook"
  - "webhook google form"
  - "webhook zalo"
  - "kết nối ads"
  - "manage webhooks"
  - "webhook leads"
endpoint: POST /internal/skills/manage_webhooks
---

# Skill: manage_webhooks

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem danh sách webhook đang kết nối giữa các kênh Ads và CRM
- Tạo webhook mới cho Facebook Lead Ads, Google Form hoặc Zalo OA
- Test webhook để kiểm tra kết nối có hoạt động không
- Xem log các lần gọi webhook gần đây (thành công / thất bại)
- Kích hoạt hoặc tắt 1 webhook cụ thể

## Cách dùng

**Request body:**
```json
{
  "action": "list | create | test | get | toggle | get_logs",
  "webhook_id": "uuid-webhook",
  "source": "facebook | google_form | zalo",
  "name": "Tên webhook",
  "target_url": "https://crm.spaclaw.pro/api/webhooks/leads/inbound",
  "secret": "webhook-secret-key",
  "active": true,
  "log_limit": 20
}
```

- `action`: `"list"` = xem danh sách, `"create"` = tạo mới, `"test"` = gửi payload test, `"get"` = xem chi tiết, `"toggle"` = bật/tắt, `"get_logs"` = xem log
- `source`: kênh nguồn dữ liệu leads
- `webhook_id`: UUID webhook (bắt buộc với `get`, `test`, `toggle`, `get_logs`)
- `target_url`: URL endpoint nhận dữ liệu (bắt buộc khi `action = "create"`)

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Xem tất cả webhook:**
```json
{
  "action": "list"
}
```

**Tạo webhook Facebook Lead Ads:**
```json
{
  "action": "create",
  "source": "facebook",
  "name": "Facebook Lead - Dịch vụ Triệt Lông",
  "target_url": "https://crm.spaclaw.pro/api/webhooks/leads/inbound",
  "secret": "fb-secret-key-xyz",
  "active": true
}
```

**Test webhook:**
```json
{
  "action": "test",
  "webhook_id": "uuid-webhook"
}
```

**Xem log 20 lần gần nhất:**
```json
{
  "action": "get_logs",
  "webhook_id": "uuid-webhook",
  "log_limit": 20
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "webhooks": [
      {
        "webhook_id": "uuid-wh-1",
        "name": "Facebook Lead - Triệt Lông",
        "source": "facebook",
        "target_url": "https://crm.spaclaw.pro/api/webhooks/leads/inbound",
        "active": true,
        "total_received": 312,
        "success_count": 308,
        "fail_count": 4,
        "last_triggered_at": "2026-04-22T09:45:00Z",
        "created_at": "2026-03-01T08:00:00Z"
      }
    ],
    "test_result": {
      "status": "success",
      "response_code": 200,
      "latency_ms": 145,
      "message": "Webhook nhận payload test thành công"
    }
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_ACTION` | `action` không hợp lệ | Dùng: `list`, `create`, `test`, `get`, `toggle`, `get_logs` |
| `WEBHOOK_NOT_FOUND` | `webhook_id` không tồn tại | Kiểm tra lại UUID webhook |
| `INVALID_SOURCE` | `source` không hợp lệ | Dùng: `facebook`, `google_form`, `zalo` |
| `MISSING_TARGET_URL` | Tạo webhook nhưng thiếu `target_url` | Cung cấp URL endpoint nhận dữ liệu |
| `WEBHOOK_TEST_FAILED` | Endpoint không phản hồi khi test | Kiểm tra URL và server đang chạy |
| `PERMISSION_DENIED` | Không có quyền tạo/sửa webhook | Chỉ Admin mới được phép |
