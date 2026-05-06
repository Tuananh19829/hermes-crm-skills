---
name: list_service_cards
description: Danh sách thẻ dịch vụ của một khách hàng - số dư, ngày hết hạn, loại thẻ (tiền hoặc buổi). Dùng khi user hỏi "kh X có thẻ gì", "thẻ dịch vụ của Mai", "số dư thẻ".
triggers:
  - "thẻ dịch vụ"
  - "service card"
  - "thẻ của kh"
  - "số dư thẻ"
  - "thẻ KH"
  - "danh sách thẻ"
endpoint: POST /internal/skills/list_service_cards
---

# Skill: list_service_cards

## Khi nào dùng
- User hỏi khách hàng đang có thẻ nào, còn bao nhiêu tiền/buổi trong thẻ
- Cần biết `card_id` trước khi nạp thẻ bằng `deposit_card`
- Kiểm tra thẻ sắp hết hạn hoặc đã dùng hết
- Có 2 loại thẻ: **VALUE** (thẻ tiền — dùng thanh toán dịch vụ bất kỳ) và **SESSION** (thẻ buổi — gắn với dịch vụ cụ thể)

## Cách dùng
1. Truyền `person_id` để lấy thẻ của 1 KH
2. `status: "ACTIVE"` (mặc định) — chỉ thẻ còn hiệu lực
3. `status: "ALL"` — kể cả thẻ hết hạn/cạn kiệt
4. `card_type` để lọc theo loại: `VALUE` hoặc `SESSION`

## Ví dụ

User: "Chị Mai có thẻ dịch vụ không?"
→ Tìm person_id Mai → `{"person_id": "uuid-mai"}`

User: "Kh A còn bao nhiêu trong thẻ tiền?"
→ `{"person_id": "uuid-a", "card_type": "VALUE"}`

User: "Thẻ buổi nào sắp hết?"
→ `{"card_type": "SESSION", "status": "ACTIVE"}`

User: "Lịch sử thẻ của kh B kể cả đã hết"
→ `{"person_id": "uuid-b", "status": "ALL"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 2,
    "cards": [
      {
        "id": "card-uuid-1",
        "card_type": "VALUE",
        "name": "Thẻ tích luỹ Vàng",
        "balance": 2500000,
        "total_deposited": 5000000,
        "total_spent": 2500000,
        "status": "ACTIVE",
        "expires_at": "2027-04-22",
        "person": { "id": "uuid-mai", "name": "Nguyễn Thị Mai" },
        "created_at": "2026-04-01T08:00:00Z"
      },
      {
        "id": "card-uuid-2",
        "card_type": "SESSION",
        "name": "Thẻ 10 buổi Peel da",
        "linked_service": { "id": "svc-uuid", "name": "Peel da AHA" },
        "sessions_total": 10,
        "sessions_used": 3,
        "sessions_remaining": 7,
        "status": "ACTIVE",
        "expires_at": "2026-10-01",
        "person": { "id": "uuid-mai", "name": "Nguyễn Thị Mai" },
        "created_at": "2026-04-01T08:30:00Z"
      }
    ]
  }
}
```

## Lỗi thường gặp
- `PERSON_NOT_FOUND`: person_id sai → tìm lại bằng `find_customer`
- Kết quả rỗng: KH chưa có thẻ hoặc tất cả đã hết hạn → dùng `status: "ALL"` để kiểm tra
- Thẻ VALUE `balance = 0`: cần nạp thêm → dùng `deposit_card`
- Để nạp tiền/buổi → lấy `card.id` và gọi `deposit_card`
