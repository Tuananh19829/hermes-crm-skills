# 395 CRM handler — verify với DATA THẬT (2026-05-07)

**Method**: Direct B test inside `appcrm-api` container, X-Internal-Secret bypass LLM, args sinh từ pattern tên + fixture **workspace thật** `fc11aab9-c954-4846-8b08-5f9159739e3d` (resolved từ core_group `52b399db`).

**Phân lớp**: thay vì gộp PASS=2xx, ta tách 6 bucket theo nội dung response:

| Bucket | Ý nghĩa | Số lượng (READ 150 + CREATE 34) |
|---|---|---:|
| **REAL_DATA** | Trả data thật từ DB workspace | **23** |
| **CREATED** | Đã tạo record mới, có id thật | **7** |
| EMPTY_OK | 0 row, không bug (workspace mới) | 15 |
| VALIDATE_OK | 4xx đúng nghiệp vụ (thiếu args) | 14 |
| **NOT_IMPL** | HTTP 200 + `{ok:false,code:NOT_IMPLEMENTED}` — STUB | **123** |
| BUG | HTTP 500 hoặc shape sai | 2 |

> ⚠ **Phát hiện cú pháp lừa**: pre-fix audit cũ đếm 326 PASS (HTTP 2xx) — nhưng **123/326 (~38%) là stub `NOT_IMPLEMENTED`** trả ok:false trong envelope 200. Direct B test args=`{}` không catch được. Phải parse body `error.code === 'NOT_IMPLEMENTED'` mới biết.

## ✅ 30 skill đã verify trả/tạo data thật

### REAL_DATA (23) — query thật, có row

`cashbook_report`, `count_leads_today`, `count_loyalty_customers`, `customers_summary`, `find_customer`, `funnel_conversion_report`, `funnel_summary`, `get_customer_detail`, `get_customer_group_detail`, `get_service_detail`, `list_campaigns`, `list_customer_groups`, `list_customers`, `list_group_members`, `list_leads`, `list_loyalty_tiers`, `list_service_categories`, `list_services`, `loyalty_summary`, `orders_summary`, `sales_summary`, `search_customers`, `top_sources`

### CREATED (7) — tạo record THẬT trong DB workspace `fc11aab9`

| Skill | id mới |
|---|---|
| `create_lead` | `bbed63f2-533c-4870-8553-dca534f1a924` |
| `create_customer` | `381ba056-9aa5-402f-a203-b5100c1beb86` |
| `create_customer_group` | `416af782-4926-4e9e-9a63-a1dae7706e83` |
| `create_service` | `3e928ac0-0478-42e8-bc6d-8468c7733577` |
| `create_bundle` | `5e41238b-19b8-4998-ba2a-05dcd3026500` |
| `create_loyalty_tier` | `0725b3ef-bd33-4cbb-88bf-d8ec1daf5c2c` |
| `create_treatment` | `9702d1d6-5fe6-4e16-9a0a-e194391c5a96` |

→ Anh có thể login CRM workspace `fc11aab9` (core_group `52b399db`) để xem 7 record này.

## ✗ 2 BUG mới

| Skill | Lỗi | Nguyên nhân |
|---|---|---|
| `get_funnel_deal_history` | HTTP 500 | Bảng `funnel_stage_history` chưa tồn tại — confirm v2 migration cần đẩy |
| `create_product` | HTTP 500 | Cần debug riêng (chưa rõ table/column) |

## ◐ 14 VALIDATE_OK — handler ĐÚNG, chỉ cần spec đầy đủ args

Đa số `create_*` thiếu required field: `add_member_to_group`, `add_note`, `create_appointment` (thiếu phone), `create_cashbook_entry`, `create_export_stock`, `create_funnel_deal`, `create_import_stock`, `create_order`, `create_stock_transfer`, `create_stocktake`, …

→ Khi viết spec LLM, phải khai required field thì LLM mới truyền đúng.

## ⚠ 123 NOT_IMPLEMENTED — STUB, không phải skill thật

13 module trả stub `{ok:false, error:{code:'NOT_IMPLEMENTED', module:..., skill:...}}`:

| Module | # stub | Ví dụ |
|---|---:|---|
| integrations | 19 | shipping, telegram, aitrucpage |
| reports | 16 | revenue/service/customer/debt_report... |
| hr | 11 | payroll, staff_performance, commissions |
| sale | 11 | promotions, discounts, sales_pipelines |
| telesale | 10 | call_history, callbacks, campaigns |
| cards_deposits | 10 | cards, deposits, prepaid |
| academy | 8 | courses, lessons, certificates |
| documents | 8 | document folders, versions, signatures |
| settings | 7 | branches, members, rooms, audit_log |
| marketing | 7 | voucher campaigns, marketing QR |
| ads | 6 | ads_dashboard, telesale_hub |
| ai_assistant | 5 | conversations, usage, prompts |
| cskh | 3 | cskh_report/summary/history |
| notifications | 2 | my_notifications, sent_notifications |

→ **123 handler này KHÔNG nên wire vào whitelist LLM** cho đến khi backend module thật được implement. Nếu wire bây giờ → LLM gọi → user nhận stub message → trải nghiệm xấu.

## Action items

1. **Wire 30 skill đã verify (23 REAL_DATA + 7 CREATED)** vào whitelist LLM TRƯỚC. Các spec hiện tại (32) đa số đã có trong nhóm này.
2. **Fix `create_product` 500** — debug riêng.
3. **Đẩy migration v2** (`funnel_stage_history` + `customer_group_members`) → fix `get_funnel_deal_history`.
4. **123 NOT_IMPL stub**: gửi list cho AI CRM để build module thật theo roadmap, KHÔNG wire whitelist.
5. **14 VALIDATE_OK**: viết spec đầy đủ required field → wire whitelist.
6. **15 EMPTY_OK**: handler OK, chỉ workspace chưa có data — wire bình thường.

## Files

- [`test_real_read.json`](./test_real_read.json) — 150 handler READ
- [`test_real_create.json`](./test_real_create.json) — 34 handler CREATE
- `/d/tmp/test_real_data_runner.mjs` — runner reusable
- Workspace test: `fc11aab9-c954-4846-8b08-5f9159739e3d`
- Person test: `6a55a0e8-a484-442b-8acf-84ea88dde824` (hồng)
