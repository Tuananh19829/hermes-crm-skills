---
name: list_rooms
description: Danh sách phòng/giường và trạng thái hiện tại (trống, đang dùng, bảo trì)
triggers:
  - "phòng trống"
  - "danh sách phòng"
  - "list rooms"
  - "giường trống"
  - "trạng thái phòng"
  - "phòng nào"
endpoint: POST /internal/skills/list_rooms
---

# Skill: list_rooms

## Khi nào dùng
- Lễ tân/NV cần biết còn phòng/giường trống không
- Xem trạng thái tất cả phòng của cơ sở để xếp lịch
- Kiểm tra phòng đang bảo trì
- KHÔNG dùng để đặt lịch → dùng module booking riêng

## Trạng thái phòng
| Value | Mô tả |
|-------|-------|
| `available` | Đang trống, có thể dùng |
| `occupied` | Đang có khách |
| `maintenance` | Bảo trì, không dùng được |

## Cách dùng
1. Nếu có nhiều chi nhánh → lấy `branch_id` từ `list_branches` trước
2. Lọc theo `status` nếu user hỏi cụ thể
3. Không truyền `branch_id` = lấy tất cả phòng của workspace

## Ví dụ
User: "Còn phòng nào trống không?"
→ `{"status": "available"}`

User: "Phòng nào đang bảo trì ở cơ sở Q.1?"
→ `{"branch_id": "uuid_branch_1", "status": "maintenance"}`

User: "Xem toàn bộ tình trạng phòng cơ sở Q.3"
→ `{"branch_id": "uuid_branch_2"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 8,
    "available_count": 3,
    "occupied_count": 4,
    "maintenance_count": 1,
    "rooms": [
      {
        "id": "uuid_room",
        "name": "Phòng 101",
        "type": "facial",
        "capacity": 1,
        "status": "available",
        "branch": {"id": "uuid_branch_1", "name": "Cơ sở Q.1"},
        "current_customer": null,
        "available_from": null
      },
      {
        "id": "uuid_room2",
        "name": "Phòng 102",
        "type": "massage",
        "capacity": 2,
        "status": "occupied",
        "branch": {"id": "uuid_branch_1", "name": "Cơ sở Q.1"},
        "current_customer": {"id": "uuid_kh", "name": "Nguyễn Thị Mai"},
        "available_from": "2026-04-22T11:30:00Z"
      }
    ]
  }
}
```

## Lỗi thường gặp
- `BRANCH_NOT_FOUND`: branch_id không đúng → dùng `list_branches` để lấy ID
- Tất cả phòng `occupied`: thông báo cho user, hỏi có muốn đặt lịch sau không
- `NO_ROOMS_CONFIGURED`: workspace chưa cấu hình phòng → vào Settings → Phòng/Giường
