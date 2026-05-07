# Prompt cho AI CRM — Phase 3: build 171 OTHER stub + 1 BUG mới + spec 41 VALIDATE_OK

> Copy đoạn từ `---PROMPT START---` xuống `---PROMPT END---` paste vào AI CRM.

---PROMPT START---

Chào AI CRM. Cảm ơn em đã hoàn tất Phase 2 — Core đã re-audit và **xác nhận 0 stub trong nhóm READ + CREATE (184 handler)**. Em làm THẬT.

Nhưng khi Core test đủ 395 handler (thêm 211 OTHER = update/delete/assign/bulk/manage/apply/...), kết quả:

| Bucket | # | % |
|---|---:|---:|
| ✅ REAL_DATA | 32 | 8% |
| 🆕 CREATED | 7 | 2% |
| ◯ EMPTY_OK | 18 | 5% |
| ◐ VALIDATE_OK | 41 | 10% |
| ⚠ **NOT_IMPL stub** | **294** | **74%** |
| ✗ BUG | 3 | 1% |

→ **CHUẨN: 98/395 (25%)**, **CHƯA: 297/395 (75%)**.

→ **Phase 2 fix 123 stub trong batch READ+CREATE thành công**, nhưng **171 stub trong nhóm OTHER (update/delete/manage/...) chưa fix** + phát hiện **1 BUG mới** + **41 VALIDATE_OK chỉ thiếu spec**.

## Phase 3 — em làm tiếp 3 việc

### Việc 1: Fix 1 BUG mới `apply_voucher_to_invoice` (P0)

```bash
docker logs appcrm-api --tail 50 | grep -A 5 apply_voucher
```

Curl reproduce:
```bash
curl -s -X POST http://localhost:4000/internal/skills/apply_voucher_to_invoice \
  -H "X-Internal-Secret: spaclaw-internal-4f8a9c2d" \
  -H "X-User-Id: 6f7462e4-fdd3-4356-884d-1c5a08d65832" \
  -H "X-Group-Id: 52b399db-ff89-4f75-a780-4c85477a0c24" \
  -H "Content-Type: application/json" \
  -d '{"invoice_id":"placeholder-no-invoice","voucher_code":"TEST"}'
# Expect: 500 — root cause em tìm trong source TS, sửa, deploy git
```

### Việc 2: Wire 41 VALIDATE_OK — chỉ cần viết spec (không cần code)

41 handler dưới đây backend **đã hoạt động** (trả 4xx đúng nghiệp vụ khi thiếu args). Chỉ cần em **viết spec đầy đủ required field** vào `skills/<module>/_index.json` → wire whitelist LLM được ngay. Không cần đụng source TS.

```
assign_funnel_deal, assign_loyalty_tier, bulk_tag, bulk_update_funnel_stage, cancel_service_refund, collect_debt, deposit_card, lead_detail, link_ads_lead, manage_finance_categories, manage_funnel_stages, manage_loyalty_label, manage_loyalty_source, manage_marketing_cost, manage_payment_methods, manage_suppliers, pos_add_payment, pos_complete_appointment, pos_create_invoice, remove_member_from_group, update_appointment_status, update_customer, update_customer_group, update_invoice, update_lead_status, update_loyalty_tier, update_order_status
```

(thêm 14 handler khác trong VALIDATE_OK gồm `manage_*` configs — em rà thêm trong test_real_other.json)

→ Mục tiêu: **41 → 41 spec ready** trong 1-2 ngày.

### Việc 3: Implement 171 NOT_IMPL OTHER stub theo thứ tự ưu tiên

Anh chủ ưu tiên giá trị nghiệp vụ:

#### 🔥 Phase 3A — sale + telesale + cskh (47 skill, P0 — chốt deal & CSKH)

##### sale (12)
- apply_manual_discount_to_invoice
- apply_promotion_to_invoice
- close_sales_opportunity
- delete_promotion
- duplicate_promotion
- manage_flash_sale
- remove_promotion_from_invoice
- sales_leaderboard
- set_sales_target
- toggle_promotion
- update_promotion
- update_sales_opportunity

##### telesale (22)
- ai_analyze_call_recording
- assign_lead_to_staff
- bulk_update_leads
- convert_lead_to_customer
- delete_call_log
- delete_lead
- delete_telesale_campaign
- export_leads
- import_leads
- initiate_call
- initiate_callback
- mark_callback_done
- rate_call_review
- reschedule_callback
- telesale_leads_breakdown
- telesale_overdue_callbacks
- toggle_auto_campaign
- update_call_log
- update_lead
- update_telesale_campaign
- upload_call_recording
- upload_lead_recording

##### cskh (13)
- bulk_initiate_calls
- bulk_send_cskh_zalo
- cskh_appointment_reminders
- cskh_birthday_list
- cskh_cancelled_appointments_list
- cskh_no_show_list
- cskh_no_visit_list
- export_cskh_list
- generate_cskh_tasks
- manage_cskh_rules
- mark_cskh_done
- send_appointment_reminder_zalo
- send_birthday_zalo

#### 🔥 Phase 3B — integrations (27 skill, P1 — shipping/Telegram/AiTrucPage)

- calculate_shipping_fee
- cancel_shipping_order
- connect_aitrucpage
- delete_telegram_subscription
- disconnect_aitrucpage
- disconnect_shipping_provider
- disconnect_telegram_chat
- link_app_workspace
- manage_zalo_mini_app
- push_event_to_app
- register_zns_template
- send_telegram_verification_code
- send_test_telegram
- set_default_app_workspace
- shipping_webhook
- submit_telegram_chat_id
- sync_aitrucpage_now
- sync_app_data
- test_shipping_connection
- toggle_aitrucpage_auto_sync
- toggle_telegram_subscription
- track_shipping_order
- unlink_app_workspace
- update_aitrucpage_sync_interval
- update_shipping_shop_settings
- update_telegram_subscription
- verify_app_integration

#### Phase 3C — marketing + cards_deposits (26 skill, P1 — voucher/thẻ trả trước)

##### marketing (14)
- bulk_issue_vouchers, campaign_revenue_attribution, delete_voucher_campaign, duplicate_voucher_campaign, export_voucher_campaigns, issue_vouchers, manage_customer_segments, manage_email_campaigns, manage_landing_pages, manage_marketing_workflows, manage_referral_program, manage_sms_campaigns, toggle_voucher_campaign, update_voucher_campaign

##### cards_deposits (12)
- apply_deposit_to_invoice, cancel_service_card, consume_card_session, deduct_card_value, delete_deposit, extend_service_card, issue_service_card, refund_deposit, revert_card_consumption, transfer_service_card, update_deposit, update_service_card

#### Phase 3D — ai_assistant + ads (28 skill, P2 — AI workflow)

##### ai_assistant (15)
- ai_assistant_chat_stream, ai_assistant_chat_with_attachment, ai_assistant_intro, ai_assistant_status, ai_get_capabilities, ai_skill_executor, ai_speech_to_text, ai_text_to_speech, delete_ai_conversation, export_ai_conversation, manage_ai_knowledge_base, manage_ai_persona, pin_ai_message, rate_ai_response, rename_ai_conversation

##### ads (13)
- ai_analyze_customer, ai_assistant_chat, ai_suggest_followup, manage_ads_settings, manage_telesale_scripts, manage_webhooks, send_zalo_broadcast, send_zalo_message, telesale_call_log, track_academy_attendance, update_lead_funnel, zalo_config, zalo_live_chat

#### Phase 3E — academy + documents + settings + notifications (38 skill, P2)

##### academy (10)
- delete_academy_course, delete_academy_lesson, enroll_staff_to_course, issue_certificate, manage_academy_quiz, mark_lesson_completed, toggle_academy_course, update_academy_course, update_academy_lesson, upload_academy_material

##### documents (9)
- delete_document, move_document, rename_document, request_document_signature, restore_document_version, set_document_permissions, share_document, tag_document, upload_document

##### settings (9)
- manage_automation, manage_bank_accounts, manage_billing, manage_business_hours, manage_notifications, manage_print_settings, manage_roles, manage_security, update_workspace_info

##### notifications (10)
- broadcast_notification, bulk_delete_notifications, delete_notification, mark_notification_read, pin_notification, snooze_notification, subscribe_notifications_stream, test_send_notification, unread_notifications_count, update_my_notification_preferences

#### Phase 3F — hr + misc (5 skill, P3)
- fix_timesheet_error, manage_commission_rules, manage_salary_policy, manage_shift_templates, manage_fixed_assets

## Quy tắc cứng (giữ nguyên Phase 2)

1. ❌ KHÔNG hot-fix `/opt/crm/agent-tools-hermes.js` bằng `docker exec sed`. Sửa source TS → commit → push → workflow git deploy → rebuild.
2. ❌ KHÔNG `docker cp` đè dist trừ rebuild image hoàn toàn.
3. ❌ KHÔNG báo done trước khi direct B verify trên container appcrm-api.
4. ✅ Pattern A/B/C/D/E của Phase 2 áp dụng tiếp:
   - **A** real_data flowing — query DB thật
   - **B** empty + note — bảng chưa có schema, trả `{ok:true, data:{items:[], note:"..."}}` honest
   - **C** audit_logs proxy — write action queue PENDING_*, worker xử lý sau
   - **D** hardcoded list — config tĩnh (carriers, event types...)
   - **E** 404 NOT_FOUND — id miss, validation đúng
5. ✅ Migration phải idempotent + có rollback plan.
6. ✅ Mỗi module xong → re-run audit `/tmp/test_real_data_runner.mjs` (Core đã copy vào container) verify 0 regression.

## Test runner cập nhật (Core đã sẵn)

```bash
# READ batch (150 handler)
docker exec -e READ_ONLY=1 appcrm-api node /tmp/test_real_data_runner.mjs

# CREATE batch (34 handler)
docker exec -e CREATE_ONLY=1 appcrm-api node /tmp/test_real_data_runner.mjs

# OTHER batch (211 handler)
docker exec -e OTHER_ONLY=1 appcrm-api node /tmp/test_real_data_runner.mjs

# ALL 395
docker exec appcrm-api node /tmp/test_real_data_runner.mjs
```

Fixture trong runner đã có: workspace `fc11aab9`, person `6a55a0e8` (hồng), service `4dcada8c`, staff `d9116fd5` (Anh Tuấn), branch `31d6c8cb`, tier `41e4e5df` + IDs từ Phase 2 CREATED.

## Output Phase 3

Em viết tiếp `COMPLETION_REPORT_PHASE3_20260507.md` trong repo CRM với:
- Per-skill checklist (Status / Direct B verify / Spec viết / Note)
- Module rollout order + estimated time
- Re-audit summary cuối Phase 3 — expect: **0 NOT_IMPL stub, 0 BUG, 395 = REAL_DATA + CREATED + EMPTY_OK + VALIDATE_OK**

## Timeline đề xuất

| Phase | Skill | Time |
|---|---:|---|
| 3 việc 1 (BUG) + 2 (41 spec) | — | 2 ngày |
| 3A (sale+telesale+cskh) | 47 | tuần 1-2 |
| 3B (integrations) | 27 | tuần 2-3 |
| 3C (marketing+cards) | 26 | tuần 3-4 |
| 3D (ai+ads) | 28 | tuần 4-5 |
| 3E (academy+docs+settings+notif) | 38 | tuần 5-6 |
| 3F (hr+misc) | 5 | tuần 6 |
| Re-audit cuối + Hub deploy | — | tuần 7 |

## File tham khảo

- `hermes-crm-skills/e2e_reports/395_FULL_VERIFY_20260507.md` — báo cáo round 2
- `hermes-crm-skills/e2e_reports/test_real_other.json` — raw 211 OTHER result
- `hermes-crm-skills/e2e_reports/test_real_read.json` + `test_real_create.json` — Phase 2 verify

Reply lại: (a) timeline em chốt, (b) module nào em làm trước (mặc định 3A), (c) có cần Core hỗ trợ gì (fixture data, migration template, AI Proxy token cho ai_assistant_chat...).

Cảm ơn em. — AI Core

---PROMPT END---
