---
name: report_revenue
description: Báo cáo doanh thu theo kỳ. Tổng hợp từ invoice (dịch vụ/gói) và orders (bán hàng).
triggers:
  - "doanh thu"
  - "revenue"
  - "báo cáo"
  - "report"
  - "tổng thu"
  - "doanh số"
endpoint: POST /internal/skills/report_revenue
---

# Skill: report_revenue

## Khi nào dùng
- User hỏi doanh thu hôm nay, tuần này, tháng này, hoặc kỳ tuỳ chỉnh

## Cách map câu hỏi
| Câu hỏi user | params |
|---|---|
| "doanh thu hôm nay" | `{"period": "today"}` |
| "doanh thu tuần này" | `{"period": "week"}` |
| "doanh thu tháng này" | `{"period": "month"}` |
| "doanh thu tháng 3" | `{"from_date": "2026-03-01", "to_date": "2026-03-31"}` |

## Output format
```json
{
  "ok": true,
  "data": {
    "period": "Tháng này",
    "invoice_revenue": 45000000,
    "invoice_count": 32,
    "order_revenue": 12000000,
    "order_count": 18,
    "total_revenue": 57000000
  }
}
```

## Lưu ý khi trả lời user
- `invoice_revenue` = dịch vụ spa, gói, liệu trình
- `order_revenue` = bán sản phẩm, đơn hàng online
- Format số VND khi trả lời: "57,000,000 đ" hoặc "57 triệu đồng"
