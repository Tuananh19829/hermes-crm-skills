# customer_groups — 2026-05-06 (FIX_PASS)

**Method**: DIRECT (POST /internal/skills/<name> via container IP, bypass Hermes/LLM)
**Workspace**: `b3ce66dc-156c-4361-992c-f7efeffea868` (nhattruong3526@gmail.com, group_id `3a87c900-a7d5-4f01-9c7a-657db3a5fc43`)
**User**: sso_user_id `8804d359-cd6a-4cdb-a67c-ff4fab792982` (OWNER)
**Person used in flow**: `de86a89d-156b-4c10-b6d5-fd04286b97b9` (Heo Heo)
**Kết quả**: **7/7 PASS** flow SEED→UPDATE→READ→DELETE

## Bug đã fix

Trước fix, 5/7 skill trả 500 vì sai schema (Hub spec giả định bảng/cột không tồn tại):

| Skill | Bug | Fix |
|---|---|---|
| `create_customer_group` | column `criteria`, `auto_assign` không tồn tại | bỏ |
| `update_customer_group` | column `criteria` không tồn tại | bỏ |
| `get_customer_group_detail` | column `criteria` + bảng `customer_group_members` không tồn tại | bỏ criteria; lấy member từ `people.customer_group=grp.name` |
| `delete_customer_group` | bảng `customer_group_members` không tồn tại | NULL out `people.customer_group` rồi DELETE group |
| `add_member_to_group` | `text=uuid` mismatch + bảng members không tồn tại | UPDATE `people SET customer_group = grp.name` |
| `remove_member_from_group` | `text=uuid` mismatch + bảng members không tồn tại | UPDATE `people SET customer_group = NULL` |
| `list_group_members` | `text=uuid` mismatch + bảng members không tồn tại | SELECT FROM `people WHERE customer_group = grp.name` |

**Cách áp**: `HANDLER_PATCH.js` insert ở TOP của `switch (action) {…}` → JS first-match wins, override case cũ buggy bên dưới (không xóa, dead code).

## Flow test detail

| Bước | Skill | Kết quả |
|---|---|---|
| SEED | `create_customer_group {name:"AI_TEST_GROUP_…"}` | ✓ id=`fa4dd923-0d3d-4206-8053-b0e54f65d638` |
| UPDATE | `update_customer_group(description)` | ✓ description đã đổi |
| UPDATE | `add_member_to_group(person=de86…)` | ✓ added=true |
| READ | `get_customer_group_detail` | ✓ FOUND member trong `data.members` |
| READ | `list_group_members` | ✓ total=1 member |
| UPDATE | `remove_member_from_group` | ✓ removed=true |
| READ_VERIFY | `list_group_members` (sau remove) | ✓ total=0 (DATA_MISSING không xảy ra — đúng vì đã remove) |
| DELETE | `delete_customer_group` | ✓ deleted=true |
| POST_DELETE | `get_customer_group_detail` | ✓ trả `GROUP_NOT_FOUND` (404) |

## Schema notes (cho Hub cập nhật spec)

- `customer_groups`: id `text`, name, description, color, is_active, branch_id. **Không có** `criteria`, `auto_assign`, `created_by_user_id`.
- **Không có** bảng `customer_group_members`. Member-of-group lưu trong `people.customer_group` (text, match theo `name`).
- ID là `text` (không phải UUID) → tool spec không cần ép format uuid.

## Artefact

- Patch: `customer_groups/HANDLER_PATCH.js`
- Apply: `customer_groups/APPLY_PATCH.sh` (insert at TOP of switch — overrides buggy cases)
- Test runner: `scripts/flow_customer_groups.sh`
- Backup VPS: `/opt/crm/agent-tools-hermes.js.bak-customer_groups-fix-20260506-213349`
