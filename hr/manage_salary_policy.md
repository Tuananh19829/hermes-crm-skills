---
name: manage_salary_policy
description: Xem/tạo/sửa chính sách lương (lương cơ bản, phụ cấp, quy tắc KPI, hệ số) áp dụng theo phòng ban hoặc cá nhân
triggers:
  - "chính sách lương"
  - "cấu hình lương"
  - "salary policy"
  - "hệ số lương"
  - "phụ cấp"
  - "lương cơ bản"
  - "quy tắc kpi lương"
  - "thêm chính sách lương"
  - "sửa chính sách lương"
endpoint: POST /internal/skills/manage_salary_policy
---

# Skill: manage_salary_policy

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem danh sách chính sách lương hiện hành của từng phòng ban hoặc cá nhân
- Tạo mới chính sách lương: lương cơ bản, phụ cấp cố định, hệ số KPI
- Sửa mức lương cơ bản, điều chỉnh phụ cấp hoặc cập nhật hệ số nhân KPI
- Gán chính sách lương cho nhân viên hoặc phòng ban cụ thể
- Xem chi tiết cấu trúc lương của một chính sách

## Cách dùng

Gửi POST request với `action` xác định thao tác. Các action hợp lệ: `list`, `get`, `create`, `update`.

**Request body — action: list:**
```json
{
  "action": "list",
  "department_id": "string | null"
}
```

**Request body — action: get:**
```json
{
  "action": "get",
  "policy_id": "string"
}
```

**Request body — action: create:**
```json
{
  "action": "create",
  "name": "string",
  "base_salary": 7000000,
  "allowances": [
    { "label": "Phụ cấp ăn trưa", "amount": 500000 },
    { "label": "Phụ cấp đi lại", "amount": 300000 }
  ],
  "kpi_rules": [
    { "from_pct": 0,   "to_pct": 79,  "multiplier": 0.8 },
    { "from_pct": 80,  "to_pct": 99,  "multiplier": 1.0 },
    { "from_pct": 100, "to_pct": 999, "multiplier": 1.2 }
  ],
  "apply_to": {
    "department_id": "string | null",
    "staff_ids": ["string"] 
  },
  "effective_from": "YYYY-MM",
  "note": "string | null"
}
```

**Request body — action: update:**
```json
{
  "action": "update",
  "policy_id": "string",
  "name": "string | null",
  "base_salary": "number | null",
  "allowances": "array | null",
  "kpi_rules": "array | null",
  "effective_from": "YYYY-MM | null",
  "note": "string | null"
}
```

**Headers bắt buộc:**
- `X-Internal-Secret`: internal secret key
- `X-User-Id`: ID người dùng đang thực hiện request
- `X-Group-Id`: ID workspace/org

> `kpi_rules.multiplier`: hệ số nhân lương cơ bản. VD: 1.2 = lương cơ bản × 1.2 khi KPI >= 100%

## Ví dụ

**Xem tất cả chính sách lương:**
```json
{
  "action": "list"
}
```

**Xem chính sách lương phòng lễ tân:**
```json
{
  "action": "list",
  "department_id": "dept_le_tan"
}
```

**Tạo chính sách lương kỹ thuật viên:**
```json
{
  "action": "create",
  "name": "Lương KTV cơ bản 2026",
  "base_salary": 8000000,
  "allowances": [
    { "label": "Phụ cấp chuyên môn", "amount": 800000 },
    { "label": "Phụ cấp ăn trưa", "amount": 500000 }
  ],
  "kpi_rules": [
    { "from_pct": 0,   "to_pct": 79,  "multiplier": 0.85 },
    { "from_pct": 80,  "to_pct": 99,  "multiplier": 1.0  },
    { "from_pct": 100, "to_pct": 119, "multiplier": 1.15 },
    { "from_pct": 120, "to_pct": 999, "multiplier": 1.3  }
  ],
  "apply_to": {
    "department_id": "dept_ky_thuat",
    "staff_ids": []
  },
  "effective_from": "2026-05",
  "note": "Áp dụng từ tháng 5/2026 cho toàn bộ KTV"
}
```

**Điều chỉnh lương cơ bản một chính sách:**
```json
{
  "action": "update",
  "policy_id": "pol_001",
  "base_salary": 8500000,
  "effective_from": "2026-06"
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
        "policy_id": "pol_001",
        "name": "Lương lễ tân cơ bản 2026",
        "base_salary": 7000000,
        "total_allowance": 800000,
        "allowances": [
          { "label": "Phụ cấp ăn trưa", "amount": 500000 },
          { "label": "Phụ cấp đi lại", "amount": 300000 }
        ],
        "kpi_rules_count": 3,
        "apply_to_department": "Lễ tân",
        "staff_count": 3,
        "effective_from": "2026-01",
        "created_at": "2025-12-15T10:00:00Z"
      }
    ],
    "total": 1
  }
}
```

**action: get**
```json
{
  "success": true,
  "data": {
    "policy_id": "pol_001",
    "name": "Lương lễ tân cơ bản 2026",
    "base_salary": 7000000,
    "allowances": [
      { "label": "Phụ cấp ăn trưa", "amount": 500000 },
      { "label": "Phụ cấp đi lại", "amount": 300000 }
    ],
    "kpi_rules": [
      { "from_pct": 0,   "to_pct": 79,  "multiplier": 0.8, "label": "KPI < 80%: nhân 0.8" },
      { "from_pct": 80,  "to_pct": 99,  "multiplier": 1.0, "label": "KPI 80–99%: nhân 1.0" },
      { "from_pct": 100, "to_pct": 999, "multiplier": 1.2, "label": "KPI >= 100%: nhân 1.2" }
    ],
    "apply_to": {
      "department": { "id": "dept_le_tan", "name": "Lễ tân" },
      "staff_ids": []
    },
    "effective_from": "2026-01",
    "note": null,
    "created_at": "2025-12-15T10:00:00Z",
    "updated_at": "2026-02-01T08:00:00Z"
  }
}
```

**action: create / update**
```json
{
  "success": true,
  "data": {
    "policy_id": "pol_005",
    "name": "Lương KTV cơ bản 2026",
    "base_salary": 8000000,
    "effective_from": "2026-05"
  },
  "message": "Tạo chính sách lương thành công"
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `MISSING_ACTION` | Thiếu field `action` | Truyền `action`: `list`, `get`, `create`, hoặc `update` |
| `POLICY_NOT_FOUND` | `policy_id` không tồn tại | Dùng `action: list` để lấy ID hợp lệ |
| `INVALID_BASE_SALARY` | `base_salary` <= 0 hoặc không phải số | Truyền số nguyên dương (VD: 7000000) |
| `INVALID_KPI_RULES` | Khoảng `from_pct`–`to_pct` bị chồng lấp hoặc lỗ hổng | Đảm bảo các khoảng KPI liên tục và không chồng nhau |
| `INVALID_MULTIPLIER` | `multiplier` <= 0 | Hệ số nhân phải là số dương (VD: 0.8, 1.0, 1.2) |
| `DEPARTMENT_NOT_FOUND` | `department_id` không hợp lệ | Dùng skill `list_departments` để lấy ID |
| `POLICY_NAME_DUPLICATE` | Tên chính sách đã tồn tại | Đổi tên hoặc thêm năm/tháng vào tên |
| `UNAUTHORIZED` | Thiếu hoặc sai header auth | Kiểm tra `X-Internal-Secret`, `X-User-Id`, `X-Group-Id` |
