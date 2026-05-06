#!/bin/bash
# ============================================================
# AUTO-APPLY customer_groups handler patch on VPS spaclaw-main
# ============================================================
# Usage: SSH vào VPS, paste toàn bộ script này vào terminal
#   ssh <user>@136.112.201.221
#   bash <(curl -sL https://raw.githubusercontent.com/Tuananh19829/hermes-crm-skills/main/customer_groups/APPLY_PATCH.sh)
# Hoặc paste trực tiếp.
# ============================================================

set -e

ROUTES_FILE="/opt/crm/agent-tools-hermes.js"
BACKUP_FILE="/opt/crm/agent-tools-hermes.js.bak-$(date +%Y%m%d-%H%M%S)"
TMP_PATCH="/tmp/customer_groups_handlers.txt"
REPO_RAW="https://raw.githubusercontent.com/Tuananh19829/hermes-crm-skills/main/customer_groups/HANDLER_PATCH.js"

echo "=== Step 1: Pre-flight check ==="
[ -f "$ROUTES_FILE" ] || { echo "ERROR: $ROUTES_FILE không tồn tại"; exit 1; }

# Check chưa có 7 case
EXISTING=$(grep -c "case 'get_customer_group_detail'" "$ROUTES_FILE" || true)
if [ "$EXISTING" -gt 0 ]; then
    echo "WARN: Patch đã có sẵn ($EXISTING match). Đang skip để tránh duplicate."
    echo "Nếu muốn re-apply, xóa case cũ rồi chạy lại."
    exit 0
fi

echo "=== Step 2: Backup file gốc ==="
sudo cp "$ROUTES_FILE" "$BACKUP_FILE"
echo "Backup: $BACKUP_FILE"

echo "=== Step 3: Pull patch từ git ==="
curl -sL "$REPO_RAW" -o "$TMP_PATCH"
[ -s "$TMP_PATCH" ] || { echo "ERROR: Pull patch failed"; exit 1; }

# Extract chỉ phần switch-case (giữa "// ============= 1. SWITCH-CASE BLOCK =============" và 2.)
# Hoặc đơn giản: lấy từ "case 'get_customer_group_detail':" tới end of last case
PATCH_BLOCK=$(awk '
  /^case .get_customer_group_detail/ { found=1 }
  found { print }
  /^}$/ && found && prev_close==1 { exit }
  /^}$/ && found { prev_close=1; next }
  /^}$/ && !found { prev_close=0 }
  { prev_close=0 }
' "$TMP_PATCH")

# Đơn giản hơn: lấy 7 case block từ patch file (start at first case to end of file or marker)
PATCH_CONTENT=$(sed -n '/^case .get_customer_group_detail/,/^case .list_group_members.*}$/p' "$TMP_PATCH")

# Hoặc grep-based extraction (an toàn nhất)
START_LINE=$(grep -n "^case 'get_customer_group_detail'" "$TMP_PATCH" | head -1 | cut -d: -f1)
[ -z "$START_LINE" ] && { echo "ERROR: Không tìm thấy start case"; exit 1; }

# Lấy từ START_LINE tới hết file (sau đó cắt phần helper functions)
tail -n +$START_LINE "$TMP_PATCH" > /tmp/patch_block.js

echo "=== Step 4: Insert vào routes.js ==="
echo "Tìm dòng 'default:' trong switch chính của ROUTES_FILE để insert trước nó..."

# Dùng Node.js script để insert chính xác (an toàn hơn sed/awk với code)
sudo node -e "
const fs = require('fs');
const file = '$ROUTES_FILE';
const patchPath = '/tmp/patch_block.js';
const src = fs.readFileSync(file, 'utf8');
const patch = fs.readFileSync(patchPath, 'utf8');

// Tìm 'default:' trong switch (skillName) cuối cùng
const switchMatch = src.match(/switch\s*\(\s*skillName\s*\)\s*\{[\s\S]*?default\s*:/);
if (!switchMatch) {
  console.error('ERROR: Không tìm thấy switch (skillName) { ... default:');
  process.exit(1);
}

// Insert patch trước 'default:'
const insertPos = switchMatch.index + switchMatch[0].length - 'default:'.length;
const newSrc = src.slice(0, insertPos) + '\n' + patch + '\n      ' + src.slice(insertPos);
fs.writeFileSync(file, newSrc);
console.log('Insert thành công: ' + patch.split('case ').length + ' case mới');
"

echo "=== Step 5: Restart container ==="
docker restart appcrm-api
sleep 4

echo "=== Step 6: Verify live ==="
LIVE_COUNT=$(docker exec appcrm-api grep -c "case 'get_customer_group_detail'" /app/dist/modules/agent-tools/routes.js 2>/dev/null || echo "0")
echo "case 'get_customer_group_detail' trong container: $LIVE_COUNT (expect: 1)"

if [ "$LIVE_COUNT" != "1" ]; then
    echo "ERROR: Verify FAIL — restore backup"
    sudo cp "$BACKUP_FILE" "$ROUTES_FILE"
    docker restart appcrm-api
    exit 1
fi

echo "=== Step 7: Logs check ==="
docker logs appcrm-api --tail 20 2>&1 | grep -iE "error|listening|started" | tail -5

echo ""
echo "✅ DONE — 7 customer_groups handlers LIVE"
echo "Backup tại: $BACKUP_FILE"
echo "Rollback nếu cần: sudo cp $BACKUP_FILE $ROUTES_FILE && docker restart appcrm-api"
echo ""
echo "→ Báo Hub re-test: cd hermes-crm-skills && git commit -m 'verified live customer_groups handlers' --allow-empty && git push"
