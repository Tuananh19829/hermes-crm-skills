---
name: list_invoices
description: Danh sách hóa đơn theo kỳ/KH/status/chi nhánh, kèm summary tổng doanh thu + breakdown.
triggers:
  - "danh sách hóa đơn"
  - "list invoices"
  - "bill hôm nay"
  - "hóa đơn tháng này"
  - "invoice của khách"
  - "hóa đơn chưa thanh toán"
  - "công nợ hóa đơn"
endpoint: POST /internal/skills/list_invoices
risk_level: read
---

# Skill: list_invoices

## Khi nào dùng
- User hỏi "bill hôm nay bao nhiêu", "hóa đơn của Mai", "bill chưa thanh toán"
- Báo cáo công nợ → filter `has_debt=true`
- Soát doanh thu theo chi nhánh → `branch_id` + `period`

## Tham số chính
- `period` nhanh: `today` / `week` / `month` / `quarter` (thay từ_ngày-đến_ngày)
- `status`: DRAFT / ISSUED / PARTIAL / PAID / VOID / ALL
- `has_debt=true`: chỉ bill còn nợ (debt_amount > 0)
- `include_summary=true`: trả thêm tổng + breakdown theo status

## Ví dụ

User: "Bill hôm nay"
→ `{ "period": "today" }`

User: "Hóa đơn KH Mai chưa thanh toán"
→ `{ "person_id": "uuid-mai", "has_debt": true }`

User: "Bill tháng này chi nhánh Hà Đông trên 1 triệu"
→ `{ "branch_id": "uuid-hd", "period": "month", "min_total": 1000000 }`

## Output
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "code": "INV-2026-05-0001",
        "person_name": "Trần Mai",
        "person_phone": "0901xxx",
        "subtotal": 750000,
        "discount": 75000,
        "total": 675000,
        "paid_amount": 500000,
        "debt_amount": 175000,
        "status": "PARTIAL",
        "issued_at": "2026-05-06T15:00:00+07:00",
        "branch_name": "Hà Đông"
      }
    ],
    "summary": {
      "total_count": 25,
      "total_amount": 18500000,
      "total_paid": 16200000,
      "total_debt": 2300000,
      "by_status": { "PAID": 18, "PARTIAL": 5, "ISSUED": 2 }
    }
  }
}
```
