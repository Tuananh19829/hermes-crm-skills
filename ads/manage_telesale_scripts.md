---
name: manage_telesale_scripts
description: Xem, tạo và chỉnh sửa kịch bản gọi điện telesale theo từng tình huống (leads mới, callback, chốt đơn...)
triggers:
  - "kịch bản telesale"
  - "script gọi điện"
  - "tạo kịch bản"
  - "xem kịch bản"
  - "sửa script"
  - "manage telesale scripts"
  - "kịch bản cuộc gọi"
  - "hướng dẫn gọi điện"
  - "script leads mới"
  - "kịch bản chốt đơn"
endpoint: POST /internal/skills/manage_telesale_scripts
---

# Skill: manage_telesale_scripts

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem danh sách kịch bản gọi điện theo tình huống
- Tạo kịch bản mới cho tình huống chưa có
- Cập nhật/chỉnh sửa nội dung kịch bản hiện có
- Xem kịch bản gợi ý phù hợp cho 1 leads cụ thể
- Kích hoạt hoặc lưu trữ kịch bản không còn dùng

## Cách dùng

**Request body:**
```json
{
  "action": "list | get | create | update | archive | suggest",
  "script_id": "uuid-script",
  "person_id": "uuid-khách-hàng",
  "situation": "new_lead | callback | re_engage | upsell | appointment_confirm | lost_recovery",
  "script_data": {
    "name": "Tên kịch bản",
    "situation": "new_lead",
    "opening": "Mở đầu cuộc gọi",
    "key_points": ["Điểm 1", "Điểm 2"],
    "objection_handling": [
      {
        "objection": "Khách nói đắt quá",
        "response": "Hướng xử lý..."
      }
    ],
    "closing": "Kết thúc cuộc gọi",
    "tags": ["leads-fb", "dịch vụ-triệt-lông"],
    "active": true
  },
  "limit": 20
}
```

- `action`: `"list"` = xem danh sách, `"get"` = xem chi tiết, `"create"` = tạo mới, `"update"` = cập nhật, `"archive"` = lưu trữ, `"suggest"` = gợi ý kịch bản phù hợp cho leads
- `situation`: bộ lọc theo tình huống (dùng với `list`)
- `person_id`: UUID khách hàng để gợi ý kịch bản phù hợp (dùng với `suggest`)

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Xem tất cả kịch bản:**
```json
{
  "action": "list"
}
```

**Xem kịch bản cho leads mới:**
```json
{
  "action": "list",
  "situation": "new_lead"
}
```

**Xem chi tiết kịch bản:**
```json
{
  "action": "get",
  "script_id": "uuid-script"
}
```

**Tạo kịch bản mới:**
```json
{
  "action": "create",
  "script_data": {
    "name": "Kịch bản leads Facebook - Triệt Lông",
    "situation": "new_lead",
    "opening": "Xin chào anh/chị [Tên], em là [NV] từ Spaclaw Spa...",
    "key_points": [
      "Giới thiệu dịch vụ triệt lông công nghệ Diode Laser",
      "Hỏi nhu cầu và vùng cần triệt",
      "Mời đặt lịch tư vấn miễn phí"
    ],
    "objection_handling": [
      {
        "objection": "Để tôi nghĩ thêm đã",
        "response": "Dạ anh/chị có thể đặt lịch tư vấn miễn phí trước để xem kết quả thực tế ạ"
      }
    ],
    "closing": "Cảm ơn anh/chị, em sẽ gửi thông tin qua Zalo nhé",
    "tags": ["leads-fb", "triệt-lông"],
    "active": true
  }
}
```

**Gợi ý kịch bản cho khách hàng cụ thể:**
```json
{
  "action": "suggest",
  "person_id": "uuid-khách-hàng"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "scripts": [
      {
        "script_id": "uuid-script-1",
        "name": "Kịch bản leads Facebook - Triệt Lông",
        "situation": "new_lead",
        "active": true,
        "usage_count": 145,
        "avg_call_duration_seconds": 185,
        "conversion_rate_pct": 12.4,
        "tags": ["leads-fb", "triệt-lông"],
        "last_updated_at": "2026-04-15T10:00:00Z"
      }
    ],
    "suggested_script": {
      "script_id": "uuid-script-1",
      "name": "Kịch bản Callback - KH quan tâm",
      "reason": "Khách đã được gọi lần trước, kết quả CALLBACK — phù hợp kịch bản follow-up",
      "opening": "...",
      "key_points": ["..."],
      "objection_handling": [],
      "closing": "..."
    }
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_ACTION` | `action` không hợp lệ | Dùng: `list`, `get`, `create`, `update`, `archive`, `suggest` |
| `SCRIPT_NOT_FOUND` | `script_id` không tồn tại | Kiểm tra lại UUID kịch bản |
| `INVALID_SITUATION` | `situation` không hợp lệ | Dùng: `new_lead`, `callback`, `re_engage`, `upsell`, `appointment_confirm`, `lost_recovery` |
| `MISSING_SCRIPT_DATA` | Thiếu `script_data` khi tạo/cập nhật | Cung cấp đầy đủ thông tin trong `script_data` |
| `PERSON_NOT_FOUND` | `person_id` không tồn tại khi `action = "suggest"` | Kiểm tra lại UUID khách hàng |
