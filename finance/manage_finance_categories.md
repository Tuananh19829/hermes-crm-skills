---
name: manage_finance_categories
description: Xem hoặc tạo danh mục thu/chi tài chính (doanh thu dịch vụ, chi phí nhân viên, chi phí vận hành...). Dùng khi cần biết có những loại thu/chi nào hoặc muốn thêm danh mục mới để phân loại sổ quỹ.
triggers:
  - "danh mục thu chi"
  - "loại thu chi"
  - "danh mục tài chính"
  - "finance category"
  - "nhóm thu chi"
  - "thêm danh mục thu"
  - "thêm danh mục chi"
  - "phân loại sổ quỹ"
  - "tạo loại thu"
  - "tạo loại chi"
  - "danh mục doanh thu"
endpoint: POST /internal/skills/manage_finance_categories
---

# Skill: manage_finance_categories

## Khi nào dùng
- User hỏi có những loại thu/chi nào đang dùng trong hệ thống
- User muốn tạo danh mục mới để phân loại phiếu thu/chi trong sổ quỹ
- Trước khi gọi `create_cashbook_entry` khi user đề cập loại phiếu chưa có trong hệ thống
- User muốn chỉnh sửa tên hoặc bật/tắt một danh mục thu/chi
- KHÔNG dùng để tạo phiếu thu/chi thực tế → dùng `create_cashbook_entry`

## Cách dùng
1. action=`list`: lấy danh sách danh mục, lọc theo `flow_type` (INCOME/EXPENSE/ALL)
2. action=`create`: cần `name`, `flow_type` (`INCOME` hoặc `EXPENSE`); tuỳ chọn `parent_id` để tạo danh mục con
3. action=`update`: cần `category_id`, truyền các field cần sửa (name, is_active)
4. Danh mục INCOME mặc định: DICH_VU (doanh thu dịch vụ), BAN_HANG (bán sản phẩm), KHAC_THU
5. Danh mục EXPENSE mặc định: LUONG, VAT_TU, MARKETING, THUE, VAN_HANH, KHAC_CHI

## Ví dụ

User: "Có những loại thu nào?"
→ `{"action": "list", "flow_type": "INCOME"}`

User: "Xem tất cả danh mục thu chi"
→ `{"action": "list", "flow_type": "ALL"}`

User: "Thêm danh mục chi 'Chi phí đào tạo nhân viên'"
→ `{"action": "create", "category_data": {"name": "Chi phí đào tạo nhân viên", "flow_type": "EXPENSE"}}`

User: "Tạo danh mục thu 'Doanh thu bán thẻ VIP'"
→ `{"action": "create", "category_data": {"name": "Doanh thu bán thẻ VIP", "flow_type": "INCOME"}}`

User: "Tạo danh mục chi phí điện nước, thuộc nhóm Vận hành (id: cat-van-hanh)"
→ `{"action": "create", "category_data": {"name": "Chi phí điện nước", "flow_type": "EXPENSE", "parent_id": "cat-van-hanh"}}`

User: "Đổi tên danh mục id cat-abc thành 'Chi phí NCC vật tư'"
→ `{"action": "update", "category_id": "cat-abc", "category_data": {"name": "Chi phí NCC vật tư"}}`

## Output format
```json
{
  "ok": true,
  "data": {
    "action": "list",
    "flow_type": "ALL",
    "total": 12,
    "categories": [
      {
        "id": "uuid",
        "name": "Doanh thu dịch vụ",
        "code": "DICH_VU",
        "flow_type": "INCOME",
        "parent_id": null,
        "is_system_default": true,
        "is_active": true,
        "children": []
      },
      {
        "id": "uuid",
        "name": "Chi phí vận hành",
        "code": "VAN_HANH",
        "flow_type": "EXPENSE",
        "parent_id": null,
        "is_system_default": true,
        "is_active": true,
        "children": [
          { "id": "uuid-child", "name": "Chi phí điện nước", "flow_type": "EXPENSE", "is_active": true }
        ]
      }
    ]
  }
}
```

## Lỗi thường gặp
- `CATEGORY_NAME_EXISTS`: Tên danh mục đã tồn tại trong cùng flow_type — đặt tên khác hoặc dùng category có sẵn
- `CANNOT_UPDATE_SYSTEM_DEFAULT`: Danh mục hệ thống mặc định (DICH_VU, LUONG...) không thể sửa tên/xóa
- `PARENT_NOT_FOUND`: parent_id không tồn tại — gọi list để lấy đúng id danh mục cha
- `FLOW_TYPE_MISMATCH`: Danh mục con phải cùng flow_type với danh mục cha
- `CATEGORY_NOT_FOUND` (khi update): category_id không hợp lệ — gọi list trước
