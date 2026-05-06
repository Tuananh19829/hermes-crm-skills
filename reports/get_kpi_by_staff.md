---
name: get_kpi_by_staff
description: Xem KPI chi tiết theo từng nhân viên trong tháng/quý: mục tiêu đã đặt, thực tế đạt được, điểm số và xếp loại
triggers:
  - "kpi theo nhân viên"
  - "kpi từng người"
  - "kpi chi tiết nhân viên"
  - "get kpi by staff"
  - "mục tiêu nhân viên"
  - "đạt kpi chưa"
  - "kpi cá nhân"
  - "nhân viên đạt kpi"
  - "nhân viên không đạt kpi"
endpoint: POST /internal/skills/get_kpi_by_staff
---

# Skill: get_kpi_by_staff

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem KPI cụ thể của một hoặc nhiều nhân viên trong tháng
- Kiểm tra nhân viên nào đang đạt / không đạt mục tiêu cá nhân
- So sánh KPI thực tế với mục tiêu đã giao
- Tìm nhân viên cần được cảnh báo hoặc hỗ trợ thêm
- Chuẩn bị bảng KPI cá nhân cho cuộc họp 1-1
- Theo dõi tiến độ KPI giữa tháng để điều chỉnh kịp thời

## Cách dùng

**Request body:**
```json
{
  "month": "2026-04",
  "staff_id": "string | null",
  "department_id": "string | null",
  "status_filter": "exceeding | on_track | at_risk | critical | null",
  "sort_by": "kpi_score | achievement_pct | staff_name",
  "sort_order": "desc | asc",
  "compare_previous": true
}
```

- `staff_id`: xem KPI chi tiết 1 nhân viên; nếu bỏ qua → xem tất cả
- `department_id`: lọc theo phòng ban (kết hợp với `status_filter`)
- `status_filter`: chỉ lấy nhân viên theo trạng thái KPI cụ thể
- `sort_by`: sắp xếp kết quả

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**KPI chi tiết một nhân viên tháng 4:**
```json
{
  "month": "2026-04",
  "staff_id": "staff_abc123",
  "compare_previous": true
}
```

**Nhân viên đang ở mức at_risk hoặc critical:**
```json
{
  "month": "2026-04",
  "status_filter": "at_risk",
  "sort_by": "achievement_pct",
  "sort_order": "asc"
}
```

**KPI toàn bộ KTV tháng 4 sắp xếp theo điểm:**
```json
{
  "month": "2026-04",
  "department_id": "dept_ktv",
  "sort_by": "kpi_score",
  "sort_order": "desc"
}
```

**Nhân viên vượt KPI tháng này:**
```json
{
  "month": "2026-04",
  "status_filter": "exceeding",
  "sort_by": "achievement_pct",
  "sort_order": "desc"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "month": "2026-04",
    "total_staff": 18,
    "summary_by_status": {
      "exceeding": 4,
      "on_track": 9,
      "at_risk": 4,
      "critical": 1
    },
    "staff_kpi": [
      {
        "staff_id": "staff_abc123",
        "employee_code": "NV001",
        "full_name": "Nguyễn Thị Hoa",
        "department": "KTV",
        "kpi_targets": {
          "revenue_target": 50000000,
          "revenue_actual": 52500000,
          "revenue_pct": 105,
          "bookings_target": 80,
          "bookings_actual": 84,
          "bookings_pct": 105,
          "new_customers_target": 10,
          "new_customers_actual": 13,
          "new_customers_pct": 130,
          "rating_target": 4.5,
          "rating_actual": 4.8,
          "rating_pct": 107
        },
        "kpi_score": 109,
        "kpi_grade": "A",
        "kpi_status": "exceeding",
        "commission_earned": 4200000,
        "days_remaining": 8,
        "projected_eom_revenue": 71000000,
        "vs_previous": {
          "month": "2026-03",
          "kpi_score": 88,
          "change": 21,
          "trend": "up"
        }
      },
      {
        "staff_id": "staff_ghi789",
        "employee_code": "NV008",
        "full_name": "Lê Văn Tuấn",
        "department": "KTV",
        "kpi_targets": {
          "revenue_target": 45000000,
          "revenue_actual": 21000000,
          "revenue_pct": 46.7,
          "bookings_target": 70,
          "bookings_actual": 33,
          "bookings_pct": 47.1,
          "new_customers_target": 8,
          "new_customers_actual": 4,
          "new_customers_pct": 50,
          "rating_target": 4.5,
          "rating_actual": 4.2,
          "rating_pct": 93.3
        },
        "kpi_score": 47,
        "kpi_grade": "D",
        "kpi_status": "critical",
        "commission_earned": 1680000,
        "days_remaining": 8,
        "projected_eom_revenue": 28600000,
        "alert": "Cần gặp 1-1 và có kế hoạch hỗ trợ ngay",
        "vs_previous": {
          "month": "2026-03",
          "kpi_score": 62,
          "change": -15,
          "trend": "down"
        }
      }
    ],
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

**Thang điểm KPI:**
- `A` (≥ 90%) — `exceeding`: vượt mục tiêu
- `B` (75–89%) — `on_track`: đang đúng tiến độ
- `C` (60–74%) — `at_risk`: có nguy cơ không đạt
- `D` (< 60%) — `critical`: cần can thiệp ngay

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `STAFF_NOT_FOUND` | `staff_id` không tồn tại | Dùng `list_staff` để lấy ID đúng |
| `INVALID_MONTH_FORMAT` | Định dạng tháng sai | Dùng `YYYY-MM` |
| `NO_KPI_TARGET_SET` | Chưa cài mục tiêu KPI cho nhân viên hoặc tháng | Thông báo cần giao target trong hệ thống |
| `INVALID_STATUS_FILTER` | `status_filter` không hợp lệ | Dùng: `exceeding`, `on_track`, `at_risk`, `critical` |
| `INVALID_SORT_BY` | `sort_by` không hợp lệ | Dùng: `kpi_score`, `achievement_pct`, `staff_name` |
| `INVALID_DEPARTMENT` | `department_id` không tồn tại | Dùng `list_departments` để lấy ID đúng |
