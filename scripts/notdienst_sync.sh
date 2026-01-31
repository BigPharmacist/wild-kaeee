#!/bin/bash
# Notdienst-Apotheken in Kalender schreiben
# Holt alle verfügbaren Tage, pro Tag die nächste Apotheke

set -e

NOTDIENST_URL="https://notdienst.sberg.net/api/apipub/notdienst/xmlschnittstelle/QUENGgADF0RCQl9HWUwFaGp_TVZGW1pPV14MdmxwSUJDVwltYHF-cntkeV5CQ1pURF1mQ1pQHw8TT0NUWk1ZQHNYV1lDXG5GRHBYVxsAWlBZWk9HWlBPcEMbGR0GEARLS1lEGhUfSk5XVBsCAEtGRVZcUFJCZ09xUFdUUQkBAUJaVkRtWVBGRENdSQw="
CALENDAR_ID="9fe4af85-0016-4c98-9a9e-6a8e1ee55e27"
LOG_FILE="/home/matthias/scripts/notdienst.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

log "Starte Notdienst-Sync..."

# XML abrufen
XML=$(curl -s "$NOTDIENST_URL" | tr -d '\n')

if [ -z "$XML" ]; then
    log "FEHLER: Konnte API nicht abrufen"
    exit 1
fi

# Alle Einträge in temporäre Datei
echo "$XML" | grep -oP '<entry>.*?</entry>' > /tmp/notdienst_entries.txt

# Bereits verarbeitete Daten tracken (pro Tag nur erste Apotheke)
declare -A PROCESSED_DATES

COUNT=0

while read -r ENTRY; do
    # Felder extrahieren (|| true verhindert Abbruch bei leeren Feldern)
    APO_ID=$(echo "$ENTRY" | grep -oP '(?<=<id>)[^<]*' || true)
    APO_NAME=$(echo "$ENTRY" | grep -oP '(?<=<name>)[^<]*' || true)
    APO_STREET=$(echo "$ENTRY" | grep -oP '(?<=<street>)[^<]*' || true)
    APO_ZIP=$(echo "$ENTRY" | grep -oP '(?<=<zipCode>)[^<]*' || true)
    APO_LOCATION=$(echo "$ENTRY" | grep -oP '(?<=<location>)[^<]*' || true)
    APO_PHONE=$(echo "$ENTRY" | grep -oP '(?<=<phone>)[^<]*' || true)
    APO_FROM=$(echo "$ENTRY" | grep -oP '(?<=<from>)[^<]*' || true)
    APO_TO=$(echo "$ENTRY" | grep -oP '(?<=<to>)[^<]*' || true)
    APO_DISTANCE=$(echo "$ENTRY" | grep -oP '(?<=<distance>)[^<]*' || true)

    # Datum extrahieren (nur Tag)
    DATE_KEY="${APO_FROM:0:10}"

    # Nur erste Apotheke pro Tag (API ist nach Entfernung sortiert)
    if [ -n "${PROCESSED_DATES[$DATE_KEY]}" ]; then
        continue
    fi
    PROCESSED_DATES[$DATE_KEY]=1

    # External ID für Duplikatvermeidung
    EXTERNAL_ID="notdienst-${DATE_KEY}"

    # Beschreibung
    DESCRIPTION="${APO_STREET}\n${APO_ZIP} ${APO_LOCATION}\nTel: ${APO_PHONE}\nEntfernung: ${APO_DISTANCE} m"

    # SQL-sichere Werte
    SAFE_NAME="${APO_NAME//\'/\'\'}"
    SAFE_DESC="${DESCRIPTION//\'/\'\'}"

    # In Datenbank schreiben
    docker exec supabase-db psql -U postgres -d postgres -q -c "
    INSERT INTO calendar_events (
        calendar_id, title, description, start_time, end_time,
        all_day, external_id, external_source
    ) VALUES (
        '${CALENDAR_ID}',
        '${SAFE_NAME}',
        E'${SAFE_DESC}',
        '${APO_FROM}',
        '${APO_TO}',
        true,
        '${EXTERNAL_ID}',
        'notdienst-api'
    ) ON CONFLICT (external_id) WHERE external_id IS NOT NULL
    DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        updated_at = NOW();
    " 2>/dev/null

    log "Gespeichert: $DATE_KEY - $APO_NAME ($APO_DISTANCE m)"
    COUNT=$((COUNT + 1))

done < /tmp/notdienst_entries.txt

log "Fertig: $COUNT Tage importiert"
echo "$COUNT Tage importiert"
