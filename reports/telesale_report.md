---
name: telesale_report
description: Báo cáo telesale: tổng cuộc gọi, tỷ lệ tiếp cận, tỷ lệ chuyển đổi, phân tích theo nhân viên
triggers:
  - "báo cáo telesale"
  - "tổng cuộc gọi"
  - "tỷ lệ tiếp cận"
  - "telesale chuyển đổi"
  - "hiệu suất telesale"
  - "cuộc gọi tháng"
  - "telesale report"
  - "cuộc gọi theo nhân viên"
  - "tỷ lệ bắt máy"
  - "no answer telesale"
endpoint: POST /internal/skills/telesale_report
---

# Skill: telesale_report

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem tổng số cuộc gọi đã thực hiện trong kỳ
- Phân tích tỷ lệ tiếp cận (answered / total calls)
- Xem tỷ lệ chuyển đổi từ cuộc gọi sang lịch hẹn hoặc chốt đơn
- So sánh hiệu suất giữa các nhân viên telesale
- Tìm giờ vàng có tỷ lệ bắt máy cao nhất

## Cách dùng

**Request body:**
```json
{
  "period": "day | week | month | custom",
  "date": "2026-04-22",
  "month": "2026-04",
  "start_date": "2026-04-01",
  "end_date": "2026-04-22",
  "staff_id": "uuid-nhân-viên",
  "group_by": "staff | result | hour | day",
  "compare_previous": true,
  "include_golden_hours": false,
  "sort_by": "calls | conversion_rate | answered_rate",
  "sort_order": "desc"
}
```

- `staff_id`: lọc theo 1 nhân viên cụ thể (tùy chọn, bỏ trống = tất cả)
- `group_by`: `"staff"` = phân theo NV, `"result"` = phân theo kết quả, `"hour"` = phân theo giờ trong ngày
- `include_golden_hours`: có phân tích giờ vàng hay không (thêm dữ liệu phân theo giờ)

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Báo cáo telesale tháng 4:**
```json
{
  "period": "month",
  "month": "2026-04",
  "compare_previous": true
}
```

**Phân tích theo nhân viên:**
```json
{
  "period": "month",
  "month": "2026-04",
  "group_by": "staff",
  "sort_by": "conversion_rate",
  "sort_order": "desc"
}
```

**Hiệu suất nhân viên cụ thể hôm nay:**
```json
{
  "period": "day",
  "date": "2026-04-22",
  "staff_id": "uuid-nhân-viên"
}
```

**Phân tích giờ vàng:**
```json
{
  "period": "month",
  "month": "2026-04",
  "group_by": "hour",
  "include_golden_hours": true
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
    "total_calls": 1240,
    "answered": 890,
    "no_answer": 280,
    "busy": 70,
    "answered_rate_pct": 71.8,
    "callbacks_scheduled": 145,
    "won": 98,
    "conversion_rate_pct": 7.9,
    "avg_call_duration_seconds": 185,
    "comparison": {
      "previous_calls": 1080,
      "previous_answered_rate_pct": 68.5,
      "previous_conversion_rate_pct": 7.2,
      "calls_change_pct": 14.8
    },
    "by_staff": [
      {
        "staff_id": "uuid-nv-1",
        "name": "Lê Văn C",
        "total_calls": 210,
        "answered": 158,
        "answered_rate_pct": 75.2,
        "won": 22,
        "conversion_rate_pct": 10.5,
        "avg_duration_seconds": 210
      }
    ],
    "by_result": [
      { "result": "ANSWERED", "count": 890, "pct": 71.8 },
      { "result": "NO_ANSWER", "count": 280, "pct": 22.6 },
      { "result": "BUSY", "count": 70, "pct": 5.6 }
    ],
    "golden_hours": [
      { "hour": 9, "answered_rate_pct": 82.3 },
      { "hour": 10, "answered_rate_pct": 79.1 },
      { "hour": 15, "answered_rate_pct": 77.6 }
    ],
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_PERIOD` | `period` không hợp lệ | Dùng: `day`, `week`, `month`, `custom` |
| `MISSING_DATE_RANGE` | `period = "custom"` nhưng thiếu `start_date`/`end_date` | Cung cấp cả hai |
| `STAFF_NOT_FOUND` | `staff_id` không tồn tại | Kiểm tra lại UUID nhân viên |
| `INVALID_GROUP_BY` | `group_by` không hợp lệ | Dùng: `staff`, `result`, `hour`, `day` |
| `INVALID_SORT_BY` | `sort_by` không hợp lệ | Dùng: `calls`, `conversion_rate`, `answered_rate` |
