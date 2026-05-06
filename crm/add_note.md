---
name: add_note
description: Thêm ghi chú cho khách hàng. Dùng khi user muốn lưu lại thông tin sau cuộc gọi, meeting.
triggers:
  - "ghi chú"
  - "add note"
  - "ghi lại"
  - "note cho kh"
  - "lưu ý"
endpoint: POST /internal/skills/add_note
---

# Skill: add_note

## Khi nào dùng
- Sau cuộc gọi/meeting, user muốn ghi lại kết quả
- User muốn đánh dấu thông tin quan trọng về khách

## Ví dụ
User: "Ghi chú kh Mai: đã gọi, hẹn thứ 5 tuần sau"
→ Tìm ID của Mai, rồi `{"person_id": "uuid", "content": "Đã gọi, hẹn thứ 5 tuần sau (24/4)"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "id": "uuid-ghi-chu",
    "person_id": "uuid-khach",
    "message": "Đã thêm ghi chú"
  }
}
```
