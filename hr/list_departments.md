---
name: list_departments
description: Lấy danh sách phòng ban trong cơ sở kèm số lượng nhân viên và trưởng phòng, dùng để tra cứu ID phòng ban cho các skill khác
triggers:
  - "danh sách phòng ban"
  - "phòng ban"
  - "bộ phận"
  - "list phòng ban"
  - "các phòng ban"
  - "phòng nào"
  - "trưởng phòng"
  - "số nhân viên phòng"
endpoint: POST /internal/skills/list_departments
---

# Skill: list_departments

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem danh sách tất cả phòng ban / bộ phận trong cơ sở
- Biết mỗi phòng ban có bao nhiêu nhân viên
- Tra cứu `department_id` để dùng với các skill khác như `list_staff`, `get_timesheet`, `get_payroll`
- Xem ai là trưởng phòng của từng bộ phận
- Tổng quan cơ cấu tổ chức nhân sự

## Cách dùng

Không cần tham số bắt buộc. Có thể lọc theo trạng thái phòng ban.

**Request body:**
```json
{
  "status": "active | inactive | null",
  "include_staff_count": true,
  "include_head": true
}
```

- `status`: lọc theo trạng thái phòng ban (mặc định `"active"`)
- `include_staff_count`: (mặc định `true`) bao gồm số lượng nhân viên
- `include_head`: (mặc định `true`) bao gồm thông tin trưởng phòng

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Xem tất cả phòng ban đang hoạt động:**
```json
{
  "status": "active"
}
```

**Xem tất cả phòng ban kèm số nhân viên:**
```json
{
  "status": "active",
  "include_staff_count": true,
  "include_head": true
}
```

**Xem cả phòng ban đã đóng:**
```json
{
  "status": null
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "total": 5,
    "departments": [
      {
        "department_id": "dept_le_tan",
        "name": "Lễ tân",
        "description": "Tiếp đón khách, quản lý lịch hẹn",
        "status": "active",
        "staff_count": 4,
        "head": {
          "staff_id": "staff_xyz001",
          "full_name": "Trần Thị Lan",
          "role": "Trưởng bộ phận lễ tân"
        }
      },
      {
        "department_id": "dept_ktv",
        "name": "Kỹ thuật viên",
        "description": "Thực hiện các liệu trình dịch vụ",
        "status": "active",
        "staff_count": 8,
        "head": {
          "staff_id": "staff_xyz002",
          "full_name": "Nguyễn Văn Đức",
          "role": "Trưởng KTV"
        }
      },
      {
        "department_id": "dept_tu_van",
        "name": "Tư vấn viên",
        "description": "Tư vấn dịch vụ, chốt sale thẻ",
        "status": "active",
        "staff_count": 5,
        "head": {
          "staff_id": "staff_xyz003",
          "full_name": "Phạm Thị Hường",
          "role": "Trưởng bộ phận tư vấn"
        }
      },
      {
        "department_id": "dept_quan_ly",
        "name": "Quản lý",
        "description": "Ban quản lý cơ sở",
        "status": "active",
        "staff_count": 2,
        "head": null
      },
      {
        "department_id": "dept_kho",
        "name": "Kho – Vật tư",
        "description": "Quản lý kho, nhập xuất vật tư",
        "status": "active",
        "staff_count": 2,
        "head": {
          "staff_id": "staff_xyz005",
          "full_name": "Lê Minh Tuấn",
          "role": "Thủ kho"
        }
      }
    ]
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_STATUS` | `status` không hợp lệ | Dùng `"active"`, `"inactive"` hoặc bỏ qua |
| `NO_DEPARTMENTS` | Chưa cấu hình phòng ban | Thông báo cần thiết lập phòng ban trong hệ thống |
| `UNAUTHORIZED` | Thiếu header auth | Kiểm tra 3 header bắt buộc |
