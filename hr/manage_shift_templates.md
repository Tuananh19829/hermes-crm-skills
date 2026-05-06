---
name: manage_shift_templates
description: Tạo/sửa/xóa mẫu ca làm việc (tên ca, giờ bắt đầu, giờ kết thúc, ngày trong tuần, màu sắc)
triggers:
  - "tạo ca"
  - "thêm ca làm"
  - "shift template"
  - "ca sáng"
  - "ca chiều"
  - "cấu hình ca"
  - "sửa ca làm việc"
  - "xóa ca làm"
  - "danh sách ca"
  - "quản lý ca"
endpoint: POST /internal/skills/manage_shift_templates
---

# Skill: manage_shift_templates

## Khi nào dùng

Dùng khi người dùng muốn:
- Tạo mới mẫu ca làm việc (ca sáng, ca chiều, ca tối, ca đặc biệt...)
- Sửa thông tin ca: giờ bắt đầu, giờ kết thúc, ngày áp dụng, màu sắc hiển thị
- Xóa mẫu ca không còn sử dụng
- Xem danh sách toàn bộ mẫu ca đã cấu hình
- Cấu hình ngày trong tuần áp dụng cho từng ca

## Cách dùng

Gửi POST request với `action` xác định thao tác cần thực hiện. Các action hợp lệ: `list`, `create`, `update`, `delete`.

**Request body — action: list:**
```json
{
  "action": "list"
}
```

**Request body — action: create:**
```json
{
  "action": "create",
  "name": "string",
  "start_time": "HH:mm",
  "end_time": "HH:mm",
  "days_of_week": [0, 1, 2, 3, 4, 5, 6],
  "color": "#hex",
  "note": "string | null"
}
```

**Request body — action: update:**
```json
{
  "action": "update",
  "shift_template_id": "string",
  "name": "string | null",
  "start_time": "HH:mm | null",
  "end_time": "HH:mm | null",
  "days_of_week": "number[] | null",
  "color": "#hex | null",
  "note": "string | null"
}
```

**Request body — action: delete:**
```json
{
  "action": "delete",
  "shift_template_id": "string"
}
```

**Headers bắt buộc:**
- `X-Internal-Secret`: internal secret key
- `X-User-Id`: ID người dùng đang thực hiện request
- `X-Group-Id`: ID workspace/org

> `days_of_week`: mảng số nguyên — 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7

## Ví dụ

**Xem toàn bộ mẫu ca:**
```json
{
  "action": "list"
}
```

**Tạo ca sáng thứ 2–6:**
```json
{
  "action": "create",
  "name": "Ca sáng",
  "start_time": "08:00",
  "end_time": "14:00",
  "days_of_week": [1, 2, 3, 4, 5],
  "color": "#F59E0B",
  "note": "Ca sáng chuẩn từ thứ 2 đến thứ 6"
}
```

**Tạo ca chiều cả tuần:**
```json
{
  "action": "create",
  "name": "Ca chiều",
  "start_time": "14:00",
  "end_time": "20:00",
  "days_of_week": [1, 2, 3, 4, 5, 6],
  "color": "#3B82F6",
  "note": null
}
```

**Sửa giờ kết thúc ca tối:**
```json
{
  "action": "update",
  "shift_template_id": "shift_tpl_001",
  "end_time": "22:30",
  "color": "#6366F1"
}
```

**Xóa mẫu ca không dùng nữa:**
```json
{
  "action": "delete",
  "shift_template_id": "shift_tpl_003"
}
```

## Output format

**action: list**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "shift_template_id": "shift_tpl_001",
        "name": "Ca sáng",
        "start_time": "08:00",
        "end_time": "14:00",
        "days_of_week": [1, 2, 3, 4, 5],
        "days_label": "Thứ 2 – Thứ 6",
        "color": "#F59E0B",
        "note": "Ca sáng chuẩn",
        "staff_count": 5,
        "created_at": "2025-01-10T08:00:00Z"
      },
      {
        "shift_template_id": "shift_tpl_002",
        "name": "Ca chiều",
        "start_time": "14:00",
        "end_time": "20:00",
        "days_of_week": [1, 2, 3, 4, 5, 6],
        "days_label": "Thứ 2 – Thứ 7",
        "color": "#3B82F6",
        "note": null,
        "staff_count": 4,
        "created_at": "2025-01-10T08:05:00Z"
      }
    ],
    "total": 2
  }
}
```

**action: create / update**
```json
{
  "success": true,
  "data": {
    "shift_template_id": "shift_tpl_004",
    "name": "Ca tối",
    "start_time": "20:00",
    "end_time": "23:00",
    "days_of_week": [5, 6],
    "days_label": "Thứ 6 – Thứ 7",
    "color": "#8B5CF6",
    "note": null,
    "created_at": "2026-04-22T09:00:00Z"
  },
  "message": "Tạo mẫu ca thành công"
}
```

**action: delete**
```json
{
  "success": true,
  "message": "Đã xóa mẫu ca 'Ca thử nghiệm'"
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `MISSING_ACTION` | Thiếu field `action` trong request body | Truyền `action`: `list`, `create`, `update`, hoặc `delete` |
| `INVALID_ACTION` | Giá trị `action` không hợp lệ | Chỉ dùng: `list`, `create`, `update`, `delete` |
| `SHIFT_TEMPLATE_NOT_FOUND` | `shift_template_id` không tồn tại | Dùng `action: list` để lấy ID hợp lệ |
| `SHIFT_NAME_DUPLICATE` | Tên ca đã tồn tại trong workspace | Đổi tên ca hoặc sửa ca hiện có |
| `INVALID_TIME_RANGE` | `end_time` <= `start_time` | Kiểm tra lại giờ bắt đầu và kết thúc |
| `SHIFT_IN_USE` | Không xóa được vì ca đang được gán cho NV | Gỡ NV khỏi ca trước khi xóa |
| `MISSING_REQUIRED_FIELD` | Thiếu `name`, `start_time`, hoặc `end_time` khi tạo | Truyền đủ 3 trường bắt buộc khi `action: create` |
| `UNAUTHORIZED` | Thiếu hoặc sai header auth | Kiểm tra `X-Internal-Secret`, `X-User-Id`, `X-Group-Id` |
