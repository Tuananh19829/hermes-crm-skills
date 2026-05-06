---
name: get_staff_detail
description: Xem chi tiết một nhân viên bao gồm thông tin cá nhân, ca làm việc, KPI tháng hiện tại và hoa hồng tích lũy
triggers:
  - "chi tiết nhân viên"
  - "thông tin nhân viên"
  - "hồ sơ nhân viên"
  - "xem hồ sơ"
  - "kpi nhân viên"
  - "hoa hồng nhân viên"
  - "ca làm của"
  - "thông tin của"
endpoint: POST /internal/skills/get_staff_detail
---

# Skill: get_staff_detail

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem đầy đủ thông tin một nhân viên cụ thể (tên, SĐT, email, phòng ban, ca...)
- Kiểm tra KPI tháng hiện tại của một nhân viên
- Xem hoa hồng tích lũy trong tháng
- Xem lịch sử làm việc và ngày vào làm
- Tra cứu thông tin nhân viên trước khi tạo phiếu lương, thưởng/phạt

## Cách dùng

Cần cung cấp `staff_id` (ID nhân viên trong hệ thống). Có thể lấy `staff_id` từ kết quả của skill `list_staff`.

**Request body:**
```json
{
  "staff_id": "string",
  "include_kpi": true,
  "include_commission": true,
  "month": "2026-04"
}
```

- `include_kpi`: (mặc định `true`) bao gồm thông tin KPI tháng
- `include_commission`: (mặc định `true`) bao gồm hoa hồng tháng
- `month`: tháng cần xem KPI/hoa hồng, định dạng `YYYY-MM`, mặc định tháng hiện tại

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Xem chi tiết nhân viên với KPI và hoa hồng tháng này:**
```json
{
  "staff_id": "staff_abc123",
  "include_kpi": true,
  "include_commission": true,
  "month": "2026-04"
}
```

**Chỉ xem thông tin cơ bản (không cần KPI):**
```json
{
  "staff_id": "staff_abc123",
  "include_kpi": false,
  "include_commission": false
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "staff_id": "staff_abc123",
    "employee_code": "NV001",
    "full_name": "Nguyễn Thị Hoa",
    "phone": "0901234567",
    "email": "hoa.nguyen@spaclaw.pro",
    "id_card": "079204012345",
    "date_of_birth": "1995-06-15",
    "gender": "female",
    "address": "123 Nguyễn Trãi, Q5, TP.HCM",
    "department": {
      "id": "dept_le_tan",
      "name": "Lễ tân"
    },
    "role": "Lễ tân cấp 2",
    "shift": {
      "id": "shift_sang",
      "name": "Ca sáng",
      "start_time": "08:00",
      "end_time": "14:00",
      "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    },
    "status": "active",
    "join_date": "2024-03-01",
    "base_salary": 8000000,
    "avatar_url": "https://cdn.spaclaw.pro/avatars/hoa.jpg",
    "kpi": {
      "month": "2026-04",
      "target_revenue": 50000000,
      "actual_revenue": 42000000,
      "completion_pct": 84,
      "target_bookings": 80,
      "actual_bookings": 67,
      "customer_rating_avg": 4.6,
      "kpi_score": 78
    },
    "commission": {
      "month": "2026-04",
      "total_amount": 3200000,
      "breakdown": [
        {"service": "Triệt lông", "amount": 1800000},
        {"service": "Trị mụn", "amount": 1400000}
      ]
    }
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `STAFF_NOT_FOUND` | `staff_id` không tồn tại | Dùng `list_staff` để lấy ID đúng |
| `INVALID_MONTH_FORMAT` | `month` sai định dạng | Dùng định dạng `YYYY-MM` (ví dụ: `2026-04`) |
| `UNAUTHORIZED` | Thiếu header auth | Kiểm tra 3 header bắt buộc |
