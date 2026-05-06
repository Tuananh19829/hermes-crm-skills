---
name: create_service
description: Tạo dịch vụ mới hoặc cập nhật dịch vụ hiện có (tên, danh mục, giá, thời gian thực hiện, vật tư cần dùng, cấu hình hoa hồng nhân viên). Dùng khi user muốn thêm dịch vụ mới hoặc sửa thông tin dịch vụ.
triggers:
  - "tạo dịch vụ"
  - "thêm dịch vụ"
  - "cập nhật dịch vụ"
  - "sửa dịch vụ"
  - "create service"
  - "thêm dv mới"
  - "dịch vụ mới"
  - "cập nhật giá dv"
  - "vật tư dịch vụ"
  - "hoa hồng dịch vụ"
endpoint: POST /internal/skills/create_service
---

# Skill: create_service

## Khi nào dùng
- User muốn tạo dịch vụ mới chưa có trong hệ thống (chăm sóc da, massage, triệt lông...)
- User muốn cập nhật giá, thời gian, danh mục, vật tư hoặc hoa hồng của dịch vụ hiện có
- User muốn gắn danh sách vật tư tiêu hao cần dùng khi thực hiện dịch vụ
- User muốn cấu hình % hoa hồng nhân viên cho dịch vụ
- KHÔNG dùng nếu chỉ muốn tìm dịch vụ → dùng `search_services`
- KHÔNG dùng nếu muốn tạo gói liệu trình cho khách → dùng `create_treatment`

## Cách dùng
1. action=`create`: bắt buộc `name`, `price`; nên có `category_name`, `duration_minutes`
2. action=`update`: bắt buộc `service_id` (lấy từ `search_services`); chỉ truyền các field cần thay đổi
3. `materials`: mảng vật tư tiêu hao — mỗi phần tử gồm product_id + quantity_per_session
4. `commission`: có thể là % cố định hoặc cấu hình theo nhân viên/nhóm nhân viên
5. Nếu user đề cập danh mục chưa có → truyền `category_name`, hệ thống tự tạo

## Ví dụ

User: "Tạo dịch vụ Peel da tế bào chết, nhóm Chăm sóc da, giá 350k, thời gian 60 phút"
→ `{"action": "create", "service_data": {"name": "Peel da tế bào chết", "category_name": "Chăm sóc da", "price": 350000, "duration_minutes": 60}}`

User: "Thêm dịch vụ triệt lông nách, giá 200k, 30 phút, vật tư: gel triệt lông (3ml mỗi buổi)"
→ `{"action": "create", "service_data": {"name": "Triệt lông nách", "price": 200000, "duration_minutes": 30, "materials": [{"product_id": "uuid-gel", "quantity_per_session": 3, "unit": "ml"}]}}`

User: "Cập nhật hoa hồng dịch vụ id sv-abc123 lên 15%"
→ `{"action": "update", "service_id": "sv-abc123", "service_data": {"commission_rate": 0.15}}`

User: "Sửa giá dịch vụ Laser YAG (id sv-xyz) thành 500k, thời gian 45 phút"
→ `{"action": "update", "service_id": "sv-xyz", "service_data": {"price": 500000, "duration_minutes": 45}}`

## Output format
```json
{
  "ok": true,
  "data": {
    "service_id": "uuid",
    "name": "Peel da tế bào chết",
    "category": { "id": "uuid-cat", "name": "Chăm sóc da" },
    "price": 350000,
    "duration_minutes": 60,
    "commission_rate": 0.10,
    "materials": [
      {
        "product_id": "uuid-product",
        "product_name": "Gel peel AHA",
        "quantity_per_session": 5,
        "unit": "ml"
      }
    ],
    "is_active": true,
    "created_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp
- `SERVICE_NAME_EXISTS`: Tên dịch vụ đã có — xác nhận user có muốn cập nhật không, dùng action=update
- `PRODUCT_NOT_FOUND` (trong materials): product_id vật tư không đúng — gọi `search_products` trước
- `SERVICE_NOT_FOUND` (khi update): service_id không hợp lệ — gọi `search_services` để lấy đúng id
- `INVALID_PRICE`: Giá phải > 0
- `COMMISSION_RATE_INVALID`: Tỷ lệ hoa hồng phải từ 0 đến 1 (ví dụ: 15% = 0.15)
