---
name: debt_report
description: Báo cáo công nợ: khách hàng nợ cơ sở, cơ sở nợ NCC, công nợ quá hạn, tổng nợ theo kỳ
triggers:
  - "báo cáo công nợ"
  - "công nợ tháng"
  - "khách nợ bao nhiêu"
  - "nợ quá hạn"
  - "cơ sở nợ nhà cung cấp"
  - "tổng nợ"
  - "đối chiếu công nợ"
  - "công nợ khách hàng"
  - "ncc nợ"
  - "debt report"
endpoint: POST /internal/skills/debt_report
---

# Skill: debt_report

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem tổng công nợ khách hàng chưa thanh toán cho cơ sở
- Xem công nợ cơ sở đang nợ nhà cung cấp (NCC)
- Lọc danh sách công nợ quá hạn (quá số ngày cho phép)
- Tổng hợp công nợ theo tháng để đối chiếu kế toán
- Xem chi tiết từng khoản nợ của một khách hàng cụ thể

## Cách dùng

**Request body:**
```json
{
  "period": "month | custom | all",
  "month": "2026-04",
  "start_date": "2026-04-01",
  "end_date": "2026-04-22",
  "debt_type": "customer | supplier | all",
  "overdue_only": false,
  "overdue_days_threshold": 30,
  "person_id": "uuid-khách-hàng",
  "supplier_id": "uuid-ncc",
  "sort_by": "amount | due_date | name",
  "sort_order": "desc | asc",
  "limit": 50
}
```

- `debt_type`: `"customer"` = KH nợ cơ sở, `"supplier"` = cơ sở nợ NCC, `"all"` = tất cả
- `overdue_only`: `true` = chỉ lấy các khoản quá hạn
- `overdue_days_threshold`: số ngày quá hạn tối thiểu (mặc định 30)
- `person_id`: lọc công nợ của 1 khách hàng cụ thể (tùy chọn)

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Tổng công nợ khách hàng tháng 4:**
```json
{
  "period": "month",
  "month": "2026-04",
  "debt_type": "customer"
}
```

**Công nợ quá hạn trên 30 ngày:**
```json
{
  "debt_type": "all",
  "overdue_only": true,
  "overdue_days_threshold": 30,
  "sort_by": "amount",
  "sort_order": "desc"
}
```

**Công nợ của khách hàng cụ thể:**
```json
{
  "period": "all",
  "debt_type": "customer",
  "person_id": "uuid-khách-hàng"
}
```

**Cơ sở nợ nhà cung cấp tháng này:**
```json
{
  "period": "month",
  "month": "2026-04",
  "debt_type": "supplier",
  "sort_by": "due_date",
  "sort_order": "asc"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "summary": {
      "total_customer_debt": 45000000,
      "total_supplier_debt": 28000000,
      "total_overdue_customer": 12000000,
      "total_overdue_supplier": 5000000,
      "overdue_count": 8
    },
    "customer_debts": [
      {
        "person_id": "uuid-1",
        "name": "Nguyễn Thị A",
        "phone": "0901234567",
        "total_debt": 5500000,
        "oldest_invoice_date": "2026-03-10",
        "overdue_days": 42,
        "is_overdue": true,
        "invoices": [
          {
            "invoice_id": "INV-001",
            "amount": 3000000,
            "remaining": 2500000,
            "due_date": "2026-03-25",
            "status": "PARTIAL"
          }
        ]
      }
    ],
    "supplier_debts": [
      {
        "supplier_id": "uuid-sup-1",
        "supplier_name": "Công ty TNHH ABC",
        "total_debt": 15000000,
        "due_date": "2026-04-30",
        "is_overdue": false
      }
    ],
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_PERIOD` | `period` không hợp lệ | Dùng: `month`, `custom`, `all` |
| `MISSING_DATE_RANGE` | `period = "custom"` nhưng thiếu `start_date`/`end_date` | Cung cấp cả hai |
| `INVALID_DEBT_TYPE` | `debt_type` không hợp lệ | Dùng: `customer`, `supplier`, `all` |
| `PERSON_NOT_FOUND` | `person_id` không tồn tại | Kiểm tra lại UUID khách hàng |
| `INVALID_DATE_FORMAT` | Định dạng ngày sai | Dùng `YYYY-MM-DD` |
