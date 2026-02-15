#!/usr/bin/env python3
"""
Migrates data from Supabase Cloud (standalone minijobber-app)
to local Supabase (Kaeee integrated mj_* tables).

Generates a single SQL file, then executes it via psql.
"""

import json
import os
import urllib.request
import uuid
import sys

# ============================================================
# CONFIG
# ============================================================
CLOUD_URL = "https://kippzqewhyoqndgepsmg.supabase.co"
# Key stored in local Supabase: private.app_secrets → 'minijobber_cloud_service_role_key'
CLOUD_KEY = os.environ.get("MINIJOBBER_CLOUD_KEY", "")

LOCAL_PHARMACY_ID = "e27c71c2-c33f-4207-8028-9071f70d4f67"
# Matthias Blüm already exists with this staff ID
MATTHIAS_STAFF_ID = "011695e8-9bd8-4ba5-9ba3-15ca37c319aa"
MATTHIAS_CLOUD_ID = "da2217dc-0933-4196-b6be-e76c50099ff5"

OUTPUT_FILE = "/tmp/minijobber_migration.sql"


def cloud_fetch(table, params=""):
    url = f"{CLOUD_URL}/rest/v1/{table}?select=*{params}"
    req = urllib.request.Request(url, headers={
        "apikey": CLOUD_KEY,
        "Authorization": f"Bearer {CLOUD_KEY}",
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def esc(val):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float)):
        return str(val)
    s = str(val).replace("'", "''")
    return f"'{s}'"


# ============================================================
# Fetch all cloud data
# ============================================================
print("Fetching cloud data...", file=sys.stderr)
cloud_employees = cloud_fetch("employees")
cloud_shifts = cloud_fetch("shifts")
cloud_schedules = cloud_fetch("schedules")
cloud_work_records = cloud_fetch("work_records")
cloud_holidays = cloud_fetch("holidays")
cloud_standard_weeks = cloud_fetch("standard_weeks")
cloud_info_entries = cloud_fetch("info_entries")

print(f"  employees: {len(cloud_employees)}, shifts: {len(cloud_shifts)}, "
      f"schedules: {len(cloud_schedules)}, work_records: {len(cloud_work_records)}, "
      f"holidays: {len(cloud_holidays)}, standard_weeks: {len(cloud_standard_weeks)}, "
      f"info_entries: {len(cloud_info_entries)}", file=sys.stderr)

# ============================================================
# Build ID mappings
# ============================================================

# Generate new UUIDs for each cloud employee → local staff
employee_to_staff = {}
for emp in cloud_employees:
    if emp["id"] == MATTHIAS_CLOUD_ID:
        employee_to_staff[emp["id"]] = MATTHIAS_STAFF_ID
    else:
        employee_to_staff[emp["id"]] = str(uuid.uuid4())

# Map cloud shift_id → new local shift_id
shift_map = {}
for shift in cloud_shifts:
    shift_map[shift["id"]] = str(uuid.uuid4())

# Map cloud schedule_id → new local schedule_id
schedule_map = {}
for sched in cloud_schedules:
    schedule_map[sched["id"]] = str(uuid.uuid4())


# ============================================================
# Generate SQL
# ============================================================
sql_lines = []
sql_lines.append("-- Minijobber Data Migration from Supabase Cloud")
sql_lines.append("-- Generated automatically")
sql_lines.append("BEGIN;")
sql_lines.append("")

# Clean up any previous failed migration data
sql_lines.append("-- Clean up previous migration attempts")
sql_lines.append(f"DELETE FROM mj_work_records WHERE pharmacy_id = '{LOCAL_PHARMACY_ID}';")
sql_lines.append(f"DELETE FROM mj_schedules WHERE pharmacy_id = '{LOCAL_PHARMACY_ID}';")
sql_lines.append(f"DELETE FROM mj_shifts WHERE pharmacy_id = '{LOCAL_PHARMACY_ID}';")
sql_lines.append(f"DELETE FROM mj_profiles WHERE pharmacy_id = '{LOCAL_PHARMACY_ID}';")
sql_lines.append(f"DELETE FROM mj_holidays WHERE pharmacy_id = '{LOCAL_PHARMACY_ID}';")
sql_lines.append(f"DELETE FROM mj_standard_weeks WHERE pharmacy_id = '{LOCAL_PHARMACY_ID}';")
sql_lines.append(f"DELETE FROM mj_info_entries WHERE pharmacy_id = '{LOCAL_PHARMACY_ID}';")
sql_lines.append(f"DELETE FROM staff WHERE pharmacy_id = '{LOCAL_PHARMACY_ID}' AND role = 'Minijobber';")
sql_lines.append("")

# --- STAFF + MJ_PROFILES ---
sql_lines.append("-- Staff + mj_profiles")
for emp in cloud_employees:
    cloud_id = emp["id"]
    staff_id = employee_to_staff[cloud_id]

    if cloud_id == MATTHIAS_CLOUD_ID:
        # Already exists, just create mj_profile
        pass
    else:
        name = emp["name"] or "Unbekannt"
        parts = name.strip().split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""

        address = emp.get("address") or ""
        street, postal_code, city = "", "", ""
        if address:
            addr_parts = address.split(",", 1)
            if len(addr_parts) >= 2:
                street = addr_parts[0].strip()
                plz_city = addr_parts[1].strip()
                plz_parts = plz_city.split(" ", 1)
                if len(plz_parts) >= 2 and plz_parts[0].isdigit():
                    postal_code = plz_parts[0]
                    city = plz_parts[1]
                else:
                    city = plz_city
            else:
                street = address

        # staff table has no 'phone' column — use mobile only
        mobile = emp.get('mobile') or emp.get('phone') or None
        sql_lines.append(
            f"INSERT INTO staff (id, pharmacy_id, first_name, last_name, email, mobile, street, postal_code, city, role) "
            f"VALUES ('{staff_id}', '{LOCAL_PHARMACY_ID}', {esc(first_name)}, {esc(last_name)}, "
            f"{esc(emp.get('email') or None)}, {esc(mobile)}, "
            f"{esc(street or None)}, {esc(postal_code or None)}, {esc(city or None)}, 'Minijobber');"
        )

    # mj_profile
    sql_lines.append(
        f"INSERT INTO mj_profiles (pharmacy_id, staff_id, hourly_rate, monthly_payment, hours_balance, "
        f"job_type, initials, active) "
        f"VALUES ('{LOCAL_PHARMACY_ID}', '{staff_id}', {emp.get('hourly_rate', 12.41)}, "
        f"{emp.get('monthly_payment', 538)}, {emp.get('hours_balance', 0)}, "
        f"{esc(emp.get('job_type', 'Autobote'))}, {esc(emp.get('initials'))}, "
        f"{esc(emp.get('active', True))});"
    )

sql_lines.append("")

# --- SHIFTS ---
sql_lines.append("-- Shifts")
for shift in cloud_shifts:
    local_id = shift_map[shift["id"]]
    sql_lines.append(
        f"INSERT INTO mj_shifts (id, pharmacy_id, name, start_time, end_time, hours) "
        f"VALUES ('{local_id}', '{LOCAL_PHARMACY_ID}', {esc(shift['name'])}, "
        f"{esc(shift['start_time'])}, {esc(shift['end_time'])}, {shift['hours']});"
    )
sql_lines.append("")

# --- SCHEDULES ---
sql_lines.append("-- Schedules")
skipped = 0
for sched in cloud_schedules:
    local_id = schedule_map[sched["id"]]
    staff_id = employee_to_staff.get(sched["employee_id"])
    shift_id = shift_map.get(sched["shift_id"])

    if not staff_id or not shift_id:
        skipped += 1
        continue

    sql_lines.append(
        f"INSERT INTO mj_schedules (id, pharmacy_id, staff_id, shift_id, date, absent, absent_reason) "
        f"VALUES ('{local_id}', '{LOCAL_PHARMACY_ID}', '{staff_id}', '{shift_id}', "
        f"{esc(sched['date'])}, {esc(sched.get('absent', False))}, {esc(sched.get('absent_reason'))});"
    )
print(f"  Schedules skipped (unmapped): {skipped}", file=sys.stderr)
sql_lines.append("")

# --- WORK RECORDS ---
sql_lines.append("-- Work Records")
wr_skipped = 0
for wr in cloud_work_records:
    local_schedule_id = schedule_map.get(wr["schedule_id"])
    if not local_schedule_id:
        wr_skipped += 1
        continue

    sql_lines.append(
        f"INSERT INTO mj_work_records (pharmacy_id, schedule_id, actual_start_time, actual_end_time, actual_hours) "
        f"VALUES ('{LOCAL_PHARMACY_ID}', '{local_schedule_id}', {esc(wr.get('actual_start_time'))}, "
        f"{esc(wr.get('actual_end_time'))}, {esc(wr.get('actual_hours') or 0)});"
    )
print(f"  Work records skipped (unmapped): {wr_skipped}", file=sys.stderr)
sql_lines.append("")

# --- HOLIDAYS ---
sql_lines.append("-- Holidays")
for h in cloud_holidays:
    sql_lines.append(
        f"INSERT INTO mj_holidays (pharmacy_id, date, name) "
        f"VALUES ('{LOCAL_PHARMACY_ID}', {esc(h['date'])}, {esc(h['name'])}) "
        f"ON CONFLICT (pharmacy_id, date) DO NOTHING;"
    )
sql_lines.append("")

# --- STANDARD WEEKS ---
sql_lines.append("-- Standard Weeks")
day_index_to_name = {"0": "Montag", "1": "Dienstag", "2": "Mittwoch", "3": "Donnerstag", "4": "Freitag", "5": "Samstag"}

for sw in cloud_standard_weeks:
    week_number = sw["id"]
    name = sw["name"]
    old_data = sw.get("schedule_data") or {}

    new_data = {}
    for day_idx, assignments in old_data.items():
        day_name = day_index_to_name.get(str(day_idx), f"Tag{day_idx}")
        day_entries = []
        for cloud_shift_id, cloud_employee_id in assignments.items():
            local_shift_id = shift_map.get(cloud_shift_id)
            local_staff_id = employee_to_staff.get(cloud_employee_id)
            if local_shift_id and local_staff_id:
                day_entries.append({"staff_id": local_staff_id, "shift_id": local_shift_id})
        new_data[day_name] = day_entries

    json_str = json.dumps(new_data).replace("'", "''")
    sql_lines.append(
        f"INSERT INTO mj_standard_weeks (pharmacy_id, week_number, name, schedule_data) "
        f"VALUES ('{LOCAL_PHARMACY_ID}', {week_number}, {esc(name)}, '{json_str}');"
    )
sql_lines.append("")

# --- INFO ENTRIES ---
sql_lines.append("-- Info Entries")
for ie in cloud_info_entries:
    sql_lines.append(
        f"INSERT INTO mj_info_entries (pharmacy_id, year, month, text) "
        f"VALUES ('{LOCAL_PHARMACY_ID}', {ie['year']}, {ie['month']}, {esc(ie['text'])});"
    )
sql_lines.append("")

sql_lines.append("COMMIT;")
sql_lines.append("")

# Write SQL file
with open(OUTPUT_FILE, "w") as f:
    f.write("\n".join(sql_lines))

print(f"\nSQL written to {OUTPUT_FILE} ({len(sql_lines)} lines)", file=sys.stderr)
print(f"Run with: cd /home/matthias/supabase/docker && docker compose exec -T db psql -U supabase_admin -d postgres < {OUTPUT_FILE}", file=sys.stderr)
