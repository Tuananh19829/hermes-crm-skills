---
name: get_staff_performance
description: Đánh giá hiệu suất tổng hợp của nhân viên bao gồm % KPI, điểm đánh giá khách hàng, doanh thu tạo ra và xếp hạng trong nhóm
triggers:
  - "hiệu suất nhân viên"
  - "đánh giá nhân viên"
  - "performance"
  - "kpi tháng"
  - "đánh giá khách hàng"
  - "doanh thu nhân viên"
  - "xếp hạng nhân viên"
  - "nhân viên xuất sắc"
  - "nhân viên kém hiệu quả"
endpoint: POST /internal/skills/get_staff_performance
---

# Skill: get_staff_performance

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem đánh giá hiệu suất tổng hợp của một nhân viên (KPI%, rating KH, doanh thu)
- So sánh hiệu suất giữa các tháng
- Tìm nhân viên xuất sắc nhất hoặc cần cải thiện trong kỳ
- Chuẩn bị dữ liệu cho cuộc họp đánh giá định kỳ
- Xem xếp hạng hiệu suất trong phòng ban hoặc toàn công ty

## Cách dùng

**Request body:**
```json
{
  "staff_id": "string | null",
  "department_id": "string | null",
  "month": "2026-04",
  "compare_months": ["2026-03"],
  "sort_by": "kpi_score | revenue | rating | null",
  "sort_order": "desc | asc"
}
```

- Truyền `staff_id` để xem chi tiết 1 nhân viên, hoặc `department_id` để xem cả phòng
- `compare_months`: tối đa 3 tháng để so sánh xu hướng
- `sort_by`: áp dụng khi xem danh sách — sắp xếp theo chỉ tiêu nào
- `sort_order`: `"desc"` = cao → thấp (mặc định), `"asc"` = thấp → cao

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Hiệu suất chi tiết một nhân viên tháng 4:**
```json
{
  "staff_id": "staff_abc123",
  "month": "2026-04",
  "compare_months": ["2026-03", "2026-02"]
}
```

**Top 5 KTV có KPI cao nhất tháng này:**
```json
{
  "department_id": "dept_ktv",
  "month": "2026-04",
  "sort_by": "kpi_score",
  "sort_order": "desc"
}
```

**Nhân viên có doanh thu thấp nhất cần hỗ trợ:**
```json
{
  "month": "2026-04",
  "sort_by": "revenue",
  "sort_order": "asc"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "staff_id": "staff_abc123",
    "full_name": "Nguyễn Thị Hoa",
    "department": "KTV",
    "month": "2026-04",
    "kpi": {
      "target_revenue": 50000000,
      "actual_revenue": 52500000,
      "revenue_pct": 105,
      "target_bookings": 80,
      "actual_bookings": 84,
      "bookings_pct": 105,
      "kpi_score": 92,
      "kpi_grade": "A"
    },
    "customer_feedback": {
      "total_ratings": 68,
      "avg_rating": 4.7,
      "five_star_count": 52,
      "one_two_star_count": 1,
      "compliments": ["Nhẹ nhàng", "Chuyên nghiệp"],
      "complaints": []
    },
    "attendance": {
      "on_time_rate_pct": 96,
      "absent_days": 0,
      "late_days": 1
    },
    "commission": 4200000,
    "overall_score": 90,
    "rank_in_department": 1,
    "rank_in_company": 3,
    "trend": [
      {"month": "2026-03", "kpi_score": 85, "overall_score": 83},
      {"month": "2026-02", "kpi_score": 88, "overall_score": 86}
    ]
  }
}
```

**Thang điểm KPI grade:**
- `A`: ≥ 90%
- `B`: 75–89%
- `C`: 60–74%
- `D`: < 60%

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `STAFF_NOT_FOUND` | `staff_id` không tồn tại | Dùng `list_staff` để lấy ID đúng |
| `INVALID_MONTH_FORMAT` | Định dạng tháng sai | Dùng `YYYY-MM` |
| `NO_KPI_TARGET_SET` | Chưa cài đặt mục tiêu KPI cho tháng | Thông báo chưa có target, chỉ hiển thị số thực tế |
| `INVALID_SORT_BY` | `sort_by` không hợp lệ | Dùng: `kpi_score`, `revenue`, `rating` |
