---
name: list_members
description: Danh sách thành viên workspace, vai trò và trạng thái tài khoản
triggers:
  - "thành viên"
  - "danh sách nv"
  - "list members"
  - "ai có quyền"
  - "thành viên workspace"
  - "nhân sự hệ thống"
endpoint: POST /internal/skills/list_members
---

# Skill: list_members

## Khi nào dùng
- Cần biết UUID của một nhân viên để dùng trong các skill khác (list_telesale_queue, list_ads_leads)
- Xem ai có quyền admin/manager trong workspace
- Kiểm tra trạng thái tài khoản NV (active/inactive)

## Vai trò (role)
| Value | Mô tả |
|-------|-------|
| `admin` | Toàn quyền hệ thống |
| `manager` | Quản lý chi nhánh/nhóm |
| `staff` | Nhân viên kỹ thuật/dịch vụ |
| `telesale` | Nhân viên telesale |

## Cách dùng
1. Lọc theo `role` nếu user hỏi về nhóm cụ thể
2. Kết quả trả về `id` có thể dùng làm `assigned_to`, `staff_id` trong các skill khác
3. Thông tin nhạy cảm (email đầy đủ) chỉ hiện cho admin

## Ví dụ
User: "Ai là admin trong workspace?"
→ `{"role": "admin"}`

User: "Danh sách NV telesale đang active"
→ `{"role": "telesale", "active_only": true}`

User: "Tìm UUID của NV tên Hoa"
→ `{"active_only": true}` → lọc kết quả theo tên

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 12,
    "members": [
      {
        "id": "uuid_member",
        "name": "Nguyễn Thị Hoa",
        "role": "telesale",
        "status": "active",
        "email": "hoa***@example.com",
        "phone": "0901xxx23",
        "branch": {"id": "uuid_branch", "name": "Cơ sở Q.1"},
        "joined_at": "2026-01-15"
      }
    ]
  }
}
```

## Lỗi thường gặp
- `PERMISSION_DENIED`: NV thường không xem email/phone đầy đủ của đồng nghiệp
- Không tìm thấy NV theo tên: tên có thể bị viết tắt hoặc nickname → tìm bằng SĐT
- `ROLE_NOT_FOUND`: role không hợp lệ → chỉ dùng: admin | manager | staff | telesale
