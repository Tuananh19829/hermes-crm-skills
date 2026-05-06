---
name: ai_assistant_chat
description: Gửi câu hỏi đến AI Assistant CRM, nhận phân tích kinh doanh, gợi ý hành động và tư vấn chiến lược
triggers:
  - "hỏi ai"
  - "ai assistant"
  - "ai crm"
  - "phân tích giúp tôi"
  - "gợi ý ai"
  - "ai tư vấn"
  - "hỏi trợ lý ai"
  - "ai analyze"
  - "ai assistant chat"
  - "chat với ai"
  - "ai giúp tôi"
  - "ai nhận xét"
endpoint: POST /internal/skills/ai_assistant_chat
---

# Skill: ai_assistant_chat

## Khi nào dùng

Dùng khi người dùng muốn:
- Đặt câu hỏi tự do về tình hình kinh doanh và nhận phân tích từ AI
- Nhận gợi ý hành động cụ thể dựa trên dữ liệu CRM hiện tại
- Hỏi AI về chiến lược telesale, marketing hoặc chăm sóc khách hàng
- Nhận tóm tắt nhanh tình hình hoạt động và điểm cần cải thiện
- Yêu cầu AI soạn thảo nội dung (tin nhắn, kịch bản, email...)

## Cách dùng

**Request body:**
```json
{
  "message": "Câu hỏi hoặc yêu cầu của người dùng",
  "context": {
    "focus": "telesale | marketing | customer | revenue | kpi | general",
    "date_range": {
      "start": "2026-04-01",
      "end": "2026-04-22"
    },
    "branch_id": "uuid-chi-nhánh",
    "staff_id": "uuid-nhân-viên",
    "person_id": "uuid-khách-hàng"
  },
  "mode": "analyze | suggest | draft | summarize",
  "language": "vi",
  "max_tokens": 1000
}
```

- `message`: câu hỏi hoặc yêu cầu cụ thể (bắt buộc)
- `context.focus`: lĩnh vực AI cần tập trung phân tích
- `mode`: `"analyze"` = phân tích dữ liệu, `"suggest"` = gợi ý hành động, `"draft"` = soạn thảo nội dung, `"summarize"` = tóm tắt tình hình
- `language`: ngôn ngữ phản hồi (mặc định `"vi"` = tiếng Việt)
- `max_tokens`: giới hạn độ dài phản hồi (mặc định 1000)

**Headers bắt buộc:**
- `X-Internal-Secret`
- `X-User-Id`
- `X-Group-Id`

## Ví dụ

**Phân tích tình hình kinh doanh tháng này:**
```json
{
  "message": "Tháng này kinh doanh của tôi đang ở mức nào? Điểm nào cần cải thiện?",
  "context": {
    "focus": "revenue",
    "date_range": {
      "start": "2026-04-01",
      "end": "2026-04-22"
    }
  },
  "mode": "analyze"
}
```

**Gợi ý chiến lược telesale:**
```json
{
  "message": "Tỷ lệ bắt máy đang giảm, tôi nên làm gì để cải thiện?",
  "context": {
    "focus": "telesale"
  },
  "mode": "suggest"
}
```

**Soạn tin nhắn Zalo cho khách hàng:**
```json
{
  "message": "Soạn tin nhắn Zalo nhắc khách hàng quay lại làm dịch vụ, tone thân thiện",
  "context": {
    "focus": "customer",
    "person_id": "uuid-khách-hàng"
  },
  "mode": "draft"
}
```

**Tóm tắt nhanh hiệu suất nhân viên:**
```json
{
  "message": "Tóm tắt hiệu suất telesale tuần này của nhóm",
  "context": {
    "focus": "telesale",
    "date_range": {
      "start": "2026-04-15",
      "end": "2026-04-22"
    }
  },
  "mode": "summarize"
}
```

## Output format

```json
{
  "success": true,
  "data": {
    "response": "Dựa trên dữ liệu từ 01/04 đến 22/04/2026:\n\n**Tình hình hiện tại:**\n- Doanh thu đạt 285 triệu, tương đương 89% mục tiêu tháng\n- Còn 8 ngày để đạt thêm 35 triệu\n\n**Điểm tốt:**\n- Dịch vụ Triệt lông tăng 18% so với tháng trước\n- Tỷ lệ quay lại đạt 65%, cao hơn trung bình ngành\n\n**Cần cải thiện:**\n- Tỷ lệ no-show lịch hẹn đang ở 12%, nên nhắc lịch 2 lần qua Zalo\n- Chi nhánh Quận 3 chỉ đạt 76% mục tiêu, cần theo sát hơn",
    "mode": "analyze",
    "focus": "revenue",
    "data_sources_used": ["revenue_report", "booking_report", "kpi_overview"],
    "suggested_actions": [
      {
        "action": "Gửi Zalo nhắc lịch hẹn 24h và 2h trước",
        "priority": "high",
        "skill": "send_zalo_broadcast"
      },
      {
        "action": "Xem chi tiết KPI Chi nhánh Quận 3",
        "priority": "medium",
        "skill": "kpi_by_branch"
      }
    ],
    "tokens_used": 420,
    "generated_at": "2026-04-22T10:00:00Z"
  }
}
```

## Lỗi thường gặp

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `MISSING_MESSAGE` | Thiếu nội dung câu hỏi | Cung cấp `message` không trống |
| `INVALID_MODE` | `mode` không hợp lệ | Dùng: `analyze`, `suggest`, `draft`, `summarize` |
| `INVALID_FOCUS` | `focus` không hợp lệ | Dùng: `telesale`, `marketing`, `customer`, `revenue`, `kpi`, `general` |
| `AI_UNAVAILABLE` | AI service tạm thời không khả dụng | Thử lại sau vài phút |
| `CONTEXT_TOO_LARGE` | Ngữ cảnh yêu cầu quá nhiều dữ liệu | Thu hẹp `date_range` hoặc chọn `focus` cụ thể hơn |
| `COIN_INSUFFICIENT` | Hết coin AI để xử lý yêu cầu | Kiểm tra số dư coin trong AccountPage |
