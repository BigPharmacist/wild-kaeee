# Minijobber Datenübernahme & Sync

## Überblick

Die Minijobber-Verwaltung wurde ursprünglich als eigenständige App mit **Supabase Cloud** betrieben.
Die Funktionen werden schrittweise in die Kaeee-App (lokale Supabase) integriert.

Bis zur vollständigen Migration läuft ein **Einweg-Sync: Cloud → Lokal** (täglich 03:30 Uhr).

```
┌─────────────────────────┐         ┌──────────────────────────────┐
│   Supabase Cloud        │         │   Lokale Supabase (Kaeee)    │
│   (minijobber-app)      │  ────►  │   mj_* Tabellen              │
│                         │  Sync   │                              │
│   kippzqewhyoqndgepsmg  │         │   kaeee.de/supabase          │
└─────────────────────────┘         └──────────────────────────────┘
```

**Datenfluss:** Nur Cloud → Lokal. Die Cloud ist Source of Truth bis zum Cutover.

---

## Tabellen-Mapping

### Cloud → Lokal

| Cloud-Tabelle | Lokale Tabelle(n) | Bemerkung |
|---|---|---|
| `employees` | `staff` + `mj_profiles` | Aufgeteilt: Stammdaten → `staff`, MJ-spezifisch → `mj_profiles` |
| `shifts` | `mj_shifts` | + `pharmacy_id` |
| `schedules` | `mj_schedules` | `employee_id` → `staff_id`, + `pharmacy_id` |
| `work_records` | `mj_work_records` | `recorded_by` entfällt, + `pharmacy_id` |
| `holidays` | `mj_holidays` | + `pharmacy_id` |
| `standard_weeks` | `mj_standard_weeks` | Format geändert (s. unten) |
| `info_entries` | `mj_info_entries` | `highlighted_employees`, `created_by` entfallen |
| `employee_hourly_rates` | `mj_hourly_rates` | `employee_id` → `staff_id` |
| `employee_monthly_payments` | `mj_monthly_payments` | `employee_id` → `staff_id` |
| `monthly_reports` | `mj_monthly_reports` | Wird lokal berechnet, nicht synchronisiert |
| `users` | — | Cloud-Auth, lokal nicht benötigt |
| `invitations` | — | Cloud-Feature |
| `audit_log` | — | Cloud-Audit |

### Felder die NICHT synchronisiert werden

- `schedules.created_by` — wer den Dienstplan-Eintrag erstellt hat
- `work_records.recorded_by` — wer die Ist-Zeit erfasst hat
- `info_entries.highlighted_employees` — @-Markierungen im Text
- `info_entries.created_by`
- `audit_log` — komplettes Änderungsprotokoll

---

## Cloud-Datenbankstruktur (Supabase Cloud)

### employees
```sql
id              UUID PRIMARY KEY
name            VARCHAR(255) NOT NULL        -- "Vorname Nachname"
address         TEXT                         -- "Straße, PLZ Stadt"
phone           VARCHAR(50)
mobile          VARCHAR(50)
email           VARCHAR(255)
active          BOOLEAN DEFAULT TRUE
hourly_rate     DECIMAL(10,2)
monthly_payment DECIMAL(10,2)
hours_balance   DECIMAL(10,2) DEFAULT 0
job_type        VARCHAR(50)                  -- 'Autobote'|'Fahrradbote'|'Sonstiges'
initials        VARCHAR(3)
```

### shifts
```sql
id              UUID PRIMARY KEY
name            VARCHAR(100)                 -- 'Vormittag'|'Nachmittag'|'Fahrradbote'
start_time      TIME
end_time        TIME
hours           DECIMAL(5,2)
```

### schedules
```sql
id              UUID PRIMARY KEY
employee_id     UUID → employees.id
shift_id        UUID → shifts.id
date            DATE
absent          BOOLEAN DEFAULT FALSE
absent_reason   VARCHAR(255)
created_by      UUID → users.id              -- ⚠ nicht synchronisiert
UNIQUE(employee_id, date, shift_id)
```

### work_records
```sql
id              UUID PRIMARY KEY
schedule_id     UUID → schedules.id ON DELETE CASCADE
actual_start_time TIME
actual_end_time   TIME
actual_hours      DECIMAL(5,2)
recorded_by     UUID → users.id              -- ⚠ nicht synchronisiert
```

### holidays
```sql
id              UUID PRIMARY KEY
name            VARCHAR(255)
date            DATE UNIQUE
```

### standard_weeks
```sql
id              INTEGER PRIMARY KEY (1 oder 2)
name            TEXT
schedule_data   JSONB                        -- Format: { "0": { "shift_id": "employee_id", ... }, ... }
                                             --   Key = Wochentag-Index (0=Mo, 5=Sa)
                                             --   Value = Map shift_id → employee_id
```

### info_entries
```sql
id              UUID PRIMARY KEY
month           INTEGER (1-12)
year            INTEGER
text            TEXT
employee_id     UUID → employees.id          -- optional
highlighted_employees TEXT[]                 -- ⚠ nicht synchronisiert
created_by      UUID → users.id              -- ⚠ nicht synchronisiert
```

### employee_hourly_rates
```sql
id              UUID PRIMARY KEY
employee_id     UUID → employees.id
rate            DECIMAL(10,2)
valid_from      DATE
UNIQUE(employee_id, valid_from)
```

### employee_monthly_payments
```sql
id              UUID PRIMARY KEY
employee_id     UUID → employees.id
amount          DECIMAL(10,2)
valid_from      DATE
UNIQUE(employee_id, valid_from)
```

---

## Lokale Datenbankstruktur (Kaeee mj_* Tabellen)

Alle Tabellen haben zusätzlich `pharmacy_id UUID` (FK → `pharmacies`) und RLS-Policies.

Vollständige Schema-Definition: `supabase/migrations/20260215_minijobber.sql`

### Wichtige Unterschiede zur Cloud

1. **employees → staff + mj_profiles**
   - Cloud: eine `employees`-Tabelle mit allem
   - Lokal: `staff` (Name, Kontakt, Rolle) + `mj_profiles` (Stundenlohn, Pauschale, etc.)
   - `staff.role = 'Minijobber'` kennzeichnet Minijobber-Einträge
   - `mj_profiles.staff_id` verweist auf `staff.id`

2. **standard_weeks.schedule_data Format**
   - Cloud: `{ "0": { "shift_uuid": "employee_uuid" } }` (Tag-Index → Shift→Employee Map)
   - Lokal: `{ "Montag": [{ "staff_id": "...", "shift_id": "..." }] }` (Tag-Name → Array von Zuordnungen)

3. **Alle IDs werden gemappt**
   - Cloud-UUIDs ≠ Lokale UUIDs (außer Matthias, s. unten)
   - Mapping in `mj_cloud_id_map`-Tabelle gespeichert

---

## Sync-Infrastruktur

### Tabellen

| Tabelle | Zweck |
|---|---|
| `mj_cloud_id_map` | Cloud-UUID → Lokale-UUID Zuordnung (PK: cloud_id + table_name) |
| `mj_sync_state` | Zeitstempel des letzten Syncs (Singleton) |

### Funktion

```sql
get_or_create_local_id(cloud_id TEXT, table_name TEXT, fixed_id UUID DEFAULT NULL) → UUID
```

Gibt die stabile lokale UUID für eine Cloud-ID zurück. Erstellt automatisch ein neues Mapping wenn keines existiert. `fixed_id` wird für Matthias verwendet (fester staff_id).

Schema-Definition: `supabase/migrations/20260216_mj_sync_infrastructure.sql`

### Festes Mapping

| Person | Cloud-ID | Lokale staff_id |
|---|---|---|
| Matthias Blüm | `da2217dc-0933-4196-b6be-e76c50099ff5` | `011695e8-9bd8-4ba5-9ba3-15ca37c319aa` |

Matthias existiert bereits als Staff-Eintrag in der lokalen DB. Sein `staff`-Eintrag wird beim Sync NICHT überschrieben — nur sein `mj_profiles`-Eintrag wird synchronisiert.

---

## Sync-Skript

### Dateien

| Datei | Zweck |
|---|---|
| `scripts/migrate_minijobber_data.py` | Haupt-Sync-Skript (Python) |
| `scripts/minijobber_sync_cron.sh` | Wrapper für Cronjob (holt Key, ruft Python auf) |

### Verwendung

```bash
# Normaler Sync (idempotent, jederzeit wiederholbar):
MINIJOBBER_CLOUD_KEY=xxx python3 scripts/migrate_minijobber_data.py

# Komplett-Reset + Neuimport (löscht alle lokalen mj_*-Daten):
MINIJOBBER_CLOUD_KEY=xxx python3 scripts/migrate_minijobber_data.py --reset

# Nur SQL generieren, nicht ausführen:
MINIJOBBER_CLOUD_KEY=xxx python3 scripts/migrate_minijobber_data.py --dry-run
```

### Cloud-Key

Der Service-Role-Key der Cloud-Instanz liegt in der lokalen DB:

```sql
SELECT value FROM private.app_secrets WHERE name = 'minijobber_cloud_service_role_key';
```

### Ablauf des Syncs

1. Alle Daten aus der Cloud via PostgREST-API holen
2. SQL generieren mit `get_or_create_local_id()` für stabile ID-Zuordnung
3. UPSERT (INSERT ... ON CONFLICT DO UPDATE) für jede Tabelle
4. Sync-Zeitstempel in `mj_sync_state` aktualisieren
5. SQL via `psql` ausführen

### Cronjob

```
30 3 * * *  /home/matthias/Kaeee/scripts/minijobber_sync_cron.sh
```

Täglich um 03:30 Uhr. Log: `logs/minijobber_sync.log`

---

## Datenvolumen (Stand Februar 2026)

| Tabelle | Anzahl |
|---|---|
| Mitarbeiter (employees/staff) | 12 (11 Minijobber + Matthias) |
| Schichten (shifts) | 3 (Vormittag, Nachmittag, Fahrradbote) |
| Dienstplan (schedules) | ~900 |
| Ist-Stunden (work_records) | ~800 |
| Feiertage (holidays) | 143 (2025–2035) |
| Standardwochen (standard_weeks) | 2 |
| Pinnwand (info_entries) | 23 |
| ID-Mappings (mj_cloud_id_map) | ~1.700 |

---

## Cutover-Plan

Wenn alle Minijobber-Funktionen in Kaeee fertig sind:

1. Letzten Sync ausführen
2. Cronjob entfernen: `crontab -e` → Zeile löschen
3. Optional: `mj_cloud_id_map` und `mj_sync_state` Tabellen droppen
4. Optional: `scripts/migrate_minijobber_data.py` und `scripts/minijobber_sync_cron.sh` löschen
5. Cloud-Instanz kann abgeschaltet werden
