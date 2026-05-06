---
name: get_customer_detail
description: Xem chi tiết 1 khách hàng theo ID. Trả về thông tin cá nhân, 5 ghi chú gần nhất và 10 đơn hàng gần nhất.
triggers:
  - "chi tiết khách"
  - "xem khách"
  - "customer detail"
  - "kh id"
  - "thông tin khách"
endpoint: POST /internal/skills/get_customer_detail
---

# Skill: get_customer_detail

## Khi nào dùng
- User hỏi chi tiết về 1 khách đã biết ID (thường sau khi chạy `find_customer`)
- User muốn xem lịch sử mua, ghi chú, thông tin liên hệ đầy đủ

## Cách dùng
1. Đảm bảo có `id` của khách (từ `find_customer` hoặc user cung cấp)
2. Gọi endpoint với `id`

## Ví dụ
→ `{"id": "uuid-cua-khach"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "name": "Nguyễn Thị Mai",
    "phone": "0901xxx67",
    "email": "mai***@example.com",
    "gender": "FEMALE",
    "birthday": "1990-05-15",
    "address": "123 Nguyễn Huệ, Q1, HCM",
    "note": "Khách VIP, thích dịch vụ massage",
    "person_type": "CUSTOMER",
    "lead_status": null,
    "tags": ["VIP", "repeat"],
    "tier": "VIP",
    "created_at": "2025-01-10T08:00:00Z",
    "recent_notes": [
      {"id": "uuid", "content": "Đã gọi, hẹn tuần sau", "created_at": "2026-04-18T14:00:00Z"}
    ],
    "recent_orders": [
      {"id": "uuid", "code": "ORD-001", "status": "COMPLETED", "total": 1500000, "paid_amount": 1500000, "created_at": "2026-04-18T10:00:00Z"}
    ]
  }
}
```

## Lỗi thường gặp
- `NOT_FOUND`: ID không tồn tại hoặc không thuộc workspace → thử tìm lại bằng `find_customer`
