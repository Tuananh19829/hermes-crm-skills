---
name: create_lead
description: Tạo lead (khách tiềm năng) mới. Dùng khi user muốn thêm khách mới vào CRM.
triggers:
  - "tạo lead"
  - "thêm khách mới"
  - "add lead"
  - "create lead"
  - "tạo khách tiềm năng"
endpoint: POST /internal/skills/create_lead
---

# Skill: create_lead

## Khi nào dùng
- User muốn ghi nhận một khách tiềm năng mới vào CRM
- Có ít nhất tên hoặc SĐT của khách

## Lưu ý
- Nếu SĐT đã tồn tại trong workspace → trả lỗi VALIDATION (không tạo trùng)
- Lead mới tạo có `lead_status = NEW`

## Ví dụ
User: "Thêm lead tên Trần Văn A, SĐT 0912345678, từ Facebook"
→ `{"full_name": "Trần Văn A", "phone": "0912345678", "lead_source": "facebook"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "id": "uuid-moi",
    "full_name": "Trần Văn A",
    "phone": "0912345678",
    "message": "Đã tạo lead thành công"
  }
}
```

## Lỗi thường gặp
- `VALIDATION`: SĐT đã tồn tại → thông báo cho user, hỏi có muốn xem khách đó không
- `VALIDATION`: Thiếu full_name → hỏi lại tên khách
