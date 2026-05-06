---
name: list_input_invoices
description: Danh sách hóa đơn đầu vào từ nhà cung cấp (lọc theo NCC, ngày, trạng thái thanh toán). Dùng khi user muốn xem hóa đơn mua hàng, kiểm tra hóa đơn chưa thanh toán, đối soát với NCC.
triggers:
  - "hóa đơn đầu vào"
  - "hóa đơn ncc"
  - "invoice nhà cung cấp"
  - "input invoice"
  - "hóa đơn mua hàng"
  - "hóa đơn chưa thanh toán"
  - "đối soát ncc"
  - "hóa đơn nhập kho"
  - "công nợ ncc"
  - "hóa đơn tháng này"
endpoint: POST /internal/skills/list_input_invoices
---

# Skill: list_input_invoices

## Khi nào dùng
- User muốn xem danh sách hóa đơn đầu vào từ nhà cung cấp theo tháng/kỳ
- User kiểm tra hóa đơn nào chưa thanh toán, đã thanh toán một phần hoặc đã thanh toán đủ
- User muốn đối soát hóa đơn với một NCC cụ thể
- User hỏi "NCC X còn bao nhiêu hóa đơn chưa thanh toán", "hóa đơn tháng 4"
- Thường dùng kết hợp với `list_debts` (lọc debtor_type=SUPPLIER) để xem tổng công nợ NCC
- KHÔNG dùng để xem hóa đơn bán hàng cho KH — đó là module orders khác

## Cách dùng
1. `supplier_id`: lọc theo NCC cụ thể (UUID) — bỏ trống = lấy tất cả NCC
2. `status`: lọc theo trạng thái thanh toán: `UNPAID`, `PARTIAL`, `PAID`, `ALL`
3. `from_date` / `to_date` hoặc `period`: kỳ thời gian lấy hóa đơn
4. `include_items`: có trả về danh sách sản phẩm trong hóa đơn hay không (mặc định false)
5. Kết quả sắp xếp theo ngày hóa đơn mới nhất trước

## Ví dụ

User: "Xem hóa đơn đầu vào tháng 4"
→ `{"period": "month", "from_date": "2026-04-01", "to_date": "2026-04-30", "status": "ALL"}`

User: "Hóa đơn chưa thanh toán của NCC Hana (id: ncc-hana)"
→ `{"supplier_id": "ncc-hana", "status": "UNPAID"}`

User: "Liệt kê hóa đơn thanh toán một phần từ đầu năm đến nay"
→ `{"from_date": "2026-01-01", "to_date": "2026-04-22", "status": "PARTIAL"}`

User: "Xem chi tiết hóa đơn NCC Hana tháng 3, bao gồm cả sản phẩm"
→ `{"supplier_id": "ncc-hana", "from_date": "2026-03-01", "to_date": "2026-03-31", "status": "ALL", "include_items": true}`

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 8,
    "total_amount": 45000000,
    "total_paid": 30000000,
    "total_unpaid": 15000000,
    "invoices": [
      {
        "id": "uuid",
        "invoice_no": "HD-NCC-2026-042",
        "supplier": { "id": "ncc-hana", "name": "Công ty Hana Cosmetics" },
        "invoice_date": "2026-04-10",
        "due_date": "2026-05-10",
        "total_amount": 12000000,
        "paid_amount": 6000000,
        "remaining_amount": 6000000,
        "status": "PARTIAL",
        "items": null
      }
    ]
  }
}
```

## Lỗi thường gặp
- `SUPPLIER_NOT_FOUND`: supplier_id không hợp lệ — gọi `manage_suppliers` để tìm đúng NCC
- Kết quả rỗng: thử mở rộng kỳ thời gian hoặc bỏ filter status
- Nếu muốn thanh toán hóa đơn → dùng `create_cashbook_entry` với type=EXPENSE và ghi chú số hóa đơn
- `from_date` và `to_date` bắt buộc dùng chung, không dùng một mình
