#!/bin/bash
# Flow test: SEED -> UPDATE -> READ -> DELETE for customer_groups
# Verifies: created group is found, member added shows in list, then removed, then deleted.
set -u
SECRET=$(docker exec appcrm-api printenv INTERNAL_SECRET)
WS=${WS:-3a87c900-a7d5-4f01-9c7a-657db3a5fc43}            # workspaces.group_id (Hermes group)
WS_INTERNAL=${WS_INTERNAL:-b3ce66dc-156c-4361-992c-f7efeffea868}  # workspaces.id (for DB query)
IP=172.21.0.2
TS=$(date +%s)
NAME="AI_TEST_GROUP_$TS"
USER_HDR=${USER_HDR:-8804d359-cd6a-4cdb-a67c-ff4fab792982}  # sso_user_id of OWNER

PERSON_ID=$(docker exec spaclaw-shared-pg psql -U appcrm -d appcrm -t -A -c "SELECT id FROM people WHERE workspace_id='$WS_INTERNAL' LIMIT 1")
if [ -z "$PERSON_ID" ]; then echo "FATAL: no person in workspace $WS_INTERNAL"; exit 1; fi
echo "Using person_id=$PERSON_ID"

call() {
    local skill="$1" body="$2"
    curl -sS -m 20 -X POST "http://$IP:4000/internal/skills/$skill" \
        -H "X-Internal-Secret: $SECRET" -H "X-User-Id: $USER_HDR" -H "X-Group-Id: $WS" \
        -H 'Content-Type: application/json' -d "$body"
}

echo "=== SEED: create_customer_group ==="
SEED=$(call create_customer_group "{\"name\":\"$NAME\",\"description\":\"AI test\",\"color\":\"#ff8800\"}")
echo "$SEED"
GID=$(echo "$SEED" | grep -oE '"id":"[^"]+"' | head -1 | sed 's/"id":"//;s/"//')
if [ -z "$GID" ]; then echo "FATAL: SEED failed (no id)"; exit 1; fi
echo "GROUP_ID=$GID"

echo "=== UPDATE: update_customer_group (description) ==="
call update_customer_group "{\"group_id\":\"$GID\",\"description\":\"AI test updated\"}"
echo

echo "=== UPDATE: add_member_to_group (person=$PERSON_ID) ==="
call add_member_to_group "{\"group_id\":\"$GID\",\"customer_id\":\"$PERSON_ID\"}"
echo

echo "=== READ: get_customer_group_detail ==="
DETAIL=$(call get_customer_group_detail "{\"group_id\":\"$GID\"}")
echo "$DETAIL"
echo "$DETAIL" | grep -q "\"$PERSON_ID\"" && echo "READ_DETAIL: FOUND member ✓" || echo "READ_DETAIL: DATA_MISSING (member not in detail) ✗"

echo "=== READ: list_group_members ==="
LIST=$(call list_group_members "{\"group_id\":\"$GID\"}")
echo "$LIST"
echo "$LIST" | grep -q "\"$PERSON_ID\"" && echo "READ_LIST: FOUND member ✓" || echo "READ_LIST: DATA_MISSING ✗"

echo "=== UPDATE: remove_member_from_group ==="
call remove_member_from_group "{\"group_id\":\"$GID\",\"customer_id\":\"$PERSON_ID\"}"
echo

echo "=== READ_VERIFY: list_group_members (should be empty) ==="
LIST2=$(call list_group_members "{\"group_id\":\"$GID\"}")
echo "$LIST2"
echo "$LIST2" | grep -q "\"$PERSON_ID\"" && echo "READ_VERIFY: STILL_PRESENT ✗" || echo "READ_VERIFY: REMOVED ✓"

echo "=== DELETE: delete_customer_group ==="
DEL=$(call delete_customer_group "{\"group_id\":\"$GID\",\"reason\":\"ai_test_cleanup\"}")
echo "$DEL"
echo "$DEL" | grep -q '"deleted":true' && echo "DELETE: OK ✓" || echo "DELETE: FAIL ✗"

echo "=== READ_AFTER_DELETE: get_customer_group_detail (should 404) ==="
AFTER=$(call get_customer_group_detail "{\"group_id\":\"$GID\"}")
echo "$AFTER"
echo "$AFTER" | grep -q 'GROUP_NOT_FOUND' && echo "POST_DELETE: 404 ✓" || echo "POST_DELETE: STILL_EXISTS ✗"
