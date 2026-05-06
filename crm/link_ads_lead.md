---
name: link_ads_lead
description: Gắn thông tin Ads/Facebook vào khách hàng CRM (campaign_id, adset_id, ad_id, fb_lead_id).
triggers:
  - "gắn ads"
  - "link facebook"
  - "link ads lead"
  - "fb campaign"
  - "ads lead"
endpoint: POST /internal/skills/link_ads_lead
---

# Skill: link_ads_lead

## Khi nào dùng
- Khi cần trace nguồn ads của một lead/khách hàng
- Khi Ads team push lead vào CRM và cần gắn metadata

## Ví dụ
→ `{"person_id": "uuid", "fb_campaign_id": "123", "fb_lead_id": "456", "lead_source": "facebook"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "person_id": "uuid",
    "updated_fields": 3,
    "message": "Đã gắn thông tin Ads"
  }
}
```
