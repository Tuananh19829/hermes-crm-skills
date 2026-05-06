---
name: telesale_hub_summary
description: Dashboard telesale hôm nay: cần gọi bao nhiêu, đã gọi, tỷ lệ tiếp cận, callback cần xử lý
triggers:
  - "dashboard telesale"
  - "telesale hôm nay"
  - "cần gọi bao nhiêu"
  - "đã gọi bao nhiêu"
  - "telesale hub"
  - "tổng quan gọi điện"
  - "hôm nay tôi còn bao nhiêu cuộc"
  - "tiến độ telesale"
  - "telesale summary"
  - "số liệu gọi điện hôm nay"
endpoint: POST /internal/skills/telesale_hub_summary
---

# Skill: telesale_hub_summary

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem tổng quan nhanh tiến độ telesale trong ngày
- Biết còn bao nhiêu cuộc cần gọi, đã gọi được bao nhiêu
- Xem số callback cần xử lý ngay hôm nay
- So sánh tiến độ cá nhân với mục tiêu ngày
- Nhận cảnh báo nếu có leads mới chưa được gọi quá lâu

## Cách dùng

**Request body:**
```json
{
  "date": "2026-04-22",
  "staff_id": "uuid-nhân-viên",
  "include_team": false,
  "include_alerts": true
}
```

- `date`: ngày cần xem (mặc định = hôm nay)
- `staff_id`: UUID nhân viên (mặc định = người gọi API)
- `include_team`: có bao gồm số liệu tổng của cả nhóm/tất cả NV hay không
- `include_alerts`: có bao gồm cảnh báo (leads chờ lâu, callback quá hạn) hay không

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Dashboard hôm nay của tôi:**
```json
{
  "date": "2026-04-22",
  "include_alerts": true
}
```

**Dashboard cả nhóm:**
```json
{
  "date": "2026-04-22",
  "include_team": true,
  "include_alerts": true
}
```

**Dashboard nhân viên cụ thể:**
```json
{
  "date": "2026-04-22",
  "staff_id": "uuid-nhân-viên",
  "include_alerts": false
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "date": "2026-04-22",
    "staff": {
      "staff_id": "uuid-nv-1",
      "name": "Lê Văn C",
      "personal": {
        "total_queue": 45,
        "called": 28,
        "remaining": 17,
        "answered": 20,
        "no_answer": 6,
        "callbacks_pending": 5,
        "callbacks_overdue": 2,
        "won": 3,
        "answered_rate_pct": 71.4,
        "conversion_rate_pct": 10.7,
        "daily_target_calls": 50,
        "target_achievement_pct": 56.0
      }
    },
    "team": {
      "total_queue": 380,
      "called": 210,
      "remaining": 170,
      "answered": 148,
      "callbacks_pending": 38,
      "won": 22,
      "top_performer": {
        "name": "Nguyễn Thị D",
        "calls": 42,
        "won": 6
      }
    },
    "alerts": [
      {
        "type": "CALLBACK_OVERDUE",
        "message": "2 cuộc hẹn gọi lại đã quá giờ, cần xử lý ngay",
        "severity": "high",
        "person_ids": ["uuid-p1", "uuid-p2"]
      },
      {
        "type": "NEW_LEADS_UNCONTACTED",
        "message": "5 leads mới từ Facebook chưa được gọi trong 2 giờ",
        "severity": "medium",
        "count": 5
      }
    ],
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `STAFF_NOT_FOUND` | `staff_id` không tồn tại | Kiểm tra lại UUID nhân viên |
| `INVALID_DATE_FORMAT` | Định dạng ngày sai | Dùng `YYYY-MM-DD` |
| `FUTURE_DATE` | `date` là ngày trong tương lai | Chỉ xem ngày hiện tại hoặc quá khứ |
