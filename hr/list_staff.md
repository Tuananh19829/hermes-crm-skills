---
name: list_staff
description: Lấy danh sách nhân viên, có thể lọc theo phòng ban, ca làm việc, hoặc trạng thái hoạt động
triggers:
  - "danh sách nhân viên"
  - "list nhân viên"
  - "xem nhân viên"
  - "nhân viên phòng ban"
  - "nhân viên ca"
  - "tìm nhân viên"
  - "nhân viên đang làm"
  - "nhân viên nghỉ việc"
endpoint: POST /internal/skills/list_staff
---

# Skill: list_staff

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem toàn bộ danh sách nhân viên trong hệ thống
- Lọc nhân viên theo phòng ban cụ thể (lễ tân, kỹ thuật viên, tư vấn, quản lý...)
- Lọc nhân viên theo ca làm việc (ca sáng, ca chiều, ca tối)
- Lọc theo trạng thái: đang làm / nghỉ việc / tạm nghỉ
- Tìm kiếm nhân viên theo tên hoặc mã nhân viên

## Cách dùng

Gửi POST request với body JSON chứa các tham số lọc tùy chọn. Không cần truyền đủ tất cả tham số — bỏ qua tham số nào không cần lọc.

**Request body:**
```json
{
  "department_id": "string | null",
  "shift_id": "string | null",
  "status": "active | inactive | on_leave | null",
  "search": "string | null",
  "page": 1,
  "limit": 20
}
```

**Headers bắt buộc:**
- `X-Internal-Secret`: internal secret key
- `X-User-Id`: ID người dùng đang thực hiện request
- `X-Group-Id`: ID workspace/org

## Ví dụ

**Lấy tất cả nhân viên đang làm việc:**
```json
{
  "status": "active",
  "page": 1,
  "limit": 50
}
```

**Lọc nhân viên phòng kỹ thuật:**
```json
{
  "department_id": "dept_ky_thuat",
  "status": "active"
}
```

**Tìm nhân viên theo tên:**
```json
{
  "search": "Nguyễn Thị",
  "status": "active"
}
```

**Nhân viên ca sáng:**
```json
{
  "shift_id": "shift_sang",
  "status": "active"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "staff_id": "staff_abc123",
        "employee_code": "NV001",
        "full_name": "Nguyễn Thị Hoa",
        "phone": "0901234567",
        "email": "hoa.nguyen@spaclaw.pro",
        "department": {
          "id": "dept_le_tan",
          "name": "Lễ tân"
        },
        "shift": {
          "id": "shift_sang",
          "name": "Ca sáng",
          "start_time": "08:00",
          "end_time": "14:00"
        },
        "role": "Lễ tân",
        "status": "active",
        "join_date": "2024-03-01",
        "avatar_url": "https://cdn.spaclaw.pro/avatars/hoa.jpg"
      }
    ],
    "total": 24,
    "page": 1,
    "limit": 20,
    "total_pages": 2
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_DEPARTMENT` | `department_id` không tồn tại | Dùng skill `list_departments` để lấy ID hợp lệ |
| `INVALID_SHIFT` | `shift_id` không tồn tại | Dùng skill `get_shift_schedule` để xác nhận ID ca |
| `INVALID_STATUS` | Giá trị `status` không hợp lệ | Chỉ dùng: `active`, `inactive`, `on_leave` |
| `UNAUTHORIZED` | Thiếu hoặc sai header auth | Kiểm tra `X-Internal-Secret`, `X-User-Id`, `X-Group-Id` |
| `PAGE_OUT_OF_RANGE` | `page` vượt quá `total_pages` | Giảm giá trị `page` |
