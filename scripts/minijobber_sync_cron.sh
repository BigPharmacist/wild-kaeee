#!/bin/bash
# Minijobber Cloud → Local Sync (für Cronjob)
# Läuft 1x täglich, holt Key aus der lokalen DB.

set -euo pipefail

DOCKER_CWD="/home/matthias/supabase/docker"
SCRIPT="/home/matthias/Kaeee/scripts/migrate_minijobber_data.py"
LOG="/home/matthias/Kaeee/logs/minijobber_sync.log"

mkdir -p "$(dirname "$LOG")"

{
  echo "=== Sync $(date '+%Y-%m-%d %H:%M:%S') ==="

  # Cloud-Key aus lokaler DB holen
  CLOUD_KEY=$(docker compose -f "$DOCKER_CWD/docker-compose.yml" exec -T db \
    psql -U supabase_admin -d postgres -t -A \
    -c "SELECT value FROM private.app_secrets WHERE name = 'minijobber_cloud_service_role_key'")

  if [ -z "$CLOUD_KEY" ]; then
    echo "FEHLER: Cloud-Key nicht gefunden"
    exit 1
  fi

  MINIJOBBER_CLOUD_KEY="$CLOUD_KEY" python3 "$SCRIPT"

  echo "=== Fertig $(date '+%Y-%m-%d %H:%M:%S') ==="
  echo ""
} >> "$LOG" 2>&1
