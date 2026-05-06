---
name: fix_timesheet_error
description: Ghi nhận và sửa lỗi chấm công (vắng có phép, nghỉ bệnh, đi muộn có lý do, duyệt đơn nghỉ phép)
triggers:
  - "sửa chấm công"
  - "duyệt nghỉ phép"
  - "fix timesheet"
  - "NV xin nghỉ"
  - "đơn nghỉ phép"
  - "chấm công sai"
  - "điều chỉnh chấm công"
  - "vắng có phép"
  - "nghỉ bệnh"
  - "đi muộn có lý do"
endpoint: POST /internal/skills/fix_timesheet_error
---

# Skill: fix_timesheet_error

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem danh sách các yêu cầu điều chỉnh chấm công đang chờ duyệt
- Duyệt hoặc từ chối đơn xin nghỉ phép, nghỉ bệnh của nhân viên
- Ghi nhận điều chỉnh lỗi chấm công: đi muộn có lý do chính đáng, vắng có phép, ra về sớm có xác nhận
- Nhân viên gửi đơn xin nghỉ (nghỉ phép năm, nghỉ bệnh, nghỉ việc riêng)
- Sửa trực tiếp một bản ghi chấm công bị ghi nhầm

## Cách dùng

Gửi POST request với `action` xác định thao tác. Các action hợp lệ: `list_requests`, `submit_request`, `approve`, `reject`, `manual_fix`.

**Request body — action: list_requests:**
```json
{
  "action": "list_requests",
  "staff_id": "string | null",
  "department_id": "string | null",
  "status": "pending | approved | rejected | all",
  "month": "YYYY-MM | null"
}
```

**Request body — action: submit_request (NV gửi đơn):**
```json
{
  "action": "submit_request",
  "staff_id": "string",
  "request_type": "leave | sick | late_excuse | early_excuse",
  "date": "YYYY-MM-DD",
  "session": "morning | afternoon | full_day",
  "reason": "string",
  "attachment_url": "string | null"
}
```

**Request body — action: approve:**
```json
{
  "action": "approve",
  "request_id": "string",
  "note": "string | null"
}
```

**Request body — action: reject:**
```json
{
  "action": "reject",
  "request_id": "string",
  "reason": "string"
}
```

**Request body — action: manual_fix (quản lý sửa thẳng):**
```json
{
  "action": "manual_fix",
  "staff_id": "string",
  "date": "YYYY-MM-DD",
  "field": "check_in | check_out | status",
  "new_value": "string",
  "reason": "string"
}
```

**Headers bắt buộc:**
- `X-Internal-Secret`: internal secret key
- `X-User-Id`: ID người dùng đang thực hiện request
- `X-Group-Id`: ID workspace/org

> `request_type`:  
> - `leave` = nghỉ phép năm  
> - `sick` = nghỉ bệnh  
> - `late_excuse` = đi muộn có lý do  
> - `early_excuse` = về sớm có lý do  
> 
> `session`: `morning` = buổi sáng, `afternoon` = buổi chiều, `full_day` = cả ngày  
> `manual_fix.field`: `check_in` / `check_out` nhận giá trị `"HH:mm"`, `status` nhận `"present"` / `"absent_excused"` / `"sick"`

## Ví dụ

**Xem các đơn đang chờ duyệt:**
```json
{
  "action": "list_requests",
  "status": "pending"
}
```

**Xem đơn nghỉ phép của một nhân viên trong tháng 4:**
```json
{
  "action": "list_requests",
  "staff_id": "staff_abc123",
  "status": "all",
  "month": "2026-04"
}
```

**NV gửi đơn xin nghỉ bệnh ngày 22/04:**
```json
{
  "action": "submit_request",
  "staff_id": "staff_abc123",
  "request_type": "sick",
  "date": "2026-04-22",
  "session": "full_day",
  "reason": "Bị cảm sốt, có đơn của bác sĩ",
  "attachment_url": "https://cdn.spaclaw.pro/docs/sick_note_abc123.pdf"
}
```

**NV xin nghỉ phép nửa ngày chiều:**
```json
{
  "action": "submit_request",
  "staff_id": "staff_xyz456",
  "request_type": "leave",
  "date": "2026-04-25",
  "session": "afternoon",
  "reason": "Có việc gia đình"
}
```

**Quản lý duyệt đơn:**
```json
{
  "action": "approve",
  "request_id": "req_001",
  "note": "Đã xác nhận với NV qua điện thoại"
}
```

**Quản lý từ chối đơn:**
```json
{
  "action": "reject",
  "request_id": "req_002",
  "reason": "Ngày đó phòng thiếu người, đề nghị đổi sang ngày khác"
}
```

**Quản lý sửa giờ check-in bị ghi nhầm:**
```json
{
  "action": "manual_fix",
  "staff_id": "staff_abc123",
  "date": "2026-04-20",
  "field": "check_in",
  "new_value": "08:05",
  "reason": "Camera ghi nhận 08:05, hệ thống ghi nhầm 09:05"
}
```

## Output format

**action: list_requests**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "request_id": "req_001",
        "staff": {
          "id": "staff_abc123",
          "name": "Nguyễn Thị Hoa",
          "department": "Lễ tân"
        },
        "request_type": "sick",
        "request_type_label": "Nghỉ bệnh",
        "date": "2026-04-22",
        "session": "full_day",
        "session_label": "Cả ngày",
        "reason": "Bị cảm sốt, có đơn của bác sĩ",
        "attachment_url": "https://cdn.spaclaw.pro/docs/sick_note_abc123.pdf",
        "status": "pending",
        "submitted_at": "2026-04-22T07:30:00Z",
        "reviewed_by": null,
        "reviewed_at": null,
        "review_note": null
      }
    ],
    "total": 1,
    "pending_count": 1
  }
}
```

**action: approve / reject**
```json
{
  "success": true,
  "data": {
    "request_id": "req_001",
    "status": "approved",
    "reviewed_by": "Trần Quản Lý",
    "reviewed_at": "2026-04-22T09:15:00Z",
    "note": "Đã xác nhận với NV qua điện thoại"
  },
  "message": "Đã duyệt đơn nghỉ bệnh của Nguyễn Thị Hoa ngày 22/04/2026"
}
```

**action: manual_fix**
```json
{
  "success": true,
  "data": {
    "staff_id": "staff_abc123",
    "date": "2026-04-20",
    "field": "check_in",
    "old_value": "09:05",
    "new_value": "08:05",
    "fixed_by": "Trần Quản Lý",
    "fixed_at": "2026-04-22T09:20:00Z",
    "reason": "Camera ghi nhận 08:05, hệ thống ghi nhầm 09:05"
  },
  "message": "Đã cập nhật giờ check-in ngày 20/04 cho Nguyễn Thị Hoa"
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `MISSING_ACTION` | Thiếu field `action` | Truyền `action` hợp lệ |
| `REQUEST_NOT_FOUND` | `request_id` không tồn tại | Dùng `action: list_requests` để lấy ID đúng |
| `STAFF_NOT_FOUND` | `staff_id` không hợp lệ | Dùng skill `list_staff` để xác nhận ID |
| `REQUEST_ALREADY_REVIEWED` | Đơn đã được duyệt/từ chối trước đó | Không thể sửa trạng thái đơn đã xử lý |
| `DUPLICATE_REQUEST` | NV đã có đơn cho cùng ngày và session | Xem đơn cũ trước khi nộp đơn mới |
| `INVALID_DATE` | `date` định dạng sai hoặc ngày tương lai quá xa | Dùng định dạng `YYYY-MM-DD`, ngày hợp lý |
| `INVALID_FIELD` | `field` trong `manual_fix` không hợp lệ | Chỉ dùng: `check_in`, `check_out`, `status` |
| `INVALID_TIME_FORMAT` | `new_value` giờ sai định dạng khi fix `check_in`/`check_out` | Dùng định dạng `HH:mm` (VD: `08:05`) |
| `MISSING_REASON` | Thiếu `reason` khi `action: reject` hoặc `manual_fix` | Bắt buộc phải có lý do khi từ chối hoặc sửa thủ công |
| `UNAUTHORIZED` | Thiếu hoặc sai header auth | Kiểm tra `X-Internal-Secret`, `X-User-Id`, `X-Group-Id` |
