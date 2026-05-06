---
name: manage_units
description: Tìm kiếm hoặc tạo đơn vị tính sản phẩm (hộp, chai, tuýp, gói, viên, lọ...). Dùng trước khi tạo sản phẩm mới để có unit_id hợp lệ.
triggers:
  - "đơn vị tính"
  - "tạo đơn vị"
  - "tìm đơn vị"
  - "unit tính"
  - "danh sách đơn vị"
  - "thêm đơn vị"
  - "hộp chai tuýp gói"
  - "unit sản phẩm"
endpoint: POST /internal/skills/manage_units
---

# Skill: manage_units

## Khi nào dùng
- Trước khi gọi `create_product` — cần `unit_id` hợp lệ để gắn vào sản phẩm
- User hỏi có những đơn vị tính nào đang dùng trong hệ thống
- User muốn thêm đơn vị tính mới chưa có trong danh sách (ví dụ: "hũ", "túi", "cuộn")
- KHÔNG dùng cho đơn vị liệu trình hay dịch vụ — đây chỉ là đơn vị kho/sản phẩm

## Cách dùng
1. action=`search`: tìm theo tên đơn vị (để trống query = lấy toàn bộ danh sách)
2. action=`create`: cần `name` đơn vị, tuỳ chọn `abbreviation` (ký hiệu viết tắt)
3. Tên đơn vị nên ngắn gọn: "Chai", "Hộp", "Tuýp", "Gói", "Viên", "Lọ", "Cái", "Cuộn"
4. Kiểm tra search trước khi create để tránh trùng lặp

## Ví dụ

User: "Có những đơn vị tính nào?"
→ `{"action": "search", "query": ""}`

User: "Tìm đơn vị 'chai'"
→ `{"action": "search", "query": "chai"}`

User: "Tạo đơn vị tính 'Tuýp', ký hiệu 'T'"
→ `{"action": "create", "unit_data": {"name": "Tuýp", "abbreviation": "T"}}`

User: "Thêm đơn vị 'Gói'"
→ `{"action": "create", "unit_data": {"name": "Gói"}}`

## Output format
```json
{
  "ok": true,
  "data": {
    "action": "search",
    "total": 6,
    "units": [
      {
        "id": "uuid",
        "name": "Chai",
        "abbreviation": "C",
        "product_count": 34
      },
      {
        "id": "uuid",
        "name": "Hộp",
        "abbreviation": "H",
        "product_count": 18
      }
    ]
  }
}
```

action=create trả về object đơn vị vừa tạo kèm `id`.

## Lỗi thường gặp
- `UNIT_NAME_EXISTS`: Đơn vị tính tên này đã tồn tại — lấy id từ kết quả search để dùng
- Tên đơn vị viết hoa chữ đầu cho nhất quán (Chai, Hộp, Tuýp...)
- Không cần `abbreviation` nếu user không đề cập — để trống là ổn
