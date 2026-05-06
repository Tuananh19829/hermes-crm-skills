---
name: get_commissions
description: Xem hoa hồng của nhân viên theo từng dịch vụ và tháng, có thể so sánh nhiều tháng hoặc nhiều nhân viên
triggers:
  - "hoa hồng"
  - "commission"
  - "hoa hồng tháng"
  - "hoa hồng dịch vụ"
  - "hoa hồng nhân viên"
  - "tính hoa hồng"
  - "xem hoa hồng"
  - "tiền hoa hồng"
endpoint: POST /internal/skills/get_commissions
---

# Skill: get_commissions

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem hoa hồng của một nhân viên trong tháng cụ thể
- Xem hoa hồng theo từng loại dịch vụ đã thực hiện
- So sánh hoa hồng nhiều tháng của cùng một nhân viên
- Xem xếp hạng hoa hồng trong phòng ban hoặc toàn công ty
- Kiểm tra hoa hồng trước khi xác nhận bảng lương

## Cách dùng

**Request body:**
```json
{
  "staff_id": "string | null",
  "department_id": "string | null",
  "month": "2026-04",
  "service_id": "string | null",
  "compare_months": ["2026-03", "2026-02"]
}
```

- `service_id`: lọc hoa hồng theo dịch vụ cụ thể (tùy chọn)
- `compare_months`: danh sách tháng muốn so sánh (tối đa 3 tháng trước)
- Nếu không truyền `staff_id` → trả về xếp hạng hoa hồng toàn bộ nhân viên

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Hoa hồng tháng 4 của một nhân viên:**
```json
{
  "staff_id": "staff_abc123",
  "month": "2026-04"
}
```

**Hoa hồng theo dịch vụ triệt lông:**
```json
{
  "staff_id": "staff_abc123",
  "month": "2026-04",
  "service_id": "svc_triet_long"
}
```

**So sánh hoa hồng 3 tháng gần nhất:**
```json
{
  "staff_id": "staff_abc123",
  "month": "2026-04",
  "compare_months": ["2026-03", "2026-02"]
}
```

**Xếp hạng hoa hồng toàn bộ KTV tháng này:**
```json
{
  "department_id": "dept_ktv",
  "month": "2026-04"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "staff_id": "staff_abc123",
    "full_name": "Nguyễn Thị Hoa",
    "month": "2026-04",
    "total_commission": 3200000,
    "breakdown_by_service": [
      {
        "service_id": "svc_triet_long",
        "service_name": "Triệt lông",
        "sessions_done": 14,
        "revenue_generated": 28000000,
        "commission_rate_pct": 8,
        "commission_amount": 2240000
      },
      {
        "service_id": "svc_tri_mun",
        "service_name": "Trị mụn",
        "sessions_done": 8,
        "revenue_generated": 12000000,
        "commission_rate_pct": 8,
        "commission_amount": 960000
      }
    ],
    "comparison": [
      {"month": "2026-03", "total_commission": 2800000},
      {"month": "2026-02", "total_commission": 3100000}
    ],
    "rank_in_department": 2,
    "rank_in_company": 5
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `STAFF_NOT_FOUND` | `staff_id` không tồn tại | Dùng `list_staff` để lấy ID đúng |
| `SERVICE_NOT_FOUND` | `service_id` không tồn tại | Bỏ qua hoặc kiểm tra danh mục dịch vụ |
| `INVALID_MONTH_FORMAT` | Định dạng tháng sai | Dùng `YYYY-MM` |
| `TOO_MANY_COMPARE_MONTHS` | `compare_months` có hơn 3 phần tử | Giới hạn tối đa 3 tháng so sánh |
| `NO_COMMISSION_DATA` | Không có dữ liệu hoa hồng tháng này | Nhân viên chưa phát sinh dịch vụ trong tháng |
