---
name: list_branches
description: Danh sách chi nhánh trong workspace và trạng thái hoạt động
triggers:
  - "chi nhánh"
  - "danh sách cơ sở"
  - "list branches"
  - "cơ sở nào"
  - "số chi nhánh"
endpoint: POST /internal/skills/list_branches
---

# Skill: list_branches

## Khi nào dùng
- User hỏi có bao nhiêu chi nhánh, chi nhánh nào đang mở
- Cần lấy `branch_id` để dùng trong các skill khác (list_rooms, v.v.)
- Xem địa chỉ và thông tin liên hệ từng chi nhánh

## Cách dùng
- Gọi với `active_only: true` (mặc định) để chỉ lấy chi nhánh đang hoạt động
- Nếu user hỏi tất cả kể cả đã đóng → `active_only: false`

## Ví dụ
User: "Có mấy chi nhánh?"
→ `{"active_only": true}`

User: "Danh sách tất cả cơ sở kể cả đã đóng?"
→ `{"active_only": false}`

User: "Chi nhánh nào đang hoạt động ở Q.3?"
→ `{"active_only": true}` → lọc kết quả theo địa chỉ

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 3,
    "branches": [
      {
        "id": "uuid_branch_1",
        "name": "Cơ sở Quận 1",
        "address": "123 Nguyễn Trãi, Q.1, TP.HCM",
        "phone": "028 3333 4444",
        "status": "active",
        "manager": {"id": "uuid", "name": "Nguyễn Văn Quản"},
        "room_count": 8,
        "working_hours": {"open": "08:00", "close": "21:00"}
      },
      {
        "id": "uuid_branch_2",
        "name": "Cơ sở Quận 3",
        "address": "45 Võ Thị Sáu, Q.3, TP.HCM",
        "phone": "028 4444 5555",
        "status": "active",
        "manager": {"id": "uuid2", "name": "Trần Thị Hoa"},
        "room_count": 5,
        "working_hours": {"open": "09:00", "close": "20:00"}
      }
    ]
  }
}
```

## Lỗi thường gặp
- `SINGLE_BRANCH_WORKSPACE`: workspace chỉ có 1 cơ sở (không dùng multi-branch) → trả về 1 kết quả
- Danh sách rỗng: tất cả chi nhánh đã tạm đóng → thông báo và đề xuất dùng `active_only: false`
