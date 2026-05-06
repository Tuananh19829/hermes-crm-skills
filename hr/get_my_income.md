---
name: get_my_income
description: Nhân viên xem thu nhập bản thân theo tháng (lương cơ bản, hoa hồng, thưởng/phạt, tạm ứng đã trừ, thực lĩnh)
triggers:
  - "thu nhập của tôi"
  - "lương tháng này"
  - "my income"
  - "tôi được bao nhiêu"
  - "xem hoa hồng tôi"
  - "lương của tôi"
  - "tôi được lương bao nhiêu"
  - "hoa hồng tháng này của tôi"
  - "phiếu lương của tôi"
  - "tiền thưởng tôi được"
endpoint: POST /internal/skills/get_my_income
---

# Skill: get_my_income

## Khi nào dùng

Dùng khi chính nhân viên muốn:
- Xem chi tiết thu nhập tháng hiện tại hoặc tháng trước
- Tra cứu cơ cấu lương: lương cơ bản + phụ cấp + hoa hồng + thưởng − phạt − tạm ứng
- Xem hoa hồng từng dịch vụ đã thực hiện trong tháng
- Kiểm tra các khoản thưởng, phạt, tạm ứng ảnh hưởng đến lương
- So sánh thu nhập giữa các tháng
- Xem trạng thái chi lương (đã trả hay chưa)

> Skill này chỉ trả dữ liệu của chính nhân viên đang đăng nhập (xác định qua `X-User-Id`). Quản lý muốn xem lương của NV khác dùng skill `get_payroll`.

## Cách dùng

Gửi POST request với tháng cần tra cứu và tùy chọn hiển thị chi tiết.

**Request body:**
```json
{
  "month": "YYYY-MM",
  "include_commission_detail": true,
  "include_bonus_penalty_detail": true,
  "compare_previous_month": false
}
```

**Headers bắt buộc:**
- `X-Internal-Secret`: internal secret key
- `X-User-Id`: ID nhân viên đang đăng nhập (dùng để xác định "tôi là ai")
- `X-Group-Id`: ID workspace/org

> Nếu không truyền `month`, hệ thống tự lấy tháng hiện tại.  
> `include_commission_detail`: true → trả về từng dòng hoa hồng theo dịch vụ.  
> `compare_previous_month`: true → thêm block so sánh với tháng trước.

## Ví dụ

**Xem lương tháng này:**
```json
{
  "month": "2026-04"
}
```

**Xem lương tháng 3 kèm chi tiết hoa hồng:**
```json
{
  "month": "2026-03",
  "include_commission_detail": true,
  "include_bonus_penalty_detail": true
}
```

**Xem và so sánh với tháng trước:**
```json
{
  "month": "2026-04",
  "compare_previous_month": true
}
```

**Xem chi tiết hoa hồng từng dịch vụ tháng 4:**
```json
{
  "month": "2026-04",
  "include_commission_detail": true,
  "include_bonus_penalty_detail": false,
  "compare_previous_month": false
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "staff": {
      "staff_id": "staff_abc123",
      "employee_code": "NV001",
      "full_name": "Nguyễn Thị Hoa",
      "department": "Lễ tân",
      "role": "Lễ tân viên"
    },
    "month": "2026-04",
    "summary": {
      "base_salary": 7000000,
      "total_allowance": 800000,
      "kpi_pct": 105,
      "kpi_multiplier": 1.2,
      "salary_after_kpi": 8400000,
      "total_commission": 3200000,
      "total_bonus": 500000,
      "total_penalty": 200000,
      "total_advance": 1000000,
      "gross_income": 12900000,
      "net_income": 11700000,
      "paid_status": "unpaid",
      "pay_date": null
    },
    "allowances": [
      { "label": "Phụ cấp ăn trưa", "amount": 500000 },
      { "label": "Phụ cấp đi lại", "amount": 300000 }
    ],
    "commission_detail": [
      {
        "service_name": "Liệu trình trẻ hóa da",
        "sessions_count": 12,
        "rule": "50,000đ/buổi",
        "amount": 600000
      },
      {
        "service_name": "Tư vấn gói liệu trình 6 tháng",
        "revenue": 25000000,
        "rule": "10% DT",
        "amount": 2500000
      },
      {
        "service_name": "Dịch vụ điều trị mụn",
        "sessions_count": 2,
        "rule": "50,000đ/buổi",
        "amount": 100000
      }
    ],
    "bonus_penalty_detail": [
      {
        "type": "bonus",
        "category": "Nhân viên xuất sắc tháng",
        "amount": 500000,
        "issued_by": "Trần Quản Lý",
        "date": "2026-04-15",
        "note": "Đạt KPI 105%, được KH đánh giá 5 sao"
      },
      {
        "type": "penalty",
        "category": "Đi muộn không phép",
        "amount": 200000,
        "issued_by": "Trần Quản Lý",
        "date": "2026-04-08",
        "note": "Đi muộn 2 lần trong tháng"
      }
    ],
    "advance_detail": [
      {
        "advance_id": "adv_001",
        "amount": 1000000,
        "advance_date": "2026-04-10",
        "deduct_month": "2026-04",
        "reason": "Chi phí khám bệnh"
      }
    ],
    "compare_previous_month": {
      "month": "2026-03",
      "net_income": 10500000,
      "change_amount": 1200000,
      "change_pct": 11.4,
      "direction": "up"
    }
  }
}
```

**Khi lương đã được chi trả:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "net_income": 11700000,
      "paid_status": "paid",
      "pay_date": "2026-04-30",
      "payment_method": "bank_transfer",
      "bank_ref": "SPACLAW20260430NV001"
    }
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `STAFF_NOT_FOUND` | `X-User-Id` không khớp với nhân viên nào trong workspace | Kiểm tra `X-User-Id` và `X-Group-Id` |
| `PAYROLL_NOT_GENERATED` | Bảng lương tháng đó chưa được tính | Liên hệ quản lý để chốt lương tháng |
| `INVALID_MONTH` | `month` sai định dạng hoặc là tháng tương lai | Dùng định dạng `YYYY-MM`, không tra tháng chưa đến |
| `COMMISSION_NOT_CALCULATED` | Hoa hồng tháng chưa được tính (chưa đến kỳ chốt) | Dữ liệu hoa hồng sẽ có sau ngày chốt hoa hồng hàng tháng |
| `NO_SALARY_POLICY` | NV chưa được gán chính sách lương | Liên hệ quản lý cấu hình chính sách lương qua skill `manage_salary_policy` |
| `UNAUTHORIZED` | Thiếu hoặc sai header auth | Kiểm tra `X-Internal-Secret`, `X-User-Id`, `X-Group-Id` |
