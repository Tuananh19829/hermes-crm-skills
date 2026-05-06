---
name: get_customer_detail
description: Xem chi tiết khách hàng - thông tin cá nhân, lịch sử mua hàng, điểm loyalty, thẻ thành viên, công nợ. Dùng khi đã có ID hoặc user muốn tra toàn bộ hồ sơ khách.
triggers:
  - "chi tiết khách hàng"
  - "hồ sơ khách"
  - "xem thông tin kh"
  - "lịch sử khách"
  - "kh id"
  - "tra cứu khách"
  - "điểm khách"
  - "thẻ khách"
endpoint: POST /internal/skills/get_customer_detail
---

# Skill: get_customer_detail

## Khi nào dùng
- User muốn xem đầy đủ hồ sơ 1 khách hàng cụ thể
- Sau khi đã có ID từ `search_customers` hoặc user cung cấp trực tiếp
- Dùng khi cần xem lịch sử đơn hàng, số điểm tích lũy, thẻ, công nợ của 1 khách
- KHÔNG dùng để tìm kiếm nhiều khách → dùng `search_customers`

## Cách dùng
1. Đảm bảo có `id` của khách (từ `search_customers` hoặc user cung cấp)
2. Chọn các `include` section phù hợp với nhu cầu (mặc định: orders, notes, loyalty)
3. Nếu user hỏi về nợ → thêm `"debt"` vào include
4. Nếu user hỏi về voucher → thêm `"vouchers"` vào include
5. Trình bày thông tin theo mức độ ưu tiên user hỏi

## Ví dụ

User: "Xem hồ sơ kh Lan (id: abc-123)"
→ `{"id": "abc-123"}`

User: "Kh abc-123 còn nợ bao nhiêu?"
→ `{"id": "abc-123", "include": ["debt"]}`

User: "Kh abc-123 có voucher nào?"
→ `{"id": "abc-123", "include": ["vouchers"]}`

User: "Xem toàn bộ hồ sơ kh abc-123"
→ `{"id": "abc-123", "include": ["orders", "notes", "loyalty", "vouchers", "debt", "cards"]}`

## Output format
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "full_name": "Nguyễn Thị Lan",
    "phone": "0901xxx23",
    "email": "lan***@gmail.com",
    "gender": "FEMALE",
    "birthday": "1992-04-10",
    "address": "123 Đinh Tiên Hoàng, Q1, HCM",
    "note": "Khách thân thiết, thích dịch vụ chăm sóc da",
    "tags": ["thân thiết", "repeat"],
    "group": { "id": "uuid-group", "name": "Thân thiết" },
    "created_at": "2025-06-01T08:00:00Z",
    "loyalty": {
      "points_balance": 1250,
      "total_earned": 3000,
      "total_redeemed": 1750,
      "tier": "SILVER"
    },
    "debt": {
      "total_debt": 500000,
      "oldest_debt_at": "2026-03-01T00:00:00Z"
    },
    "recent_orders": [
      {
        "id": "uuid-order",
        "code": "ORD-2026-042",
        "status": "COMPLETED",
        "total": 1500000,
        "paid_amount": 1500000,
        "created_at": "2026-04-15T10:00:00Z"
      }
    ],
    "recent_notes": [
      {
        "id": "uuid-note",
        "content": "Đã gọi, khách hài lòng với liệu trình mới",
        "created_by": "Nhân viên A",
        "created_at": "2026-04-18T14:00:00Z"
      }
    ],
    "vouchers": [
      {
        "code": "BDAYLAN04",
        "type": "percent",
        "value": 20,
        "expires_at": "2026-04-30T23:59:59Z",
        "used": false
      }
    ],
    "cards": []
  }
}
```

## Lỗi thường gặp
- `NOT_FOUND`: ID không tồn tại hoặc không thuộc workspace này → thử tìm lại bằng `search_customers`
- `INVALID_UUID`: id không đúng format UUID → kiểm tra lại ID được cung cấp
