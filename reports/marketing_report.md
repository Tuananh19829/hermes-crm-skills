---
name: marketing_report
description: Báo cáo marketing: chi phí theo kênh, CPL, ROI, tỷ lệ chuyển đổi leads
triggers:
  - "báo cáo marketing"
  - "chi phí marketing"
  - "cpl theo kênh"
  - "roi marketing"
  - "leads chuyển đổi"
  - "hiệu quả kênh marketing"
  - "chi phí quảng cáo tháng"
  - "marketing report"
  - "chuyển đổi marketing"
  - "kênh nào hiệu quả"
endpoint: POST /internal/skills/marketing_report
---

# Skill: marketing_report

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem tổng chi phí marketing phân theo từng kênh (Facebook, Google, Zalo, TikTok...)
- Tính CPL (Cost Per Lead) theo từng kênh để so sánh hiệu quả
- Xem ROI marketing: chi phí vs doanh thu từ leads chuyển đổi
- Phân tích funnel chuyển đổi từ leads đến khách hàng thực sự
- So sánh hiệu quả marketing giữa các tháng

## Cách dùng

**Request body:**
```json
{
  "period": "month | quarter | custom",
  "month": "2026-04",
  "quarter": "2026-Q1",
  "start_date": "2026-04-01",
  "end_date": "2026-04-22",
  "channel": "facebook | google | zalo | tiktok | referral | all",
  "group_by": "channel | campaign | week | day",
  "compare_previous": true,
  "include_funnel": true,
  "include_roi": true
}
```

- `channel`: lọc theo kênh cụ thể, mặc định `"all"` = tất cả kênh
- `group_by`: chiều phân tích chi tiết
- `include_funnel`: có bao gồm phân tích funnel chuyển đổi hay không
- `include_roi`: có tính ROI (yêu cầu dữ liệu doanh thu từ leads) hay không

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Tổng quan marketing tháng 4:**
```json
{
  "period": "month",
  "month": "2026-04",
  "compare_previous": true,
  "include_funnel": true,
  "include_roi": true
}
```

**Chi phí theo kênh, phân theo tuần:**
```json
{
  "period": "month",
  "month": "2026-04",
  "group_by": "week",
  "channel": "all"
}
```

**Hiệu quả kênh Facebook:**
```json
{
  "period": "quarter",
  "quarter": "2026-Q1",
  "channel": "facebook",
  "include_roi": true,
  "compare_previous": true
}
```

**Báo cáo tùy chỉnh khoảng thời gian:**
```json
{
  "period": "custom",
  "start_date": "2026-04-01",
  "end_date": "2026-04-22",
  "group_by": "channel",
  "include_funnel": true
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "period": "month",
    "start_date": "2026-04-01",
    "end_date": "2026-04-30",
    "total_spend": 45000000,
    "total_leads": 312,
    "total_converted": 78,
    "overall_cpl": 144231,
    "overall_conversion_rate_pct": 25.0,
    "overall_roi_pct": 285.5,
    "channels": [
      {
        "channel": "facebook",
        "spend": 25000000,
        "leads": 180,
        "converted": 42,
        "cpl": 138889,
        "conversion_rate_pct": 23.3,
        "revenue_from_converted": 95000000,
        "roi_pct": 280.0
      },
      {
        "channel": "google",
        "spend": 15000000,
        "leads": 95,
        "converted": 28,
        "cpl": 157895,
        "conversion_rate_pct": 29.5,
        "revenue_from_converted": 62000000,
        "roi_pct": 313.3
      },
      {
        "channel": "zalo",
        "spend": 5000000,
        "leads": 37,
        "converted": 8,
        "cpl": 135135,
        "conversion_rate_pct": 21.6,
        "revenue_from_converted": 18000000,
        "roi_pct": 260.0
      }
    ],
    "funnel": {
      "leads": 312,
      "contacted": 270,
      "interested": 130,
      "appointment": 95,
      "won": 78,
      "lost": 52
    },
    "comparison": {
      "previous_spend": 40000000,
      "previous_leads": 280,
      "spend_change_pct": 12.5,
      "leads_change_pct": 11.4
    },
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_PERIOD` | `period` không hợp lệ | Dùng: `month`, `quarter`, `custom` |
| `MISSING_DATE_RANGE` | `period = "custom"` nhưng thiếu `start_date`/`end_date` | Cung cấp cả hai |
| `INVALID_CHANNEL` | `channel` không hợp lệ | Dùng: `facebook`, `google`, `zalo`, `tiktok`, `referral`, `all` |
| `INVALID_GROUP_BY` | `group_by` không hợp lệ | Dùng: `channel`, `campaign`, `week`, `day` |
| `ROI_DATA_UNAVAILABLE` | Thiếu dữ liệu doanh thu để tính ROI | Đặt `include_roi: false` hoặc kiểm tra kết nối dữ liệu doanh thu |
