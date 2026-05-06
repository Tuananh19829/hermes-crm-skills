---
name: update_lead_status
description: Cập nhật trạng thái lead trong pipeline CRM.
triggers:
  - "đổi trạng thái"
  - "chốt lead"
  - "lead bỏ"
  - "update status"
  - "kh đã liên hệ"
  - "đã gọi"
  - "chốt rồi"
endpoint: POST /internal/skills/update_lead_status
---

# Skill: update_lead_status

## Khi nào dùng
- User báo cáo tiến trình lead: đã gọi, đã gặp, chốt, bỏ

## Pipeline
NEW → CONTACTED → QUALIFIED → WON / LOST

| Status | Ý nghĩa |
|---|---|
| NEW | Lead mới, chưa liên hệ |
| CONTACTED | Đã liên hệ/gọi |
| QUALIFIED | Đã đánh giá tiềm năng cao |
| WON | Chốt thành công |
| LOST | Bỏ/không quan tâm |

## Ví dụ
User: "Kh Mai đã gọi xong rồi"
→ Tìm ID của Mai, rồi `{"id": "uuid", "status": "CONTACTED"}`

User: "Lead Trần A chốt rồi"
→ `{"id": "uuid", "status": "WON"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "lead_status": "CONTACTED",
    "message": "Cập nhật trạng thái thành công"
  }
}
```
