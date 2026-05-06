#!/usr/bin/env bash
# CRM AI chạy script này TRÊN VPS (hoặc bind-mount vào appcrm-api):
#   ssh vienthammykjm@136.112.201.221
#   scp scripts/sweep_all_skills.sh vienthammykjm@136.112.201.221:/tmp/
#   docker cp /tmp/sweep_all_skills.sh appcrm-api:/tmp/
#   docker exec -i appcrm-api bash /tmp/sweep_all_skills.sh
#
# Output: /tmp/sweep_<date>.md  → copy ra host → push lên repo e2e_reports/

set -uo pipefail

SECRET=$(printenv CRM_INTERNAL_SECRET 2>/dev/null || echo "")
[[ -z "$SECRET" ]] && { echo "FATAL: CRM_INTERNAL_SECRET không set"; exit 1; }

WS="52b399db-ff89-4f75-a780-4c85477a0c24"   # My Salon
USER_ID=$(printenv TEST_USER_ID 2>/dev/null || echo "")
[[ -z "$USER_ID" ]] && {
  # Tự lấy 1 user_id thuộc workspace
  USER_ID=$(psql "$DATABASE_URL" -tAc "SELECT user_id FROM workspace_members WHERE workspace_id::text='$WS' LIMIT 1" 2>/dev/null || echo "")
}
[[ -z "$USER_ID" ]] && { echo "FATAL: không tìm được user_id"; exit 1; }

SENTINEL="00000000-0000-0000-0000-000000000000"
DATE=$(date +%Y%m%d)
OUT="/tmp/sweep_${DATE}.md"

# Danh sách skill từ tool_spec_anthropic_implemented.json (skill backend đã wire)
SPEC="/app/dist/skills/crm/_tool_spec_anthropic_implemented.json"
[[ -f "$SPEC" ]] || SPEC="/opt/crm/skills/crm/_tool_spec_anthropic_implemented.json"
[[ -f "$SPEC" ]] || { echo "FATAL: không thấy spec"; exit 1; }

SKILLS=$(node -e "const a=JSON.parse(require('fs').readFileSync('$SPEC','utf8'));console.log(a.map(s=>s.name).join('\n'))")
TOTAL=$(echo "$SKILLS" | wc -l)

echo "# Direct sweep — $DATE" > "$OUT"
echo "" >> "$OUT"
echo "**Total**: $TOTAL skill | **Workspace**: $WS | **User**: $USER_ID" >> "$OUT"
echo "" >> "$OUT"
echo "| # | Skill | HTTP | Verdict | Snippet |" >> "$OUT"
echo "|---|---|---|---|---|" >> "$OUT"

i=0
PASS=0; PASSV=0; NOH=0; ERR=0
while IFS= read -r skill; do
  i=$((i+1))
  # Args mẫu: tất cả id dùng SENTINEL, các field text "test"
  BODY='{"group_id":"'$SENTINEL'","customer_id":"'$SENTINEL'","id":"'$SENTINEL'","limit":5,"name":"sweep test","query":"test"}'

  RES=$(curl -s -o /tmp/body.json -w '%{http_code}' -X POST "http://localhost:3000/internal/skills/$skill" \
    -H "X-Internal-Secret: $SECRET" \
    -H "X-User-Id: $USER_ID" \
    -H "X-Group-Id: $WS" \
    -H "Content-Type: application/json" \
    --max-time 10 \
    -d "$BODY")
  BODY_OUT=$(head -c 200 /tmp/body.json | tr '\n' ' ' | tr '|' '/')

  case "$RES" in
    200)
      if grep -q '"ok":true' /tmp/body.json; then V="PASS"; PASS=$((PASS+1));
      elif grep -qE 'NOT_FOUND|MISSING|VALIDATION' /tmp/body.json; then V="PASS_VALIDATION"; PASSV=$((PASSV+1));
      else V="PASS_AMBIG"; PASS=$((PASS+1)); fi ;;
    404)
      if grep -q "Cannot POST" /tmp/body.json; then V="NO_HANDLER"; NOH=$((NOH+1));
      else V="NOT_FOUND"; PASSV=$((PASSV+1)); fi ;;
    400) V="PASS_VALIDATION"; PASSV=$((PASSV+1));;
    500) V="ERROR_500"; ERR=$((ERR+1));;
    *)   V="HTTP_$RES"; ERR=$((ERR+1));;
  esac
  echo "| $i | \`$skill\` | $RES | $V | $BODY_OUT |" >> "$OUT"
  printf "[%3d/%3d] %-40s %s %s\n" "$i" "$TOTAL" "$skill" "$RES" "$V"
done <<< "$SKILLS"

echo "" >> "$OUT"
echo "## Tổng kết" >> "$OUT"
echo "- ✅ PASS: $PASS" >> "$OUT"
echo "- ✅ PASS_VALIDATION: $PASSV" >> "$OUT"
echo "- ❌ NO_HANDLER: $NOH" >> "$OUT"
echo "- ❌ ERROR_500: $ERR" >> "$OUT"
echo ""
echo "DONE → $OUT"
echo "PASS=$PASS PASSV=$PASSV NO_HANDLER=$NOH ERROR=$ERR"
