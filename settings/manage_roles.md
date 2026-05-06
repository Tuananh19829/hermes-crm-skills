---
name: manage_roles
description: Xem/cập nhật phân quyền theo vai trò (Owner/Manager/Staff/Viewer), từng permission. CHỈ OWNER/ADMIN.
triggers:
  - "phân quyền"
  - "vai trò"
  - "role"
  - "quyền hạn"
  - "permission"
  - "cập nhật quyền"
  - "đổi vai trò"
  - "quản lý quyền"
  - "thêm quyền"
endpoint: POST /internal/skills/manage_roles
---

# Skill: manage_roles

## Khi nào dùng
- User muốn xem danh sách vai trò và quyền hạn hiện tại
- User muốn thay đổi quyền cho một vai trò (Manager, Staff, Viewer)
- User muốn thêm hoặc thu hồi quyền cụ thể (xem báo cáo, xóa khách, xuất dữ liệu...)
- User muốn xem thành viên nào đang có vai trò gì
- **QUAN TRỌNG: Chỉ OWNER và ADMIN (Manager cấp cao nhất) mới được thực hiện thao tác này**

## Cách dùng
- `action: "list_roles"` — Xem tất cả vai trò và quyền đang cấu hình
- `action: "get_role"` — Xem chi tiết một vai trò, cần `role`
- `action: "update_role"` — Cập nhật quyền cho vai trò, cần `role` + `permissions`
- `action: "assign_role"` — Gán vai trò cho thành viên, cần `user_id` + `role`
- `action: "list_permissions"` — Xem danh sách tất cả permission có thể cấu hình
- Các `role` hợp lệ: `"owner"`, `"manager"`, `"staff"`, `"viewer"`
- Role `owner` không thể chỉnh sửa quyền

## Ví dụ
User: "Xem phân quyền hiện tại của từng vai trò"
→ `{"action": "list_roles"}`

User: "Xem quyền của nhân viên (Staff)"
→ `{"action": "get_role", "role": "staff"}`

User: "Cho Staff xem được báo cáo doanh thu"
→ `{"action": "update_role", "role": "staff", "permissions": {"view_revenue_report": true}}`

User: "Thu hồi quyền xuất dữ liệu của Viewer"
→ `{"action": "update_role", "role": "viewer", "permissions": {"export_data": false}}`

User: "Đổi vai trò của nhân viên user_123 thành Manager"
→ `{"action": "assign_role", "user_id": "user_123", "role": "manager"}`

## Output format
```json
{
  "ok": true,
  "action": "list_roles",
  "data": {
    "roles": [
      {
        "role": "owner",
        "label": "Chủ sở hữu",
        "editable": false,
        "permissions": {
          "view_all": true,
          "manage_settings": true,
          "manage_roles": true,
          "delete_customer": true,
          "export_data": true,
          "view_revenue_report": true,
          "manage_billing": true
        }
      },
      {
        "role": "manager",
        "label": "Quản lý",
        "editable": true,
        "permissions": {
          "view_all": true,
          "manage_settings": true,
          "manage_roles": false,
          "delete_customer": true,
          "export_data": true,
          "view_revenue_report": true,
          "manage_billing": false
        }
      },
      {
        "role": "staff",
        "label": "Nhân viên",
        "editable": true,
        "permissions": {
          "view_all": false,
          "manage_settings": false,
          "manage_roles": false,
          "delete_customer": false,
          "export_data": false,
          "view_revenue_report": false,
          "manage_billing": false
        }
      },
      {
        "role": "viewer",
        "label": "Chỉ xem",
        "editable": true,
        "permissions": {
          "view_all": true,
          "manage_settings": false,
          "manage_roles": false,
          "delete_customer": false,
          "export_data": false,
          "view_revenue_report": false,
          "manage_billing": false
        }
      }
    ]
  }
}
```

Khi update thành công:
```json
{
  "ok": true,
  "action": "update_role",
  "role": "staff",
  "updated_permissions": {"view_revenue_report": true},
  "message": "Đã cập nhật quyền cho vai trò Nhân viên"
}
```

## Lỗi thường gặp
- `PERMISSION_DENIED`: **Chỉ OWNER hoặc ADMIN mới được xem/sửa phân quyền** → thông báo rõ ràng, không thực hiện
- `CANNOT_EDIT_OWNER`: Quyền của Owner không thể chỉnh sửa
- `INVALID_ROLE`: Role không hợp lệ (phải là owner/manager/staff/viewer)
- `INVALID_PERMISSION_KEY`: Tên permission không tồn tại → gọi `list_permissions` để xem danh sách hợp lệ
- `USER_NOT_FOUND`: `user_id` không tồn tại trong workspace
- `CANNOT_DEMOTE_LAST_OWNER`: Không thể hạ vai trò Owner cuối cùng trong workspace
