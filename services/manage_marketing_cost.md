---
name: manage_marketing_cost
description: Xem báo cáo hoặc ghi nhận chi phí marketing theo kênh (Facebook, Google, Zalo, offline). Dùng khi user muốn xem ROI marketing, ghi nhận ngân sách chạy ads, so sánh hiệu quả kênh.
triggers:
  - "chi phí marketing"
  - "chi phí quảng cáo"
  - "ngân sách ads"
  - "marketing cost"
  - "chi phí facebook ads"
  - "chi phí google"
  - "chi phí zalo"
  - "roi marketing"
  - "hiệu quả kênh"
  - "ghi chi marketing"
  - "báo cáo marketing"
endpoint: POST /internal/skills/manage_marketing_cost
---

# Skill: manage_marketing_cost

## Khi nào dùng
- User muốn xem tổng chi phí marketing theo tháng/kỳ hoặc theo kênh cụ thể
- User muốn ghi nhận ngân sách/chi phí đã tiêu cho một kênh quảng cáo
- User muốn so sánh hiệu quả (ROI, số khách mới) giữa các kênh marketing
- User hỏi "tháng này tốn bao nhiêu chạy Facebook", "ROI Google Ads tháng 3"
- Liên quan đến `cashbook_report` nhưng chuyên biệt hơn — phân tích theo kênh, không phải theo ngày

## Cách dùng
1. action=`list`: xem tổng hợp chi phí theo kênh và kỳ thời gian
2. action=`create`: ghi nhận một khoản chi marketing mới vào hệ thống
3. `channel`: kênh marketing — enum cố định: `facebook`, `google`, `zalo`, `tiktok`, `offline`, `other`
4. `period` / `from_date` + `to_date`: kỳ báo cáo khi list
5. Khi create, hệ thống tự động tạo phiếu chi trong sổ quỹ với category=MARKETING

## Ví dụ

User: "Xem chi phí marketing tháng 4"
→ `{"action": "list", "period": "month", "from_date": "2026-04-01", "to_date": "2026-04-30"}`

User: "Tháng này chi bao nhiêu cho Facebook?"
→ `{"action": "list", "channel": "facebook", "period": "month"}`

User: "Ghi chi phí chạy Facebook Ads tuần này 3.5 triệu"
→ `{"action": "create", "channel": "facebook", "amount": 3500000, "date": "2026-04-22", "description": "Chi phí Facebook Ads tuần 17/2026"}`

User: "Ghi chi phí in tờ rơi offline 500k, ngày 20/4"
→ `{"action": "create", "channel": "offline", "amount": 500000, "date": "2026-04-20", "description": "In tờ rơi phát tại chỗ"}`

User: "Xem hiệu quả tất cả kênh quý 1"
→ `{"action": "list", "from_date": "2026-01-01", "to_date": "2026-03-31", "include_roi": true}`

## Output format
```json
{
  "ok": true,
  "data": {
    "action": "list",
    "period": { "from": "2026-04-01", "to": "2026-04-30" },
    "total_cost": 12500000,
    "by_channel": [
      {
        "channel": "facebook",
        "channel_label": "Facebook Ads",
        "total_cost": 7000000,
        "new_customers": 23,
        "revenue_attributed": 35000000,
        "roi_percent": 400
      },
      {
        "channel": "google",
        "channel_label": "Google Ads",
        "total_cost": 4000000,
        "new_customers": 11,
        "revenue_attributed": 18000000,
        "roi_percent": 350
      },
      {
        "channel": "offline",
        "channel_label": "Offline",
        "total_cost": 1500000,
        "new_customers": 5,
        "revenue_attributed": null,
        "roi_percent": null
      }
    ]
  }
}
```

action=create trả về `{"entry_id": "uuid", "cashbook_entry_id": "uuid", "channel": "facebook", "amount": 3500000}`.

## Lỗi thường gặp
- `INVALID_CHANNEL`: Kênh không hợp lệ — chỉ dùng: facebook, google, zalo, tiktok, offline, other
- `INVALID_AMOUNT`: Số tiền phải > 0
- `DATE_REQUIRED`: Ngày chi là bắt buộc khi action=create
- ROI = null nếu kênh offline chưa được gắn với nguồn khách hàng cụ thể
- Nếu user hỏi tổng chi không phân kênh → dùng `cashbook_report` với category=MARKETING sẽ nhanh hơn
