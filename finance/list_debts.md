---
name: list_debts
description: Danh sách công nợ của khách hàng hoặc nhà cung cấp. Dùng khi user hỏi "kh nào còn nợ", "công nợ NCC", "khách X nợ bao nhiêu".
triggers:
  - "công nợ"
  - "nợ khách"
  - "nợ NCC"
  - "list debts"
  - "khách nợ tiền"
  - "nợ chưa thu"
  - "nợ nhà cung cấp"
endpoint: POST /internal/skills/list_debts
---

# Skill: list_debts

## Khi nào dùng
- User muốn xem tổng quan công nợ của tất cả KH hoặc NCC
- User hỏi 1 KH/NCC cụ thể còn nợ bao nhiêu
- Lọc nợ quá hạn để nhắc nhở thanh toán
- Bước đầu trước khi thu nợ bằng `collect_debt`

## Cách dùng
1. Không filter → trả tất cả công nợ chưa thu
2. Nếu user hỏi 1 người cụ thể → lấy `person_id` rồi truyền vào
3. `overdue_only: true` khi user nói "nợ quá hạn", "nợ hết hạn chưa trả"
4. `debtor_type: "SUPPLIER"` khi hỏi về nợ nhà cung cấp

## Ví dụ

User: "Danh sách khách còn nợ mình"
→ `{"debtor_type": "CUSTOMER"}`

User: "Kh Mai nợ bao nhiêu?"
→ Tìm person_id Mai → `{"person_id": "uuid-mai", "debtor_type": "CUSTOMER"}`

User: "Nợ nào quá hạn chưa thu?"
→ `{"overdue_only": true}`

User: "Công nợ nhà cung cấp tổng là bao nhiêu?"
→ `{"debtor_type": "SUPPLIER"}`

User: "Khách nợ từ 500k trở lên"
→ `{"debtor_type": "CUSTOMER", "min_amount": 500000}`

## Output format
```json
{
  "ok": true,
  "data": {
    "total_records": 8,
    "total_debt_amount": 12500000,
    "debts": [
      {
        "id": "debt-uuid",
        "debtor_type": "CUSTOMER",
        "person": { "id": "uuid-mai", "name": "Nguyễn Thị Mai", "phone": "0901xxx67" },
        "original_amount": 3000000,
        "paid_amount": 1000000,
        "remaining_amount": 2000000,
        "due_date": "2026-04-30",
        "is_overdue": false,
        "created_at": "2026-04-01T10:00:00Z",
        "note": "Nợ tiền liệu trình Laser CO2"
      }
    ]
  }
}
```

## Lỗi thường gặp
- `PERSON_NOT_FOUND`: person_id không hợp lệ → tìm lại bằng `find_customer`
- Nếu `remaining_amount = 0`: đã thanh toán đủ, hệ thống tự đóng công nợ
- Để thu nợ → lấy `debt.id` và gọi `collect_debt`
