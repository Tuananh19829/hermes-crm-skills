# FIX NOW — bug schema 7 module Round 1 (sau customer_groups)

> CRM AI: fix theo thứ tự dưới, mỗi module xong → SEED→UPDATE→READ→DELETE qua Hermes /ask để verify thật → push report → BÁO ANH 1 module 1 lần. Đừng nhảy lung tung.

## Thứ tự (dễ → cần migration)

### 1. `customers` — 3 bug col rename (DỄ)
- `deleted_at` → kiểm tra DB column thật, nếu không có thì bỏ filter `WHERE deleted_at IS NULL`
- `last_visit_at` → tên thật trong `customers` table (chạy `\d customers` trong psql)
- `customer_group_members` → tên thật của bảng membership (có thể `customers_group_members` / `customer_group_members` / khác)

**Verify**: 
```bash
docker exec spaclaw-shared-pg psql -U postgres -d appcrm -c "\d customers" | grep -E "deleted|visit"
docker exec spaclaw-shared-pg psql -U postgres -d appcrm -c "\dt" | grep -i group
```
Sửa `agent-tools-hermes.js` cho khớp tên thật → restart → test 6 skill module `customers` qua flow SEED→READ.

### 2. `orders` — 2 bug (DỄ)
- Column `code` → tên thật `order_code` (đã biết)
- Enum cast: thêm `::order_status_enum` (hoặc tên enum thật) khi WHERE/INSERT
**Verify**:
```bash
docker exec spaclaw-shared-pg psql -U postgres -d appcrm -c "\d orders" | head -30
docker exec spaclaw-shared-pg psql -U postgres -d appcrm -c "\dT+" | grep -i order
```

### 3. `pos` — 1 bug voucher join (DỄ)
- Kiểm tra bảng voucher tên gì: `vouchers` / `voucher_codes` / `pos_vouchers`
- Sửa JOIN cho đúng FK
```bash
docker exec spaclaw-shared-pg psql -U postgres -d appcrm -c "\dt" | grep -i voucher
```

### 4. `crm` — 2 bug enum cast (DỄ)
- Liệt kê enum trong DB, cast đúng kiểu
```bash
docker exec spaclaw-shared-pg psql -U postgres -d appcrm -c "\dT+"
```

### 5. `services`, `inventory` — chưa probe, chạy Phase READ trước → log bug → fix tương tự (DỄ-TB)

### 6. `funnel` — 9 bug TOÀN BỘ table funnel_* không tồn tại
**KHÔNG fix code**. Đây là missing migration.
- Action: viết migration SQL `CREATE TABLE funnel_stages, funnel_leads, funnel_transitions, ...` dựa trên handler kỳ vọng
- HOẶC nếu đã có module funnel ở repo source CRM cũ → import migration đó
- Nếu chưa có schema chuẩn → ghi `e2e_reports/funnel_BLOCKED.md` lý do "missing tables, cần spec từ anh"

### 7. `loyalty` — 8 bug TOÀN BỘ table loyalty_* không tồn tại
Giống `funnel`: missing migration. BLOCKED nếu chưa có schema. Note: account `daotaokinhdoanhspa@gmail.com` đã có loyalty data trước đây (xem memory `fix_hermes_crm_envelope_flat_args_20260506.md`) → có thể bảng tên khác (`loyalty_tier` thay vì `loyalty_tiers`?). Kiểm tra:
```bash
docker exec spaclaw-shared-pg psql -U postgres -d appcrm -c "\dt" | grep -i loyalty
```

---

## Quy trình từng module

```
1. Probe DB: \d <table>, \dt, \dT+ → ghi tên cột/enum/bảng thật
2. Sửa agent-tools-hermes.js cho khớp
3. cd /opt/crm && docker compose -p appcrm restart api
4. Chạy: node scripts/test_via_hermes.mjs --module=<tên>  (đã có flow SEED→READ→DELETE)
5. Nếu xanh hết → push e2e_reports/<module>_<date>.md → commit kèm tag:
   "fix(<module>): <tóm tắt>. Verified X/Y PASS via Hermes /ask seed→read→delete"
6. BÁO ANH 1 dòng: "<module>: X/Y PASS, đã push commit <sha>" → DỪNG
```

**Thứ tự đề xuất**: `customers` → `orders` → `pos` → `crm` → `services` → `inventory` → (funnel/loyalty BLOCKED nếu thiếu schema).

Một module 1 lần. Báo xong → đợi anh nói "tiếp" hoặc Hub sẽ chạy test verify độc lập → mới sang module kế.
