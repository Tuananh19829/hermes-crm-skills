---
name: list_campaigns
description: Liệt kê pipeline funnel CRM và khuyến mãi/voucher đang hoạt động.
triggers:
  - "chiến dịch"
  - "campaign"
  - "funnel"
  - "khuyến mãi"
  - "voucher"
  - "pipeline"
endpoint: POST /internal/skills/list_campaigns
---

# Skill: list_campaigns

## Khi nào dùng
- User hỏi về chiến dịch marketing, funnel lead, hoặc chương trình khuyến mãi đang chạy

## Output format
```json
{
  "ok": true,
  "data": {
    "crm_pipeline": [
      { "step": "LEAD", "active": 45, "won": 12, "lost": 8, "total": 65 },
      { "step": "CONTACTED", "active": 23, "won": 5, "lost": 3, "total": 31 }
    ],
    "active_promotions": [
      {
        "id": "uuid",
        "name": "Flash Sale tháng 4",
        "discount_type": "PERCENT",
        "discount_value": 20,
        "start_date": "2026-04-01",
        "end_date": "2026-04-30",
        "status": "ACTIVE"
      }
    ]
  }
}
```

## Cách đọc pipeline
- `step`: bước trong funnel (LEAD → CONTACTED → QUALIFIED → WON/LOST)
- `active`: đang xử lý (chưa win/lost)
- `won_rate`: tính = won/(active+won+lost)*100
