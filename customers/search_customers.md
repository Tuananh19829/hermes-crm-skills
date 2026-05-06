---
name: search_customers
description: Tìm khách hàng theo tên, SĐT, tag hoặc nhóm khách hàng. Dùng khi user hỏi "tìm khách tên Hoa", "kh SĐT 0901", "tìm nhóm VIP", "khách tag thân thiết".
triggers:
  - "tìm khách hàng"
  - "tìm kh"
  - "search khách"
  - "khách tên"
  - "kh sdt"
  - "khách tag"
  - "khách nhóm"
  - "danh sách khách"
endpoint: POST /internal/skills/search_customers
---

# Skill: search_customers

## Khi nào dùng
- User muốn tìm một hoặc nhiều khách theo tên, SĐT, email, tag hoặc nhóm
- Đây là bước đầu tiên trước khi xem chi tiết — sau khi có ID mới dùng `get_customer_detail`
- KHÔNG dùng nếu user đã có ID khách → dùng `get_customer_detail` trực tiếp

## Cách dùng
1. Trích keyword từ câu user (tên, số điện thoại, tag)
2. Nếu user đề cập nhóm cụ thể (VIP, thân thiết) → thêm `filter.group_name`
3. Nếu user hỏi "lâu không đến" → thêm `filter.last_visit_before` (ngày hiện tại trừ số ngày)
4. Nếu user hỏi "sinh nhật tháng này" → thêm `filter.birthday_month`
5. Gọi endpoint, trình bày kết quả ngắn gọn (tên, SĐT, nhóm, điểm tích lũy)

## Ví dụ

User: "Tìm khách tên Lan"
→ `{"query": "Lan", "limit": 10}`

User: "Kh SĐT 0901"
→ `{"query": "0901", "limit": 10}`

User: "Khách nhóm VIP"
→ `{"query": "", "filter": {"group_name": "VIP"}, "limit": 20}`

User: "Khách có tag thân thiết"
→ `{"query": "", "filter": {"tag": "thân thiết"}, "limit": 20}`

User: "Khách sinh nhật tháng 4"
→ `{"query": "", "filter": {"birthday_month": 4}, "limit": 50}`

User: "Khách lâu không đến (hơn 30 ngày)"
→ Dùng skill `customer_care_list` với `care_type: "no_visit"` thay vì skill này

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 5,
    "customers": [
      {
        "id": "uuid",
        "full_name": "Nguyễn Thị Lan",
        "phone": "0901xxx23",
        "email": "lan***@gmail.com",
        "gender": "FEMALE",
        "birthday": "1992-04-10",
        "tags": ["thân thiết", "repeat"],
        "group": { "id": "uuid-group", "name": "Thân thiết" },
        "loyalty_points": 1250,
        "total_spent": 8500000,
        "last_visit_at": "2026-03-15T09:00:00Z",
        "created_at": "2025-06-01T08:00:00Z"
      }
    ]
  }
}
```

## Lỗi thường gặp
- `NO_WORKSPACE`: user chưa setup workspace CRM → gợi ý vào trang cài đặt
- Kết quả rỗng: thử bỏ filter, mở rộng query hoặc kiểm tra lại tên/SĐT
- Quá nhiều kết quả: thêm filter để thu hẹp (tag, nhóm, giới tính)
