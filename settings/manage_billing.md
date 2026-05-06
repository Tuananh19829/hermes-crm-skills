---
name: manage_billing
description: Xem gói hiện tại, lịch sử thanh toán, nâng cấp gói, xem hóa đơn
triggers:
  - "gói dịch vụ"
  - "billing"
  - "nâng cấp gói"
  - "lịch sử thanh toán"
  - "hóa đơn gói"
  - "subscription"
  - "gia hạn"
  - "gói nào đang dùng"
  - "hết hạn khi nào"
endpoint: POST /internal/skills/manage_billing
---

# Skill: manage_billing

## Khi nào dùng
- User muốn xem đang dùng gói nào (Free / Pro / Business / Enterprise)
- User hỏi gói hết hạn khi nào, còn bao nhiêu ngày
- User muốn xem lịch sử các lần thanh toán, hóa đơn đã phát hành
- User muốn nâng cấp hoặc hạ cấp gói dịch vụ
- User muốn tải hóa đơn PDF để quyết toán
- **Chỉ OWNER mới được thực hiện nâng cấp/hạ cấp gói**

## Cách dùng
- `action: "get_plan"` — Xem gói hiện tại và ngày hết hạn
- `action: "list_invoices"` — Xem lịch sử hóa đơn
- `action: "get_invoice"` — Xem chi tiết một hóa đơn, cần `invoice_id`
- `action: "get_upgrade_options"` — Xem các gói có thể nâng cấp
- `action: "request_upgrade"` — Yêu cầu nâng cấp gói, cần `plan_id`
- Truyền `limit` và `offset` để phân trang lịch sử hóa đơn

## Ví dụ
User: "Mình đang dùng gói nào? Còn hạn không?"
→ `{"action": "get_plan"}`

User: "Xem lịch sử thanh toán 3 tháng gần nhất"
→ `{"action": "list_invoices", "limit": 10}`

User: "Tải hóa đơn tháng 3"
→ `{"action": "get_invoice", "invoice_id": "inv_march2026"}`

User: "Các gói nào có thể nâng cấp?"
→ `{"action": "get_upgrade_options"}`

User: "Nâng cấp lên gói Business"
→ `{"action": "request_upgrade", "plan_id": "plan_business"}`

## Output format
```json
{
  "ok": true,
  "action": "get_plan",
  "data": {
    "plan_id": "plan_pro",
    "plan_name": "Pro",
    "status": "active",
    "started_at": "2026-01-01T00:00:00Z",
    "expires_at": "2026-07-01T00:00:00Z",
    "days_remaining": 70,
    "features": {
      "max_members": 10,
      "max_customers": 5000,
      "ai_coins_monthly": 1000,
      "zalo_integration": true,
      "custom_reports": true,
      "api_access": false
    },
    "billing_cycle": "monthly",
    "next_billing_date": "2026-05-01T00:00:00Z",
    "amount": 499000,
    "currency": "VND"
  }
}
```

Lịch sử hóa đơn:
```json
{
  "ok": true,
  "action": "list_invoices",
  "data": {
    "invoices": [
      {
        "id": "inv_apr2026",
        "period": "2026-04-01 ~ 2026-04-30",
        "plan": "Pro",
        "amount": 499000,
        "status": "paid",
        "paid_at": "2026-04-01T09:00:00Z",
        "pdf_url": "https://crm.spaclaw.pro/api/billing/invoices/inv_apr2026.pdf"
      }
    ],
    "total": 4
  }
}
```

## Lỗi thường gặp
- `INVOICE_NOT_FOUND`: `invoice_id` không tồn tại
- `ALREADY_ON_PLAN`: Đang dùng gói được yêu cầu nâng cấp rồi
- `DOWNGRADE_NOT_ALLOWED`: Không thể hạ cấp giữa kỳ billing → hướng dẫn chờ hết kỳ
- `PERMISSION_DENIED`: **Chỉ OWNER mới được xem billing và thực hiện nâng/hạ cấp gói**
- `PAYMENT_REQUIRED`: Hóa đơn chưa thanh toán → cung cấp link thanh toán
