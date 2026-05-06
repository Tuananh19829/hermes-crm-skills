---
name: create_bonus_penalty
description: Tạo phiếu thưởng hoặc phạt cho nhân viên, tự động cộng/trừ vào bảng lương tháng tương ứng
triggers:
  - "thưởng nhân viên"
  - "phạt nhân viên"
  - "tạo thưởng"
  - "tạo phạt"
  - "khen thưởng"
  - "kỷ luật"
  - "bonus"
  - "penalty"
  - "thưởng doanh số"
  - "phạt đi muộn"
  - "phạt vi phạm"
endpoint: POST /internal/skills/create_bonus_penalty
---

# Skill: create_bonus_penalty

## Khi nào dùng

Dùng khi người dùng muốn:
- Tạo phiếu thưởng cho nhân viên đạt KPI, vượt doanh số, hoàn thành xuất sắc
- Tạo phiếu phạt do vi phạm nội quy, đi muộn nhiều lần, lỗi nghiêm trọng
- Ghi nhận thưởng/phạt vào hệ thống để tính vào lương cuối tháng
- Tạo thưởng tháng 13, thưởng ngày lễ, thưởng doanh số theo đợt

## Cách dùng

**Request body:**
```json
{
  "staff_id": "string",
  "type": "bonus | penalty",
  "amount": 500000,
  "reason": "string",
  "category": "kpi | sales | discipline | attendance | other",
  "apply_month": "2026-04",
  "issued_by": "string | null",
  "note": "string | null"
}
```

- `type`: `"bonus"` = thưởng, `"penalty"` = phạt
- `amount`: số tiền (VND, số nguyên dương) — hệ thống sẽ tự cộng nếu bonus, trừ nếu penalty
- `reason`: lý do bắt buộc, mô tả rõ ràng
- `category`: phân loại mục đích: `kpi`, `sales`, `discipline`, `attendance`, `other`
- `apply_month`: tháng lương áp dụng, mặc định tháng hiện tại; định dạng `YYYY-MM`
- `issued_by`: `staff_id` người ra quyết định (mặc định `X-User-Id`)

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Thưởng KPI tháng 4:**
```json
{
  "staff_id": "staff_abc123",
  "type": "bonus",
  "amount": 500000,
  "reason": "Đạt 105% KPI doanh thu tháng 4",
  "category": "kpi",
  "apply_month": "2026-04"
}
```

**Phạt đi muộn:**
```json
{
  "staff_id": "staff_abc123",
  "type": "penalty",
  "amount": 100000,
  "reason": "Đi muộn 3 lần trong tháng (22/4, 15/4, 8/4)",
  "category": "attendance",
  "apply_month": "2026-04"
}
```

**Thưởng vượt doanh số bán thẻ:**
```json
{
  "staff_id": "staff_def456",
  "type": "bonus",
  "amount": 1000000,
  "reason": "Bán vượt 10 thẻ dịch vụ trong tháng",
  "category": "sales",
  "apply_month": "2026-04",
  "note": "Theo chính sách thưởng tháng 4/2026"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "record_id": "bp_20260422_abc123_bonus",
    "staff_id": "staff_abc123",
    "full_name": "Nguyễn Thị Hoa",
    "type": "bonus",
    "amount": 500000,
    "reason": "Đạt 105% KPI doanh thu tháng 4",
    "category": "kpi",
    "apply_month": "2026-04",
    "issued_by": "Quản lý Spa",
    "created_at": "2026-04-22T11:00:00Z",
    "note": "",
    "payroll_impact": {
      "current_bonus_total": 500000,
      "current_penalty_total": 100000,
      "net_impact": 400000
    }
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `STAFF_NOT_FOUND` | `staff_id` không tồn tại | Dùng `list_staff` để lấy ID đúng |
| `INVALID_TYPE` | `type` không phải `bonus` hoặc `penalty` | Chỉ dùng `"bonus"` hoặc `"penalty"` |
| `INVALID_CATEGORY` | `category` không hợp lệ | Dùng: `kpi`, `sales`, `discipline`, `attendance`, `other` |
| `AMOUNT_INVALID` | `amount` ≤ 0 | Nhập số dương |
| `REASON_REQUIRED` | Thiếu `reason` | Cung cấp lý do rõ ràng |
| `PAYROLL_ALREADY_PAID` | Bảng lương tháng `apply_month` đã thanh toán | Chọn tháng chưa trả lương |
