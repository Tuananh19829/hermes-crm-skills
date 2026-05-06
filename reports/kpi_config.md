---
name: kpi_config
description: Xem hoặc cập nhật cấu hình mục tiêu KPI (doanh thu mục tiêu, số lịch hẹn, khách hàng mới) theo tháng/chi nhánh
triggers:
  - "cấu hình kpi"
  - "đặt mục tiêu kpi"
  - "mục tiêu doanh thu"
  - "thiết lập kpi"
  - "kpi config"
  - "xem mục tiêu"
  - "cập nhật mục tiêu"
  - "target tháng"
  - "set kpi"
  - "mục tiêu chi nhánh"
endpoint: POST /internal/skills/kpi_config
---

# Skill: kpi_config

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem cấu hình mục tiêu KPI hiện tại cho tháng/chi nhánh
- Cập nhật mục tiêu doanh thu, số lịch hẹn, số khách hàng mới cho tháng tới
- Thiết lập KPI lần đầu cho chi nhánh mới
- Sao chép cấu hình KPI từ tháng trước sang tháng mới
- Xem lịch sử thay đổi mục tiêu KPI

## Cách dùng

**Request body:**
```json
{
  "action": "get | set | copy_from_previous",
  "month": "2026-05",
  "branch_id": "uuid-chi-nhánh",
  "targets": {
    "revenue": 160000000,
    "bookings": 300,
    "new_customers": 40,
    "satisfaction_min": 4.5
  },
  "copy_month": "2026-04",
  "apply_to_all_branches": false
}
```

- `action`: `"get"` = xem cấu hình, `"set"` = cập nhật, `"copy_from_previous"` = sao chép từ tháng trước
- `branch_id`: chi nhánh cụ thể (bỏ trống khi `apply_to_all_branches = true`)
- `targets`: các chỉ tiêu KPI cần đặt (dùng khi `action = "set"`)
- `copy_month`: tháng nguồn khi `action = "copy_from_previous"` (mặc định = tháng hiện tại)
- `apply_to_all_branches`: áp dụng cho tất cả chi nhánh cùng lúc

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Xem mục tiêu KPI tháng 5:**
```json
{
  "action": "get",
  "month": "2026-05"
}
```

**Đặt mục tiêu cho chi nhánh cụ thể:**
```json
{
  "action": "set",
  "month": "2026-05",
  "branch_id": "uuid-chi-nhánh",
  "targets": {
    "revenue": 180000000,
    "bookings": 320,
    "new_customers": 45,
    "satisfaction_min": 4.5
  }
}
```

**Sao chép KPI tháng 4 sang tháng 5 cho tất cả chi nhánh:**
```json
{
  "action": "copy_from_previous",
  "month": "2026-05",
  "copy_month": "2026-04",
  "apply_to_all_branches": true
}
```

**Đặt mục tiêu cho tất cả chi nhánh:**
```json
{
  "action": "set",
  "month": "2026-05",
  "apply_to_all_branches": true,
  "targets": {
    "revenue": 150000000,
    "bookings": 280,
    "new_customers": 35
  }
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "action": "get",
    "month": "2026-05",
    "configs": [
      {
        "branch_id": "uuid-branch-1",
        "branch_name": "Chi nhánh Quận 1",
        "targets": {
          "revenue": 180000000,
          "bookings": 320,
          "new_customers": 45,
          "satisfaction_min": 4.5
        },
        "configured_by": "uuid-user-manager",
        "configured_at": "2026-04-20T09:00:00Z",
        "last_modified_at": "2026-04-21T14:30:00Z"
      },
      {
        "branch_id": "uuid-branch-2",
        "branch_name": "Chi nhánh Quận 3",
        "targets": {
          "revenue": 150000000,
          "bookings": 260,
          "new_customers": 38,
          "satisfaction_min": 4.5
        },
        "configured_by": "uuid-user-manager",
        "configured_at": "2026-04-20T09:00:00Z",
        "last_modified_at": "2026-04-20T09:00:00Z"
      }
    ]
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_ACTION` | `action` không hợp lệ | Dùng: `get`, `set`, `copy_from_previous` |
| `INVALID_MONTH_FORMAT` | Định dạng tháng sai | Dùng `YYYY-MM` |
| `BRANCH_NOT_FOUND` | `branch_id` không tồn tại | Kiểm tra lại UUID chi nhánh |
| `MISSING_TARGETS` | `action = "set"` nhưng không có `targets` | Cung cấp ít nhất một chỉ tiêu trong `targets` |
| `PERMISSION_DENIED` | Người dùng không có quyền sửa KPI config | Chỉ Manager và Admin mới được phép |
| `COPY_SOURCE_NOT_FOUND` | Tháng nguồn chưa có cấu hình | Thay bằng `action = "set"` và nhập thủ công |
