---
name: kpi_overview
description: Tổng quan KPI cơ sở theo tháng/quý so với mục tiêu đã đặt ra, gồm doanh thu, lượt khách, lịch hẹn, hài lòng khách hàng
triggers:
  - "tổng quan kpi"
  - "kpi cơ sở"
  - "kpi tháng này"
  - "mục tiêu tháng"
  - "đạt mục tiêu chưa"
  - "kpi overview"
  - "dashboard kpi"
  - "kpi so với mục tiêu"
  - "tiến độ kpi"
endpoint: POST /internal/skills/kpi_overview
---

# Skill: kpi_overview

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem nhanh tổng quan KPI của toàn bộ cơ sở trong tháng / quý hiện tại
- So sánh thực tế với mục tiêu đã đặt ra
- Kiểm tra tiến độ đạt KPI để có biện pháp điều chỉnh kịp thời
- Báo cáo nhanh cho ban quản lý về tình hình cơ sở
- Xem xu hướng KPI qua các tháng gần đây

## Cách dùng

**Request body:**
```json
{
  "period": "month | quarter",
  "month": "2026-04",
  "quarter": "2026-Q1",
  "compare_previous": true,
  "include_trend": true,
  "trend_months": 3
}
```

- `period`: `"month"` hoặc `"quarter"`
- `include_trend`: (mặc định `true`) bao gồm biểu đồ xu hướng N tháng gần nhất
- `trend_months`: số tháng lịch sử cho trend (mặc định 3, tối đa 12)

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Tổng quan KPI tháng 4:**
```json
{
  "period": "month",
  "month": "2026-04",
  "compare_previous": true
}
```

**KPI quý 1/2026:**
```json
{
  "period": "quarter",
  "quarter": "2026-Q1",
  "include_trend": false
}
```

**Tổng quan KPI tháng này kèm xu hướng 6 tháng:**
```json
{
  "period": "month",
  "month": "2026-04",
  "include_trend": true,
  "trend_months": 6
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "period": "month",
    "month": "2026-04",
    "days_elapsed": 22,
    "days_total": 30,
    "progress_pct": 73.3,
    "kpi_metrics": [
      {
        "metric": "Doanh thu",
        "target": 400000000,
        "actual": 285000000,
        "projected_eom": 389000000,
        "achievement_pct": 71.3,
        "projected_pct": 97.3,
        "status": "on_track",
        "unit": "VND"
      },
      {
        "metric": "Số lượt khách",
        "target": 500,
        "actual": 360,
        "projected_eom": 491,
        "achievement_pct": 72,
        "projected_pct": 98.2,
        "status": "on_track",
        "unit": "lượt"
      },
      {
        "metric": "Khách hàng mới",
        "target": 60,
        "actual": 48,
        "projected_eom": 65,
        "achievement_pct": 80,
        "projected_pct": 108.3,
        "status": "exceeding",
        "unit": "người"
      },
      {
        "metric": "Tỷ lệ hài lòng",
        "target": 90,
        "actual": 94.2,
        "projected_eom": 94.2,
        "achievement_pct": 104.7,
        "projected_pct": 104.7,
        "status": "exceeding",
        "unit": "%"
      },
      {
        "metric": "Tỷ lệ hủy lịch",
        "target": 5,
        "actual": 6.2,
        "projected_eom": 6.2,
        "achievement_pct": 80.6,
        "projected_pct": 80.6,
        "status": "at_risk",
        "unit": "%",
        "note": "Cần giảm xuống dưới 5%"
      }
    ],
    "overall_kpi_score": 82,
    "overall_grade": "B",
    "comparison": {
      "prev_month": "2026-03",
      "prev_kpi_score": 78,
      "change": 4,
      "trend": "up"
    },
    "trend_history": [
      {"month": "2026-02", "kpi_score": 74, "revenue": 310000000},
      {"month": "2026-03", "kpi_score": 78, "revenue": 342000000},
      {"month": "2026-04", "kpi_score": 82, "revenue": 285000000, "note": "Tháng đang chạy"}
    ],
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

**Giá trị `status` của từng metric:**
- `exceeding` — vượt mục tiêu (≥ 100%)
- `on_track` — đang đúng tiến độ (70–99%)
- `at_risk` — có rủi ro không đạt (50–69%)
- `critical` — nguy hiểm, cần can thiệp ngay (< 50%)

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_PERIOD` | `period` không phải `month` hoặc `quarter` | Chỉ dùng `"month"` hoặc `"quarter"` |
| `NO_KPI_TARGET_SET` | Chưa đặt mục tiêu KPI cho tháng/quý này | Thông báo cần cài đặt target trước, chỉ hiển thị số thực tế |
| `INVALID_QUARTER_FORMAT` | `quarter` sai định dạng | Dùng `YYYY-QN`, ví dụ `2026-Q1` |
| `TREND_MONTHS_EXCEEDED` | `trend_months` > 12 | Giảm xuống tối đa 12 |
