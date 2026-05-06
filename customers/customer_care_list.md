---
name: customer_care_list
description: Danh sách khách hàng cần chăm sóc - lâu không đến, có sinh nhật sắp tới, có nợ chưa thanh toán, chưa được follow-up. Dùng khi user hỏi "khách nào cần gọi", "sinh nhật tuần này", "kh lâu không đến".
triggers:
  - "khách cần chăm sóc"
  - "kh cần gọi"
  - "follow up khách"
  - "sinh nhật khách"
  - "kh lâu không đến"
  - "danh sách cskh"
  - "nhắc nhở kh"
  - "kh có nợ"
endpoint: POST /internal/skills/customer_care_list
---

# Skill: customer_care_list

## Khi nào dùng
- Đầu ngày/tuần nhân viên muốn biết cần chăm sóc khách nào
- User hỏi danh sách khách cần gọi điện, nhắn tin
- User muốn tìm khách có sinh nhật để gửi lời chúc/voucher
- User muốn follow up khách lâu chưa quay lại
- User cần xử lý công nợ tồn đọng

## Cách dùng
1. Xác định loại chăm sóc (`care_type`):
   - `no_visit`: khách không đến trong N ngày (mặc định 30 ngày)
   - `birthday`: sinh nhật trong N ngày tới (mặc định 7 ngày)
   - `debt`: còn công nợ chưa thanh toán
   - `no_followup`: chưa được liên hệ (không có note/call log gần đây)
   - `all`: tất cả các loại trên
2. Trình bày kết quả theo nhóm, ưu tiên trường hợp cấp bách nhất

## Ví dụ

User: "Sinh nhật tuần này có khách nào không?"
→ `{"care_type": "birthday", "birthday_days_ahead": 7, "limit": 50}`

User: "Khách nào lâu không đến quá 45 ngày?"
→ `{"care_type": "no_visit", "no_visit_days": 45, "limit": 30}`

User: "Danh sách khách cần gọi hôm nay"
→ `{"care_type": "all", "no_visit_days": 30, "birthday_days_ahead": 3, "limit": 50}`

User: "Khách nào còn nợ?"
→ `{"care_type": "debt", "limit": 100}`

User: "Khách chưa được follow up tuần này"
→ `{"care_type": "no_followup", "limit": 30}`

## Output format
```json
{
  "ok": true,
  "data": {
    "summary": {
      "birthday_soon": 3,
      "no_visit": 12,
      "has_debt": 5,
      "no_followup": 8
    },
    "items": [
      {
        "customer_id": "uuid",
        "full_name": "Nguyễn Thị Lan",
        "phone": "0901xxx23",
        "care_reason": "birthday",
        "care_detail": "Sinh nhật ngày 25/04/2026 (còn 3 ngày)",
        "last_visit_at": "2026-04-01T10:00:00Z",
        "debt_amount": 0,
        "group": { "id": "grp-loyal-002", "name": "Thân thiết" },
        "priority": "HIGH"
      },
      {
        "customer_id": "uuid-2",
        "full_name": "Trần Văn Bình",
        "phone": "0912xxx78",
        "care_reason": "no_visit",
        "care_detail": "Chưa đến 52 ngày (lần cuối: 01/03/2026)",
        "last_visit_at": "2026-03-01T09:00:00Z",
        "debt_amount": 0,
        "group": { "id": "grp-vip-001", "name": "VIP" },
        "priority": "MEDIUM"
      },
      {
        "customer_id": "uuid-3",
        "full_name": "Phạm Thị Hoa",
        "phone": "0908xxx45",
        "care_reason": "debt",
        "care_detail": "Còn nợ 850.000đ từ ngày 15/03/2026",
        "last_visit_at": "2026-03-15T14:00:00Z",
        "debt_amount": 850000,
        "group": null,
        "priority": "HIGH"
      }
    ]
  }
}
```

## Lỗi thường gặp
- Danh sách rỗng với `no_visit`: tất cả khách đều đến gần đây → thông báo là tín hiệu tốt
- Danh sách rỗng với `birthday`: không có khách sinh nhật trong khoảng → tăng `birthday_days_ahead` lên 14-30
- `NO_WORKSPACE`: workspace chưa setup → hướng dẫn vào trang cài đặt
