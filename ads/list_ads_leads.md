---
name: list_ads_leads
description: Danh sách leads từ Ads theo nguồn/trạng thái/NV phụ trách
triggers:
  - "leads ads"
  - "leads facebook"
  - "leads quảng cáo"
  - "danh sách leads"
  - "list ads leads"
  - "leads chưa gọi"
  - "leads mới"
endpoint: POST /internal/skills/list_ads_leads
---

# Skill: list_ads_leads

## Khi nào dùng
- User hỏi xem danh sách leads từ quảng cáo
- Lọc theo kênh nguồn (Facebook, Google, Zalo, TikTok)
- Lọc theo trạng thái xử lý (mới, đã liên hệ, đã chốt, v.v.)
- Lọc theo nhân viên phụ trách
- KHÔNG dùng để tổng hợp số liệu → dùng `ads_dashboard`
- KHÔNG dùng để tìm khách thường → dùng `find_customer`

## Cách dùng
1. Trích xuất các bộ lọc từ câu hỏi user
2. Nếu user nói "hôm nay" → dùng `from_date` = ngày hôm nay
3. Nếu user đề cập NV cụ thể → resolve UUID nhân viên trước
4. Mặc định lấy 20 leads gần nhất nếu không có filter ngày

## Ví dụ
User: "Leads Facebook hôm nay chưa ai gọi?"
→ `{"source": "facebook", "status": "NEW", "from_date": "2026-04-22"}`

User: "Leads của NV Hoa tháng này"
→ `{"assigned_to": "<uuid_hoa>", "from_date": "2026-04-01", "to_date": "2026-04-30"}`

User: "Leads Zalo đã chốt tuần này?"
→ `{"source": "zalo", "status": "WON", "from_date": "2026-04-15"}`

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 18,
    "leads": [
      {
        "id": "uuid",
        "name": "Trần Thị B",
        "phone": "0912xxx45",
        "source": "facebook",
        "status": "NEW",
        "assigned_to": {"id": "uuid", "name": "Hoa"},
        "created_at": "2026-04-22T08:30:00Z",
        "campaign": "Quảng cáo tháng 4",
        "last_contact_at": null
      }
    ]
  }
}
```

## Lỗi thường gặp
- `NO_ADS_INTEGRATION`: chưa kết nối tài khoản Ads
- Kết quả rỗng với filter `status: NEW`: tất cả leads đã được xử lý — thông báo tốt
- `STAFF_NOT_FOUND`: UUID nhân viên không đúng → dùng `list_members` để tìm UUID
