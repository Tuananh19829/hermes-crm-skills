---
name: commission_report
description: Báo cáo hoa hồng tổng hợp theo nhân viên, dịch vụ và tháng — dùng để đối chiếu trước khi tính lương
triggers:
  - "báo cáo hoa hồng"
  - "hoa hồng tổng hợp"
  - "tổng hoa hồng"
  - "commission report"
  - "hoa hồng theo dịch vụ"
  - "hoa hồng theo nhân viên"
  - "đối chiếu hoa hồng"
  - "hoa hồng tháng"
endpoint: POST /internal/skills/commission_report
---

# Skill: commission_report

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem tổng hợp hoa hồng toàn bộ nhân viên trong tháng
- Phân tích hoa hồng theo từng dịch vụ
- So sánh hoa hồng giữa các tháng hoặc giữa các nhân viên
- Đối chiếu hoa hồng trước khi ký duyệt bảng lương
- Tìm nhân viên có hoa hồng cao nhất / thấp nhất
- Xem chi tiết từng đơn hàng/lượt dịch vụ phát sinh hoa hồng

## Cách dùng

**Request body:**
```json
{
  "month": "2026-04",
  "staff_id": "string | null",
  "department_id": "string | null",
  "service_id": "string | null",
  "group_by": "staff | service | department",
  "sort_by": "total_commission | staff_name | sessions",
  "sort_order": "desc | asc",
  "compare_months": ["2026-03"]
}
```

- Nếu không truyền `staff_id`/`department_id` → báo cáo toàn công ty
- `group_by`: chiều tổng hợp chính
- `compare_months`: tối đa 3 tháng để so sánh xu hướng

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Báo cáo hoa hồng toàn bộ nhân viên tháng 4:**
```json
{
  "month": "2026-04",
  "group_by": "staff",
  "sort_by": "total_commission",
  "sort_order": "desc"
}
```

**Hoa hồng theo dịch vụ tháng 4:**
```json
{
  "month": "2026-04",
  "group_by": "service",
  "sort_by": "total_commission",
  "sort_order": "desc"
}
```

**Hoa hồng KTV tháng 4 so với tháng 3:**
```json
{
  "month": "2026-04",
  "department_id": "dept_ktv",
  "group_by": "staff",
  "compare_months": ["2026-03"]
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "month": "2026-04",
    "group_by": "staff",
    "total_commission_all": 48500000,
    "comparison": [
      {"month": "2026-03", "total_commission": 42000000, "change_pct": 15.5}
    ],
    "items": [
      {
        "staff_id": "staff_abc123",
        "full_name": "Nguyễn Thị Hoa",
        "department": "KTV",
        "total_sessions": 22,
        "total_revenue_generated": 52500000,
        "commission_rate_avg_pct": 8,
        "total_commission": 4200000,
        "breakdown": [
          {
            "service_name": "Triệt lông",
            "sessions": 14,
            "revenue": 28000000,
            "commission": 2240000
          },
          {
            "service_name": "Trị mụn",
            "sessions": 8,
            "revenue": 24500000,
            "commission": 1960000
          }
        ],
        "vs_previous": {
          "month": "2026-03",
          "commission": 3600000,
          "change_pct": 16.7
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
| `INVALID_MONTH_FORMAT` | Định dạng tháng sai | Dùng `YYYY-MM` |
| `INVALID_GROUP_BY` | `group_by` không hợp lệ | Dùng: `staff`, `service`, `department` |
| `INVALID_SORT_BY` | `sort_by` không hợp lệ | Dùng: `total_commission`, `staff_name`, `sessions` |
| `TOO_MANY_COMPARE_MONTHS` | `compare_months` > 3 phần tử | Giới hạn tối đa 3 tháng |
| `NO_COMMISSION_DATA` | Không có hoa hồng trong tháng | Kiểm tra lại tháng |
