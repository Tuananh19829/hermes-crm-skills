---
name: manage_brands
description: Tìm kiếm, tạo mới hoặc xóa thương hiệu sản phẩm. Dùng khi user hỏi danh sách thương hiệu, muốn thêm brand mới, hoặc kiểm tra brand nào đang có trong hệ thống.
triggers:
  - "thương hiệu"
  - "brand sản phẩm"
  - "tìm brand"
  - "danh sách thương hiệu"
  - "thêm thương hiệu"
  - "tạo brand"
  - "xóa thương hiệu"
  - "brand nào có"
endpoint: POST /internal/skills/manage_brands
---

# Skill: manage_brands

## Khi nào dùng
- User muốn xem có những thương hiệu nào đang được quản lý trong hệ thống
- User muốn thêm thương hiệu mới trước khi tạo sản phẩm thuộc brand đó
- User muốn xóa (ẩn) thương hiệu không còn sử dụng
- Thường dùng TRƯỚC `create_product` khi sản phẩm cần gắn `brand_id`
- KHÔNG dùng nếu user hỏi về sản phẩm cụ thể → dùng `search_products`

## Cách dùng
1. action=`search`: tìm brand theo từ khoá tên — trả danh sách brand khớp
2. action=`create`: cần `name` thương hiệu, tuỳ chọn `country_of_origin` và `website`
3. action=`delete`: cần `brand_id` — thao tác này ẩn brand, không xóa vĩnh viễn
4. Luôn kiểm tra brand đã tồn tại (search) trước khi tạo mới để tránh trùng lặp

## Ví dụ

User: "Có brand nào đang dùng không?"
→ `{"action": "search", "query": ""}`

User: "Tìm thương hiệu L'Oreal"
→ `{"action": "search", "query": "L'Oreal"}`

User: "Thêm thương hiệu Obagi, xuất xứ Mỹ"
→ `{"action": "create", "brand_data": {"name": "Obagi", "country_of_origin": "Mỹ"}}`

User: "Xóa thương hiệu id uuid-brand-123"
→ `{"action": "delete", "brand_id": "uuid-brand-123"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "action": "search",
    "total": 3,
    "brands": [
      {
        "id": "uuid",
        "name": "Obagi",
        "country_of_origin": "Mỹ",
        "website": null,
        "product_count": 12,
        "is_active": true
      }
    ]
  }
}
```

action=create trả về object brand vừa tạo; action=delete trả về `{"deleted": true, "brand_id": "..."}`.

## Lỗi thường gặp
- `BRAND_NAME_EXISTS`: Tên thương hiệu đã tồn tại — dùng `search` để lấy brand_id hiện có
- `BRAND_NOT_FOUND`: brand_id không hợp lệ — gọi search trước
- `BRAND_HAS_PRODUCTS`: Không thể xóa brand đang có sản phẩm hoạt động — cần chuyển sản phẩm sang brand khác hoặc vô hiệu hóa sản phẩm trước
