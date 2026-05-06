---
name: get_service_detail
description: Xem chi tiết một dịch vụ - giá niêm yết, thời gian thực hiện, danh sách vật tư tiêu hao, cấu hình hoa hồng nhân viên. Dùng khi đã có service_id.
triggers:
  - "chi tiết dịch vụ"
  - "service detail"
  - "thông tin dv"
  - "giá dv"
  - "vật tư dv"
  - "hoa hồng dv"
endpoint: POST /internal/skills/get_service_detail
---

# Skill: get_service_detail

## Khi nào dùng
- User muốn biết chi tiết 1 dịch vụ cụ thể: giá, thời gian, vật tư cần dùng, hoa hồng
- Đã có `service_id` từ kết quả `search_services`
- KHÔNG dùng khi chưa biết ID → dùng `search_services` trước

## Cách dùng
1. Lấy `service_id` từ bước search trước đó hoặc từ context conversation
2. Gọi endpoint với `service_id`
3. Đọc response để trả lời câu hỏi cụ thể của user (giá, thời gian, vật tư, hoa hồng)

## Ví dụ

User: "Cho tôi biết chi tiết dịch vụ Peel da" (đã search và có id="uuid-peel")
→ `{"service_id": "uuid-peel"}`

User: "Dịch vụ triệt lông dùng vật tư gì?"
→ Gọi `search_services` với query "triệt lông" → lấy id → gọi `get_service_detail`

## Output format
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "name": "Peel da tế bào chết",
    "category": { "id": "uuid-cat", "name": "Chăm sóc da" },
    "price": 350000,
    "duration_minutes": 60,
    "description": "Loại bỏ tế bào chết, làm sáng da tức thì",
    "is_active": true,
    "materials": [
      { "id": "mat-uuid", "name": "Kem peel AHA", "unit": "ml", "quantity_per_session": 5 },
      { "id": "mat-uuid2", "name": "Mặt nạ dưỡng", "unit": "gói", "quantity_per_session": 1 }
    ],
    "commissions": [
      { "role": "TECHNICIAN", "type": "PERCENT", "value": 10, "note": "10% giá dịch vụ" },
      { "role": "CONSULTANT", "type": "FIXED", "value": 20000, "note": "20k/lần" }
    ],
    "updated_at": "2026-04-01T08:00:00Z"
  }
}
```

## Lỗi thường gặp
- `SERVICE_NOT_FOUND`: service_id không tồn tại hoặc đã bị xoá → tìm lại bằng `search_services`
- `NO_WORKSPACE`: workspace chưa được cấu hình
- Nếu `materials` rỗng: dịch vụ chưa khai báo vật tư, cần cập nhật trong màn hình quản lý dịch vụ
