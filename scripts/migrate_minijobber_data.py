#!/usr/bin/env python3
"""
Einweg-Sync: Supabase Cloud (minijobber-app) → Lokale Kaeee (mj_* Tabellen).

Cloud ist Source of Truth. Jederzeit wiederholbar.
IDs bleiben stabil dank mj_cloud_id_map Tabelle.

Usage:
  MINIJOBBER_CLOUD_KEY=xxx python3 scripts/migrate_minijobber_data.py
  MINIJOBBER_CLOUD_KEY=xxx python3 scripts/migrate_minijobber_data.py --reset
  MINIJOBBER_CLOUD_KEY=xxx python3 scripts/migrate_minijobber_data.py --dry-run

  --reset    Alle mj_*-Daten löschen und komplett neu importieren (erster Lauf)
  --dry-run  SQL generieren ohne auszuführen
"""

import json
import os
import subprocess
import sys
import urllib.request
from datetime import datetime


# ============================================================
# CONFIG
# ============================================================
CLOUD_URL = "https://kippzqewhyoqndgepsmg.supabase.co"
CLOUD_KEY = os.environ.get("MINIJOBBER_CLOUD_KEY", "")

LOCAL_PHARMACY_ID = "e27c71c2-c33f-4207-8028-9071f70d4f67"
MATTHIAS_STAFF_ID = "011695e8-9bd8-4ba5-9ba3-15ca37c319aa"
MATTHIAS_CLOUD_ID = "da2217dc-0933-4196-b6be-e76c50099ff5"

OUTPUT_FILE = "/tmp/minijobber_sync.sql"
DOCKER_CWD = "/home/matthias/supabase/docker"


# ============================================================
# HELPERS
# ============================================================
def cloud_fetch(table):
    """Alle Zeilen einer Cloud-Tabelle via PostgREST holen."""
    url = f"{CLOUD_URL}/rest/v1/{table}?select=*"
    req = urllib.request.Request(url, headers={
        "apikey": CLOUD_KEY,
        "Authorization": f"Bearer {CLOUD_KEY}",
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def esc(val):
    """SQL-Escape für Werte."""
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float)):
        return str(val)
    s = str(val).replace("'", "''")
    return f"'{s}'"


def lid(cloud_id, table, fixed=None):
    """SQL-Ausdruck für get_or_create_local_id()."""
    if fixed:
        return f"get_or_create_local_id('{cloud_id}', '{table}', '{fixed}')"
    return f"get_or_create_local_id('{cloud_id}', '{table}')"


def parse_address(address):
    """'Straße, PLZ Stadt' in Komponenten zerlegen."""
    street, postal_code, city = "", "", ""
    if not address:
        return street, postal_code, city
    parts = address.split(",", 1)
    if len(parts) >= 2:
        street = parts[0].strip()
        plz_city = parts[1].strip()
        plz_parts = plz_city.split(" ", 1)
        if len(plz_parts) >= 2 and plz_parts[0].isdigit():
            postal_code = plz_parts[0]
            city = plz_parts[1]
        else:
            city = plz_city
    else:
        street = address
    return street, postal_code, city


# ============================================================
# SQL GENERATION
# ============================================================
def generate_infrastructure_sql():
    """Sync-Infrastruktur (idempotent, läuft VOR der Transaktion)."""
    return """
-- Sync-Infrastruktur (idempotent)
CREATE TABLE IF NOT EXISTS mj_cloud_id_map (
  cloud_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  local_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (cloud_id, table_name)
);
CREATE INDEX IF NOT EXISTS idx_mj_cloud_id_map_local ON mj_cloud_id_map(local_id);

CREATE TABLE IF NOT EXISTS mj_sync_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_sync_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION get_or_create_local_id(
  p_cloud_id TEXT,
  p_table_name TEXT,
  p_fixed_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT local_id INTO v_id
  FROM mj_cloud_id_map
  WHERE cloud_id = p_cloud_id AND table_name = p_table_name;

  IF v_id IS NULL THEN
    v_id := COALESCE(p_fixed_id, gen_random_uuid());
    INSERT INTO mj_cloud_id_map (cloud_id, table_name, local_id)
    VALUES (p_cloud_id, p_table_name, v_id);
  END IF;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
"""


def generate_reset_sql(pharmacy_id, matthias_staff_id):
    """Alle mj_*-Daten und Mappings löschen (für --reset)."""
    PH = pharmacy_id
    return f"""
-- ========== RESET: Alle Daten löschen ==========
DELETE FROM mj_work_records WHERE pharmacy_id = '{PH}';
DELETE FROM mj_monthly_reports WHERE pharmacy_id = '{PH}';
DELETE FROM mj_manual_hours WHERE pharmacy_id = '{PH}';
DELETE FROM mj_schedules WHERE pharmacy_id = '{PH}';
DELETE FROM mj_shifts WHERE pharmacy_id = '{PH}';
DELETE FROM mj_hourly_rates WHERE pharmacy_id = '{PH}';
DELETE FROM mj_monthly_payments WHERE pharmacy_id = '{PH}';
DELETE FROM mj_profiles WHERE pharmacy_id = '{PH}';
DELETE FROM mj_holidays WHERE pharmacy_id = '{PH}';
DELETE FROM mj_standard_weeks WHERE pharmacy_id = '{PH}';
DELETE FROM mj_info_entries WHERE pharmacy_id = '{PH}';
DELETE FROM staff WHERE pharmacy_id = '{PH}' AND role = 'Minijobber' AND id != '{matthias_staff_id}';
DELETE FROM mj_cloud_id_map;
DELETE FROM mj_sync_state;
"""


def generate_sync_sql(data, pharmacy_id, matthias_cloud_id, matthias_staff_id):
    """Haupt-Sync: UPSERT aller Cloud-Daten."""
    PH = pharmacy_id
    sql = []

    employees = data["employees"]
    shifts = data["shifts"]
    schedules = data["schedules"]
    work_records = data["work_records"]
    holidays = data["holidays"]
    standard_weeks = data["standard_weeks"]
    info_entries = data["info_entries"]
    hourly_rates = data["hourly_rates"]
    monthly_payments = data["monthly_payments"]

    # Sets für Validierung (nur bekannte IDs referenzieren)
    employee_ids = {e["id"] for e in employees}
    shift_ids = {s["id"] for s in shifts}
    schedule_ids = {s["id"] for s in schedules}

    # ---- Feste Mapping für Matthias ----
    sql.append("-- Festes Mapping: Matthias")
    sql.append(
        f"INSERT INTO mj_cloud_id_map (cloud_id, table_name, local_id) "
        f"VALUES ('{matthias_cloud_id}', 'employees', '{matthias_staff_id}') "
        f"ON CONFLICT (cloud_id, table_name) DO NOTHING;"
    )
    sql.append("")

    # ---- EMPLOYEES → staff + mj_profiles ----
    sql.append("-- ========== EMPLOYEES → staff + mj_profiles ==========")
    for emp in employees:
        cid = emp["id"]
        is_matthias = (cid == matthias_cloud_id)
        local = lid(cid, "employees")

        if not is_matthias:
            name = emp.get("name") or "Unbekannt"
            parts = name.strip().split(" ", 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ""
            street, postal_code, city = parse_address(emp.get("address"))
            mobile = emp.get("mobile") or emp.get("phone") or None

            sql.append(
                f"INSERT INTO staff (id, pharmacy_id, first_name, last_name, email, mobile, "
                f"street, postal_code, city, role) "
                f"VALUES ({local}, '{PH}', {esc(first_name)}, {esc(last_name)}, "
                f"{esc(emp.get('email'))}, {esc(mobile)}, "
                f"{esc(street or None)}, {esc(postal_code or None)}, {esc(city or None)}, "
                f"'Minijobber') "
                f"ON CONFLICT (id) DO UPDATE SET "
                f"first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name, "
                f"email=EXCLUDED.email, mobile=EXCLUDED.mobile, "
                f"street=EXCLUDED.street, postal_code=EXCLUDED.postal_code, city=EXCLUDED.city;"
            )

        sql.append(
            f"INSERT INTO mj_profiles (pharmacy_id, staff_id, hourly_rate, monthly_payment, "
            f"hours_balance, job_type, initials, active) "
            f"VALUES ('{PH}', {local}, {emp.get('hourly_rate', 12.41)}, "
            f"{emp.get('monthly_payment', 538)}, {emp.get('hours_balance', 0)}, "
            f"{esc(emp.get('job_type', 'Autobote'))}, {esc(emp.get('initials'))}, "
            f"{esc(emp.get('active', True))}) "
            f"ON CONFLICT (staff_id) DO UPDATE SET "
            f"hourly_rate=EXCLUDED.hourly_rate, monthly_payment=EXCLUDED.monthly_payment, "
            f"hours_balance=EXCLUDED.hours_balance, job_type=EXCLUDED.job_type, "
            f"initials=EXCLUDED.initials, active=EXCLUDED.active;"
        )
    sql.append("")

    # ---- SHIFTS ----
    sql.append("-- ========== SHIFTS ==========")
    for shift in shifts:
        local = lid(shift["id"], "shifts")
        sql.append(
            f"INSERT INTO mj_shifts (id, pharmacy_id, name, start_time, end_time, hours) "
            f"VALUES ({local}, '{PH}', {esc(shift['name'])}, "
            f"{esc(shift['start_time'])}, {esc(shift['end_time'])}, {shift['hours']}) "
            f"ON CONFLICT (id) DO UPDATE SET "
            f"name=EXCLUDED.name, start_time=EXCLUDED.start_time, "
            f"end_time=EXCLUDED.end_time, hours=EXCLUDED.hours;"
        )
    sql.append("")

    # ---- SCHEDULES ----
    sql.append("-- ========== SCHEDULES ==========")
    skipped = 0
    for sched in schedules:
        emp_id = sched.get("employee_id")
        shift_id = sched.get("shift_id")
        if emp_id not in employee_ids or shift_id not in shift_ids:
            skipped += 1
            continue

        local = lid(sched["id"], "schedules")
        staff = lid(emp_id, "employees")
        shift = lid(shift_id, "shifts")

        sql.append(
            f"INSERT INTO mj_schedules (id, pharmacy_id, staff_id, shift_id, date, absent, absent_reason) "
            f"VALUES ({local}, '{PH}', {staff}, {shift}, "
            f"{esc(sched['date'])}, {esc(sched.get('absent', False))}, "
            f"{esc(sched.get('absent_reason'))}) "
            f"ON CONFLICT (id) DO UPDATE SET "
            f"staff_id=EXCLUDED.staff_id, shift_id=EXCLUDED.shift_id, "
            f"date=EXCLUDED.date, absent=EXCLUDED.absent, absent_reason=EXCLUDED.absent_reason;"
        )
    if skipped:
        print(f"  Schedules übersprungen (fehlende Referenz): {skipped}", file=sys.stderr)
    sql.append("")

    # ---- WORK RECORDS ----
    sql.append("-- ========== WORK RECORDS ==========")
    wr_skipped = 0
    for wr in work_records:
        sched_id = wr.get("schedule_id")
        if sched_id not in schedule_ids:
            wr_skipped += 1
            continue

        local = lid(wr["id"], "work_records")
        sched = lid(sched_id, "schedules")

        sql.append(
            f"INSERT INTO mj_work_records (id, pharmacy_id, schedule_id, "
            f"actual_start_time, actual_end_time, actual_hours) "
            f"VALUES ({local}, '{PH}', {sched}, "
            f"{esc(wr.get('actual_start_time'))}, {esc(wr.get('actual_end_time'))}, "
            f"{esc(wr.get('actual_hours') or 0)}) "
            f"ON CONFLICT (id) DO UPDATE SET "
            f"schedule_id=EXCLUDED.schedule_id, actual_start_time=EXCLUDED.actual_start_time, "
            f"actual_end_time=EXCLUDED.actual_end_time, actual_hours=EXCLUDED.actual_hours;"
        )
    if wr_skipped:
        print(f"  Work Records übersprungen (fehlende Referenz): {wr_skipped}", file=sys.stderr)
    sql.append("")

    # ---- HOLIDAYS ----
    sql.append("-- ========== HOLIDAYS ==========")
    for h in holidays:
        sql.append(
            f"INSERT INTO mj_holidays (pharmacy_id, date, name) "
            f"VALUES ('{PH}', {esc(h['date'])}, {esc(h['name'])}) "
            f"ON CONFLICT (pharmacy_id, date) DO UPDATE SET name=EXCLUDED.name;"
        )
    sql.append("")

    # ---- STANDARD WEEKS ----
    # schedule_data muss mit aufgelösten lokalen IDs gebaut werden → PL/pgSQL DO-Block
    sql.append("-- ========== STANDARD WEEKS ==========")
    day_idx_to_name = {
        "0": "Montag", "1": "Dienstag", "2": "Mittwoch",
        "3": "Donnerstag", "4": "Freitag", "5": "Samstag",
    }
    for sw in standard_weeks:
        week_num = sw["id"]  # Integer 1 oder 2
        name = sw.get("name", f"Woche {week_num}")
        old_data = sw.get("schedule_data") or {}

        do_lines = []
        do_lines.append("DO $$")
        do_lines.append("DECLARE")
        do_lines.append("  v_data JSONB := '{}'::jsonb;")
        do_lines.append("  v_day JSONB;")
        do_lines.append("BEGIN")

        for day_idx, assignments in old_data.items():
            day_name = day_idx_to_name.get(str(day_idx), f"Tag{day_idx}")
            do_lines.append(f"  v_day := '[]'::jsonb;")

            if isinstance(assignments, dict):
                for cloud_shift_id, cloud_emp_id in assignments.items():
                    if cloud_emp_id in employee_ids and cloud_shift_id in shift_ids:
                        do_lines.append(
                            f"  v_day := v_day || jsonb_build_array(jsonb_build_object("
                            f"'staff_id', get_or_create_local_id('{cloud_emp_id}', 'employees')::text, "
                            f"'shift_id', get_or_create_local_id('{cloud_shift_id}', 'shifts')::text));"
                        )

            do_lines.append(f"  v_data := v_data || jsonb_build_object('{day_name}', v_day);")

        do_lines.append(
            f"  INSERT INTO mj_standard_weeks (pharmacy_id, week_number, name, schedule_data) "
            f"  VALUES ('{PH}', {week_num}, {esc(name)}, v_data) "
            f"  ON CONFLICT (pharmacy_id, week_number) DO UPDATE SET "
            f"  name=EXCLUDED.name, schedule_data=EXCLUDED.schedule_data;"
        )
        do_lines.append("END $$;")
        sql.append("\n".join(do_lines))
    sql.append("")

    # ---- HOURLY RATES ----
    sql.append("-- ========== HOURLY RATES ==========")
    for hr in hourly_rates:
        emp_id = hr.get("employee_id")
        if emp_id not in employee_ids:
            continue
        staff = lid(emp_id, "employees")
        sql.append(
            f"INSERT INTO mj_hourly_rates (pharmacy_id, staff_id, rate, valid_from) "
            f"VALUES ('{PH}', {staff}, {hr['rate']}, {esc(hr['valid_from'])}) "
            f"ON CONFLICT (staff_id, valid_from) DO UPDATE SET rate=EXCLUDED.rate;"
        )
    sql.append("")

    # ---- MONTHLY PAYMENTS ----
    sql.append("-- ========== MONTHLY PAYMENTS ==========")
    for mp in monthly_payments:
        emp_id = mp.get("employee_id")
        if emp_id not in employee_ids:
            continue
        staff = lid(emp_id, "employees")
        sql.append(
            f"INSERT INTO mj_monthly_payments (pharmacy_id, staff_id, amount, valid_from) "
            f"VALUES ('{PH}', {staff}, {mp['amount']}, {esc(mp['valid_from'])}) "
            f"ON CONFLICT (staff_id, valid_from) DO UPDATE SET amount=EXCLUDED.amount;"
        )
    sql.append("")

    # ---- INFO ENTRIES ----
    sql.append("-- ========== INFO ENTRIES ==========")
    for ie in info_entries:
        local = lid(ie["id"], "info_entries")
        staff_expr = "NULL"
        if ie.get("employee_id") and ie["employee_id"] in employee_ids:
            staff_expr = lid(ie["employee_id"], "employees")

        sql.append(
            f"INSERT INTO mj_info_entries (id, pharmacy_id, year, month, text, staff_id) "
            f"VALUES ({local}, '{PH}', {ie['year']}, {ie['month']}, {esc(ie['text'])}, {staff_expr}) "
            f"ON CONFLICT (id) DO UPDATE SET "
            f"text=EXCLUDED.text, staff_id=EXCLUDED.staff_id;"
        )
    sql.append("")

    # ---- Sync-Zeitstempel ----
    sql.append("-- Sync-Zeitstempel aktualisieren")
    sql.append(
        "INSERT INTO mj_sync_state (id, last_sync_at) VALUES (1, NOW()) "
        "ON CONFLICT (id) DO UPDATE SET last_sync_at=NOW(), updated_at=NOW();"
    )

    return "\n".join(sql)


# ============================================================
# MAIN
# ============================================================
def main():
    dry_run = "--dry-run" in sys.argv
    reset = "--reset" in sys.argv

    if not CLOUD_KEY:
        print("FEHLER: MINIJOBBER_CLOUD_KEY nicht gesetzt.", file=sys.stderr)
        print("", file=sys.stderr)
        print("Key liegt in der lokalen DB: private.app_secrets → 'minijobber_cloud_service_role_key'", file=sys.stderr)
        print("Usage: MINIJOBBER_CLOUD_KEY=xxx python3 scripts/migrate_minijobber_data.py", file=sys.stderr)
        sys.exit(1)

    # ---- Cloud-Daten holen ----
    print("Cloud-Daten abrufen...", file=sys.stderr)
    data = {}
    tables = {
        "employees": "employees",
        "shifts": "shifts",
        "schedules": "schedules",
        "work_records": "work_records",
        "holidays": "holidays",
        "standard_weeks": "standard_weeks",
        "info_entries": "info_entries",
        "hourly_rates": "employee_hourly_rates",
        "monthly_payments": "employee_monthly_payments",
    }

    for key, cloud_table in tables.items():
        try:
            data[key] = cloud_fetch(cloud_table)
            print(f"  {key}: {len(data[key])}", file=sys.stderr)
        except Exception as e:
            print(f"  {key}: FEHLER ({e}) — leer weiter", file=sys.stderr)
            data[key] = []

    # ---- SQL zusammenbauen ----
    parts = []
    parts.append("-- ============================================================")
    parts.append("-- Minijobber Cloud → Local Sync")
    parts.append(f"-- {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    if reset:
        parts.append("-- MODUS: --reset (komplett neu)")
    parts.append("-- ============================================================")
    parts.append("")

    # Infrastruktur (außerhalb Transaktion)
    parts.append(generate_infrastructure_sql())

    # Transaktion
    parts.append("BEGIN;")
    parts.append("")

    if reset:
        parts.append(generate_reset_sql(LOCAL_PHARMACY_ID, MATTHIAS_STAFF_ID))

    parts.append(generate_sync_sql(data, LOCAL_PHARMACY_ID, MATTHIAS_CLOUD_ID, MATTHIAS_STAFF_ID))

    parts.append("")
    parts.append("COMMIT;")

    sql_text = "\n".join(parts)

    # ---- Schreiben ----
    with open(OUTPUT_FILE, "w") as f:
        f.write(sql_text)

    line_count = sql_text.count("\n") + 1
    print(f"\nSQL geschrieben: {OUTPUT_FILE} ({line_count} Zeilen)", file=sys.stderr)

    if dry_run:
        print("Dry-Run — SQL nicht ausgeführt.", file=sys.stderr)
        print(f"Prüfen:    less {OUTPUT_FILE}", file=sys.stderr)
        print(f"Ausführen: cd {DOCKER_CWD} && docker compose exec -T db psql -U supabase_admin -d postgres < {OUTPUT_FILE}", file=sys.stderr)
        return

    # ---- Ausführen ----
    print("Ausführen...", file=sys.stderr)
    result = subprocess.run(
        ["docker", "compose", "exec", "-T", "db",
         "psql", "-U", "supabase_admin", "-d", "postgres"],
        input=sql_text,
        capture_output=True,
        text=True,
        cwd=DOCKER_CWD,
    )

    if result.returncode == 0:
        # Zusammenfassung
        stdout = result.stdout.strip()
        inserts = stdout.count("INSERT")
        updates = stdout.count("UPDATE")
        print(f"Sync abgeschlossen! (INSERT: {inserts}, UPDATE: {updates})", file=sys.stderr)
        if result.stderr.strip():
            # Warnungen/Notices ausgeben
            for line in result.stderr.strip().split("\n"):
                if "NOTICE" in line or "WARNING" in line:
                    print(f"  {line}", file=sys.stderr)
    else:
        print(f"FEHLER:", file=sys.stderr)
        print(result.stderr, file=sys.stderr)
        if result.stdout.strip():
            print(result.stdout, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
