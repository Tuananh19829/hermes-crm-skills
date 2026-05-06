---
name: manage_commission_rules
description: Xem/tạo/sửa quy tắc hoa hồng (% doanh thu, số cố định/SP, áp dụng cho phòng ban hoặc dịch vụ cụ thể)
triggers:
  - "quy tắc hoa hồng"
  - "commission rule"
  - "cấu hình HH"
  - "% hoa hồng DV"
  - "thêm quy tắc HH"
  - "sửa hoa hồng"
  - "xóa quy tắc hoa hồng"
  - "hoa hồng theo dịch vụ"
  - "cấu hình commission"
endpoint: POST /internal/skills/manage_commission_rules
---

# Skill: manage_commission_rules

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem toàn bộ quy tắc hoa hồng đang áp dụng
- Tạo quy tắc hoa hồng mới: theo % doanh thu hoặc số tiền cố định trên mỗi sản phẩm/dịch vụ
- Sửa mức hoa hồng, phạm vi áp dụng (phòng ban, dịch vụ, nhân viên cụ thể)
- Xóa quy tắc hoa hồng lỗi thời
- Kiểm tra quy tắc nào đang áp dụng cho một dịch vụ hoặc phòng ban

## Cách dùng

Gửi POST request với `action` xác định thao tác. Các action hợp lệ: `list`, `get`, `create`, `update`, `delete`.

**Request body — action: list:**
```json
{
  "action": "list",
  "department_id": "string | null",
  "service_id": "string | null"
}
```

**Request body — action: get:**
```json
{
  "action": "get",
  "rule_id": "string"
}
```

**Request body — action: create:**
```json
{
  "action": "create",
  "name": "string",
  "type": "percentage | fixed_per_unit",
  "value": 10.5,
  "apply_to": {
    "department_ids": ["string"],
    "service_ids": ["string"],
    "staff_ids": ["string"]
  },
  "min_revenue": "number | null",
  "max_payout": "number | null",
  "effective_from": "YYYY-MM",
  "effective_to": "YYYY-MM | null",
  "note": "string | null"
}
```

**Request body — action: update:**
```json
{
  "action": "update",
  "rule_id": "string",
  "name": "string | null",
  "value": "number | null",
  "apply_to": "object | null",
  "min_revenue": "number | null",
  "max_payout": "number | null",
  "effective_from": "YYYY-MM | null",
  "effective_to": "YYYY-MM | null",
  "note": "string | null"
}
```

**Request body — action: delete:**
```json
{
  "action": "delete",
  "rule_id": "string"
}
```

**Headers bắt buộc:**
- `X-Internal-Secret`: internal secret key
- `X-User-Id`: ID người dùng đang thực hiện request
- `X-Group-Id`: ID workspace/org

> `type: percentage` — `value` là % doanh thu (VD: 10.5 = 10.5% DT)  
> `type: fixed_per_unit` — `value` là số tiền cố định per sản phẩm/buổi (VD: 50000 = 50k/buổi)  
> `min_revenue`: ngưỡng doanh thu tối thiểu để kích hoạt hoa hồng  
> `max_payout`: trần hoa hồng tối đa được nhận trong tháng

## Ví dụ

**Xem tất cả quy tắc hoa hồng:**
```json
{
  "action": "list"
}
```

**Xem quy tắc áp dụng cho dịch vụ cụ thể:**
```json
{
  "action": "list",
  "service_id": "svc_lieu_trinh_001"
}
```

**Tạo hoa hồng 10% DT cho phòng tư vấn:**
```json
{
  "action": "create",
  "name": "HH tư vấn 10% DT 2026",
  "type": "percentage",
  "value": 10,
  "apply_to": {
    "department_ids": ["dept_tu_van"],
    "service_ids": [],
    "staff_ids": []
  },
  "min_revenue": 5000000,
  "max_payout": 20000000,
  "effective_from": "2026-01",
  "effective_to": null,
  "note": "Áp dụng cho TVV khi DT tháng >= 5 triệu"
}
```

**Tạo hoa hồng cố định 50k/buổi cho KTV:**
```json
{
  "action": "create",
  "name": "HH KTV 50k/buổi dịch vụ trẻ hóa",
  "type": "fixed_per_unit",
  "value": 50000,
  "apply_to": {
    "department_ids": ["dept_ky_thuat"],
    "service_ids": ["svc_tre_hoa_da"],
    "staff_ids": []
  },
  "min_revenue": null,
  "max_payout": null,
  "effective_from": "2026-04",
  "effective_to": null,
  "note": null
}
```

**Sửa mức % hoa hồng:**
```json
{
  "action": "update",
  "rule_id": "cr_001",
  "value": 12,
  "effective_from": "2026-05"
}
```

**Xóa quy tắc hoa hồng cũ:**
```json
{
  "action": "delete",
  "rule_id": "cr_003"
}
```

## Output format

**action: list**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "rule_id": "cr_001",
        "name": "HH tư vấn 10% DT 2026",
        "type": "percentage",
        "type_label": "% Doanh thu",
        "value": 10,
        "value_display": "10%",
        "apply_to": {
          "departments": [{ "id": "dept_tu_van", "name": "Tư vấn" }],
          "services": [],
          "staff": []
        },
        "min_revenue": 5000000,
        "max_payout": 20000000,
        "effective_from": "2026-01",
        "effective_to": null,
        "status": "active",
        "note": "Áp dụng cho TVV khi DT tháng >= 5 triệu"
      },
      {
        "rule_id": "cr_002",
        "name": "HH KTV 50k/buổi dịch vụ trẻ hóa",
        "type": "fixed_per_unit",
        "type_label": "Cố định/đơn vị",
        "value": 50000,
        "value_display": "50,000đ/buổi",
        "apply_to": {
          "departments": [{ "id": "dept_ky_thuat", "name": "Kỹ thuật" }],
          "services": [{ "id": "svc_tre_hoa_da", "name": "Trẻ hóa da" }],
          "staff": []
        },
        "min_revenue": null,
        "max_payout": null,
        "effective_from": "2026-04",
        "effective_to": null,
        "status": "active",
        "note": null
      }
    ],
    "total": 2
  }
}
```

**action: create / update**
```json
{
  "success": true,
  "data": {
    "rule_id": "cr_005",
    "name": "HH tư vấn 10% DT 2026",
    "type": "percentage",
    "value": 10,
    "effective_from": "2026-01"
  },
  "message": "Tạo quy tắc hoa hồng thành công"
}
```

**action: delete**
```json
{
  "success": true,
  "message": "Đã xóa quy tắc hoa hồng 'HH cũ Q4 2025'"
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `MISSING_ACTION` | Thiếu field `action` | Truyền `action`: `list`, `get`, `create`, `update`, hoặc `delete` |
| `RULE_NOT_FOUND` | `rule_id` không tồn tại | Dùng `action: list` để lấy ID hợp lệ |
| `INVALID_TYPE` | `type` không phải `percentage` hoặc `fixed_per_unit` | Chỉ dùng hai loại trên |
| `INVALID_VALUE` | `value` <= 0 hoặc `percentage` > 100 | Kiểm tra lại giá trị hoa hồng |
| `INVALID_DATE_RANGE` | `effective_to` trước `effective_from` | Sửa lại khoảng thời gian áp dụng |
| `RULE_CONFLICT` | Đã có quy tắc khác áp dụng cùng phòng ban/dịch vụ trong cùng khoảng thời gian | Xóa hoặc giới hạn quy tắc cũ trước |
| `DEPARTMENT_NOT_FOUND` | Một `department_id` trong `apply_to` không hợp lệ | Dùng skill `list_departments` để lấy ID hợp lệ |
| `UNAUTHORIZED` | Thiếu hoặc sai header auth | Kiểm tra `X-Internal-Secret`, `X-User-Id`, `X-Group-Id` |
