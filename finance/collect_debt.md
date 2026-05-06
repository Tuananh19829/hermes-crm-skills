---
name: collect_debt
description: Thu nợ từ khách hàng - ghi nhận thanh toán một phần hoặc toàn bộ khoản nợ tồn đọng. Dùng khi user nói "thu nợ kh X", "kh X trả 2tr", "ghi nhận kh thanh toán".
triggers:
  - "thu nợ"
  - "kh trả nợ"
  - "collect debt"
  - "thanh toán nợ"
  - "ghi thu nợ"
  - "kh thanh toán công nợ"
endpoint: POST /internal/skills/collect_debt
---

# Skill: collect_debt

## Khi nào dùng
- Khách hàng thanh toán 1 phần hoặc toàn bộ khoản nợ
- User muốn ghi nhận việc thu tiền nợ vào sổ quỹ
- Cần `debt_id` trước — gọi `list_debts` để lấy nếu chưa có
- LUÔN xác nhận số tiền thu với user trước khi thực hiện (không hoàn tác được)

## Cách dùng
1. Lấy `debt_id` từ `list_debts` hoặc context
2. Hỏi user số tiền thu và phương thức thanh toán
3. Nếu `amount` = toàn bộ `remaining_amount` → nợ được đóng hoàn toàn
4. Nếu `amount` < `remaining_amount` → thanh toán một phần, nợ giảm tương ứng
5. KHÔNG cho phép `amount` > `remaining_amount`

## Ví dụ

User: "Kh Mai vừa trả 1 triệu tiền nợ"
→ Lấy debt_id của Mai → `{"debt_id": "debt-uuid", "amount": 1000000, "payment_method": "CASH"}`

User: "Kh A trả hết nợ 3 triệu chuyển khoản"
→ `{"debt_id": "debt-uuid", "amount": 3000000, "payment_method": "TRANSFER"}`

User: "Thu nợ kh B 500k qua Momo"
→ `{"debt_id": "debt-uuid", "amount": 500000, "payment_method": "MOMO"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "payment_id": "pay-uuid",
    "debt_id": "debt-uuid",
    "person": { "id": "uuid-mai", "name": "Nguyễn Thị Mai" },
    "amount_collected": 1000000,
    "payment_method": "CASH",
    "date": "2026-04-22",
    "debt_status_after": {
      "original_amount": 3000000,
      "paid_amount": 2000000,
      "remaining_amount": 1000000,
      "is_closed": false
    },
    "cashbook_entry_id": "entry-uuid"
  }
}
```

## Lỗi thường gặp
- `DEBT_NOT_FOUND`: debt_id sai → gọi `list_debts` để lấy lại
- `AMOUNT_EXCEEDS_DEBT`: số tiền thu vượt số nợ còn lại → kiểm tra lại `remaining_amount`
- `DEBT_ALREADY_CLOSED`: nợ này đã được thanh toán đủ trước đó
- Mỗi lần thu tạo 1 phiếu thu trong sổ quỹ (trường `cashbook_entry_id`)
