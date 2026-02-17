-- Recalculate MJ monthly reports on any relevant change

CREATE OR REPLACE FUNCTION mj_recalc_monthly_reports(p_pharmacy_id UUID, p_staff_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_initial_balance NUMERIC;
  v_profile_hourly NUMERIC;
  v_profile_payment NUMERIC;
  v_start_date DATE;
  v_end_date DATE;
  v_month DATE;
  v_cumulative NUMERIC;
  v_hourly NUMERIC;
  v_payment NUMERIC;
  v_planned NUMERIC;
  v_actual NUMERIC;
  v_manual NUMERIC;
  v_paid NUMERIC;
  v_balance NUMERIC;
BEGIN
  SELECT initial_balance, hourly_rate, monthly_payment
    INTO v_initial_balance, v_profile_hourly, v_profile_payment
  FROM mj_profiles
  WHERE pharmacy_id = p_pharmacy_id AND staff_id = p_staff_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Find earliest data point across all relevant tables
  SELECT MIN(first_of_month) INTO v_start_date FROM (
    SELECT date_trunc('month', MIN(date))::date AS first_of_month
      FROM mj_schedules WHERE pharmacy_id = p_pharmacy_id AND staff_id = p_staff_id
    UNION ALL
    SELECT date_trunc('month', MIN(mh.date))::date
      FROM mj_manual_hours mh WHERE mh.pharmacy_id = p_pharmacy_id AND mh.staff_id = p_staff_id
    UNION ALL
    SELECT make_date(MIN(year * 100 + month) / 100, MOD(MIN(year * 100 + month), 100), 1)
      FROM mj_monthly_conditions WHERE pharmacy_id = p_pharmacy_id AND staff_id = p_staff_id
  ) sub WHERE first_of_month IS NOT NULL;

  IF v_start_date IS NULL THEN
    DELETE FROM mj_monthly_reports
    WHERE pharmacy_id = p_pharmacy_id AND staff_id = p_staff_id;

    UPDATE mj_profiles
    SET hours_balance = v_initial_balance
    WHERE pharmacy_id = p_pharmacy_id AND staff_id = p_staff_id;
    RETURN;
  END IF;

  v_end_date := date_trunc('month', now())::date;

  -- Delete ALL reports for this staff member (not just from start month)
  -- to clean up any stale rows from before the first condition month
  DELETE FROM mj_monthly_reports
  WHERE pharmacy_id = p_pharmacy_id
    AND staff_id = p_staff_id;

  v_cumulative := COALESCE(v_initial_balance, 0);
  v_month := v_start_date;

  WHILE v_month <= v_end_date LOOP
    -- Effective conditions: exact month or last before, fallback to profile defaults
    SELECT hourly_rate, monthly_payment
      INTO v_hourly, v_payment
    FROM mj_monthly_conditions
    WHERE pharmacy_id = p_pharmacy_id
      AND staff_id = p_staff_id
      AND (year < EXTRACT(YEAR FROM v_month)::INT
        OR (year = EXTRACT(YEAR FROM v_month)::INT AND month <= EXTRACT(MONTH FROM v_month)::INT))
    ORDER BY year DESC, month DESC
    LIMIT 1;

    IF v_hourly IS NULL THEN v_hourly := v_profile_hourly; END IF;
    IF v_payment IS NULL THEN v_payment := v_profile_payment; END IF;

    -- Planned hours from schedules (excluding absences)
    SELECT COALESCE(SUM(CASE WHEN s.absent THEN 0 ELSE sh.hours END), 0)
      INTO v_planned
    FROM mj_schedules s
    JOIN mj_shifts sh ON sh.id = s.shift_id
    WHERE s.pharmacy_id = p_pharmacy_id
      AND s.staff_id = p_staff_id
      AND s.date >= v_month
      AND s.date < (v_month + INTERVAL '1 month')::date;

    -- Actual hours from work records (fallback to time diff)
    SELECT COALESCE(SUM(
      CASE
        WHEN wr.actual_hours IS NOT NULL AND wr.actual_hours > 0 THEN wr.actual_hours
        WHEN wr.actual_start_time IS NOT NULL AND wr.actual_end_time IS NOT NULL
          AND wr.actual_start_time <> TIME '00:00:00' AND wr.actual_end_time <> TIME '00:00:00' THEN
          GREATEST(EXTRACT(EPOCH FROM (wr.actual_end_time - wr.actual_start_time)) / 3600, 0)
        ELSE 0
      END
    ), 0)
      INTO v_actual
    FROM mj_work_records wr
    JOIN mj_schedules s ON s.id = wr.schedule_id
    WHERE s.pharmacy_id = p_pharmacy_id
      AND s.staff_id = p_staff_id
      AND s.date >= v_month
      AND s.date < (v_month + INTERVAL '1 month')::date;

    -- Manual hours
    SELECT COALESCE(SUM(hours), 0)
      INTO v_manual
    FROM mj_manual_hours
    WHERE pharmacy_id = p_pharmacy_id
      AND staff_id = p_staff_id
      AND date >= v_month
      AND date < (v_month + INTERVAL '1 month')::date;

    v_actual := COALESCE(v_actual, 0) + COALESCE(v_manual, 0);

    IF v_hourly IS NULL OR v_hourly <= 0 THEN
      v_paid := 0;
    ELSE
      v_paid := v_payment / v_hourly;
    END IF;

    v_balance := v_actual - v_paid;
    v_cumulative := v_cumulative + v_balance;

    INSERT INTO mj_monthly_reports (
      pharmacy_id, staff_id, year, month,
      planned_hours, actual_hours, paid_hours,
      hours_balance, cumulative_balance,
      monthly_payment, hourly_rate
    ) VALUES (
      p_pharmacy_id, p_staff_id,
      EXTRACT(YEAR FROM v_month)::INT,
      EXTRACT(MONTH FROM v_month)::INT,
      ROUND(COALESCE(v_planned, 0), 2),
      ROUND(COALESCE(v_actual, 0), 2),
      ROUND(COALESCE(v_paid, 0), 2),
      ROUND(COALESCE(v_balance, 0), 2),
      ROUND(COALESCE(v_cumulative, 0), 2),
      v_payment,
      v_hourly
    );

    v_month := (v_month + INTERVAL '1 month')::date;
  END LOOP;

  UPDATE mj_profiles
  SET hours_balance = ROUND(COALESCE(v_cumulative, 0), 2)
  WHERE pharmacy_id = p_pharmacy_id AND staff_id = p_staff_id;
END;
$$;

CREATE OR REPLACE FUNCTION mj_recalc_monthly_reports_for_staff(p_pharmacy_id UUID, p_staff_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM mj_recalc_monthly_reports(p_pharmacy_id, p_staff_id);
END;
$$;

-- Schedules
CREATE OR REPLACE FUNCTION mj_trg_recalc_on_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM mj_recalc_monthly_reports_for_staff(OLD.pharmacy_id, OLD.staff_id);
  ELSE
    PERFORM mj_recalc_monthly_reports_for_staff(NEW.pharmacy_id, NEW.staff_id);
    IF TG_OP = 'UPDATE' AND (OLD.staff_id IS DISTINCT FROM NEW.staff_id OR OLD.pharmacy_id IS DISTINCT FROM NEW.pharmacy_id) THEN
      PERFORM mj_recalc_monthly_reports_for_staff(OLD.pharmacy_id, OLD.staff_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS mj_recalc_on_schedule ON mj_schedules;
CREATE TRIGGER mj_recalc_on_schedule
AFTER INSERT OR UPDATE OR DELETE ON mj_schedules
FOR EACH ROW EXECUTE FUNCTION mj_trg_recalc_on_schedule();

-- Work records
CREATE OR REPLACE FUNCTION mj_trg_recalc_on_work_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_staff UUID;
  v_pharmacy UUID;
  v_schedule_id UUID;
BEGIN
  v_schedule_id := COALESCE(NEW.schedule_id, OLD.schedule_id);
  SELECT staff_id, pharmacy_id INTO v_staff, v_pharmacy
  FROM mj_schedules
  WHERE id = v_schedule_id;

  IF v_staff IS NOT NULL THEN
    PERFORM mj_recalc_monthly_reports_for_staff(v_pharmacy, v_staff);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS mj_recalc_on_work_record ON mj_work_records;
CREATE TRIGGER mj_recalc_on_work_record
AFTER INSERT OR UPDATE OR DELETE ON mj_work_records
FOR EACH ROW EXECUTE FUNCTION mj_trg_recalc_on_work_record();

-- Manual hours
CREATE OR REPLACE FUNCTION mj_trg_recalc_on_manual_hours()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM mj_recalc_monthly_reports_for_staff(OLD.pharmacy_id, OLD.staff_id);
  ELSE
    PERFORM mj_recalc_monthly_reports_for_staff(NEW.pharmacy_id, NEW.staff_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS mj_recalc_on_manual_hours ON mj_manual_hours;
CREATE TRIGGER mj_recalc_on_manual_hours
AFTER INSERT OR UPDATE OR DELETE ON mj_manual_hours
FOR EACH ROW EXECUTE FUNCTION mj_trg_recalc_on_manual_hours();

-- Monthly conditions
CREATE OR REPLACE FUNCTION mj_trg_recalc_on_conditions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM mj_recalc_monthly_reports_for_staff(OLD.pharmacy_id, OLD.staff_id);
  ELSE
    PERFORM mj_recalc_monthly_reports_for_staff(NEW.pharmacy_id, NEW.staff_id);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS mj_recalc_on_conditions ON mj_monthly_conditions;
CREATE TRIGGER mj_recalc_on_conditions
AFTER INSERT OR UPDATE OR DELETE ON mj_monthly_conditions
FOR EACH ROW EXECUTE FUNCTION mj_trg_recalc_on_conditions();

-- Profile changes (initial balance / defaults)
-- IMPORTANT: Only fires on relevant field changes, NOT on hours_balance updates
-- (hours_balance is written by the recalc function itself → would cause infinite recursion)
CREATE OR REPLACE FUNCTION mj_trg_recalc_on_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM mj_recalc_monthly_reports_for_staff(OLD.pharmacy_id, OLD.staff_id);
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM mj_recalc_monthly_reports_for_staff(NEW.pharmacy_id, NEW.staff_id);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only recalc when balance-relevant fields change, not hours_balance itself
    IF OLD.initial_balance IS DISTINCT FROM NEW.initial_balance
      OR OLD.hourly_rate IS DISTINCT FROM NEW.hourly_rate
      OR OLD.monthly_payment IS DISTINCT FROM NEW.monthly_payment
    THEN
      PERFORM mj_recalc_monthly_reports_for_staff(NEW.pharmacy_id, NEW.staff_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS mj_recalc_on_profile ON mj_profiles;
CREATE TRIGGER mj_recalc_on_profile
AFTER INSERT OR UPDATE OR DELETE ON mj_profiles
FOR EACH ROW EXECUTE FUNCTION mj_trg_recalc_on_profile();

-- Shift updates: recalc affected staff
CREATE OR REPLACE FUNCTION mj_trg_recalc_on_shift()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_shift_id UUID;
BEGIN
  v_shift_id := COALESCE(NEW.id, OLD.id);
  FOR r IN
    SELECT DISTINCT staff_id, pharmacy_id
    FROM mj_schedules
    WHERE shift_id = v_shift_id
  LOOP
    PERFORM mj_recalc_monthly_reports_for_staff(r.pharmacy_id, r.staff_id);
  END LOOP;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS mj_recalc_on_shift ON mj_shifts;
CREATE TRIGGER mj_recalc_on_shift
AFTER UPDATE ON mj_shifts
FOR EACH ROW EXECUTE FUNCTION mj_trg_recalc_on_shift();

-- Initial backfill for existing profiles
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT pharmacy_id, staff_id FROM mj_profiles LOOP
    PERFORM mj_recalc_monthly_reports(r.pharmacy_id, r.staff_id);
  END LOOP;
END
$$;
