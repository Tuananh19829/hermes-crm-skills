---
name: telesale_call_log
description: Ghi log cuộc gọi telesale (kết quả, ghi chú, lịch gọi lại)
triggers:
  - "ghi cuộc gọi"
  - "log call"
  - "call log"
  - "đã gọi"
  - "không bắt máy"
  - "hẹn gọi lại"
  - "telesale log"
endpoint: POST /internal/skills/telesale_call_log
---

# Skill: telesale_call_log

## Khi nào dùng
- NV vừa gọi xong → báo cáo kết quả cuộc gọi
- Cần ghi hẹn gọi lại (callback) vào lịch
- Ghi nhận ghi chú nội dung đã trao đổi
- KHÔNG dùng để xem lịch gọi → dùng `list_telesale_queue`

## Kết quả cuộc gọi (result)
| Value | Mô tả |
|-------|-------|
| `ANSWERED` | Bắt máy, nói chuyện bình thường |
| `NO_ANSWER` | Không bắt máy |
| `BUSY` | Máy bận |
| `CALLBACK` | Hẹn gọi lại sau |
| `WON` | Chốt ngay trong cuộc gọi |
| `NOT_INTERESTED` | Từ chối, không có nhu cầu |

## Cách dùng
1. Trích person_id từ ngữ cảnh hoặc yêu cầu tìm khách trước
2. Map câu nói của NV sang `result` phù hợp
3. Nếu NV nói "hẹn gọi lại lúc X" → điền `callback_at` và set `result: CALLBACK`
4. Ghi chú ngắn gọn nội dung đã trao đổi

## Ví dụ
User: "Vừa gọi cho kh Lan, không bắt máy"
→ `{"person_id": "uuid_lan", "result": "NO_ANSWER"}`

User: "Gọi cho kh B, họ hẹn gọi lại 3h chiều nay. Họ đang bận họp"
→ `{"person_id": "uuid_b", "result": "CALLBACK", "note": "Đang bận họp", "callback_at": "2026-04-22T15:00:00Z"}`

User: "Kh Hùng chốt rồi! Gọi 8 phút"
→ `{"person_id": "uuid_hung", "result": "WON", "duration_seconds": 480, "note": "Khách chốt dịch vụ X"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "log_id": "uuid",
    "person_id": "uuid",
    "result": "CALLBACK",
    "callback_at": "2026-04-22T15:00:00Z",
    "note": "Đang bận họp",
    "logged_at": "2026-04-22T10:30:00Z",
    "logged_by": "uuid_nv"
  }
}
```

## Lỗi thường gặp
- `PERSON_NOT_FOUND`: person_id không tồn tại → dùng `find_customer` trước
- `CALLBACK_TIME_PAST`: callback_at là thời điểm đã qua → xác nhận lại với user
- `MISSING_CALLBACK_TIME`: result=CALLBACK nhưng không có callback_at → hỏi user gọi lại lúc mấy giờ
