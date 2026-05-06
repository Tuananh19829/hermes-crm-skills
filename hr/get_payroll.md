---
name: get_payroll
description: Xem bảng lương nhân viên theo tháng bao gồm lương cơ bản, phụ cấp, thưởng/phạt, hoa hồng và lương thực lĩnh
triggers:
  - "bảng lương"
  - "lương tháng"
  - "lương nhân viên"
  - "tính lương"
  - "xem lương"
  - "lương thực lĩnh"
  - "payroll"
  - "lương tháng này"
  - "lương tháng trước"
endpoint: POST /internal/skills/get_payroll
---

# Skill: get_payroll

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem bảng lương chi tiết của một nhân viên cụ thể
- Xem bảng lương toàn bộ nhân viên trong tháng
- Kiểm tra cơ cấu lương: lương cơ bản + hoa hồng + thưởng - phạt - tạm ứng
- Xác nhận lương thực lĩnh trước khi thanh toán
- Xuất bảng lương để tham khảo

## Cách dùng

Có thể lấy lương của 1 nhân viên hoặc cả phòng ban. Mặc định lấy tháng hiện tại.

**Request body:**
```json
{
  "staff_id": "string | null",
  "department_id": "string | null",
  "month": "2026-04",
  "status": "draft | confirmed | paid | null"
}
```

- `month`: định dạng `YYYY-MM`
- `status`: lọc theo trạng thái bảng lương (`draft` = nháp, `confirmed` = đã xác nhận, `paid` = đã trả)
- Nếu không truyền `staff_id` và `department_id`, trả về toàn bộ nhân viên

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Xem lương tháng 4 của một nhân viên:**
```json
{
  "staff_id": "staff_abc123",
  "month": "2026-04"
}
```

**Xem bảng lương toàn công ty tháng 3:**
```json
{
  "month": "2026-03",
  "status": "confirmed"
}
```

**Bảng lương phòng KTV chưa trả:**
```json
{
  "department_id": "dept_ktv",
  "month": "2026-04",
  "status": "confirmed"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "month": "2026-04",
    "generated_at": "2026-04-22T10:00:00Z",
    "status": "draft",
    "items": [
      {
        "staff_id": "staff_abc123",
        "employee_code": "NV001",
        "full_name": "Nguyễn Thị Hoa",
        "department": "Lễ tân",
        "working_days": 22,
        "base_salary": 8000000,
        "attendance_deduction": 200000,
        "allowances": {
          "meal": 500000,
          "transport": 300000,
          "phone": 200000
        },
        "commission": 3200000,
        "bonus": 500000,
        "penalty": 100000,
        "advance_taken": 2000000,
        "insurance_deduction": 560000,
        "tax_deduction": 0,
        "gross_salary": 12400000,
        "net_salary": 9840000,
        "payroll_status": "draft",
        "note": ""
      }
    ],
    "summary": {
      "total_staff": 12,
      "total_gross": 148800000,
      "total_net": 118080000
    }
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `STAFF_NOT_FOUND` | `staff_id` không tồn tại | Dùng `list_staff` để lấy ID đúng |
| `INVALID_MONTH_FORMAT` | `month` sai định dạng | Dùng `YYYY-MM` |
| `PAYROLL_NOT_GENERATED` | Bảng lương tháng này chưa được tạo | Thông báo cần tạo bảng lương trước |
| `INVALID_STATUS` | `status` không hợp lệ | Chỉ dùng: `draft`, `confirmed`, `paid` |
