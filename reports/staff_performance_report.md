---
name: staff_performance_report
description: Báo cáo hiệu suất tổng hợp toàn bộ nhân viên theo kỳ, xếp hạng, phân loại và so sánh với mục tiêu
triggers:
  - "báo cáo hiệu suất nhân viên"
  - "hiệu suất toàn bộ nhân viên"
  - "xếp hạng nhân viên"
  - "staff performance report"
  - "đánh giá nhân sự"
  - "top nhân viên"
  - "nhân viên xuất sắc tháng"
  - "nhân viên kém hiệu quả"
  - "bảng xếp hạng nhân viên"
endpoint: POST /internal/skills/staff_performance_report
---

# Skill: staff_performance_report

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem bảng xếp hạng toàn bộ nhân viên theo KPI, doanh thu, rating khách hàng
- Tìm nhân viên xuất sắc nhất hoặc kém hiệu quả nhất trong tháng
- So sánh hiệu suất giữa các phòng ban
- Chuẩn bị dữ liệu họp đánh giá nhân sự định kỳ
- Xác định ai cần được khen thưởng hoặc hỗ trợ đào tạo thêm

## Cách dùng

**Request body:**
```json
{
  "period": "month | quarter",
  "month": "2026-04",
  "quarter": "2026-Q1",
  "department_id": "string | null",
  "sort_by": "kpi_score | revenue | rating | attendance",
  "sort_order": "desc | asc",
  "top_n": 10,
  "compare_previous": true
}
```

- `department_id`: lọc theo phòng ban (bỏ qua = toàn công ty)
- `sort_by`: tiêu chí xếp hạng chính
- `top_n`: chỉ lấy top N nhân viên (mặc định tất cả)
- `compare_previous`: so sánh với kỳ trước

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Top 5 KTV hiệu suất cao nhất tháng 4:**
```json
{
  "period": "month",
  "month": "2026-04",
  "department_id": "dept_ktv",
  "sort_by": "kpi_score",
  "sort_order": "desc",
  "top_n": 5
}
```

**Toàn bộ nhân viên sắp xếp theo doanh thu tháng này:**
```json
{
  "period": "month",
  "month": "2026-04",
  "sort_by": "revenue",
  "sort_order": "desc",
  "compare_previous": true
}
```

**Nhân viên cần cải thiện (KPI thấp nhất):**
```json
{
  "period": "month",
  "month": "2026-04",
  "sort_by": "kpi_score",
  "sort_order": "asc",
  "top_n": 5
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "period": "month",
    "month": "2026-04",
    "department_filter": null,
    "total_staff_evaluated": 18,
    "grade_distribution": {
      "A": 4,
      "B": 8,
      "C": 5,
      "D": 1
    },
    "department_comparison": [
      {
        "department": "KTV",
        "avg_kpi_score": 82,
        "avg_revenue": 29000000,
        "avg_rating": 4.6
      },
      {
        "department": "Tư vấn",
        "avg_kpi_score": 75,
        "avg_revenue": 18000000,
        "avg_rating": 4.4
      }
    ],
    "rankings": [
      {
        "rank": 1,
        "staff_id": "staff_abc123",
        "full_name": "Nguyễn Thị Hoa",
        "department": "KTV",
        "kpi_score": 95,
        "kpi_grade": "A",
        "revenue": 52500000,
        "avg_rating": 4.8,
        "attendance_score": 98,
        "overall_score": 94,
        "vs_previous": {
          "overall_change": 4,
          "trend": "up"
        }
      },
      {
        "rank": 2,
        "staff_id": "staff_def456",
        "full_name": "Trần Văn Minh",
        "department": "KTV",
        "kpi_score": 91,
        "kpi_grade": "A",
        "revenue": 48000000,
        "avg_rating": 4.7,
        "attendance_score": 100,
        "overall_score": 91,
        "vs_previous": {
          "overall_change": -2,
          "trend": "down"
        }
      }
    ],
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_PERIOD` | `period` không hợp lệ | Dùng: `month` hoặc `quarter` |
| `INVALID_DEPARTMENT` | `department_id` không tồn tại | Dùng `list_departments` để lấy ID |
| `INVALID_SORT_BY` | `sort_by` không hợp lệ | Dùng: `kpi_score`, `revenue`, `rating`, `attendance` |
| `NO_KPI_TARGET` | Chưa cài mục tiêu KPI cho tháng | Chỉ xếp hạng theo doanh thu/rating thực tế |
| `INSUFFICIENT_DATA` | Chưa đủ dữ liệu để đánh giá | Kiểm tra tháng đã kết thúc chưa |
