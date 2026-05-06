---
name: cashbook_report
description: Báo cáo thu chi sổ quỹ theo ngày/tuần/tháng hoặc kỳ tuỳ chỉnh. Dùng khi user hỏi "thu chi hôm nay", "sổ quỹ tháng này", "tổng chi tháng 3".
triggers:
  - "thu chi"
  - "sổ quỹ"
  - "cashbook"
  - "báo cáo thu chi"
  - "tổng thu"
  - "tổng chi"
  - "quỹ tiền mặt"
endpoint: POST /internal/skills/cashbook_report
---

# Skill: cashbook_report

## Khi nào dùng
- User hỏi tình hình tài chính: thu bao nhiêu, chi bao nhiêu, quỹ hiện tại
- Báo cáo theo kỳ: hôm nay, tuần này, tháng này, hoặc khoảng tuỳ chỉnh
- Lọc chỉ xem thu hoặc chỉ xem chi
- Lọc theo loại phiếu (dịch vụ, vật tư, lương...)
- KHÔNG dùng cho báo cáo doanh thu tổng → dùng `report_revenue` (skill CRM)

## Cách dùng
1. Xác định kỳ báo cáo: `today`, `week`, `month`, hoặc `custom` với `from_date`/`to_date`
2. Nếu user hỏi "tháng 3" → `{"period": "custom", "from_date": "2026-03-01", "to_date": "2026-03-31"}`
3. Nếu user chỉ hỏi tổng thu → `{"type": "INCOME"}`; chỉ chi → `{"type": "EXPENSE"}`
4. Ngày mặc định = `month` nếu user không chỉ rõ kỳ

## Ví dụ

User: "Thu chi hôm nay thế nào?"
→ `{"period": "today"}`

User: "Tháng này mình chi bao nhiêu?"
→ `{"period": "month", "type": "EXPENSE"}`

User: "Báo cáo sổ quỹ tháng 3"
→ `{"period": "custom", "from_date": "2026-03-01", "to_date": "2026-03-31"}`

User: "Tổng thu từ dịch vụ tuần này"
→ `{"period": "week", "type": "INCOME", "category": "DICH_VU"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "period": { "from": "2026-04-01", "to": "2026-04-22" },
    "summary": {
      "total_income": 45000000,
      "total_expense": 12000000,
      "net": 33000000,
      "opening_balance": 5000000,
      "closing_balance": 38000000
    },
    "by_category": [
      { "category": "DICH_VU", "income": 40000000, "expense": 0 },
      { "category": "VAT_TU", "income": 0, "expense": 8000000 },
      { "category": "LUONG", "income": 0, "expense": 4000000 }
    ],
    "entries_count": 127
  }
}
```

## Lỗi thường gặp
- Nếu `period: "custom"` mà thiếu `from_date`/`to_date`: yêu cầu user cung cấp khoảng thời gian
- Số âm ở `net`: tháng chi nhiều hơn thu — cần kiểm tra phiếu chi bất thường
- `NO_WORKSPACE`: workspace chưa khởi tạo module tài chính
