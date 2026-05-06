# Module `customers` — báo cáo lỗi skill (2026-05-06T11:13:32Z)

**Tổng**: 10 | **PASS**: 4 | **Lỗi**: 6

## ✅ PASS (4)
- `get_customer_detail`
- `create_customer`
- `get_customer_detail`
- `create_customer`

## ❌ LỖI (6)

| Skill | Verdict | Có handler? | Lý do | Snippet |
|---|---|---|---|---|
| `search_customers` | TIMEOUT | ❌ chưa wire | no reply |  |
| `update_customer` | TIMEOUT | ❌ chưa wire | no reply |  |
| `get_loyalty_points` | TIMEOUT | ❌ chưa wire | no reply |  |
| `manage_vouchers` | TIMEOUT | ❌ chưa wire | no reply |  |
| `list_customer_groups` | NO_SKILL | ❌ chưa wire | LLM nói skill không tồn tại | Không gọi được skill vì trong app `crm` hiện không tồn tại `list_customer_groups`. - `spaclaw_view_skill("list_customer_groups")` trả về `SKILL_NOT_FOUND` - Tìm thêm theo các từ khóa `customer`, `gro |
| `customer_care_list` | TIMEOUT | ❌ chưa wire | no reply |  |
