---
name: send_zalo_broadcast
description: Gửi broadcast Zalo cho nhóm khách hàng theo điều kiện lọc
triggers:
  - "broadcast zalo"
  - "gửi zalo hàng loạt"
  - "zalo broadcast"
  - "nhắn nhiều kh"
  - "gửi bulk zalo"
  - "gửi zalo nhóm"
endpoint: POST /internal/skills/send_zalo_broadcast
---

# Skill: send_zalo_broadcast

## Khi nào dùng
- User muốn gửi cùng 1 tin nhắn cho nhiều khách hàng
- Gửi thông báo khuyến mãi, sự kiện, nhắc lịch hàng loạt
- Lọc người nhận theo tag, trạng thái lead, thời gian mua hàng
- LUÔN dùng `dry_run: true` trước để xác nhận số lượng người nhận
- KHÔNG dùng khi chỉ gửi cho 1 người → dùng `send_zalo_message`

## Cách dùng
1. Xác định nội dung tin nhắn hoặc template
2. Xác định bộ lọc người nhận từ yêu cầu user
3. Bước 1: gọi với `dry_run: true` → báo số lượng người nhận để user xác nhận
4. Bước 2: sau khi user xác nhận → gọi lại với `dry_run: false`

## Ví dụ
User: "Gửi Zalo khuyến mãi 20% cho KH VIP chưa mua 2 tháng"
→ Bước 1 (dry_run): `{"message": "...", "filter": {"tags": ["VIP"], "last_order_before": "2026-02-22"}, "dry_run": true}`
→ Báo user: "Sẽ gửi đến 43 khách, xác nhận gửi?"
→ Bước 2 (thật): `{"message": "...", "filter": {...}, "dry_run": false}`

User: "Broadcast nhắc lịch hẹn tuần này cho tất cả kh đã đặt lịch"
→ `{"template_id": "appointment_reminder", "filter": {"lead_status": "QUALIFIED"}, "dry_run": true}`

## Output format (dry_run)
```json
{
  "ok": true,
  "data": {
    "dry_run": true,
    "estimated_recipients": 43,
    "filter_applied": {"tags": ["VIP"], "last_order_before": "2026-02-22"},
    "cost_estimate": "43 tin ZNS"
  }
}
```

## Output format (thật)
```json
{
  "ok": true,
  "data": {
    "dry_run": false,
    "broadcast_id": "uuid",
    "sent_count": 43,
    "failed_count": 2,
    "queued_at": "2026-04-22T10:00:00Z",
    "status": "PROCESSING"
  }
}
```

## Lỗi thường gặp
- `NO_ZALO_INTEGRATION`: chưa cấu hình Zalo OA → Settings → Zalo
- `FILTER_TOO_BROAD`: filter rỗng sẽ gửi tất cả → yêu cầu user xác nhận kỹ trước `dry_run: false`
- `ZNS_QUOTA_EXCEEDED`: hết quota ZNS → dùng tin nhắn text thường (nhưng có giới hạn nội dung)
- `ZERO_RECIPIENTS`: không có ai khớp filter → điều chỉnh lại điều kiện lọc
