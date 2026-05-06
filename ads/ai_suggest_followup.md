---
name: ai_suggest_followup
description: AI gợi ý nội dung follow-up phù hợp cho khách hàng cụ thể
triggers:
  - "gợi ý follow-up"
  - "nhắn gì cho kh"
  - "follow up kh"
  - "ai suggest"
  - "nên liên hệ thế nào"
  - "ai gợi ý"
endpoint: POST /internal/skills/ai_suggest_followup
---

# Skill: ai_suggest_followup

## Khi nào dùng
- NV không biết nên nhắn gì / nói gì khi liên hệ lại với khách
- Cần soạn tin Zalo, script gọi điện hoặc nội dung email phù hợp
- Muốn AI đề xuất thời điểm và kênh liên hệ tốt nhất
- KHÔNG dùng để phân tích hành vi sâu → dùng `ai_analyze_customer`

## Kênh liên hệ (channel)
| Value | Mô tả |
|-------|-------|
| `zalo` | Soạn tin nhắn Zalo |
| `call` | Gợi ý script/điểm cần nói khi gọi điện |
| `email` | Soạn nội dung email |
| `any` | AI tự chọn kênh phù hợp nhất (mặc định) |

## Cách dùng
1. Xác định person_id
2. Cung cấp `context` nếu có thêm thông tin ngữ cảnh (ví dụ: khách vừa hỏi về dịch vụ, vừa khiếu nại)
3. Chọn `channel` nếu user chỉ định kênh cụ thể
4. Trình bày gợi ý AI và hỏi user có muốn gửi ngay không

## Ví dụ
User: "Nên nhắn gì cho kh Lan hôm nay?"
→ `{"person_id": "uuid_lan", "channel": "any"}`

User: "Soạn tin Zalo follow-up cho kh B vừa hỏi về gói liệu trình"
→ `{"person_id": "uuid_b", "channel": "zalo", "context": "Khách vừa hỏi về gói liệu trình da mặt"}`

User: "Script gọi điện cho kh chưa mua 2 tháng?"
→ `{"person_id": "uuid", "channel": "call", "context": "Khách inactive 2 tháng, từng mua gói massage"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "person_id": "uuid",
    "recommended_channel": "zalo",
    "recommended_time": "Chiều nay 14:00-16:00 (khách thường online giờ này)",
    "suggestions": [
      {
        "type": "message_draft",
        "content": "Chào chị Lan, cơ sở em vừa ra dịch vụ chăm sóc da chuyên sâu mới. Biết chị hay quan tâm đến facial nên muốn thông báo sớm. Chị có muốn em giữ lịch thử miễn phí 1 buổi không ạ?"
      },
      {
        "type": "talking_point",
        "content": "Nhắc lại lần trước chị khen hiệu quả của dịch vụ X → bridge sang offer mới"
      }
    ],
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp
- `INSUFFICIENT_DATA`: khách mới, chưa có lịch sử → AI sẽ gợi ý generic, nên thêm `context` cụ thể
- `AI_QUOTA_EXCEEDED`: hết coin AI → kiểm tra `get_plan_usage`
- `PERSON_NOT_FOUND`: person_id sai → dùng `find_customer` để tìm lại UUID
