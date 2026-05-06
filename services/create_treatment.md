---
name: create_treatment
description: Tạo gói liệu trình cho khách hàng (số buổi, giá gói, nhân viên phụ trách, lịch buổi đầu tiên). Dùng khi khách mua gói liệu trình da, giảm béo, điều trị... và cần ghi nhận vào hệ thống.
triggers:
  - "tạo liệu trình"
  - "mở gói liệu trình"
  - "gói liệu trình mới"
  - "create treatment"
  - "đăng ký liệu trình"
  - "kh mua gói"
  - "mua liệu trình"
  - "tạo gói buổi"
  - "ghi nhận liệu trình"
endpoint: POST /internal/skills/create_treatment
---

# Skill: create_treatment

## Khi nào dùng
- Khách hàng mua gói liệu trình (da mặt, triệt lông, giảm béo, phục hồi...) — cần ghi nhận vào hệ thống
- User muốn mở liệu trình mới cho khách: xác định số buổi, giá gói, nhân viên phụ trách
- User cần ghi nhận buổi đầu tiên hoặc lên lịch buổi kế tiếp ngay khi tạo
- KHÔNG dùng nếu user chỉ muốn xem liệu trình hiện có → dùng `search_treatments` hoặc `get_treatment_progress`
- KHÔNG dùng nếu muốn tạo gói/combo dịch vụ (bundle) để bán — đây là skill tạo liệu trình cho 1 KH cụ thể

## Cách dùng
1. Bắt buộc: `person_id` (KH), `service_id` (dịch vụ gốc), `total_sessions` (số buổi), `package_price` (giá gói)
2. `staff_id`: nhân viên phụ trách — nếu user không đề cập, có thể để trống
3. `start_date`: ngày bắt đầu liệu trình (ngày mua hoặc ngày buổi đầu tiên)
4. `first_session_datetime`: nếu user muốn đặt lịch buổi đầu ngay khi tạo
5. `notes`: ghi chú tình trạng ban đầu của khách (mức độ da, mục tiêu điều trị...)
6. Trước khi tạo, cần đảm bảo đã có person_id (dùng search_customers) và service_id (dùng search_services)

## Ví dụ

User: "Mở liệu trình da cho chị Mai (id: kh-abc123), dịch vụ Peel da (id: sv-peel), 10 buổi, giá gói 2.5 triệu, phụ trách: Lan (id: nv-lan)"
→ `{"person_id": "kh-abc123", "service_id": "sv-peel", "total_sessions": 10, "package_price": 2500000, "staff_id": "nv-lan", "start_date": "2026-04-22"}`

User: "Tạo liệu trình triệt lông toàn thân 8 buổi, giá 5 triệu, KH Mai, buổi đầu lúc 9h sáng ngày 25/4"
→ `{"person_id": "kh-abc123", "service_id": "sv-triet-long", "total_sessions": 8, "package_price": 5000000, "start_date": "2026-04-25", "first_session_datetime": "2026-04-25T09:00:00"}`

User: "Ghi liệu trình giảm béo 6 buổi cho anh Hùng, giá 3.6tr, ghi chú: BMI 28, vùng bụng"
→ `{"person_id": "kh-hung", "service_id": "sv-giam-beo", "total_sessions": 6, "package_price": 3600000, "notes": "BMI 28, vùng bụng"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "treatment_id": "uuid",
    "person": { "id": "kh-abc123", "name": "Nguyễn Thị Mai" },
    "service": { "id": "sv-peel", "name": "Peel da tế bào chết" },
    "total_sessions": 10,
    "used_sessions": 0,
    "remaining_sessions": 10,
    "package_price": 2500000,
    "staff": { "id": "nv-lan", "name": "Trần Thị Lan" },
    "start_date": "2026-04-22",
    "status": "ACTIVE",
    "first_session": null,
    "notes": null,
    "created_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp
- `PERSON_NOT_FOUND`: KH không tồn tại — gọi `search_customers` để lấy đúng person_id
- `SERVICE_NOT_FOUND`: Dịch vụ không tồn tại — gọi `search_services` để lấy đúng service_id
- `TOTAL_SESSIONS_INVALID`: Số buổi phải >= 1
- `PACKAGE_PRICE_INVALID`: Giá gói phải > 0
- `STAFF_NOT_FOUND`: Nhân viên không tồn tại — bỏ trống staff_id nếu chưa xác định được
