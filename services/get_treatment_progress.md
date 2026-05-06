---
name: get_treatment_progress
description: Xem tiến độ chi tiết một liệu trình - tổng buổi, đã dùng, còn lại, danh sách các buổi đã thực hiện, nhân viên phụ trách. Dùng khi đã có treatment_id.
triggers:
  - "tiến độ liệu trình"
  - "đã dùng bao nhiêu buổi"
  - "còn mấy buổi"
  - "treatment progress"
  - "lịch sử liệu trình"
  - "buổi còn lại"
endpoint: POST /internal/skills/get_treatment_progress
---

# Skill: get_treatment_progress

## Khi nào dùng
- User hỏi "kh X còn mấy buổi liệu trình", "đã làm bao nhiêu buổi rồi"
- User muốn xem lịch sử các lần thực hiện dịch vụ trong 1 liệu trình
- Đã biết `treatment_id` từ kết quả `search_treatments`
- KHÔNG dùng khi chưa có treatment_id → gọi `search_treatments` trước

## Cách dùng
1. Lấy `treatment_id` từ `search_treatments` hoặc context
2. Nếu user chỉ hỏi số buổi → `include_sessions: false` (nhanh hơn)
3. Nếu user hỏi lịch sử chi tiết → `include_sessions: true` (mặc định)

## Ví dụ

User: "Chị Mai còn bao nhiêu buổi liệu trình Peel da?"
→ Tìm treatment_id → `{"treatment_id": "treat-uuid", "include_sessions": false}`

User: "Lịch sử làm liệu trình của kh A gồm những buổi nào?"
→ `{"treatment_id": "treat-uuid", "include_sessions": true}`

User: "Kỹ thuật viên nào phụ trách liệu trình của kh này?"
→ `{"treatment_id": "treat-uuid", "include_sessions": false}`

## Output format
```json
{
  "ok": true,
  "data": {
    "id": "treat-uuid",
    "person": { "id": "uuid", "name": "Nguyễn Thị Mai", "phone": "0901xxx67" },
    "service": { "id": "svc-uuid", "name": "Peel da AHA" },
    "total_sessions": 10,
    "used_sessions": 4,
    "remaining_sessions": 6,
    "status": "ACTIVE",
    "started_at": "2026-03-15",
    "expires_at": "2026-09-15",
    "assigned_staff": { "id": "staff-uuid", "name": "Nguyễn Văn Kỹ thuật" },
    "sessions": [
      {
        "session_no": 1,
        "date": "2026-03-15",
        "staff": { "id": "staff-uuid", "name": "Nguyễn Văn Kỹ thuật" },
        "note": "Da phục hồi tốt, khách phản hồi tốt",
        "status": "COMPLETED"
      },
      {
        "session_no": 2,
        "date": "2026-03-29",
        "staff": { "id": "staff-uuid", "name": "Nguyễn Văn Kỹ thuật" },
        "note": "Tăng nồng độ AHA 15%",
        "status": "COMPLETED"
      }
    ]
  }
}
```

## Lỗi thường gặp
- `TREATMENT_NOT_FOUND`: treatment_id sai hoặc đã bị xoá → tìm lại qua `search_treatments`
- `sessions` rỗng: liệu trình mới tạo, chưa có buổi nào được ghi nhận
- Nếu `status = EXPIRED` mà còn `remaining_sessions > 0`: gói hết hạn trước khi dùng hết → báo KH gia hạn
