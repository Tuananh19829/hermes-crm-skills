---
name: booking_report
description: Báo cáo lịch hẹn theo kỳ: tổng lịch, hoàn thành, hủy, no-show, tỷ lệ lấp đầy và phân tích nguyên nhân
triggers:
  - "báo cáo lịch hẹn"
  - "lịch hẹn tháng"
  - "tỷ lệ hủy lịch"
  - "no-show"
  - "khách không đến"
  - "lịch hẹn hoàn thành"
  - "booking report"
  - "tỷ lệ lấp đầy"
  - "lịch hẹn hôm nay"
endpoint: POST /internal/skills/booking_report
---

# Skill: booking_report

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem tổng số lịch hẹn, phân loại hoàn thành / hủy / no-show
- Phân tích tỷ lệ lấp đầy ca làm việc
- Tìm khung giờ nào có nhiều lịch nhất / ít nhất
- Xem lý do hủy lịch phổ biến để cải thiện
- So sánh hiệu quả đặt lịch giữa các kỳ
- Theo dõi lịch hẹn theo nhân viên hoặc dịch vụ

## Cách dùng

**Request body:**
```json
{
  "period": "day | week | month | quarter | custom",
  "date": "2026-04-22",
  "month": "2026-04",
  "start_date": "2026-04-01",
  "end_date": "2026-04-22",
  "staff_id": "string | null",
  "service_id": "string | null",
  "status": "completed | cancelled | noshow | all",
  "group_by": "staff | service | hour | day | null",
  "compare_previous": true
}
```

- `status`: lọc theo trạng thái lịch hẹn (`"all"` = tất cả)
- `group_by`: phân tích chi tiết theo chiều nào

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Báo cáo lịch hẹn tháng 4:**
```json
{
  "period": "month",
  "month": "2026-04",
  "compare_previous": true
}
```

**Lịch hẹn hôm nay phân theo giờ:**
```json
{
  "period": "day",
  "date": "2026-04-22",
  "group_by": "hour"
}
```

**Phân tích no-show theo nhân viên:**
```json
{
  "period": "month",
  "month": "2026-04",
  "status": "noshow",
  "group_by": "staff"
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
    "summary": {
      "total_bookings": 450,
      "completed": 412,
      "cancelled": 28,
      "noshow": 10,
      "completion_rate_pct": 91.6,
      "cancellation_rate_pct": 6.2,
      "noshow_rate_pct": 2.2,
      "capacity_fill_rate_pct": 78.4
    },
    "comparison": {
      "prev_total": 398,
      "total_change_pct": 13.1,
      "prev_completion_rate_pct": 89.2,
      "completion_rate_change": 2.4
    },
    "cancellation_reasons": [
      {"reason": "Khách bận đột xuất", "count": 14, "pct": 50},
      {"reason": "Bệnh", "count": 8, "pct": 28.6},
      {"reason": "Đổi lịch", "count": 4, "pct": 14.3},
      {"reason": "Không rõ", "count": 2, "pct": 7.1}
    ],
    "peak_hours": [
      {"hour": "10:00", "bookings": 42},
      {"hour": "14:00", "bookings": 38},
      {"hour": "16:00", "bookings": 35}
    ],
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_PERIOD` | `period` không hợp lệ | Dùng: `day`, `week`, `month`, `quarter`, `custom` |
| `INVALID_STATUS` | `status` không hợp lệ | Dùng: `completed`, `cancelled`, `noshow`, `all` |
| `INVALID_GROUP_BY` | `group_by` không hợp lệ | Dùng: `staff`, `service`, `hour`, `day` |
| `STAFF_NOT_FOUND` | `staff_id` không tồn tại | Dùng `list_staff` để lấy ID đúng |
| `NO_BOOKING_DATA` | Không có lịch hẹn trong kỳ | Kiểm tra lại khoảng thời gian |
