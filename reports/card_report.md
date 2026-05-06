---
name: card_report
description: Báo cáo thẻ dịch vụ: tổng thẻ phát hành, số dư còn lại, lượng nạp/sử dụng theo tháng, thẻ sắp hết hạn
triggers:
  - "báo cáo thẻ"
  - "thẻ dịch vụ"
  - "thẻ sắp hết hạn"
  - "số dư thẻ"
  - "nạp thẻ tháng này"
  - "thẻ đã dùng"
  - "thẻ còn hạn"
  - "báo cáo thẻ dịch vụ"
  - "card report"
endpoint: POST /internal/skills/card_report
---

# Skill: card_report

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem tổng số thẻ dịch vụ đang lưu hành và số dư còn lại
- Thống kê lượng tiền nạp vào thẻ và lượng sử dụng trong tháng
- Tìm danh sách thẻ sắp hết hạn (trong N ngày tới)
- Xem lịch sử giao dịch của 1 thẻ cụ thể
- Phân tích xu hướng nạp/dùng thẻ theo thời gian

## Cách dùng

**Request body:**
```json
{
  "period": "month | custom | all",
  "month": "2026-04",
  "start_date": "2026-04-01",
  "end_date": "2026-04-22",
  "report_type": "summary | expiring | transactions | balance",
  "expiring_within_days": 30,
  "card_id": "uuid-thẻ",
  "person_id": "uuid-khách-hàng",
  "include_zero_balance": false,
  "sort_by": "balance | expiry_date | top_up | usage",
  "sort_order": "asc | desc",
  "limit": 50
}
```

- `report_type`: `"summary"` = tổng quan, `"expiring"` = sắp hết hạn, `"transactions"` = lịch sử giao dịch, `"balance"` = tồn số dư
- `expiring_within_days`: số ngày trước khi hết hạn (mặc định 30, dùng khi `report_type = "expiring"`)
- `include_zero_balance`: có bao gồm thẻ hết số dư hay không

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Tổng quan thẻ tháng 4:**
```json
{
  "period": "month",
  "month": "2026-04",
  "report_type": "summary"
}
```

**Thẻ sắp hết hạn trong 30 ngày:**
```json
{
  "report_type": "expiring",
  "expiring_within_days": 30,
  "sort_by": "expiry_date",
  "sort_order": "asc"
}
```

**Thẻ của một khách hàng cụ thể:**
```json
{
  "period": "all",
  "person_id": "uuid-khách-hàng",
  "report_type": "balance"
}
```

**Lịch sử nạp/dùng thẻ tháng này:**
```json
{
  "period": "month",
  "month": "2026-04",
  "report_type": "transactions",
  "sort_by": "usage",
  "sort_order": "desc"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "summary": {
      "total_cards_active": 320,
      "total_balance_remaining": 485000000,
      "total_top_up_this_period": 120000000,
      "total_usage_this_period": 95000000,
      "cards_expiring_soon": 18,
      "cards_zero_balance": 42
    },
    "expiring_cards": [
      {
        "card_id": "uuid-card-1",
        "card_code": "CARD-2024-001",
        "person_id": "uuid-person-1",
        "person_name": "Trần Thị B",
        "phone": "0912345678",
        "balance_remaining": 2500000,
        "expiry_date": "2026-05-10",
        "days_until_expiry": 18
      }
    ],
    "monthly_trend": [
      {
        "month": "2026-03",
        "top_up": 105000000,
        "usage": 88000000,
        "net": 17000000
      },
      {
        "month": "2026-04",
        "top_up": 120000000,
        "usage": 95000000,
        "net": 25000000
      }
    ],
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_REPORT_TYPE` | `report_type` không hợp lệ | Dùng: `summary`, `expiring`, `transactions`, `balance` |
| `MISSING_DATE_RANGE` | `period = "custom"` nhưng thiếu `start_date`/`end_date` | Cung cấp cả hai |
| `CARD_NOT_FOUND` | `card_id` không tồn tại | Kiểm tra lại UUID thẻ |
| `PERSON_NOT_FOUND` | `person_id` không tồn tại | Kiểm tra lại UUID khách hàng |
| `INVALID_DATE_FORMAT` | Định dạng ngày sai | Dùng `YYYY-MM-DD` |
