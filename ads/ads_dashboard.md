---
name: ads_dashboard
description: Tổng quan hiệu quả quảng cáo (leads, CPL, chuyển đổi) theo kỳ và kênh
triggers:
  - "ads dashboard"
  - "tổng quan quảng cáo"
  - "cpl"
  - "chi phí quảng cáo"
  - "hiệu quả ads"
  - "leads hôm nay"
  - "chuyển đổi ads"
endpoint: POST /internal/skills/ads_dashboard
---

# Skill: ads_dashboard

## Khi nào dùng
- User hỏi tổng quan hiệu quả quảng cáo trong kỳ (hôm nay / tuần / tháng)
- User muốn xem CPL (Cost Per Lead), tỉ lệ chuyển đổi, tổng chi tiêu
- User hỏi so sánh giữa các kênh (Facebook, Google, Zalo, TikTok)
- KHÔNG dùng để xem chi tiết từng lead → dùng `list_ads_leads`

## Cách dùng
1. Xác định kỳ báo cáo từ câu hỏi (hôm nay / tuần / tháng / custom)
2. Nếu user đề cập kênh cụ thể → truyền `channel`
3. Gọi endpoint và trình bày kết quả dưới dạng bảng tổng quan

## Ví dụ
User: "Ads hôm nay thế nào?"
→ `{"period": "today"}`

User: "CPL Facebook tháng này bao nhiêu?"
→ `{"period": "month", "channel": "facebook"}`

User: "Hiệu quả ads từ 1/4 đến 20/4?"
→ `{"from_date": "2026-04-01", "to_date": "2026-04-20"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "period": "today",
    "total_spend": 2500000,
    "total_leads": 47,
    "cpl": 53191,
    "conversion_rate": 0.12,
    "won_count": 5,
    "channels": [
      {
        "channel": "facebook",
        "spend": 1800000,
        "leads": 35,
        "cpl": 51428,
        "won": 4
      },
      {
        "channel": "zalo",
        "spend": 700000,
        "leads": 12,
        "cpl": 58333,
        "won": 1
      }
    ]
  }
}
```

## Lỗi thường gặp
- `NO_ADS_INTEGRATION`: chưa kết nối tài khoản quảng cáo → hướng dẫn vào Settings → Ads
- `DATE_RANGE_TOO_LARGE`: khoảng thời gian quá dài (> 90 ngày) → chia nhỏ kỳ báo cáo
- Dữ liệu trống: chi tiêu = 0 và leads = 0 → kiểm tra lại tích hợp Ads
