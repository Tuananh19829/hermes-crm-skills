---
name: find_customer
description: Tìm khách hàng theo tên, SĐT, email hoặc tag. Dùng khi user hỏi "tìm khách X", "kh nào tên Mai", "search customer 0901..."
triggers:
  - "tìm khách"
  - "tìm kh"
  - "lookup customer"
  - "kh tên"
  - "search contact"
  - "kh nào"
endpoint: POST /internal/skills/find_customer
---

# Skill: find_customer

## Khi nào dùng
- User hỏi tìm/lookup/search 1 hoặc nhiều khách hàng
- Input có thể là tên, SĐT, email hoặc một phần thông tin
- KHÔNG dùng nếu user hỏi chi tiết 1 khách đã biết ID → dùng `get_customer_detail`

## Cách dùng
1. Trích query từ câu hỏi user
2. Nếu user nói "khách mua tháng 3" → thêm filter `last_order_after: "2026-03-01"`
3. Nếu user nói "khách VIP" → thêm filter `tag: "VIP"`
4. Gọi endpoint với params

## Ví dụ
User: "Tìm khách tên Mai mua tháng này"
→ `{"query": "Mai", "filter": {"last_order_after": "2026-04-01"}}`

User: "Kh có tag VIP"
→ `{"query": "", "filter": {"tag": "VIP"}, "limit": 20}`

User: "Kh nào chưa chốt?"
→ `{"query": "", "filter": {"lead_status": "CONTACTED"}}`

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 3,
    "customers": [
      {
        "id": "uuid",
        "name": "Nguyễn Thị Mai",
        "phone": "0901xxx67",
        "email": "mai***@example.com",
        "person_type": "CUSTOMER",
        "lead_status": null,
        "tags": ["VIP", "repeat"],
        "tier": "NORMAL",
        "last_order_at": "2026-04-18T10:00:00Z",
        "lifetime_value": 3500000
      }
    ]
  }
}
```

## Lỗi thường gặp
- `NO_WORKSPACE`: user chưa có workspace CRM → gợi ý vào CRM setup
- Kết quả rỗng: mở rộng query hoặc bỏ filter
