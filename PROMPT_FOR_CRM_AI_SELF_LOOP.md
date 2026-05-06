# 🎯 Prompt master cho CRM AI — TỰ test + fix + loop tới khi xanh

> Anh (Hub) viết file này 1 lần. CRM AI đọc → tự chạy hết phần backend + test + fix + commit. Hub chỉ verify final round.

## Bối cảnh

Pack `hermes-crm-skills` (repo này) có 723 skill spec. CRM AI đã wire 25 handler ở `/opt/crm/agent-tools-hermes.js` LIVE container `appcrm-api` trên VPS `136.112.201.221`. Đang trong vòng fix module **customer_groups** (7 skill).

Hiện trạng (commit `2a764a5`): 2/7 PASS, 3 NO_SKILL, 1 DECLINE, 1 AMBIG.

## Yêu cầu CRM AI

Tự loop test+fix đến khi **7/7 PASS hoặc PASS_VALIDATION** (handler validate đúng — trả `GROUP_NOT_FOUND` / `MISSING_PARAM` khi args mẫu thiếu).

### Vòng lặp (lặp tối đa 5 vòng)

**Bước 1 — Test E2E**
```bash
# Tài khoản test (Hub provide)
EMAIL=daotaokinhdoanhspa@gmail.com
PASSWORD='Anhtuan@89'
APP_KEY=crm

# Lấy JWT
TOKEN=$(curl -s -X POST https://api-auth.spaclaw.pro/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token // .access_token')

# Lấy group_id
GROUP=$(curl -s https://api-core.spaclaw.pro/api/bff/workspace-groups \
  -H "Authorization: Bearer $TOKEN" | jq -r '.data.items[0].id // .items[0].id')

# Test 1 skill (loop qua 7 skill customer_groups)
for skill in get_customer_group_detail create_customer_group list_group_members \
             add_member_to_group remove_member_from_group update_customer_group \
             delete_customer_group; do
  echo "=== $skill ==="
  curl -s -X POST "https://api-core.spaclaw.pro/api/v1/hermes/companies/$GROUP/agents/$APP_KEY/ask" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"message\":\"Hãy gọi skill \`$skill\` ngay với args mẫu hợp lý. KHÔNG hỏi lại.\"}" \
    | jq -r '.data.response // .response // "TIMEOUT"' | head -c 300
  echo
done
```

**Bước 2 — Phân loại verdict mỗi skill**

| Verdict | Match pattern trong response | Hành động |
|---|---|---|
| **PASS** | `đã gọi/đã tạo/kết quả/"ok":true` | Skip, skill này xong |
| **PASS_VALIDATION** | `GROUP_NOT_FOUND/CUSTOMER_NOT_FOUND/MISSING_PARAM` | Skip, handler có + validate đúng |
| **NO_SKILL** | `không gọi được/không tồn tại/SKILL_NOT_FOUND` | Fix Bước 3A |
| **ERROR** | `error/exception/500` | Fix Bước 3B |
| **DECLINE** | `tôi không/không thể/cannot` | Fix Bước 3C |
| **AMBIG/TIMEOUT** | Không match gì | Re-test |

**Bước 3A — Fix NO_SKILL**

```bash
ssh vienthammykjm@136.112.201.221 "docker exec appcrm-api grep -c \"case '$skill'\" /app/dist/modules/agent-tools/routes.js"
```
- Trả `0` → paste case từ `customer_groups/HANDLER_PATCH.js` vào `/opt/crm/agent-tools-hermes.js`, `docker restart appcrm-api`, retest skill đó
- Trả `1` → handler đã có. Vấn đề ở Hub Hermes `_index.json` thiếu skill name → **commit message ghi rõ "REQUIRES HUB SPEC DEPLOY: <list skill name>"** rồi STOP loop, đợi Hub deploy.

**Bước 3B — Fix ERROR**

```bash
ssh vienthammykjm@136.112.201.221 "docker logs appcrm-api --tail 100"
```
- Đọc stack trace, fix SQL/Prisma trong `/opt/crm/agent-tools-hermes.js`
- `docker restart appcrm-api`, retest

**Bước 3C — Fix DECLINE**

- Sửa `customer_groups/_index.json` description của skill bị decline:
  - Ghi rõ "Khi user không cung cấp group_id, dùng UUID giả `'00000000-0000-0000-0000-000000000000'` để test handler validation"
  - Ghi rõ args mẫu mặc định
- Retest skill đó

**Bước 4 — Bump `_implemented.json`**

Sau mỗi handler PASS thật:
```json
{
  "implemented": [..., "<skill_name>"],
  "implemented_count": <count + 1>,
  "by_module_status": {
    "customer_groups": "ALL_IMPLEMENTED (7/7 verified live <date>)"
  }
}
```

**Bước 5 — Commit từng vòng**

```bash
cd hermes-crm-skills
git add _implemented.json customer_groups/ e2e_reports/
git commit -m "fix(customer_groups): round N — X/7 PASS, [list NO_SKILL còn lại]"
git push
```

**Bước 6 — Stop conditions**

- ✅ 7/7 PASS hoặc PASS_VALIDATION → commit `customer_groups verified live 7/7`, ping Hub
- ⚠️ 5 vòng không tiến triển → commit log + ping Hub debug cùng
- 🛑 NO_SKILL kéo dài + dispatcher đã có handler → STOP, ghi `REQUIRES HUB SPEC DEPLOY` trong commit, Hub side handle

### Output mỗi vòng

CRM AI tạo file `e2e_reports/customer_groups_AUTOLOOP_round<N>_<date>.md` ghi:
- Bảng 7 skill × verdict
- Action mỗi skill (paste handler / fix description / retest)
- Diff `_implemented.json`
- Stop reason nếu dừng

## Quyền CRM AI có

✅ SSH `vienthammykjm@136.112.201.221`
✅ Sửa `/opt/crm/agent-tools-hermes.js` (host bind-mount)
✅ `docker restart appcrm-api`
✅ Sửa `customer_groups/_index.json`, `customer_groups/HANDLER_PATCH.js`, `_implemented.json`
✅ Commit + push branch `main` (đã được add collab)

## Quyền CRM AI KHÔNG có (Hub độc quyền)

🚫 Sửa `/opt/hermes/skills/crm/_index.json` trên Hub VPS `34.142.240.11`
🚫 `docker cp` vào container `hermes-api`
🚫 Bump `_master_manifest.json` version (Hub side bump sau khi consolidate)

→ Khi gặp giới hạn này, commit message ghi `REQUIRES HUB ACTION` + tag Hub.

## Sau customer_groups xong

Áp dụng prompt này cho 7 module còn lại đã có report ở `e2e_reports/`:
- customers, finance, funnel, loyalty, orders, pos, services
- (Mỗi module có file `<module>_20260506.md` liệt kê skill lỗi)

CRM AI lặp self-loop từng module. Hub chỉ ack cuối cùng + chạy round 2 (8 module mid) + round 3 (8 module lớn) khi 8 module nhỏ xanh.
