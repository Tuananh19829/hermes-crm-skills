#!/bin/bash
# ============================================================
# AUTO-APPLY customer_groups handler patch on VPS spaclaw-main
# Version: 2 (use awk instead of sudo node)
# ============================================================
# Usage: SSH vào VPS, paste:
#   bash <(curl -sL https://raw.githubusercontent.com/Tuananh19829/hermes-crm-skills/main/customer_groups/APPLY_PATCH.sh)
# ============================================================

set -e

ROUTES_FILE="/opt/crm/agent-tools-hermes.js"
BACKUP_FILE="/opt/crm/agent-tools-hermes.js.bak-$(date +%Y%m%d-%H%M%S)"
PATCH_URL="https://raw.githubusercontent.com/Tuananh19829/hermes-crm-skills/main/customer_groups/HANDLER_PATCH.js"
TMP_PATCH="/tmp/customer_groups_full.js"
TMP_BLOCK="/tmp/customer_groups_cases_only.js"

echo "=== Step 1: Pre-flight check ==="
[ -f "$ROUTES_FILE" ] || { echo "ERROR: $ROUTES_FILE không tồn tại"; exit 1; }

EXISTING=$(grep -c "case 'get_customer_group_detail'" "$ROUTES_FILE" 2>/dev/null || echo "0")
if [ "$EXISTING" -gt 0 ] 2>/dev/null; then
    echo "WARN: Patch đã có sẵn ($EXISTING match). Skip."
    exit 0
fi

echo "=== Step 2: Backup file gốc ==="
sudo cp "$ROUTES_FILE" "$BACKUP_FILE"
echo "Backup: $BACKUP_FILE"

echo "=== Step 3: Pull patch từ git ==="
curl -sL "$PATCH_URL" -o "$TMP_PATCH"
[ -s "$TMP_PATCH" ] || { echo "ERROR: Pull patch failed"; exit 1; }

echo "=== Step 4: Extract 7 case block từ patch file ==="
# Patch file có 2 phần: SWITCH-CASE BLOCK (cần) + helper docs (bỏ)
# Lấy từ "case 'get_customer_group_detail':" đến cuối "case 'list_group_members': {...}"
# Đếm braces để tìm đúng end của case cuối cùng

awk '
  /^case .get_customer_group_detail/ { found=1 }
  found {
    print
    # Track {...} balance
    n_open = gsub(/\{/, "{")
    n_close = gsub(/\}/, "}")
    balance += n_open - n_close
    if (in_last_case && balance == 0) { exit }
  }
  found && /^case .list_group_members/ { in_last_case=1 }
' "$TMP_PATCH" > "$TMP_BLOCK"

LINES=$(wc -l < "$TMP_BLOCK")
echo "Extracted $LINES dòng vào $TMP_BLOCK"
[ "$LINES" -lt 50 ] && { echo "ERROR: Block quá ngắn, có vấn đề. Xem $TMP_BLOCK"; exit 1; }

echo "=== Step 5: Insert vào routes.js (dùng awk) ==="

# Tìm dòng 'default:' trong switch (skillName) {...} để insert TRƯỚC nó
# Strategy: tạo file mới = phần trước default: + patch block + default: trở đi

# Backup trước
sudo cp "$ROUTES_FILE" /tmp/routes_pre_patch.js

# Dùng awk để chèn block trước "default:" đầu tiên gặp trong switch (skillName)
awk -v patch_file="$TMP_BLOCK" '
  BEGIN {
    # Đọc patch block vào biến
    while ((getline line < patch_file) > 0) {
      patch_block = patch_block line "\n"
    }
    close(patch_file)
    inserted = 0
  }
  # Detect switch (skillName) block
  /switch\s*\(\s*skillName\s*\)/ { in_switch = 1 }
  # Insert before first default: encountered in the switch
  in_switch && !inserted && /^[[:space:]]*default[[:space:]]*:/ {
    print patch_block
    inserted = 1
  }
  { print }
  END {
    if (!inserted) {
      print "ERROR: Không tìm thấy default: trong switch (skillName)" > "/dev/stderr"
      exit 1
    }
  }
' /tmp/routes_pre_patch.js > /tmp/routes_patched.js

# Verify file mới có 7 case mới
NEW_COUNT=$(grep -c "case 'get_customer_group_detail'" /tmp/routes_patched.js)
[ "$NEW_COUNT" = "1" ] || { echo "ERROR: Insert thất bại (count=$NEW_COUNT)"; exit 1; }

# Move file mới về production path
sudo mv /tmp/routes_patched.js "$ROUTES_FILE"
echo "Insert thành công: 7 case mới"

echo "=== Step 6: Restart container ==="
docker restart appcrm-api
sleep 4

echo "=== Step 7: Verify live ==="
LIVE_COUNT=$(docker exec appcrm-api grep -c "case 'get_customer_group_detail'" /app/dist/modules/agent-tools/routes.js 2>/dev/null || echo "0")
echo "Live count: $LIVE_COUNT (expect: 1)"

if [ "$LIVE_COUNT" != "1" ]; then
    echo "ERROR: Verify FAIL — restore backup"
    sudo cp "$BACKUP_FILE" "$ROUTES_FILE"
    docker restart appcrm-api
    exit 1
fi

echo "=== Step 8: Logs check ==="
docker logs appcrm-api --tail 20 2>&1 | grep -iE "error|listening|started" | tail -5 || true

echo ""
echo "✅ DONE — 7 customer_groups handlers LIVE"
echo "Backup: $BACKUP_FILE"
echo "Rollback nếu cần: sudo cp $BACKUP_FILE $ROUTES_FILE && docker restart appcrm-api"
echo ""
echo "→ Báo Hub re-test bằng cách commit ack:"
echo "   cd /tmp && git clone https://github.com/Tuananh19829/hermes-crm-skills.git 2>/dev/null; cd hermes-crm-skills"
echo "   git commit --allow-empty -m 'verified live customer_groups handlers' && git push"
