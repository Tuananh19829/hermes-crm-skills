---
name: service_report
description: Báo cáo theo dịch vụ: số lượt thực hiện, doanh thu, đánh giá khách hàng và so sánh với kỳ trước
triggers:
  - "báo cáo dịch vụ"
  - "dịch vụ phổ biến"
  - "dịch vụ nhiều khách nhất"
  - "lượt dịch vụ"
  - "đánh giá dịch vụ"
  - "dịch vụ doanh thu cao"
  - "service report"
  - "dịch vụ tháng này"
endpoint: POST /internal/skills/service_report
---

# Skill: service_report

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem dịch vụ nào được đặt nhiều nhất trong kỳ
- So sánh doanh thu giữa các loại dịch vụ
- Xem điểm đánh giá trung bình của từng dịch vụ
- Phân tích xu hướng dịch vụ để lên kế hoạch chiến dịch
- Tìm dịch vụ nào đang giảm để có biện pháp cải thiện

## Cách dùng

**Request body:**
```json
{
  "period": "day | week | month | quarter | custom",
  "month": "2026-04",
  "start_date": "2026-04-01",
  "end_date": "2026-04-22",
  "service_id": "string | null",
  "sort_by": "revenue | sessions | rating",
  "sort_order": "desc | asc",
  "compare_previous": true
}
```

- `service_id`: xem chi tiết 1 dịch vụ cụ thể (nếu bỏ qua → xem tất cả)
- `sort_by`: sắp xếp kết quả theo tiêu chí nào
- `compare_previous`: so sánh với kỳ trước

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Top dịch vụ doanh thu cao nhất tháng 4:**
```json
{
  "period": "month",
  "month": "2026-04",
  "sort_by": "revenue",
  "sort_order": "desc",
  "compare_previous": true
}
```

**Chi tiết dịch vụ triệt lông tháng này:**
```json
{
  "period": "month",
  "month": "2026-04",
  "service_id": "svc_triet_long"
}
```

**Dịch vụ được đánh giá tốt nhất tuần này:**
```json
{
  "period": "week",
  "sort_by": "rating",
  "sort_order": "desc"
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
    "services": [
      {
        "service_id": "svc_triet_long",
        "service_name": "Triệt lông",
        "category": "Thẩm mỹ",
        "total_sessions": 200,
        "total_revenue": 180000000,
        "avg_revenue_per_session": 900000,
        "avg_rating": 4.7,
        "total_ratings": 180,
        "completion_rate_pct": 96,
        "cancellation_rate_pct": 3,
        "noshow_rate_pct": 1,
        "comparison": {
          "prev_sessions": 175,
          "sessions_change_pct": 14.3,
          "prev_revenue": 157500000,
          "revenue_change_pct": 14.3
        }
      },
      {
        "service_id": "svc_tri_mun",
        "service_name": "Trị mụn",
        "category": "Da liễu",
        "total_sessions": 110,
        "total_revenue": 95000000,
        "avg_revenue_per_session": 863636,
        "avg_rating": 4.5,
        "total_ratings": 100,
        "completion_rate_pct": 94,
        "cancellation_rate_pct": 4,
        "noshow_rate_pct": 2,
        "comparison": {
          "prev_sessions": 98,
          "sessions_change_pct": 12.2,
          "prev_revenue": 84700000,
          "revenue_change_pct": 12.2
        }
      }
    ],
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `SERVICE_NOT_FOUND` | `service_id` không tồn tại | Bỏ qua `service_id` để xem tất cả |
| `INVALID_PERIOD` | `period` không hợp lệ | Dùng: `day`, `week`, `month`, `quarter`, `custom` |
| `INVALID_SORT_BY` | `sort_by` không hợp lệ | Dùng: `revenue`, `sessions`, `rating` |
| `NO_DATA` | Không có lượt dịch vụ trong kỳ | Kiểm tra lại khoảng thời gian |
