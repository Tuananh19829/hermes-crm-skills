---
name: zalo_live_chat
description: Xem danh sách hội thoại Zalo OA, tin nhắn gần đây, và nhận gợi ý AI reply cho từng khách hàng
triggers:
  - "chat zalo"
  - "tin nhắn zalo"
  - "hội thoại zalo"
  - "zalo live chat"
  - "zalo inbox"
  - "khách nhắn zalo"
  - "zalo chưa trả lời"
  - "gợi ý reply zalo"
  - "ai reply zalo"
  - "xem tin nhắn zalo"
endpoint: POST /internal/skills/zalo_live_chat
---

# Skill: zalo_live_chat

## Khi nào dùng

Dùng khi người dùng muốn:
- Xem danh sách hội thoại Zalo đang chờ phản hồi
- Đọc lịch sử tin nhắn của 1 khách hàng cụ thể trên Zalo
- Nhận gợi ý nội dung reply từ AI dựa trên ngữ cảnh hội thoại
- Lọc hội thoại chưa được đọc hoặc chưa được trả lời
- Xem thống kê hội thoại Zalo trong ngày

## Cách dùng

**Request body:**
```json
{
  "action": "list_conversations | get_messages | suggest_reply | mark_read",
  "conversation_id": "uuid-hội-thoại",
  "person_id": "uuid-khách-hàng",
  "filter": "all | unread | unanswered | today",
  "message_limit": 20,
  "suggest_context": "Ngữ cảnh bổ sung cho AI gợi ý reply",
  "sort_by": "last_message | unread_count",
  "sort_order": "desc",
  "limit": 30
}
```

- `action`: `"list_conversations"` = danh sách hội thoại, `"get_messages"` = lịch sử tin nhắn, `"suggest_reply"` = AI gợi ý trả lời, `"mark_read"` = đánh dấu đã đọc
- `filter`: lọc hội thoại theo trạng thái (dùng với `list_conversations`)
- `conversation_id` hoặc `person_id`: xác định hội thoại cụ thể (dùng với `get_messages`, `suggest_reply`, `mark_read`)
- `suggest_context`: thêm ngữ cảnh cho AI khi gợi ý reply (tùy chọn)

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Xem danh sách hội thoại chưa trả lời:**
```json
{
  "action": "list_conversations",
  "filter": "unanswered",
  "sort_by": "last_message",
  "sort_order": "desc",
  "limit": 20
}
```

**Xem tin nhắn của 1 khách hàng:**
```json
{
  "action": "get_messages",
  "person_id": "uuid-khách-hàng",
  "message_limit": 20
}
```

**AI gợi ý nội dung trả lời:**
```json
{
  "action": "suggest_reply",
  "conversation_id": "uuid-hội-thoại",
  "suggest_context": "Khách hỏi về giá dịch vụ triệt lông"
}
```

**Đánh dấu đã đọc:**
```json
{
  "action": "mark_read",
  "conversation_id": "uuid-hội-thoại"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "conversation_id": "uuid-conv-1",
        "person_id": "uuid-person-1",
        "person_name": "Nguyễn Thị A",
        "phone": "0901234567",
        "zalo_display_name": "Thị A",
        "last_message": "Cho em hỏi giá triệt lông nách ạ?",
        "last_message_at": "2026-04-22T09:30:00Z",
        "unread_count": 2,
        "is_answered": false,
        "tags": ["leads-fb", "quan-tâm"]
      }
    ],
    "messages": [
      {
        "message_id": "msg-001",
        "direction": "inbound",
        "content": "Cho em hỏi giá triệt lông nách ạ?",
        "sent_at": "2026-04-22T09:30:00Z",
        "read": false
      },
      {
        "message_id": "msg-000",
        "direction": "outbound",
        "content": "Xin chào! Em có thể tư vấn cho anh/chị ạ",
        "sent_at": "2026-04-22T08:00:00Z",
        "read": true
      }
    ],
    "ai_suggestions": [
      {
        "suggestion": "Dạ giá dịch vụ triệt lông nách bằng công nghệ Diode Laser tại Spaclaw là 500.000đ/lần hoặc gói 6 lần chỉ 2.400.000đ anh/chị ạ. Anh/chị có muốn đặt lịch tư vấn miễn phí không ạ?",
        "tone": "friendly",
        "confidence": 0.92
      },
      {
        "suggestion": "Chào anh/chị! Dịch vụ triệt lông nách Diode Laser tại Spaclaw có giá ưu đãi từ 500k/lần, cam kết hiệu quả sau 6-8 buổi. Spaclaw đang có ưu đãi 20% cho khách mới, anh/chị muốn đặt lịch không ạ?",
        "tone": "promotional",
        "confidence": 0.85
      }
    ],
    "stats": {
      "total_conversations_today": 28,
      "unanswered": 8,
      "avg_response_time_minutes": 12
    }
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `INVALID_ACTION` | `action` không hợp lệ | Dùng: `list_conversations`, `get_messages`, `suggest_reply`, `mark_read` |
| `ZALO_NOT_CONNECTED` | Chưa kết nối Zalo OA | Dùng `manage_ads_settings` để kết nối trước |
| `CONVERSATION_NOT_FOUND` | `conversation_id` không tồn tại | Kiểm tra lại UUID hội thoại |
| `PERSON_NOT_FOUND` | `person_id` không tồn tại hoặc chưa liên kết Zalo | Kiểm tra lại UUID khách hàng |
| `INVALID_FILTER` | `filter` không hợp lệ | Dùng: `all`, `unread`, `unanswered`, `today` |
| `AI_SUGGEST_FAILED` | Không có đủ ngữ cảnh để AI gợi ý | Cung cấp thêm `suggest_context` |
