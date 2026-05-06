---
name: list_telesale_queue
description: Danh sách số cần gọi hôm nay theo NV, ưu tiên theo hẹn callback
triggers:
  - "danh sách gọi"
  - "queue telesale"
  - "hôm nay gọi ai"
  - "telesale queue"
  - "lịch gọi"
  - "ai cần gọi"
endpoint: POST /internal/skills/list_telesale_queue
---

# Skill: list_telesale_queue

## Khi nào dùng
- NV muốn biết hôm nay cần gọi cho ai
- Quản lý muốn xem queue gọi điện của NV cụ thể
- Xem các cuộc hẹn callback sắp đến
- KHÔNG dùng để ghi kết quả gọi → dùng `telesale_call_log`

## Cách dùng
1. Nếu NV hỏi cho bản thân → bỏ `assigned_to` (server tự resolve từ token)
2. Nếu quản lý hỏi về NV khác → truyền UUID nhân viên đó
3. Queue được sắp xếp: callback đã hẹn trước → leads mới → leads chưa liên hệ

## Ví dụ
User: "Hôm nay tôi gọi ai?"
→ `{"date": "2026-04-22", "include_callbacks": true}`

User: "Queue telesale của NV Hoa hôm nay?"
→ `{"assigned_to": "<uuid_hoa>", "date": "2026-04-22"}`

User: "Có bao nhiêu cuộc gọi tồn đọng?"
→ `{"date": "2026-04-22", "include_callbacks": true, "limit": 100}`

## Output format
```json
{
  "ok": true,
  "data": {
    "date": "2026-04-22",
    "total": 24,
    "queue": [
      {
        "person_id": "uuid",
        "name": "Nguyễn Thị Mai",
        "phone": "0901xxx67",
        "priority": "callback",
        "callback_at": "2026-04-22T15:00:00Z",
        "last_result": "CALLBACK",
        "call_count": 2,
        "note": "Hẹn gọi lại sau họp"
      },
      {
        "person_id": "uuid2",
        "name": "Trần Văn B",
        "phone": "0912xxx45",
        "priority": "new",
        "callback_at": null,
        "last_result": null,
        "call_count": 0,
        "note": null
      }
    ]
  }
}
```

## Lỗi thường gặp
- `STAFF_NOT_FOUND`: UUID nhân viên không đúng → dùng `list_members` để tra UUID
- Queue rỗng: không có leads được assign → kiểm tra phân công leads trong Ads module
- `PERMISSION_DENIED`: NV thường không xem queue của người khác → chỉ manager/admin được xem
