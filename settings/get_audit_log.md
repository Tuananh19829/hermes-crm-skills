---
name: get_audit_log
description: Nhật ký thao tác hệ thống (ai làm gì, lúc nào, trên dữ liệu nào)
triggers:
  - "nhật ký"
  - "audit log"
  - "lịch sử thao tác"
  - "ai đã làm"
  - "log hệ thống"
  - "activity log"
endpoint: POST /internal/skills/get_audit_log
---

# Skill: get_audit_log

## Khi nào dùng
- Quản lý muốn điều tra ai đã xóa/sửa dữ liệu
- Kiểm tra lịch sử thao tác trên 1 khách hàng hoặc đơn hàng cụ thể
- Giám sát hoạt động của NV trong khoảng thời gian
- CHỈ ADMIN hoặc MANAGER mới dùng được skill này

## Loại đối tượng (resource_type)
| Value | Mô tả |
|-------|-------|
| `customer` | Thao tác trên hồ sơ khách hàng |
| `order` | Thao tác trên đơn hàng |
| `invoice` | Thao tác trên hóa đơn |
| `settings` | Thay đổi cài đặt workspace |
| `member` | Thêm/xóa/đổi quyền thành viên |

## Cách dùng
1. Nếu điều tra cụ thể 1 đối tượng → dùng `resource_type` + `resource_id`
2. Nếu giám sát 1 NV → dùng `actor_id`
3. Luôn thêm `from_date`/`to_date` để giới hạn phạm vi tìm kiếm
4. Mặc định lấy 30 bản ghi gần nhất

## Ví dụ
User: "Ai đã xóa khách Lan hôm nay?"
→ `{"resource_type": "customer", "resource_id": "uuid_lan", "from_date": "2026-04-22"}`

User: "NV Hoa đã làm gì tuần này?"
→ `{"actor_id": "uuid_hoa", "from_date": "2026-04-15", "to_date": "2026-04-22"}`

User: "Ai đã thay đổi cài đặt hệ thống tháng này?"
→ `{"resource_type": "settings", "from_date": "2026-04-01"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 15,
    "logs": [
      {
        "id": "uuid_log",
        "actor": {"id": "uuid_nv", "name": "Nguyễn Thị Hoa"},
        "action": "DELETE",
        "resource_type": "customer",
        "resource_id": "uuid_kh",
        "resource_label": "Trần Thị Lan",
        "ip_address": "203.xxx.xxx.1",
        "timestamp": "2026-04-22T09:30:00Z",
        "detail": {"reason": "Duplicate record"}
      }
    ]
  }
}
```

## Lỗi thường gặp
- `PERMISSION_DENIED`: chỉ ADMIN/MANAGER xem được audit log → thông báo user liên hệ quản lý
- `RESOURCE_NOT_FOUND`: resource_id không tồn tại (đã bị xóa) → log vẫn được trả về nếu có
- Kết quả quá nhiều: thêm filter `actor_id` hoặc `resource_type` để thu hẹp
- Log chỉ lưu 90 ngày gần nhất, các thao tác cũ hơn không còn
