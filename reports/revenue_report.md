---
name: revenue_report
description: Báo cáo doanh thu theo kỳ (ngày/tuần/tháng/quý), so sánh với kỳ trước, phân tích theo dịch vụ và nhân viên
triggers:
  - "báo cáo doanh thu"
  - "doanh thu tháng"
  - "doanh thu tuần"
  - "doanh thu hôm nay"
  - "so sánh doanh thu"
  - "doanh thu kỳ này"
  - "doanh thu kỳ trước"
  - "revenue report"
  - "tổng doanh thu"
endpoint: POST /internal/skills/revenue_report
---

# Skill: revenue_report

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem tổng doanh thu trong một khoảng thời gian cụ thể
- So sánh doanh thu kỳ này với kỳ trước (ngày/tuần/tháng)
- Phân tích doanh thu theo từng loại dịch vụ
- Phân tích doanh thu theo từng nhân viên
- Xem xu hướng tăng trưởng doanh thu theo thời gian
- Chuẩn bị số liệu báo cáo cho ban quản lý

## Cách dùng

**Request body:**
```json
{
  "period": "day | week | month | quarter | custom",
  "date": "2026-04-22",
  "month": "2026-04",
  "quarter": "2026-Q1",
  "start_date": "2026-04-01",
  "end_date": "2026-04-22",
  "compare_previous": true,
  "group_by": "service | staff | day | null"
}
```

- `period`: khung thời gian — `"day"`, `"week"`, `"month"`, `"quarter"`, `"custom"`
- `compare_previous`: (mặc định `true`) so sánh với kỳ trước cùng độ dài
- `group_by`: chi tiết hóa theo chiều nào (tùy chọn)
- Khi `period = "custom"` phải cung cấp `start_date` và `end_date`

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Doanh thu hôm nay:**
```json
{
  "period": "day",
  "date": "2026-04-22",
  "compare_previous": true
}
```

**Doanh thu tháng 4 phân theo dịch vụ:**
```json
{
  "period": "month",
  "month": "2026-04",
  "group_by": "service",
  "compare_previous": true
}
```

**Doanh thu tuần này phân theo nhân viên:**
```json
{
  "period": "week",
  "compare_previous": true,
  "group_by": "staff"
}
```

**Báo cáo tùy chỉnh ngày 1–22/4:**
```json
{
  "period": "custom",
  "start_date": "2026-04-01",
  "end_date": "2026-04-22",
  "compare_previous": true
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
    "total_revenue": 385000000,
    "total_transactions": 412,
    "avg_transaction_value": 935000,
    "comparison": {
      "previous_period_revenue": 342000000,
      "change_amount": 43000000,
      "change_pct": 12.6,
      "trend": "up"
    },
    "breakdown": [
      {
        "label": "Triệt lông",
        "revenue": 180000000,
        "pct_of_total": 46.8,
        "transaction_count": 200
      },
      {
        "label": "Trị mụn",
        "revenue": 95000000,
        "pct_of_total": 24.7,
        "transaction_count": 110
      },
      {
        "label": "Chăm sóc da",
        "revenue": 72000000,
        "pct_of_total": 18.7,
        "transaction_count": 80
      },
      {
        "label": "Khác",
        "revenue": 38000000,
        "pct_of_total": 9.8,
        "transaction_count": 22
      }
    ],
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_PERIOD` | `period` không hợp lệ | Dùng: `day`, `week`, `month`, `quarter`, `custom` |
| `MISSING_DATE_RANGE` | `period = "custom"` nhưng thiếu `start_date`/`end_date` | Cung cấp cả hai |
| `DATE_RANGE_TOO_LARGE` | Khoảng thời gian > 12 tháng | Rút ngắn khoảng thời gian |
| `INVALID_DATE_FORMAT` | Định dạng ngày sai | Dùng `YYYY-MM-DD` |
| `INVALID_GROUP_BY` | `group_by` không hợp lệ | Dùng: `service`, `staff`, `day` hoặc bỏ qua |
