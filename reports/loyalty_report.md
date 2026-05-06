---
name: loyalty_report
description: Báo cáo điểm tích lũy: tổng điểm đang lưu hành, điểm tích/đổi trong tháng, top khách hàng điểm cao
triggers:
  - "báo cáo tích điểm"
  - "điểm tích lũy"
  - "tích điểm tháng"
  - "đổi điểm"
  - "top khách hàng điểm"
  - "điểm lưu hành"
  - "loyalty report"
  - "khách tích nhiều điểm"
  - "điểm sắp hết hạn"
endpoint: POST /internal/skills/loyalty_report
---

# Skill: loyalty_report

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem tổng số điểm đang lưu hành trong toàn hệ thống
- Thống kê điểm được tích và điểm đã đổi trong tháng
- Xem top khách hàng có điểm tích lũy cao nhất
- Tìm khách hàng có điểm sắp hết hạn cần thông báo
- Phân tích tỷ lệ đổi điểm và giá trị đổi thực tế

## Cách dùng

**Request body:**
```json
{
  "period": "month | quarter | custom | all",
  "month": "2026-04",
  "quarter": "2026-Q1",
  "start_date": "2026-04-01",
  "end_date": "2026-04-22",
  "report_type": "summary | top_customers | expiring | transactions",
  "top_n": 10,
  "expiring_within_days": 30,
  "person_id": "uuid-khách-hàng",
  "min_points": 1000,
  "compare_previous": true
}
```

- `report_type`: `"summary"` = tổng quan, `"top_customers"` = top KH điểm cao, `"expiring"` = điểm sắp hết hạn, `"transactions"` = lịch sử giao dịch điểm
- `top_n`: số lượng khách hàng top (mặc định 10, dùng khi `report_type = "top_customers"`)
- `expiring_within_days`: số ngày trước khi điểm hết hạn (dùng khi `report_type = "expiring"`)

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Tổng quan điểm tích lũy tháng 4:**
```json
{
  "period": "month",
  "month": "2026-04",
  "report_type": "summary",
  "compare_previous": true
}
```

**Top 10 khách hàng điểm cao nhất:**
```json
{
  "report_type": "top_customers",
  "top_n": 10
}
```

**Điểm sắp hết hạn trong 30 ngày:**
```json
{
  "report_type": "expiring",
  "expiring_within_days": 30
}
```

**Lịch sử điểm của khách hàng cụ thể:**
```json
{
  "period": "all",
  "report_type": "transactions",
  "person_id": "uuid-khách-hàng"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "summary": {
      "total_points_in_circulation": 1850000,
      "total_points_earned_this_period": 245000,
      "total_points_redeemed_this_period": 120000,
      "net_points_change": 125000,
      "redemption_rate_pct": 48.9,
      "customers_with_points": 580,
      "comparison": {
        "previous_earned": 210000,
        "previous_redeemed": 98000,
        "earned_change_pct": 16.7
      }
    },
    "top_customers": [
      {
        "rank": 1,
        "person_id": "uuid-1",
        "name": "Nguyễn Thị A",
        "phone": "0901234567",
        "total_points": 45200,
        "points_earned_this_period": 3200,
        "points_redeemed_this_period": 0
      }
    ],
    "expiring_soon": [
      {
        "person_id": "uuid-2",
        "name": "Trần Văn B",
        "phone": "0912345678",
        "expiring_points": 5000,
        "expiry_date": "2026-05-15",
        "days_until_expiry": 23
      }
    ],
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_REPORT_TYPE` | `report_type` không hợp lệ | Dùng: `summary`, `top_customers`, `expiring`, `transactions` |
| `INVALID_PERIOD` | `period` không hợp lệ | Dùng: `month`, `quarter`, `custom`, `all` |
| `MISSING_DATE_RANGE` | `period = "custom"` nhưng thiếu `start_date`/`end_date` | Cung cấp cả hai |
| `PERSON_NOT_FOUND` | `person_id` không tồn tại | Kiểm tra lại UUID khách hàng |
| `INVALID_TOP_N` | `top_n` vượt quá giới hạn | Tối đa 100 |
