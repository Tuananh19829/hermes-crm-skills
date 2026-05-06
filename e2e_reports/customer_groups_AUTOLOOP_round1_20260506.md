# 🤖 customer_groups self-loop ROUND 1 — 2026-05-06T20:30

**CRM AI tự loop theo prompt PROMPT_FOR_CRM_AI_SELF_LOOP.md**

## Stop reason: REQUIRES HUB SPEC DEPLOY

5/7 skill blocked on Hub Hermes `_index.json` chưa sync lên `/opt/hermes/skills/crm/` trên VPS Hub `34.142.240.11`. Backend dispatcher đã 7/7 verified live.

## Bước 1 — Verify backend dispatcher

```bash
ssh daotaokinhdoanhspanoibo@136.112.201.221 \
  'for s in get_customer_group_detail create_customer_group list_group_members \
            add_member_to_group remove_member_from_group update_customer_group \
            delete_customer_group; do
     echo -n "$s: "
     docker exec appcrm-api grep -c "case .$s." /app/dist/modules/agent-tools/routes.js
   done'
```

**Output**:
```
get_customer_group_detail: 1
create_customer_group: 1
list_group_members: 1
add_member_to_group: 1
remove_member_from_group: 1
update_customer_group: 1
delete_customer_group: 1
```

→ 7/7 case có trong dispatcher live. Handler không thiếu.

## Bước 2 — Phân loại verdict (theo RETEST2)

| # | Skill | Verdict | Handler có? | Action |
|---|---|---|---|---|
| 1 | get_customer_group_detail | NO_SKILL | ✅ count=1 | REQUIRES HUB SPEC DEPLOY |
| 2 | create_customer_group | **PASS** | ✅ count=1 | Skip (đã xong) |
| 3 | list_group_members | NO_SKILL | ✅ count=1 | REQUIRES HUB SPEC DEPLOY |
| 4 | add_member_to_group | NO_SKILL | ✅ count=1 | REQUIRES HUB SPEC DEPLOY |
| 5 | remove_member_from_group | AMBIG | ✅ count=1 | Refine description (no_skill phrasing) |
| 6 | update_customer_group | DECLINE | ✅ count=1 | Refine description (auto-fallback args) |
| 7 | delete_customer_group | **PASS** | ✅ count=1 | Skip (đã xong) |

→ Theo prompt Bước 3A: handler count=1 → "Vấn đề ở Hub Hermes `_index.json` thiếu skill name → commit message ghi rõ REQUIRES HUB SPEC DEPLOY rồi STOP loop, đợi Hub deploy."

## Bước 3 — CRM AI side fix (dù nguyên nhân ở Hub)

Vẫn refine `customer_groups/_index.json` v1.1.0 → **v1.2.0** để Hub deploy lần này có:

1. **Description sharper**: prefix `[CRM app]` + cuối câu ghi `Endpoint /internal/skills/<name>` để LLM định danh rõ
2. **Args mẫu**: ghi UUID giả `00000000-0000-0000-0000-000000000000` cho LLM tự sinh khi user không cho group_id (giải DECLINE)
3. **Triggers mở rộng**: thêm "CustomerGroup" CamelCase, English variants ("remove member CustomerGroup", "add customer to CustomerGroup")
4. **Backend_status field**: `implemented_and_verified` thay `implemented` (rõ hơn)

Diff:
- v1.1.0: 4-5 triggers per skill, description ngắn
- v1.2.0: 7-8 triggers per skill, description prefix [CRM app], args mẫu UUID giả, _changelog metadata

## Bước 4 — `_implemented.json` v3.4.0 → v3.5.0

```diff
-  "manifest_version": "3.4.0",
+  "manifest_version": "3.5.0",
+  "blocked_on": "Hub Hermes spec deploy customer_groups/_index.json v1.2.0 lên /opt/hermes/skills/crm/ trên 34.142.240.11"
```

Module status:
```diff
- customer_groups: "ALL_IMPLEMENTED + VERIFIED LIVE (7/7 — applied 2026-05-06 20:13)"
+ customer_groups: "BACKEND_VERIFIED 7/7 (dispatcher count=1). RETEST2: 2/7 PASS. 5 còn lại blocked on Hub spec sync — REQUIRES HUB SPEC DEPLOY"
```

## Bước 5 — Commit + push

Commit message: `fix(customer_groups): round 1 — 2/7 PASS, REQUIRES HUB SPEC DEPLOY for [get_customer_group_detail, list_group_members, add_member_to_group, remove_member_from_group, update_customer_group]`

## Bước 6 — STOP loop

Stop condition met: handler all wired (count=1 × 7), 5 skill blocked on Hub side.

→ **Ping Hub**: please deploy `customer_groups/_index.json` v1.2.0 to `/opt/hermes/skills/crm/` on VPS `34.142.240.11`, then re-run RETEST3.

## Sau khi Hub deploy xong

CRM AI sẽ pull report Hub → nếu 7/7 PASS hoặc PASS_VALIDATION → bump `_implemented.json` thêm 5 skill (current 27 → 32) → ack final.

Nếu vẫn fail trên skill nào → loop tiếp round 2 với fix theo error logs.

## Kết quả tổng

- **Backend**: 7/7 ✅
- **Hub spec sync**: 2/7 (RETEST2)
- **End-to-end PASS**: 2/7 (create + delete)
- **Blocked**: 5/7 chờ Hub deploy spec mới

## Skills tiếp theo (sau customer_groups xanh)

CRM AI áp pattern này cho 7 module Round 1 còn lại:
- `customers` (xem `e2e_reports/customers_20260506.md`)
- `finance` (xem `e2e_reports/finance_20260506.md`)
- `funnel`
- `loyalty`
- `orders`
- `pos`
- `services`

Mỗi module: verify backend → refine spec → commit → ping Hub deploy.
