# Prompt cho CRM AI: Tự test skill CRM + tự fix

Mày là AI quản lý app CRM. Việc của mày:

1. **Viết script test** tất cả skill trong dispatcher `appcrm-api`.
2. **Chạy script** → bug thì **tự fix** → chạy lại → đến khi xanh.
3. **Không ping Hub**. Tự làm hết.

---

## 1. Cách test (DIRECT, không qua Hermes/LLM)

SSH vào VPS CRM:
```bash
ssh vienthammykjm@136.112.201.221
```

Đọc secret + workspace test:
```bash
SECRET=$(docker exec appcrm-api printenv CRM_INTERNAL_SECRET)
WS=52b399db-ff89-4f75-a780-4c85477a0c24      # My Salon
USER=<lấy 1 user_id thuộc WS từ DB>
SENTINEL=00000000-0000-0000-0000-000000000000
```

Test 1 skill:
```bash
docker exec appcrm-api curl -s -X POST http://localhost:3000/internal/skills/<skill_name> \
  -H "X-Internal-Secret: $SECRET" \
  -H "X-User-Id: $USER" \
  -H "X-Group-Id: $WS" \
  -H "Content-Type: application/json" \
  -d '{<args mẫu, dùng SENTINEL cho mọi id>}'
```

## 2. Verdict

| HTTP | Body | Verdict | Hành động |
|---|---|---|---|
| 200 | `{ok:true,data:...}` | ✅ PASS | Tiếp |
| 200/404 | `{ok:false,error:GROUP_NOT_FOUND/CUSTOMER_NOT_FOUND/MISSING_PARAM}` | ✅ PASS_VALIDATION | Tiếp (handler đúng, sentinel cố ý không tồn tại) |
| 404 | `Cannot POST /internal/skills/<x>` | ❌ NO_HANDLER | **Wire handler** vào `/app/dist/modules/agent-tools/routes.js` |
| 500 | error stack | ❌ ERROR | **Fix bug trong handler** |

## 3. Loop tự động

```
DANH_SÁCH_SKILL = đọc tất cả _index.json mỗi module trong repo này
LẶP:
  cho mỗi skill chưa xanh:
    test direct
    PASS/PASS_VALIDATION → tick xanh
    NO_HANDLER → paste case vào dispatcher, restart appcrm-api, test lại
    ERROR → docker logs appcrm-api --tail 100, fix code, restart, test lại
  nếu 100% xanh → DỪNG
  nếu 5 vòng không tiến triển → ghi e2e_reports/<module>_BLOCKED.md, DỪNG
```

## 4. Fix ở đâu

- File bind-mount: `/opt/crm/agent-tools-hermes.js` → `/app/dist/modules/agent-tools/routes.js` (sửa thẳng, không cần rebuild)
- Source TS (nếu có): rebuild → docker cp dist
- Restart: `cd /opt/crm && docker compose -p appcrm restart api`

## 5. Output

Mỗi module test xong, ghi `e2e_reports/<module>_<YYYYMMDD>.md` — bảng skill | verdict | note. Push lên repo này.

**Không động vào Hub VPS (`/opt/hermes/`). Chỉ làm trong appcrm-api.**

---

**Bắt đầu**: viết `scripts/test_all_skills.sh` — đọc tất cả `_index.json` trong repo, direct test từng skill, ghi report `e2e_reports/`. Rồi tự loop fix tới khi xanh.
