#!/usr/bin/env bash
# Hub-side auto-deploy spec to Hub VPS hermes-api container
# Run từ máy Hub admin (đã ssh-key vào hub VPS)
# Usage:
#   ./scripts/hub_deploy_spec.sh <module>
#   ./scripts/hub_deploy_spec.sh customer_groups
#   ./scripts/hub_deploy_spec.sh --all       # deploy mọi module có thay đổi
#   ./scripts/hub_deploy_spec.sh --auto      # đọc commit message gần nhất, tự detect REQUIRES HUB SPEC DEPLOY

set -euo pipefail

# === CONFIG ===
HUB_SSH="${HUB_SSH:-vienthammykjm@34.142.240.11}"
HUB_CONTAINER="${HUB_CONTAINER:-hermes-api}"
HUB_SKILLS_PATH="${HUB_SKILLS_PATH:-/opt/hermes/skills/crm}"
PACK_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# === HELPERS ===
log() { echo "[hub-deploy] $*" >&2; }
die() { log "FATAL: $*"; exit 1; }

deploy_module() {
  local mod="$1"
  local local_index="$PACK_ROOT/$mod/_index.json"
  [[ -f "$local_index" ]] || die "Missing $local_index"

  log "Deploying module $mod..."

  # 1. Copy _index.json + skill JSON files lên Hub VPS /tmp staging
  ssh "$HUB_SSH" "mkdir -p /tmp/hermes-deploy/$mod"
  scp -q "$local_index" "$HUB_SSH:/tmp/hermes-deploy/$mod/_index.json"

  # Copy tất cả file *.json + HANDLER_PATCH.js (read-only ref) trong module
  for f in "$PACK_ROOT/$mod/"*.json; do
    [[ -f "$f" ]] && scp -q "$f" "$HUB_SSH:/tmp/hermes-deploy/$mod/$(basename "$f")"
  done

  # 2. docker cp staging → container
  ssh "$HUB_SSH" "docker cp /tmp/hermes-deploy/$mod $HUB_CONTAINER:$HUB_SKILLS_PATH/"
  log "  docker cp $mod -> $HUB_CONTAINER:$HUB_SKILLS_PATH/$mod"
}

deploy_root_specs() {
  log "Deploying root tool_spec files..."
  for f in _tool_spec_anthropic.json _tool_spec_anthropic_implemented.json _master_manifest.json; do
    [[ -f "$PACK_ROOT/$f" ]] || continue
    scp -q "$PACK_ROOT/$f" "$HUB_SSH:/tmp/hermes-deploy/$f"
    ssh "$HUB_SSH" "docker cp /tmp/hermes-deploy/$f $HUB_CONTAINER:$HUB_SKILLS_PATH/$f"
    log "  $f -> $HUB_CONTAINER:$HUB_SKILLS_PATH/"
  done
}

restart_hermes() {
  log "Restarting $HUB_CONTAINER..."
  ssh "$HUB_SSH" "docker restart $HUB_CONTAINER"
  log "  done. Waiting 5s for boot..."
  sleep 5
  local status
  status=$(ssh "$HUB_SSH" "docker inspect -f '{{.State.Status}}' $HUB_CONTAINER")
  [[ "$status" == "running" ]] || die "$HUB_CONTAINER not running after restart (status=$status)"
  log "  $HUB_CONTAINER is running"
}

verify_module() {
  local mod="$1"
  log "Verifying module $mod inside container..."
  ssh "$HUB_SSH" "docker exec $HUB_CONTAINER cat $HUB_SKILLS_PATH/$mod/_index.json | head -20" || true
}

auto_detect_modules_from_commit() {
  local msg
  msg=$(git log -1 --pretty=%B)
  # Match patterns:
  #   REQUIRES HUB SPEC DEPLOY: <module>
  #   ADD_SKILL: <skill_name> in <module>
  echo "$msg" | grep -oE 'REQUIRES HUB SPEC DEPLOY: [a-z_]+' | awk '{print $NF}'
  echo "$msg" | grep -oE 'in [a-z_]+$' | awk '{print $NF}'
}

# === MAIN ===
MODULES=()
DEPLOY_ROOT=true

case "${1:-}" in
  "")
    die "Usage: $0 <module> | --all | --auto"
    ;;
  --auto)
    mapfile -t MODULES < <(auto_detect_modules_from_commit | sort -u)
    [[ ${#MODULES[@]} -gt 0 ]] || die "No modules detected from commit message"
    log "Auto-detected from last commit: ${MODULES[*]}"
    ;;
  --all)
    mapfile -t MODULES < <(find "$PACK_ROOT" -maxdepth 2 -name '_index.json' -not -path '*/scripts/*' \
                            | xargs -n1 dirname | xargs -n1 basename | sort)
    log "Deploying all ${#MODULES[@]} modules"
    ;;
  *)
    MODULES=("$1")
    ;;
esac

for mod in "${MODULES[@]}"; do
  deploy_module "$mod"
done

if $DEPLOY_ROOT; then
  deploy_root_specs
fi

restart_hermes

for mod in "${MODULES[@]}"; do
  verify_module "$mod"
done

log "✅ Deploy complete. Modules: ${MODULES[*]}"
log "   Next: cd $PACK_ROOT && node /d/tmp/retest_<module>.mjs để verify E2E"
