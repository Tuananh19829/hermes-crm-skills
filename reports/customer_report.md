---
name: customer_report
description: Báo cáo khách hàng theo kỳ: khách mới, khách cũ quay lại, tỷ lệ retention, phân khúc và giá trị vòng đời
triggers:
  - "báo cáo khách hàng"
  - "khách mới tháng này"
  - "tỷ lệ quay lại"
  - "khách hàng quay lại"
  - "retention"
  - "khách cũ"
  - "phân khúc khách hàng"
  - "customer report"
  - "khách mới vs cũ"
endpoint: POST /internal/skills/customer_report
---

# Skill: customer_report

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem số lượng khách hàng mới và khách cũ quay lại trong kỳ
- Tính tỷ lệ retention (giữ chân khách hàng)
- Phân tích phân khúc khách hàng (VIP, thường, mới)
- Xem giá trị vòng đời trung bình của khách hàng (LTV)
- Tìm khách hàng có nguy cơ rời bỏ (churn risk)
- Chuẩn bị chiến dịch tái kích hoạt khách cũ

## Cách dùng

**Request body:**
```json
{
  "period": "day | week | month | quarter | custom",
  "month": "2026-04",
  "start_date": "2026-04-01",
  "end_date": "2026-04-22",
  "segment": "new | returning | vip | all",
  "compare_previous": true,
  "include_churn_risk": false
}
```

- `segment`: lọc theo phân khúc khách hàng (`"all"` = tất cả)
- `include_churn_risk`: (mặc định `false`) bao gồm danh sách khách có nguy cơ rời bỏ

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Báo cáo khách hàng tháng 4:**
```json
{
  "period": "month",
  "month": "2026-04",
  "compare_previous": true
}
```

**Khách mới tháng này:**
```json
{
  "period": "month",
  "month": "2026-04",
  "segment": "new"
}
```

**Khách hàng có nguy cơ churn:**
```json
{
  "period": "month",
  "month": "2026-04",
  "include_churn_risk": true
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "period": "month",
    "start_date": "2026-04-01",
    "end_date": "2026-04-30",
    "overview": {
      "total_active_customers": 312,
      "new_customers": 48,
      "returning_customers": 264,
      "retention_rate_pct": 84.6,
      "churn_rate_pct": 5.2,
      "avg_visits_per_customer": 1.8,
      "avg_ltv": 8500000
    },
    "comparison": {
      "prev_new_customers": 41,
      "new_customers_change_pct": 17.1,
      "prev_retention_rate_pct": 81.2,
      "retention_change_pct": 3.4
    },
    "segments": {
      "vip": {"count": 42, "avg_spend": 18000000},
      "regular": {"count": 198, "avg_spend": 5200000},
      "new": {"count": 48, "avg_spend": 1200000},
      "inactive_30d": {"count": 24},
      "inactive_60d": {"count": 11}
    },
    "churn_risk": {
      "enabled": false,
      "high_risk_count": null,
      "customers": null
    },
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_PERIOD` | `period` không hợp lệ | Dùng: `day`, `week`, `month`, `quarter`, `custom` |
| `INVALID_SEGMENT` | `segment` không hợp lệ | Dùng: `new`, `returning`, `vip`, `all` |
| `NO_CUSTOMER_DATA` | Không có dữ liệu khách hàng trong kỳ | Kiểm tra lại khoảng thời gian |
| `MISSING_DATE_RANGE` | `period = "custom"` thiếu `start_date`/`end_date` | Cung cấp đủ ngày bắt đầu và kết thúc |
