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

## Sau customer_groups xong — TỰ test toàn bộ 23 module còn lại

Hub chỉ test 8 module nhỏ round 1 (72 skill có sẵn report `e2e_reports/<module>_20260506.md`). **23 module còn lại CRM AI tự test** bằng cùng script curl ở Bước 1, không chờ Hub đẩy report.

### Danh sách 23 module CRM AI cần tự test

**Round 1 đã có report Hub đẩy** (8 module — đọc `e2e_reports/<module>_20260506.md`):
- customers, customer_groups (đang fix), finance, funnel, loyalty, orders, pos, services

**Round 2 — 8 module mid (~120 skill)** — CRM AI tự test:
- notifications, hr, inventory, settings, reports, cskh, documents, academy

**Round 3 — 8 module lớn (~530 skill)** — CRM AI tự test:
- ads, ai_assistant, marketing, cards_deposits, sale, telesale, integrations, _other

### Cách CRM AI tự test 1 module

```bash
# Lấy danh sách skill của module từ _index.json
MODULE=notifications
SKILLS=$(jq -r '.skills[].name' $MODULE/_index.json)

# Loop test mỗi skill (dùng script curl ở Bước 1, đổi $skill thành từng tên)
for skill in $SKILLS; do
  echo "=== $skill ==="
  curl -s -X POST "https://api-core.spaclaw.pro/api/v1/hermes/companies/$GROUP/agents/crm/ask" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"message\":\"Hãy gọi skill \`$skill\` ngay với args mẫu hợp lý. KHÔNG hỏi lại.\"}" \
    | jq -r '.data.response // .response // "TIMEOUT"' | head -c 300
  echo
done

# Phân loại verdict + ghi report e2e_reports/<module>_AUTO_<date>.md
# Áp Loop A fix từng skill verdict ≠ PASS
```

### Output mỗi module

CRM AI tạo `e2e_reports/<module>_AUTO_<date>.md` với cấu trúc:
- Total skill / PASS / NO_SKILL / ERROR / DECLINE / TIMEOUT
- Bảng từng skill × verdict
- Action plan: skill nào paste handler, skill nào sửa description, skill nào defer
- Commit message tag chuẩn: `REQUIRES HUB SPEC DEPLOY: <module>` nếu cần Hub deploy

### Stop conditions per module

- ✅ ≥80% skill PASS hoặc PASS_VALIDATION → coi module xong, sang module tiếp
- ⚠️ <80% PASS sau 3 vòng → commit `<module>_BLOCKED.md` + ping Hub debug
- 🛑 Module có >50 skill spec_only (chưa wire backend) → commit list skill cần loại khỏi `_tool_spec_anthropic_implemented.json`, để LLM khỏi tra

Hub chỉ:
1. Chạy `scripts/hub_deploy_spec.sh --auto` mỗi khi commit có tag `REQUIRES HUB SPEC DEPLOY`
2. Verify final round khi CRM AI báo "all 31 modules done"
3. Bump `_master_manifest.json` 3.3.0 → 3.4.0 sau consolidate

---

## 🆕 Workflow B — THÊM SKILL MỚI vào agent CRM

> Khi backend CRM có endpoint mới muốn agent gọi được, hoặc user yêu cầu skill chưa có trong 723 spec.

### Bước 1 — Tạo handler backend

Sửa `/opt/crm/agent-tools-hermes.js` thêm case mới trong `switch (skillName)`:

```javascript
case 'merge_customer_groups': {
  const { source_group_id, target_group_id, delete_source = false } = body;
  if (!source_group_id || !target_group_id) {
    return res.status(400).json({ ok: false, error: { code: 'MISSING_PARAMS' } });
  }
  await prisma.$executeRawUnsafe(`
    UPDATE customer_group_members SET group_id = $1::uuid
    WHERE group_id = $2::uuid
    ON CONFLICT (group_id, customer_id) DO NOTHING
  `, target_group_id, source_group_id);
  if (delete_source) {
    await prisma.$executeRawUnsafe(`DELETE FROM customer_groups WHERE id = $1::uuid AND workspace_id = $2`, source_group_id, workspaceId);
  }
  return res.json({ ok: true, data: { merged: true, source_group_id, target_group_id, source_deleted: delete_source } });
}
```

`docker restart appcrm-api`.

### Bước 2 — Update `<module>/HANDLER_PATCH.js`

Thêm snippet trên vào cuối file, để Hub có ground truth.

### Bước 3 — Update `<module>/_index.json`

Thêm entry skill mới (ví dụ vào `customer_groups/_index.json`):

```json
{
  "skills": [
    ...existing,
    {
      "name": "merge_customer_groups",
      "description": "Gộp toàn bộ thành viên từ nhóm nguồn vào nhóm đích. Optional xoá nhóm nguồn sau khi gộp. Args mặc định khi user không cung cấp: hỏi lại user, KHÔNG tự sinh.",
      "triggers": ["gộp 2 nhóm", "merge group", "chuyển thành viên"],
      "backend_status": "implemented",
      "handler_path": "/internal/agent-tools/merge_customer_groups",
      "verified_at": "2026-05-06"
    }
  ]
}
```

### Bước 4 — Update `_tool_spec_anthropic.json` + `_tool_spec_anthropic_implemented.json`

Thêm tool definition (Anthropic format):

```json
{
  "name": "merge_customer_groups",
  "description": "Gộp 2 nhóm khách hàng — chuyển members từ source_group sang target_group, optional xoá source.",
  "input_schema": {
    "type": "object",
    "properties": {
      "source_group_id": {
        "type": "string",
        "format": "uuid",
        "description": "UUID nhóm nguồn"
      },
      "target_group_id": {
        "type": "string",
        "format": "uuid",
        "description": "UUID nhóm đích"
      },
      "delete_source": {
        "type": "boolean",
        "default": false,
        "description": "Xoá nhóm nguồn sau khi gộp"
      }
    },
    "required": ["source_group_id", "target_group_id"]
  }
}
```

Thêm vào CẢ 2 file (full + implemented).

### Bước 5 — Bump `_implemented.json`

```json
{
  "implemented": [..., "merge_customer_groups"],
  "implemented_count": <count + 1>
}
```

### Bước 6 — Commit với tag để Hub auto-deploy

```bash
git add customer_groups/ _tool_spec_anthropic*.json _implemented.json
git commit -m "feat(customer_groups): add merge_customer_groups skill

ADD_SKILL: merge_customer_groups in customer_groups
REQUIRES HUB SPEC DEPLOY: customer_groups
"
git push
```

**Hub script** `scripts/hub_deploy_spec.sh --auto` sẽ đọc commit message, detect `REQUIRES HUB SPEC DEPLOY: customer_groups`, tự `docker cp` `customer_groups/_index.json` + tool_spec lên Hub VPS + restart hermes-api.

### Bước 7 — CRM AI tự test skill mới

Sau khi commit, đợi Hub script ack (commit `[hub-deploy]` từ Hub side hoặc message comment). Rồi CRM AI re-run E2E:

```bash
curl -s -X POST "https://api-core.spaclaw.pro/api/v1/hermes/companies/$GROUP/agents/crm/ask" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"message":"Hãy gộp nhóm A vào nhóm B (merge_customer_groups)"}'
```

→ Verdict PASS thì xong. NO_SKILL thì coi commit Hub đã chạy chưa.

---

## 📝 Tag commit message convention

Hub script `hub_deploy_spec.sh --auto` parse các tag sau:

| Tag trong commit body | Hành động Hub |
|---|---|
| `REQUIRES HUB SPEC DEPLOY: <module>` | Deploy `<module>/_index.json` + tool_spec → Hub VPS, restart hermes-api |
| `ADD_SKILL: <name> in <module>` | Đồng nghĩa REQUIRES HUB SPEC DEPLOY (auto detect cùng module) |
| `REMOVE_SKILL: <name> in <module>` | Deploy + log skill name bị remove |
| `REQUIRES HUB ACTION` (không tag module) | KHÔNG auto, ping anh xử tay |

CRM AI ghi tag CHÍNH XÁC dòng nguyên (không nested trong block code), Hub regex grep từ `git log -1 --pretty=%B`.
