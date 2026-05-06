---
name: create_cashbook_entry
description: Tạo phiếu thu hoặc phiếu chi thủ công vào sổ quỹ. Dùng khi user nói "tạo phiếu chi mua vật tư 500k", "ghi thu tiền mặt", "thêm phiếu thu dịch vụ".
triggers:
  - "tạo phiếu thu"
  - "tạo phiếu chi"
  - "thêm phiếu"
  - "ghi thu"
  - "ghi chi"
  - "create cashbook"
  - "phiếu chi tiền"
endpoint: POST /internal/skills/create_cashbook_entry
---

# Skill: create_cashbook_entry

## Khi nào dùng
- User muốn ghi nhận 1 khoản thu/chi thủ công không qua đơn hàng tự động
- Các trường hợp: chi mua vật tư, chi lương, thu tiền mặt ngoài hệ thống, chi điện nước...
- LUÔN xác nhận thông tin với user trước khi tạo (số tiền, loại phiếu, mô tả)
- KHÔNG dùng cho các khoản thu từ đơn hàng — hệ thống tự ghi khi đơn hoàn thành

## Cách dùng
1. Trích xuất từ câu user: loại phiếu (thu/chi), số tiền, mô tả
2. Xác định `category` phù hợp:
   - `DICH_VU` — thu từ dịch vụ thủ công
   - `VAT_TU` — chi mua nguyên vật liệu
   - `LUONG` — chi trả lương nhân viên
   - `THUE` — chi thuế, phí
   - `KHAC` — các khoản khác
3. Hỏi phương thức thanh toán nếu user không nói rõ (mặc định CASH)
4. Xác nhận với user trước khi submit

## Ví dụ

User: "Tạo phiếu chi mua kem peel 1 triệu tiền mặt"
→ `{"type": "EXPENSE", "amount": 1000000, "description": "Mua kem peel AHA", "category": "VAT_TU", "payment_method": "CASH"}`

User: "Ghi thu 500k dịch vụ trả tiền mặt ngoài"
→ `{"type": "INCOME", "amount": 500000, "description": "Thu tiền mặt dịch vụ", "category": "DICH_VU", "payment_method": "CASH"}`

User: "Chi lương nhân viên tháng 4 tổng 15 triệu chuyển khoản"
→ `{"type": "EXPENSE", "amount": 15000000, "description": "Lương nhân viên tháng 4/2026", "category": "LUONG", "payment_method": "TRANSFER"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "id": "entry-uuid",
    "type": "EXPENSE",
    "amount": 1000000,
    "description": "Mua kem peel AHA",
    "category": "VAT_TU",
    "payment_method": "CASH",
    "date": "2026-04-22",
    "created_by": { "id": "staff-uuid", "name": "Nguyễn Admin" },
    "created_at": "2026-04-22T09:30:00Z"
  }
}
```

## Lỗi thường gặp
- `AMOUNT_INVALID`: số tiền phải > 0
- `MISSING_DESCRIPTION`: mô tả bắt buộc — hỏi user mô tả ngắn về khoản thu/chi
- Không nên tạo phiếu trùng lặp: kiểm tra với user nếu có phiếu tương tự cùng ngày và số tiền
