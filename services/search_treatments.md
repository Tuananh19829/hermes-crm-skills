---
name: search_treatments
description: Tìm gói liệu trình đã mua của khách hàng. Dùng khi user hỏi "kh X có liệu trình gì", "gói nào còn hạn", "liệu trình da của Mai".
triggers:
  - "liệu trình khách"
  - "tìm liệu trình"
  - "gói liệu trình"
  - "treatment của kh"
  - "search treatment"
  - "liệu trình còn"
endpoint: POST /internal/skills/search_treatments
---

# Skill: search_treatments

## Khi nào dùng
- User hỏi khách hàng đang có liệu trình gì, còn hạn không
- Cần biết danh sách gói đã bán cho 1 khách trước khi xem tiến độ
- Tìm tất cả khách đang có liệu trình 1 dịch vụ cụ thể
- KHÔNG dùng để xem chi tiết buổi → dùng `get_treatment_progress` sau khi có `treatment_id`

## Cách dùng
1. Xác định `person_id` từ context hoặc gọi `find_customer` trước
2. Nếu user chỉ hỏi về 1 KH → truyền `person_id`
3. Nếu user lọc trạng thái → truyền `status` (ACTIVE = đang dùng, EXPIRED = hết hạn...)
4. Nếu user hỏi về dịch vụ cụ thể → có thể truyền `service_id`

## Ví dụ

User: "Kh Mai có liệu trình nào đang dùng?"
→ Tìm person_id của Mai → `{"person_id": "uuid-mai", "status": "ACTIVE"}`

User: "Liệt kê tất cả gói liệu trình còn hạn của khách"
→ `{"status": "ACTIVE", "limit": 50}`

User: "Kh nào đang làm liệu trình Laser CO2?"
→ Tìm service_id → `{"service_id": "uuid-laser", "status": "ACTIVE"}`

User: "Gói của chị Lan mua tháng 3"
→ Tìm person_id Lan → `{"person_id": "uuid-lan", "from_date": "2026-03-01", "to_date": "2026-03-31"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 2,
    "treatments": [
      {
        "id": "treat-uuid",
        "person": { "id": "uuid-mai", "name": "Nguyễn Thị Mai", "phone": "0901xxx67" },
        "service": { "id": "svc-uuid", "name": "Peel da AHA" },
        "total_sessions": 10,
        "used_sessions": 4,
        "remaining_sessions": 6,
        "status": "ACTIVE",
        "started_at": "2026-03-15",
        "expires_at": "2026-09-15",
        "assigned_staff": { "id": "staff-uuid", "name": "Nguyễn Văn Kỹ thuật" }
      }
    ]
  }
}
```

## Lỗi thường gặp
- Kết quả rỗng: khách chưa có liệu trình nào, hoặc tất cả đã hết hạn → bỏ filter `status`
- `PERSON_NOT_FOUND`: person_id sai → tìm lại bằng `find_customer`
- Để xem chi tiết buổi từng lần → lấy `treatment.id` và gọi `get_treatment_progress`
