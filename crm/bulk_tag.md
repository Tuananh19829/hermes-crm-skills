---
name: bulk_tag
description: Gắn tag cho nhiều khách cùng lúc. Hỗ trợ merge (thêm vào tag cũ) hoặc replace (thay toàn bộ).
triggers:
  - "gắn tag"
  - "bulk tag"
  - "tag nhiều khách"
  - "label khách"
  - "phân nhóm"
endpoint: POST /internal/skills/bulk_tag
---

# Skill: bulk_tag

## Khi nào dùng
- User muốn phân nhóm/label nhiều khách sau khi tìm kiếm

## Mode
- `merge` (mặc định): thêm tags mới vào danh sách tag hiện có
- `replace`: thay toàn bộ tag bằng danh sách mới

## Ví dụ
User: "Gắn tag 'tháng4-promo' cho 3 khách vừa tìm được"
→ `{"person_ids": ["uuid1","uuid2","uuid3"], "tags": ["tháng4-promo"]}`

## Giới hạn
- Tối đa 100 khách mỗi lần

## Output format
```json
{
  "ok": true,
  "data": {
    "updated": 3,
    "tags": ["tháng4-promo"],
    "mode": "merge",
    "message": "Đã cập nhật tag cho 3 khách hàng"
  }
}
```
