---
name: manage_suppliers
description: Tìm kiếm, xem chi tiết hoặc tạo nhà cung cấp mới. Dùng khi user hỏi về NCC, muốn xem danh sách nhà cung cấp, thêm NCC mới hoặc tra cứu thông tin NCC.
triggers:
  - "nhà cung cấp"
  - "ncc"
  - "tìm ncc"
  - "danh sách ncc"
  - "thêm ncc"
  - "tạo nhà cung cấp"
  - "supplier"
  - "thông tin ncc"
endpoint: POST /internal/skills/manage_suppliers
---

# Skill: manage_suppliers

## Khi nào dùng
- User muốn tìm nhà cung cấp để lấy `supplier_id` dùng trong `create_import_stock`
- User muốn xem thông tin chi tiết, lịch sử nhập hàng của một NCC
- User muốn thêm nhà cung cấp mới vào hệ thống
- User hỏi danh sách các NCC đang cung cấp cho cửa hàng

## Cách dùng

### action = search
1. Trích keyword từ câu hỏi user (tên NCC, SĐT)
2. Gọi endpoint → trả về danh sách NCC khớp

### action = get
1. Cần `supplier_id` (từ search hoặc user cung cấp)
2. Trả về chi tiết NCC kèm lịch sử nhập hàng gần đây

### action = create
1. Thu thập thông tin NCC: tên (`name` bắt buộc), SĐT, email, địa chỉ, MST, người liên hệ
2. Hỏi `payment_terms` nếu user đề cập (NET30 = thanh toán trong 30 ngày, COD = trả khi nhận hàng)
3. Gọi endpoint → hệ thống tạo NCC và trả về ID

## Ví dụ

User: "Tìm NCC tên Thanh Hà"
→ `{"action": "search", "query": "Thanh Hà"}`

User: "Danh sách tất cả nhà cung cấp"
→ `{"action": "search", "query": "", "limit": 50}`

User: "Xem chi tiết NCC sup-001"
→ `{"action": "get", "supplier_id": "sup-001"}`

User: "Thêm NCC mới: Công ty TNHH Mỹ phẩm ABC, SĐT 028-1234567, người liên hệ chị Hương, thanh toán NET30"
→ ```json
{
  "action": "create",
  "supplier_data": {
    "name": "Công ty TNHH Mỹ phẩm ABC",
    "phone": "028-1234567",
    "contact_person": "Hương",
    "payment_terms": "NET30"
  }
}
```

User: "Tạo NCC: Lương Linh Cosmetics, email luonglinh@gmail.com, địa chỉ 45 Nguyễn Thị Minh Khai Q3, MST 0312345678"
→ ```json
{
  "action": "create",
  "supplier_data": {
    "name": "Lương Linh Cosmetics",
    "email": "luonglinh@gmail.com",
    "address": "45 Nguyễn Thị Minh Khai, Q3, HCM",
    "tax_code": "0312345678"
  }
}
```

## Output format

### action = search
```json
{
  "ok": true,
  "data": {
    "total": 3,
    "suppliers": [
      {
        "id": "sup-001",
        "name": "Công ty Thanh Hà",
        "phone": "0901234567",
        "email": "thanhhaco@gmail.com",
        "contact_person": "Chị Thanh",
        "payment_terms": "NET30",
        "total_import_value": 85000000,
        "last_import_at": "2026-04-10T00:00:00Z"
      }
    ]
  }
}
```

### action = get
```json
{
  "ok": true,
  "data": {
    "id": "sup-001",
    "name": "Công ty Thanh Hà",
    "phone": "0901234567",
    "email": "thanhhaco@gmail.com",
    "address": "123 Lê Văn Sỹ, Q3, HCM",
    "tax_code": "0301234567",
    "contact_person": "Chị Thanh",
    "payment_terms": "NET30",
    "note": null,
    "total_import_value": 85000000,
    "total_import_orders": 12,
    "last_import_at": "2026-04-10T00:00:00Z",
    "recent_imports": [
      {
        "id": "imp-uuid",
        "code": "IMP-2026-0080",
        "date": "2026-04-10",
        "total_value": 9000000,
        "items_count": 2
      }
    ]
  }
}
```

### action = create
```json
{
  "ok": true,
  "data": {
    "id": "sup-uuid-moi",
    "name": "Công ty TNHH Mỹ phẩm ABC",
    "phone": "028-1234567",
    "contact_person": "Hương",
    "payment_terms": "NET30",
    "created_at": "2026-04-22T10:00:00Z",
    "message": "Đã tạo nhà cung cấp Công ty TNHH Mỹ phẩm ABC thành công"
  }
}
```

## Lỗi thường gặp
- `DUPLICATE_SUPPLIER`: NCC với tên/MST tương tự đã tồn tại → hiển thị NCC đã có và hỏi user có muốn tạo mới không
- `INVALID_TAX_CODE`: Mã số thuế không đúng định dạng (10 hoặc 13 số)
- `NOT_FOUND` (với action=get): supplier_id không tồn tại → dùng action=search để tìm lại
