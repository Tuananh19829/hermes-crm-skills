---
name: list_customer_groups
description: Liệt kê các nhóm khách hàng (VIP, thân thiết, mới, v.v.), số lượng thành viên và tiêu chí xếp hạng. Dùng khi user hỏi về phân loại nhóm khách, tier khách hàng.
triggers:
  - "nhóm khách hàng"
  - "danh sách nhóm kh"
  - "tier khách"
  - "phân loại khách"
  - "nhóm VIP"
  - "nhóm thân thiết"
  - "xếp hạng kh"
  - "customer group"
endpoint: POST /internal/skills/list_customer_groups
---

# Skill: list_customer_groups

## Khi nào dùng
- User hỏi có những nhóm khách hàng nào trong hệ thống
- User muốn biết tiêu chí để xếp vào nhóm VIP/thân thiết/mới
- User cần lấy `group_id` để dùng trong `search_customers` hoặc `update_customer`
- User hỏi số lượng khách trong từng nhóm

## Cách dùng
1. Gọi endpoint để lấy toàn bộ danh sách nhóm
2. Nếu chỉ cần xem nhanh → `include_members_count: false` để tăng tốc
3. Nếu cần biết tiêu chí xếp hạng → giữ `include_criteria: true` (mặc định)
4. Dùng `group_id` từ kết quả để truyền vào skill khác

## Ví dụ

User: "Có những nhóm khách nào?"
→ `{"include_members_count": true, "include_criteria": true}`

User: "Bao nhiêu khách VIP?"
→ `{"include_members_count": true}` → lọc group tên VIP từ kết quả

User: "Tiêu chí để thành khách thân thiết là gì?"
→ `{"include_criteria": true}` → đọc criteria của group "thân thiết"

## Output format
```json
{
  "ok": true,
  "data": {
    "total": 4,
    "groups": [
      {
        "id": "grp-vip-001",
        "name": "VIP",
        "description": "Khách hàng chi tiêu cao, ưu tiên chăm sóc đặc biệt",
        "members_count": 23,
        "criteria": {
          "min_total_spent": 10000000,
          "min_orders": 5,
          "description": "Chi tiêu tích lũy trên 10 triệu HOẶC mua từ 5 đơn trở lên"
        },
        "benefits": ["ưu tiên đặt lịch", "giảm giá 10%", "tặng điểm x2"],
        "created_at": "2025-01-01T00:00:00Z"
      },
      {
        "id": "grp-loyal-002",
        "name": "Thân thiết",
        "description": "Khách hàng thường xuyên, đến ít nhất 1 lần/tháng",
        "members_count": 87,
        "criteria": {
          "min_visits_per_month": 1,
          "min_total_spent": 3000000,
          "description": "Tối thiểu 1 lần/tháng VÀ chi tiêu tổng trên 3 triệu"
        },
        "benefits": ["giảm giá 5%", "tặng điểm x1.5"],
        "created_at": "2025-01-01T00:00:00Z"
      },
      {
        "id": "grp-new-003",
        "name": "Mới",
        "description": "Khách hàng đăng ký trong 30 ngày gần nhất",
        "members_count": 156,
        "criteria": {
          "registered_within_days": 30
        },
        "benefits": ["voucher chào mừng 10%"],
        "created_at": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

## Lỗi thường gặp
- `NO_WORKSPACE`: workspace chưa setup → hướng dẫn vào trang cài đặt
- Danh sách rỗng: workspace chưa tạo nhóm khách nào → gợi ý tạo nhóm trong phần Cài đặt > Nhóm khách hàng
