# Prompt cho AI CRM — verify 123 NOT_IMPL + 2 BUG là THẬT, sau đó fix LOCAL

> Copy đoạn từ `---PROMPT START---` xuống `---PROMPT END---` paste vào AI CRM.

---PROMPT START---

Chào AI CRM. Anh chủ Spaclaw + AI Core vừa chạy direct B test 395 handler `agent-tools-hermes` với data THẬT (workspace `fc11aab9-c954-4846-8b08-5f9159739e3d` resolved từ core_group `52b399db`, person `6a55a0e8` = "hồng"), runner `/tmp/test_real_data_runner.mjs`.

**Kết quả phân lớp lại** (không gộp 2xx = OK như audit cũ):

| Bucket | # | Trạng thái |
|---|---:|---|
| ✅ REAL_DATA + 🆕 CREATED + ◯ EMPTY_OK + ◐ VALIDATE_OK | **59** | **CHUẨN** — sẵn sàng wire LLM |
| ⚠ NOT_IMPL (HTTP 200 + `{ok:false,code:NOT_IMPLEMENTED}`) | **123** | Stub vỏ, ruột chưa code |
| ✗ BUG (HTTP 500) | **2** | `get_funnel_deal_history`, `create_product` |
| (chưa test round 2: WRITE_UPDATE/DELETE/ACTION/BULK) | ~211 | Pending |

**Đề nghị 2 phase**:

## Phase 1 — VERIFY (em làm, đừng tin Core mù quáng)

Anh chủ KHÔNG muốn em tin Core 100%. Em **tự reproduce** trước khi fix:

### 1.1 Verify 123 NOT_IMPL bằng direct B test

```bash
# Trong container appcrm-api
docker exec appcrm-api sh -c '
cat > /tmp/verify.mjs << "EOF"
const SECRET="spaclaw-internal-4f8a9c2d";
const USER="6f7462e4-fdd3-4356-884d-1c5a08d65832";
const GROUP="52b399db-ff89-4f75-a780-4c85477a0c24";
const FX={person_id:"6a55a0e8-a484-442b-8acf-84ea88dde824",customer_id:"6a55a0e8-a484-442b-8acf-84ea88dde824",service_id:"4dcada8c-bb91-469f-a45a-871bf9825b73",staff_id:"d9116fd5-5c36-45ac-8b97-06ac08b88af1",branch_id:"31d6c8cb-185f-4d4f-b3fe-d44f769387bf"};
const handlers=`<paste 123 handler tên ở dưới>`.trim().split(/\\s+/);
for(const n of handlers){
  const args={...FX, from:"2026-01-01", to:"2026-12-31"};
  const r=await fetch(`http://localhost:4000/internal/skills/${n}`,{method:"POST",headers:{"Content-Type":"application/json","X-Internal-Secret":SECRET,"X-User-Id":USER,"X-Group-Id":GROUP},body:JSON.stringify(args)});
  const j=await r.json().catch(()=>null);
  const isStub=j?.ok===false && j?.error?.code==="NOT_IMPLEMENTED";
  console.log(`${isStub?"STUB":"NOT_STUB"} ${n} ${r.status} ${JSON.stringify(j).slice(0,120)}`);
}
EOF
node /tmp/verify.mjs
'
```

→ Confirm 123/123 đúng là stub `NOT_IMPLEMENTED`. Nếu có cái nào KHÔNG phải stub → reply Core ngay (Core test sai).

### 1.2 Verify 2 BUG

```bash
# get_funnel_deal_history
curl -s -X POST http://localhost:4000/internal/skills/get_funnel_deal_history \
  -H "X-Internal-Secret: spaclaw-internal-4f8a9c2d" \
  -H "X-User-Id: 6f7462e4-fdd3-4356-884d-1c5a08d65832" \
  -H "X-Group-Id: 52b399db-ff89-4f75-a780-4c85477a0c24" \
  -H "Content-Type: application/json" \
  -d '{"deal_id":"any-id"}'
# Expect: 500 hoặc "relation funnel_stage_history does not exist"

# create_product
curl -s -X POST http://localhost:4000/internal/skills/create_product \
  -H "X-Internal-Secret: spaclaw-internal-4f8a9c2d" \
  -H "X-User-Id: 6f7462e4-fdd3-4356-884d-1c5a08d65832" \
  -H "X-Group-Id: 52b399db-ff89-4f75-a780-4c85477a0c24" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","price":100000}'
# Expect: 500 — em check log để biết lỗi gì
docker logs appcrm-api --tail 50 | grep -A 5 create_product
```

### 1.3 Output verify report

Em viết file `VERIFY_REPORT_125_HANDLERS_20260507.md` trong repo CRM:

```markdown
# Verify 125 handler (123 NOT_IMPL + 2 BUG) — 2026-05-07

## 123 NOT_IMPL
- [x] 120/123 confirm STUB (đúng như Core báo)
- [ ] 3/123 KHÔNG stub: `<handler_a>` trả ..., `<handler_b>` trả ... → Core test sai, đã trả data thật

## 2 BUG
- [x] `get_funnel_deal_history` confirm 500 — `relation "funnel_stage_history" does not exist`
- [x] `create_product` confirm 500 — `<root cause em tìm được>`
```

## Phase 2 — FIX LOCAL (sau khi verify xong)

**Anh chủ yêu cầu**: KHÔNG hot-fix VPS bằng `docker exec sed`. **Phải sửa trong source repo CRM local → commit → push → workflow git deploy → rebuild image**. Lý do: hot-fix mất khi rebuild image, đã có incident `agent-tools-hermes.js` lệch source TS.

### 2.1 Fix 2 BUG (làm ngay, P0)

#### BUG 1: `get_funnel_deal_history` thiếu bảng `funnel_stage_history`

Migration đã chuẩn bị sẵn ở Core: `hermes-crm-skills/e2e_reports/fix_missing_tables_v2_20260507.sql`. Nội dung:

```sql
CREATE TABLE funnel_stage_history (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    deal_id text NOT NULL,
    from_stage_id text,
    to_stage_id text,
    changed_by text,
    note text,
    changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customer_group_members (
    group_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    role text NOT NULL DEFAULT 'MEMBER',
    added_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, customer_id)
);
```

→ Em viết Prisma migration `prisma/migrations/<timestamp>_add_funnel_stage_history_group_members/migration.sql` chuẩn (idempotent, có FK nếu phù hợp), commit + git deploy.

**Type mismatch warning**: handler `customer_group_members` dùng `$1::uuid` trong khi convention CRM là text. Em xem lại: thiết kế chuẩn dùng uuid hay text? Reply trước khi đẩy migration nếu sai → sửa cả handler luôn.

#### BUG 2: `create_product` 500

Em check `docker logs appcrm-api | grep create_product` để tìm root cause (chắc là cột thiếu trong bảng `products`, giống bug `list_orders` cột `code` vs `order_code` trước). Fix ở source TS, commit, deploy.

### 2.2 Implement 123 NOT_IMPL theo thứ tự ưu tiên

Anh chủ ưu tiên theo giá trị nghiệp vụ:

| # | Module | # skill | Lý do |
|---:|---|---:|---|
| 1 | **reports** | 16 | Dashboard CEO — cần nhất |
| 2 | **hr** | 11 | Lương, KPI, ca làm — vận hành lõi |
| 3 | **sale** | 11 | Promotion, sales pipeline — chốt deal |
| 4 | **telesale** | 10 | Call history, callbacks |
| 5 | **integrations** | 19 | Shipping, Telegram, AI Trực Page |
| 6 | **cards_deposits** | 10 | Thẻ trả trước, ký quỹ |
| 7 | **academy** | 8 | Đào tạo nhân viên |
| 8 | **documents** | 8 | Hợp đồng, ký số |
| 9 | **settings** | 7 | Branches, members, audit |
| 10 | **marketing** | 7 | Voucher, QR campaign |
| 11 | **ads** | 6 | Ads dashboard |
| 12 | **ai_assistant** | 5 | Conversations, prompts |
| 13 | **cskh** | 3 | CSKH report |
| 14 | **notifications** | 2 | My/sent |

### 2.3 Workflow chuẩn cho mỗi module

1. Check schema Prisma đã có bảng chưa → nếu thiếu, viết migration
2. Implement handler trong `src/modules/agent-tools/handlers/<module>.ts` (thay stub bằng query thật)
3. Direct B test trong container → confirm REAL_DATA hoặc EMPTY_OK
4. Viết spec `hermes-crm-skills/<module>/_index.json` (name, description tiếng Việt + Args mẫu, input_schema required field)
5. Build top-level _index.json + push deploy hub
6. Commit + git deploy CRM image
7. /ask LLM test (đo prompt + spec quality, KHÔNG trộn lẫn 2 lớp)

### 2.4 Per-skill checklist

Mỗi handler implement xong em điền 1 row:

```markdown
| Handler | Module | Status | Direct B verify | Spec viết | Note |
|---|---|---|---|---|---|
| revenue_report | reports | ✅ DONE | REAL_DATA 12 rows | ✅ | from/to required |
| ...
```

## 123 NOT_IMPL tên handler đầy đủ (paste vào verify script)

### academy (8)
- academy_progress_report
- academy_summary
- get_academy_course_detail
- list_academy_lessons
- list_course_enrollments
- list_staff_certificates
- create_academy_course
- create_academy_lesson

### ads (6)
- ads_dashboard
- list_academy_courses
- list_ads_leads
- list_telesale_queue
- list_zalo_templates
- telesale_hub_summary

### ai_assistant (5)
- get_ai_conversation
- get_ai_usage
- list_ai_conversations
- list_ai_prompt_suggestions
- create_ai_conversation

### cards_deposits (10)
- card_movements_summary
- deposits_summary
- get_card_detail
- get_card_movement_detail
- get_deposit_detail
- list_card_movements
- list_deposit_movements
- list_deposits
- prepaid_cards_summary
- create_deposit

### cskh (3)
- cskh_report
- cskh_summary
- list_cskh_history

### documents (8)
- documents_summary
- get_document_signature_status
- get_document_url
- list_document_folders
- list_document_versions
- list_documents
- search_documents
- create_document_folder

### hr (11)
- get_commissions
- get_my_income
- get_payroll
- get_shift_schedule
- get_staff_detail
- get_staff_performance
- get_timesheet
- list_departments
- list_staff
- create_advance_salary
- create_bonus_penalty

### integrations (19)
- get_aitrucpage_stats
- get_pickup_address
- get_telegram_chat_detail
- list_aitrucpage_connections
- list_aitrucpage_sync_history
- list_app_integrations
- list_connected_shipping_providers
- list_consumed_events
- list_published_events
- list_remote_workspaces
- list_shipping_providers
- list_telegram_chats
- list_telegram_event_types
- list_telegram_push_history
- list_telegram_subscriptions
- shipping_report
- add_shipping_provider
- create_shipping_order
- create_telegram_subscription

### marketing (7)
- get_voucher_campaign_detail
- list_campaign_redemptions
- list_voucher_campaigns
- voucher_campaign_report
- voucher_campaigns_summary
- create_marketing_qr
- create_voucher_campaign

### notifications (2)
- list_my_notifications
- list_sent_notifications

### reports (16)
- booking_report
- card_report
- commission_report
- customer_report
- debt_report
- get_kpi_by_staff
- inventory_report
- kpi_by_branch
- kpi_config
- kpi_overview
- loyalty_report
- marketing_report
- revenue_report
- service_report
- staff_performance_report
- telesale_report

### sale (11)
- get_promotion_detail
- get_sales_target_progress
- list_active_promotions_for_invoice
- list_discount_campaigns
- list_promotions
- list_sales_pipelines
- promotion_redemption_report
- sale_summary
- create_discount_campaign
- create_promotion
- create_sales_opportunity

### settings (7)
- get_account_profile
- get_audit_log
- get_plan_usage
- get_workspace_info
- list_branches
- list_members
- list_rooms

### telesale (10)
- get_ai_call_review
- get_call_detail
- get_telesale_campaign_detail
- list_ai_call_reviews
- list_call_history
- list_callbacks
- list_telesale_campaigns
- list_uncalled_leads
- telesale_campaign_report
- create_telesale_campaign

## Quy tắc cứng (KHÔNG phá vỡ)

1. **KHÔNG hot-fix `/opt/crm/agent-tools-hermes.js` bằng sed**. Sửa source TS, build, deploy git.
2. **KHÔNG `docker cp` đè dist** trừ khi rebuild image hoàn toàn.
3. **KHÔNG bỏ qua direct B verify** trước khi báo done — Core sẽ re-audit và phát hiện stub trá hình.
4. **Migration phải idempotent** + có rollback plan.
5. **Mỗi module xong → re-run audit script** `/tmp/test_real_data_runner.mjs` để confirm không regression.

## Timeline đề xuất

- **48h**: Phase 1 verify xong + fix 2 BUG + đẩy migration v2
- **Tuần 1-2**: Module 1-3 (reports, hr, sale) — 38 skill
- **Tuần 3-4**: Module 4-7 (telesale, integrations, cards_deposits, academy) — 47 skill
- **Tuần 5-6**: Module 8-14 — 38 skill
- **Sau cùng**: Re-audit toàn bộ 395 → expect 0 NOT_IMPL, 0 BUG, 395 CHUẨN

## File tham khảo

- `hermes-crm-skills/e2e_reports/395_REAL_DATA_VERIFIED_20260507.md` — báo cáo audit chi tiết
- `hermes-crm-skills/e2e_reports/test_real_read.json` — raw 150 READ result
- `hermes-crm-skills/e2e_reports/test_real_create.json` — raw 34 CREATE result (7 record id thật)
- `hermes-crm-skills/e2e_reports/fix_missing_tables_v2_20260507.sql` — migration 2 bảng latent
- `hermes-crm-skills/e2e_reports/PROMPT_FOR_CRM_AI_CHECK_UI_20260507.md` — prompt forensic UI 8 bảng (gửi trước, vẫn pending)

Reply lại: (a) timeline Phase 1 verify (48h?), (b) confirm uuid vs text cho `customer_group_members`, (c) module nào em làm trước (mặc định theo thứ tự reports → hr → sale), (d) có cần Core hỗ trợ gì (fixture data, schema mẫu, AI Proxy token...).

Cảm ơn em. — AI Core

---PROMPT END---
