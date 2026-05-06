---
name: create_advance_salary
description: Tạo phiếu tạm ứng lương cho nhân viên, ghi nhận số tiền tạm ứng và lý do để trừ vào bảng lương cuối tháng
triggers:
  - "tạm ứng lương"
  - "ứng lương"
  - "tạo phiếu tạm ứng"
  - "nhân viên xin tạm ứng"
  - "ứng trước lương"
  - "advance salary"
  - "tạm ứng"
endpoint: POST /internal/skills/create_advance_salary
---

# Skill: create_advance_salary

## Khi nào dùng

Dùng khi người dùng muốn:
- Tạo phiếu tạm ứng lương cho một nhân viên cụ thể
- Ghi nhận yêu cầu tạm ứng để trừ vào lương tháng
- Phê duyệt nhanh tạm ứng lương trong ngày

Sau khi tạo, phiếu tạm ứng sẽ tự động được ghi nhận vào cột `advance_taken` khi tính lương tháng của nhân viên.

## Cách dùng

**Request body:**
```json
{
  "staff_id": "string",
  "amount": 2000000,
  "reason": "string",
  "advance_date": "2026-04-22",
  "deduct_month": "2026-04",
  "approved_by": "string | null",
  "note": "string | null"
}
```

- `amount`: số tiền tạm ứng (VND, số nguyên dương)
- `reason`: lý do tạm ứng (bắt buộc)
- `advance_date`: ngày phát sinh tạm ứng, mặc định hôm nay
- `deduct_month`: tháng lương sẽ trừ, mặc định tháng hiện tại; định dạng `YYYY-MM`
- `approved_by`: `staff_id` của người phê duyệt (tùy chọn, mặc định là `X-User-Id`)

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Tạm ứng 2 triệu cho nhân viên do việc gia đình:**
```json
{
  "staff_id": "staff_abc123",
  "amount": 2000000,
  "reason": "Việc gia đình đột xuất",
  "advance_date": "2026-04-22",
  "deduct_month": "2026-04"
}
```

**Tạm ứng 3 triệu trừ vào lương tháng 5:**
```json
{
  "staff_id": "staff_abc123",
  "amount": 3000000,
  "reason": "Đám cưới",
  "advance_date": "2026-04-22",
  "deduct_month": "2026-05",
  "note": "Đã nộp đơn xin phép"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "advance_id": "adv_20260422_abc123",
    "staff_id": "staff_abc123",
    "full_name": "Nguyễn Thị Hoa",
    "amount": 2000000,
    "reason": "Việc gia đình đột xuất",
    "advance_date": "2026-04-22",
    "deduct_month": "2026-04",
    "approved_by": "Quản lý Spa",
    "status": "approved",
    "created_at": "2026-04-22T10:30:00Z",
    "note": "",
    "current_advance_total_this_month": 2000000,
    "remaining_salary_estimate": 7840000
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `STAFF_NOT_FOUND` | `staff_id` không tồn tại | Dùng `list_staff` để lấy ID đúng |
| `AMOUNT_EXCEEDS_SALARY` | Số tiền tạm ứng vượt lương cơ bản | Giảm số tiền hoặc xin phê duyệt đặc biệt |
| `AMOUNT_INVALID` | `amount` ≤ 0 hoặc không phải số nguyên | Nhập số tiền dương, đơn vị VND |
| `REASON_REQUIRED` | Thiếu lý do tạm ứng | Yêu cầu người dùng cung cấp lý do |
| `INVALID_MONTH_FORMAT` | `deduct_month` sai định dạng | Dùng `YYYY-MM` |
| `PAYROLL_ALREADY_PAID` | Bảng lương tháng `deduct_month` đã trả | Chọn tháng khác để khấu trừ |
