-- Minijobber Migration
-- Minijob-Mitarbeiter-Verwaltung: Dienstplanung, Zeiterfassung, Monatsabrechnung
-- Nutzt bestehende staff-Tabelle + mj_profiles für Zusatzdaten

-- ============================================
-- 1. MJ_PROFILES (Minijobber-Profil, FK → staff)
-- ============================================
CREATE TABLE IF NOT EXISTS mj_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 12.41,
  monthly_payment DECIMAL(10,2) NOT NULL DEFAULT 538.00,
  hours_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  job_type VARCHAR(50) NOT NULL DEFAULT 'Autobote' CHECK (job_type IN ('Autobote', 'Fahrradbote', 'Sonstiges')),
  initials VARCHAR(3),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id)
);

CREATE INDEX IF NOT EXISTS idx_mj_profiles_pharmacy ON mj_profiles(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_mj_profiles_staff ON mj_profiles(staff_id);
CREATE INDEX IF NOT EXISTS idx_mj_profiles_active ON mj_profiles(active);

-- ============================================
-- 2. MJ_HOURLY_RATES (Stundenlohn-Verlauf)
-- ============================================
CREATE TABLE IF NOT EXISTS mj_hourly_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  valid_from DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_mj_hourly_rates_staff ON mj_hourly_rates(staff_id);

-- ============================================
-- 3. MJ_MONTHLY_PAYMENTS (Pauschale-Verlauf)
-- ============================================
CREATE TABLE IF NOT EXISTS mj_monthly_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  valid_from DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_mj_monthly_payments_staff ON mj_monthly_payments(staff_id);

-- ============================================
-- 4. MJ_SHIFTS (Schicht-Definitionen)
-- ============================================
CREATE TABLE IF NOT EXISTS mj_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mj_shifts_pharmacy ON mj_shifts(pharmacy_id);

-- ============================================
-- 5. MJ_SCHEDULES (Schichtzuordnungen pro Tag)
-- ============================================
CREATE TABLE IF NOT EXISTS mj_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  shift_id UUID REFERENCES mj_shifts(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  absent BOOLEAN NOT NULL DEFAULT false,
  absent_reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, date, shift_id)
);

CREATE INDEX IF NOT EXISTS idx_mj_schedules_pharmacy ON mj_schedules(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_mj_schedules_staff ON mj_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_mj_schedules_date ON mj_schedules(date);
CREATE INDEX IF NOT EXISTS idx_mj_schedules_shift ON mj_schedules(shift_id);

-- ============================================
-- 6. MJ_WORK_RECORDS (Ist-Stunden)
-- ============================================
CREATE TABLE IF NOT EXISTS mj_work_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  schedule_id UUID REFERENCES mj_schedules(id) ON DELETE CASCADE NOT NULL,
  actual_start_time TIME,
  actual_end_time TIME,
  actual_hours DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mj_work_records_pharmacy ON mj_work_records(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_mj_work_records_schedule ON mj_work_records(schedule_id);

-- ============================================
-- 7. MJ_MANUAL_HOURS (Manuelle Stundenkorrekturen)
-- ============================================
CREATE TABLE IF NOT EXISTS mj_manual_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mj_manual_hours_pharmacy ON mj_manual_hours(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_mj_manual_hours_staff ON mj_manual_hours(staff_id);
CREATE INDEX IF NOT EXISTS idx_mj_manual_hours_date ON mj_manual_hours(date);

-- ============================================
-- 8. MJ_MONTHLY_REPORTS (Monatsabrechnungen)
-- ============================================
CREATE TABLE IF NOT EXISTS mj_monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  planned_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  actual_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
  hours_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  cumulative_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  monthly_payment DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  finalized BOOLEAN NOT NULL DEFAULT false,
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_mj_monthly_reports_pharmacy ON mj_monthly_reports(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_mj_monthly_reports_staff ON mj_monthly_reports(staff_id);
CREATE INDEX IF NOT EXISTS idx_mj_monthly_reports_period ON mj_monthly_reports(year, month);

-- ============================================
-- 9. MJ_HOLIDAYS (Feiertage)
-- ============================================
CREATE TABLE IF NOT EXISTS mj_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pharmacy_id, date)
);

CREATE INDEX IF NOT EXISTS idx_mj_holidays_pharmacy ON mj_holidays(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_mj_holidays_date ON mj_holidays(date);

-- ============================================
-- 10. MJ_STANDARD_WEEKS (Rotations-Vorlagen)
-- ============================================
CREATE TABLE IF NOT EXISTS mj_standard_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number IN (1, 2)),
  name VARCHAR(100) NOT NULL,
  schedule_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pharmacy_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_mj_standard_weeks_pharmacy ON mj_standard_weeks(pharmacy_id);

-- ============================================
-- 11. MJ_INFO_ENTRIES (Pinnwand-Einträge)
-- ============================================
CREATE TABLE IF NOT EXISTS mj_info_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  text TEXT NOT NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mj_info_entries_pharmacy ON mj_info_entries(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_mj_info_entries_period ON mj_info_entries(year, month);

-- ============================================
-- 12. MJ_SETTINGS (Apotheken-Einstellungen)
-- ============================================
CREATE TABLE IF NOT EXISTS mj_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  default_hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 12.41,
  monthly_limit DECIMAL(10,2) NOT NULL DEFAULT 538.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pharmacy_id)
);

-- ============================================
-- 13. RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE mj_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mj_hourly_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mj_monthly_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mj_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mj_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE mj_work_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE mj_manual_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE mj_monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE mj_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE mj_standard_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mj_info_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mj_settings ENABLE ROW LEVEL SECURITY;

-- get_user_pharmacy_ids() already exists from botendienst migration

-- Macro for standard pharmacy-based RLS (SELECT, INSERT, UPDATE, DELETE)
-- MJ_PROFILES
CREATE POLICY "mj_profiles_select" ON mj_profiles FOR SELECT
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_profiles_insert" ON mj_profiles FOR INSERT
  WITH CHECK (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_profiles_update" ON mj_profiles FOR UPDATE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_profiles_delete" ON mj_profiles FOR DELETE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

-- MJ_HOURLY_RATES
CREATE POLICY "mj_hourly_rates_select" ON mj_hourly_rates FOR SELECT
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_hourly_rates_insert" ON mj_hourly_rates FOR INSERT
  WITH CHECK (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_hourly_rates_update" ON mj_hourly_rates FOR UPDATE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_hourly_rates_delete" ON mj_hourly_rates FOR DELETE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

-- MJ_MONTHLY_PAYMENTS
CREATE POLICY "mj_monthly_payments_select" ON mj_monthly_payments FOR SELECT
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_monthly_payments_insert" ON mj_monthly_payments FOR INSERT
  WITH CHECK (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_monthly_payments_update" ON mj_monthly_payments FOR UPDATE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_monthly_payments_delete" ON mj_monthly_payments FOR DELETE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

-- MJ_SHIFTS
CREATE POLICY "mj_shifts_select" ON mj_shifts FOR SELECT
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_shifts_insert" ON mj_shifts FOR INSERT
  WITH CHECK (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_shifts_update" ON mj_shifts FOR UPDATE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_shifts_delete" ON mj_shifts FOR DELETE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

-- MJ_SCHEDULES
CREATE POLICY "mj_schedules_select" ON mj_schedules FOR SELECT
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_schedules_insert" ON mj_schedules FOR INSERT
  WITH CHECK (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_schedules_update" ON mj_schedules FOR UPDATE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_schedules_delete" ON mj_schedules FOR DELETE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

-- MJ_WORK_RECORDS
CREATE POLICY "mj_work_records_select" ON mj_work_records FOR SELECT
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_work_records_insert" ON mj_work_records FOR INSERT
  WITH CHECK (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_work_records_update" ON mj_work_records FOR UPDATE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_work_records_delete" ON mj_work_records FOR DELETE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

-- MJ_MANUAL_HOURS
CREATE POLICY "mj_manual_hours_select" ON mj_manual_hours FOR SELECT
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_manual_hours_insert" ON mj_manual_hours FOR INSERT
  WITH CHECK (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_manual_hours_update" ON mj_manual_hours FOR UPDATE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_manual_hours_delete" ON mj_manual_hours FOR DELETE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

-- MJ_MONTHLY_REPORTS
CREATE POLICY "mj_monthly_reports_select" ON mj_monthly_reports FOR SELECT
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_monthly_reports_insert" ON mj_monthly_reports FOR INSERT
  WITH CHECK (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_monthly_reports_update" ON mj_monthly_reports FOR UPDATE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_monthly_reports_delete" ON mj_monthly_reports FOR DELETE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

-- MJ_HOLIDAYS
CREATE POLICY "mj_holidays_select" ON mj_holidays FOR SELECT
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_holidays_insert" ON mj_holidays FOR INSERT
  WITH CHECK (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_holidays_update" ON mj_holidays FOR UPDATE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_holidays_delete" ON mj_holidays FOR DELETE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

-- MJ_STANDARD_WEEKS
CREATE POLICY "mj_standard_weeks_select" ON mj_standard_weeks FOR SELECT
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_standard_weeks_insert" ON mj_standard_weeks FOR INSERT
  WITH CHECK (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_standard_weeks_update" ON mj_standard_weeks FOR UPDATE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_standard_weeks_delete" ON mj_standard_weeks FOR DELETE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

-- MJ_INFO_ENTRIES
CREATE POLICY "mj_info_entries_select" ON mj_info_entries FOR SELECT
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_info_entries_insert" ON mj_info_entries FOR INSERT
  WITH CHECK (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_info_entries_update" ON mj_info_entries FOR UPDATE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_info_entries_delete" ON mj_info_entries FOR DELETE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

-- MJ_SETTINGS
CREATE POLICY "mj_settings_select" ON mj_settings FOR SELECT
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_settings_insert" ON mj_settings FOR INSERT
  WITH CHECK (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_settings_update" ON mj_settings FOR UPDATE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));
CREATE POLICY "mj_settings_delete" ON mj_settings FOR DELETE
  USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

-- ============================================
-- 14. TRIGGERS for updated_at
-- ============================================
-- update_updated_at_column() already exists from botendienst migration

DROP TRIGGER IF EXISTS update_mj_profiles_updated_at ON mj_profiles;
CREATE TRIGGER update_mj_profiles_updated_at
  BEFORE UPDATE ON mj_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mj_shifts_updated_at ON mj_shifts;
CREATE TRIGGER update_mj_shifts_updated_at
  BEFORE UPDATE ON mj_shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mj_schedules_updated_at ON mj_schedules;
CREATE TRIGGER update_mj_schedules_updated_at
  BEFORE UPDATE ON mj_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mj_work_records_updated_at ON mj_work_records;
CREATE TRIGGER update_mj_work_records_updated_at
  BEFORE UPDATE ON mj_work_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mj_manual_hours_updated_at ON mj_manual_hours;
CREATE TRIGGER update_mj_manual_hours_updated_at
  BEFORE UPDATE ON mj_manual_hours FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mj_monthly_reports_updated_at ON mj_monthly_reports;
CREATE TRIGGER update_mj_monthly_reports_updated_at
  BEFORE UPDATE ON mj_monthly_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mj_standard_weeks_updated_at ON mj_standard_weeks;
CREATE TRIGGER update_mj_standard_weeks_updated_at
  BEFORE UPDATE ON mj_standard_weeks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mj_info_entries_updated_at ON mj_info_entries;
CREATE TRIGGER update_mj_info_entries_updated_at
  BEFORE UPDATE ON mj_info_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mj_settings_updated_at ON mj_settings;
CREATE TRIGGER update_mj_settings_updated_at
  BEFORE UPDATE ON mj_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 15. SEED DEFAULT SHIFTS (pro Apotheke bei Bedarf)
-- ============================================
-- Default-Schichten werden im Frontend bei erster Nutzung angelegt,
-- wenn keine Schichten für die Apotheke existieren.
