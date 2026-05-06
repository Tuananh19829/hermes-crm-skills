---
name: update_lead_funnel
description: Di chuyển lead qua các bước funnel CRM (Mới→Quan tâm→Đặt lịch→Chốt)
triggers:
  - "di chuyển lead"
  - "chuyển funnel"
  - "move lead"
  - "update funnel"
  - "lead quan tâm"
  - "lead đặt lịch"
  - "chuyển bước"
endpoint: POST /internal/skills/update_lead_funnel
---

# Skill: update_lead_funnel

## Khi nào dùng
- NV báo kết quả tư vấn → cần chuyển bước funnel
- User muốn cập nhật tiến trình của lead trong pipeline
- Ghi nhận lý do chuyển bước và lịch follow-up tiếp theo
- KHÔNG dùng để cập nhật trạng thái đơn hàng → dùng `update_lead_status` (crm)

## Bước funnel
| Stage | Mô tả |
|-------|-------|
| `NEW` | Lead mới, chưa liên hệ |
| `INTERESTED` | Đã liên hệ, khách quan tâm |
| `APPOINTMENT` | Khách đã đặt lịch hẹn |
| `WON` | Đã chốt, trở thành khách hàng |
| `LOST` | Không chốt được |

## Cách dùng
1. Xác định lead_id từ ngữ cảnh hoặc kết quả `list_ads_leads`
2. Map câu nói của user sang stage tương ứng
3. Nếu user hẹn gọi lại → điền `follow_up_at`
4. Ghi `note` tóm tắt lý do chuyển bước

## Ví dụ
User: "Kh Trần B đã quan tâm, hẹn gặp thứ 6"
→ `{"lead_id": "uuid", "stage": "APPOINTMENT", "note": "Khách quan tâm, hẹn gặp thứ 6", "follow_up_at": "2026-04-25T09:00:00Z"}`

User: "Lead này không tiềm năng, đánh dấu lost"
→ `{"lead_id": "uuid", "stage": "LOST", "note": "Khách không có nhu cầu"}`

User: "Kh B đã chốt rồi!"
→ `{"lead_id": "uuid", "stage": "WON"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "lead_id": "uuid",
    "previous_stage": "INTERESTED",
    "new_stage": "APPOINTMENT",
    "follow_up_at": "2026-04-25T09:00:00Z",
    "updated_at": "2026-04-22T14:00:00Z"
  }
}
```

## Lỗi thường gặp
- `LEAD_NOT_FOUND`: lead_id không tồn tại → dùng `list_ads_leads` để tìm ID
- `INVALID_STAGE_TRANSITION`: không thể chuyển ngược bước (ví dụ WON → NEW) → xác nhận lại với user
- `PERMISSION_DENIED`: NV chỉ được sửa leads được assign cho mình
