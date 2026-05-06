---
name: ai_analyze_customer
description: AI phân tích hành vi/sở thích KH, gợi ý dịch vụ phù hợp
triggers:
  - "phân tích khách"
  - "ai analyze"
  - "gợi ý dịch vụ"
  - "kh phù hợp gì"
  - "nhận xét khách"
  - "ai phân tích"
endpoint: POST /internal/skills/ai_analyze_customer
---

# Skill: ai_analyze_customer

## Khi nào dùng
- NV cần hiểu sâu hơn về hành vi, sở thích của khách trước khi tư vấn
- Muốn biết khách có nguy cơ churn (bỏ) hay tiềm năng upsell
- Cần gợi ý dịch vụ phù hợp với profile khách
- KHÔNG dùng để xem lịch sử đơn hàng đơn thuần → dùng `search_orders`
- KHÔNG dùng để gợi ý nội dung nhắn tin → dùng `ai_suggest_followup`

## Góc phân tích (focus)
| Value | Mô tả |
|-------|-------|
| `behavior` | Hành vi mua hàng, tần suất, kênh ưa thích |
| `preferences` | Sở thích dịch vụ, giờ đặt lịch, phương thức thanh toán |
| `lifetime_value` | Giá trị vòng đời, tiềm năng tăng trưởng |
| `churn_risk` | Nguy cơ bỏ đi (inactive, khiếu nại, v.v.) |
| `upsell` | Cơ hội bán thêm/nâng cấp dịch vụ |

## Cách dùng
1. Xác định person_id từ ngữ cảnh hoặc `find_customer`
2. Chọn `focus` phù hợp với câu hỏi của user (hoặc bỏ trống = phân tích toàn diện)
3. Trình bày kết quả AI dưới dạng bullet points dễ đọc

## Ví dụ
User: "Kh Lan phù hợp với dịch vụ gì?"
→ `{"person_id": "uuid_lan", "focus": "upsell"}`

User: "Phân tích toàn diện kh Hùng"
→ `{"person_id": "uuid_hung"}`

User: "KH nào có nguy cơ bỏ không quay lại?"
→ Dùng `find_customer` trước để lấy danh sách, sau đó gọi AI cho từng người

## Output format
```json
{
  "ok": true,
  "data": {
    "person_id": "uuid",
    "analysis": {
      "summary": "Khách hàng trung thành, tần suất cao, ưu tiên dịch vụ cao cấp",
      "behavior": "Đặt lịch đều đặn mỗi 3 tuần, thường vào sáng thứ 7",
      "preferences": ["facial treatment", "relaxation massage"],
      "lifetime_value": "HIGH",
      "churn_risk": "LOW",
      "upsell_opportunities": [
        "Gói liệu trình 10 buổi (tiết kiệm 15%)",
        "Dịch vụ chăm sóc da chuyên sâu mới ra"
      ]
    },
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp
- `INSUFFICIENT_DATA`: khách mới, ít lịch sử → kết quả phân tích sẽ kém chính xác, AI sẽ thông báo
- `AI_QUOTA_EXCEEDED`: hết coin AI tháng này → kiểm tra `get_plan_usage`
- `PERSON_NOT_FOUND`: person_id không đúng → dùng `find_customer` để tìm lại
