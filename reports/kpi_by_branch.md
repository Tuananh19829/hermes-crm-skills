---
name: kpi_by_branch
description: KPI theo chi nhánh: doanh thu, lịch hẹn, khách hàng mới so với mục tiêu đặt ra
triggers:
  - "kpi chi nhánh"
  - "so sánh chi nhánh"
  - "doanh thu theo chi nhánh"
  - "chi nhánh nào đạt kpi"
  - "kpi by branch"
  - "mục tiêu chi nhánh"
  - "xếp hạng chi nhánh"
  - "báo cáo chi nhánh"
  - "chi nhánh tốt nhất"
endpoint: POST /internal/skills/kpi_by_branch
---

# Skill: kpi_by_branch

## Khi nào dùng

Dùng khi người dùng muốn:
- So sánh KPI giữa các chi nhánh trong cùng tháng/quý
- Xem chi nhánh nào đang đạt/chưa đạt mục tiêu
- Phân tích tiến độ doanh thu, lịch hẹn, khách mới theo từng chi nhánh
- Xếp hạng chi nhánh theo hiệu suất tổng hợp
- Xem chi tiết KPI của 1 chi nhánh cụ thể

## Cách dùng

**Request body:**
```json
{
  "period": "month | quarter | custom",
  "month": "2026-04",
  "quarter": "2026-Q1",
  "start_date": "2026-04-01",
  "end_date": "2026-04-22",
  "branch_id": "uuid-chi-nhánh",
  "metrics": ["revenue", "bookings", "new_customers", "satisfaction"],
  "compare_target": true,
  "sort_by": "revenue | achievement_rate | new_customers",
  "sort_order": "desc",
  "include_trend": false
}
```

- `branch_id`: lọc 1 chi nhánh cụ thể (tùy chọn, bỏ trống = tất cả chi nhánh)
- `metrics`: mảng các chỉ số cần xem — `revenue`, `bookings`, `new_customers`, `satisfaction`
- `compare_target`: so sánh thực tế với mục tiêu đặt ra hay không
- `include_trend`: có bao gồm xu hướng 3 tháng gần nhất hay không

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**KPI tất cả chi nhánh tháng 4:**
```json
{
  "period": "month",
  "month": "2026-04",
  "compare_target": true,
  "sort_by": "achievement_rate",
  "sort_order": "desc"
}
```

**Chi tiết KPI chi nhánh cụ thể:**
```json
{
  "period": "month",
  "month": "2026-04",
  "branch_id": "uuid-chi-nhánh",
  "compare_target": true,
  "include_trend": true
}
```

**So sánh doanh thu và khách mới Q1:**
```json
{
  "period": "quarter",
  "quarter": "2026-Q1",
  "metrics": ["revenue", "new_customers"],
  "compare_target": true,
  "sort_by": "revenue",
  "sort_order": "desc"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "period": "month",
    "month": "2026-04",
    "branches": [
      {
        "branch_id": "uuid-branch-1",
        "branch_name": "Chi nhánh Quận 1",
        "rank": 1,
        "revenue": {
          "actual": 185000000,
          "target": 160000000,
          "achievement_pct": 115.6,
          "status": "EXCEEDED"
        },
        "bookings": {
          "actual": 320,
          "target": 300,
          "achievement_pct": 106.7,
          "status": "EXCEEDED"
        },
        "new_customers": {
          "actual": 48,
          "target": 40,
          "achievement_pct": 120.0,
          "status": "EXCEEDED"
        },
        "satisfaction_score": 4.7,
        "overall_achievement_pct": 114.1,
        "overall_status": "EXCEEDED"
      },
      {
        "branch_id": "uuid-branch-2",
        "branch_name": "Chi nhánh Quận 3",
        "rank": 2,
        "revenue": {
          "actual": 120000000,
          "target": 140000000,
          "achievement_pct": 85.7,
          "status": "BELOW_TARGET"
        },
        "bookings": {
          "actual": 210,
          "target": 250,
          "achievement_pct": 84.0,
          "status": "BELOW_TARGET"
        },
        "new_customers": {
          "actual": 28,
          "target": 35,
          "achievement_pct": 80.0,
          "status": "BELOW_TARGET"
        },
        "satisfaction_score": 4.4,
        "overall_achievement_pct": 83.2,
        "overall_status": "BELOW_TARGET"
      }
    ],
    "trend": [
      { "month": "2026-02", "avg_achievement_pct": 95.2 },
      { "month": "2026-03", "avg_achievement_pct": 102.8 },
      { "month": "2026-04", "avg_achievement_pct": 98.6 }
    ],
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_PERIOD` | `period` không hợp lệ | Dùng: `month`, `quarter`, `custom` |
| `BRANCH_NOT_FOUND` | `branch_id` không tồn tại | Kiểm tra lại UUID chi nhánh |
| `NO_TARGET_CONFIGURED` | Chưa cấu hình mục tiêu KPI cho chi nhánh | Dùng skill `kpi_config` để thiết lập mục tiêu |
| `INVALID_METRIC` | Metric không hợp lệ | Dùng: `revenue`, `bookings`, `new_customers`, `satisfaction` |
| `MISSING_DATE_RANGE` | `period = "custom"` nhưng thiếu `start_date`/`end_date` | Cung cấp cả hai |
