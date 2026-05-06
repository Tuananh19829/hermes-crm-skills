---
name: create_product
description: Tạo sản phẩm mới hoặc cập nhật thông tin sản phẩm hiện có (tên, danh mục, đơn vị, giá bán, giá vốn, barcode, tồn tối thiểu). Dùng khi user muốn thêm sản phẩm vào kho, sửa giá, đổi danh mục.
triggers:
  - "tạo sản phẩm"
  - "thêm sản phẩm"
  - "cập nhật sản phẩm"
  - "sửa sản phẩm"
  - "tạo sp mới"
  - "add sản phẩm"
  - "create product"
  - "nhập sản phẩm mới"
  - "cập nhật giá sp"
endpoint: POST /internal/skills/create_product
---

# Skill: create_product

## Khi nào dùng
- User muốn tạo sản phẩm mới chưa có trong hệ thống (thuốc, kem, vật tư tiêu hao...)
- User muốn cập nhật thông tin sản phẩm đã có: đổi giá, đổi danh mục, thêm barcode, thay đơn vị tính
- User nhập danh sách sản phẩm mới nhận từ NCC cần đăng ký vào hệ thống
- KHÔNG dùng nếu user chỉ muốn tìm/xem sản phẩm → dùng `search_products`
- KHÔNG dùng nếu user muốn nhập hàng vào kho → dùng `create_import_stock`

## Cách dùng
1. Hỏi user đủ thông tin: tên, danh mục, đơn vị tính, giá bán (bắt buộc)
2. Nếu user chưa có `unit_id` → gọi `manage_units` trước để tra hoặc tạo đơn vị
3. Nếu user chưa có `category_id` → hỏi tên danh mục và truyền `category_name` để tạo tự động
4. Với action=update: bắt buộc phải có `product_id` (lấy từ `search_products`)
5. Giá vốn (`cost_price`) nên điền để tính lãi gộp chính xác

## Ví dụ

User: "Thêm sản phẩm kem dưỡng ẩm X, giá bán 250k, đơn vị chai, danh mục Chăm sóc da"
→ `{"action": "create", "product_data": {"name": "Kem dưỡng ẩm X", "sale_price": 250000, "unit_name": "Chai", "category_name": "Chăm sóc da"}}`

User: "Cập nhật giá kem dưỡng Y (id: abc123) lên 300k"
→ `{"action": "update", "product_id": "abc123", "product_data": {"sale_price": 300000}}`

User: "Tạo sản phẩm serum phục hồi, barcode 8938504123, giá vốn 80k, giá bán 150k, tồn tối thiểu 5"
→ `{"action": "create", "product_data": {"name": "Serum phục hồi", "barcode": "8938504123", "cost_price": 80000, "sale_price": 150000, "min_stock": 5}}`

## Output format
```json
{
  "ok": true,
  "data": {
    "product_id": "uuid",
    "name": "Kem dưỡng ẩm X",
    "sku": "SP-00123",
    "category": { "id": "uuid-cat", "name": "Chăm sóc da" },
    "unit": { "id": "uuid-unit", "name": "Chai" },
    "sale_price": 250000,
    "cost_price": null,
    "barcode": null,
    "min_stock": 0,
    "is_active": true,
    "created_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp
- `PRODUCT_NAME_EXISTS`: Tên sản phẩm đã tồn tại — hỏi user có muốn cập nhật sản phẩm hiện có không
- `UNIT_NOT_FOUND`: Đơn vị tính chưa có — gọi `manage_units` với action=create trước
- `INVALID_PRICE`: Giá bán phải > 0
- `PRODUCT_NOT_FOUND` (khi update): product_id không hợp lệ — gọi `search_products` để lấy đúng id
