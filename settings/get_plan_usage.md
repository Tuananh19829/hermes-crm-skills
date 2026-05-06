---
name: get_plan_usage
description: Xem gói đang dùng và mức sử dụng (coins, API calls, quota còn lại)
triggers:
  - "gói dịch vụ"
  - "coin còn lại"
  - "plan usage"
  - "quota"
  - "mức sử dụng"
  - "usage tháng này"
  - "coins"
endpoint: POST /internal/skills/get_plan_usage
---

# Skill: get_plan_usage

## Khi nào dùng
- User hỏi còn bao nhiêu coin AI
- Kiểm tra xem gói hiện tại có đủ dùng không
- Xem tỉ lệ sử dụng so với giới hạn gói (để tránh bị cắt dịch vụ)
- Khi các skill AI báo lỗi `AI_QUOTA_EXCEEDED` → dùng skill này để kiểm tra

## Cách dùng
- Không cần tham số bắt buộc
- Mặc định xem tháng hiện tại
- Có thể xem tháng trước để so sánh

## Ví dụ
User: "Còn bao nhiêu coin?"
→ `{"period": "current_month"}`

User: "Tháng trước dùng bao nhiêu coin?"
→ `{"period": "last_month"}`

User: "Gói nào đang dùng và có những tính năng gì?"
→ `{"period": "current_month"}` → trình bày `plan_name` và `features`

## Output format
```json
{
  "ok": true,
  "data": {
    "period": "current_month",
    "plan": {
      "name": "Business",
      "renews_at": "2026-05-01",
      "price_vnd": 990000
    },
    "coins": {
      "total": 10000,
      "used": 3420,
      "remaining": 6580,
      "usage_pct": 34.2
    },
    "api_calls": {
      "total": 50000,
      "used": 18234,
      "remaining": 31766,
      "usage_pct": 36.5
    },
    "zns_messages": {
      "total": 500,
      "used": 127,
      "remaining": 373,
      "usage_pct": 25.4
    },
    "features": {
      "ai_analyze": true,
      "zalo_broadcast": true,
      "multi_branch": true,
      "academy": true,
      "ads_integration": true
    },
    "alerts": []
  }
}
```

## Lỗi thường gặp
- `usage_pct` > 80: cảnh báo sắp hết quota → thông báo user liên hệ admin để nâng gói
- `usage_pct` = 100: đã hết quota, tính năng liên quan bị tạm khóa
- Khi `features.ai_analyze: false`: gói hiện tại không có tính năng AI → cần upgrade
- `NO_ACTIVE_PLAN`: workspace chưa kích hoạt gói nào → liên hệ Spaclaw để mua gói
