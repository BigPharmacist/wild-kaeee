-- Migration: Tour-Abschluss Felder und RPC-Funktion
-- Ermöglicht Fahrern, Tour-Feedback und Fahrzeugprobleme zu melden
-- Zeiterfassung für Fahrer-Arbeitszeiten

-- Neue Spalten für Tour-Feedback und Zeiterfassung
ALTER TABLE delivery_tours
ADD COLUMN IF NOT EXISTS driver_notes TEXT,
ADD COLUMN IF NOT EXISTS vehicle_issues TEXT,
ADD COLUMN IF NOT EXISTS driver_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS driver_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS driver_ended_at TIMESTAMPTZ;

-- RPC-Funktion: Tour per Token abschließen mit Feedback
CREATE OR REPLACE FUNCTION complete_tour_by_token(
  tour_token TEXT,
  p_driver_notes TEXT DEFAULT NULL,
  p_vehicle_issues TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tour_id UUID;
  v_tour RECORD;
BEGIN
  -- Tour per Token finden
  SELECT id INTO v_tour_id
  FROM delivery_tours
  WHERE access_token = tour_token
    AND status IN ('active', 'draft');

  IF v_tour_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Tour nicht gefunden oder nicht aktiv');
  END IF;

  -- Tour-Feedback speichern
  UPDATE delivery_tours
  SET
    driver_notes = COALESCE(p_driver_notes, driver_notes),
    vehicle_issues = COALESCE(p_vehicle_issues, vehicle_issues),
    driver_completed_at = NOW()
  WHERE id = v_tour_id
  RETURNING * INTO v_tour;

  RETURN to_jsonb(v_tour);
END;
$$;

-- Berechtigung für anonyme Benutzer (Token-Zugriff)
GRANT EXECUTE ON FUNCTION complete_tour_by_token TO anon;
GRANT EXECUTE ON FUNCTION complete_tour_by_token TO authenticated;

-- RPC-Funktion: Fahrer-Startzeit setzen (beim Auswählen des Namens)
CREATE OR REPLACE FUNCTION set_driver_name_by_token(
  tour_token TEXT,
  p_driver_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tour_id UUID;
  v_tour RECORD;
BEGIN
  -- Tour per Token finden
  SELECT id INTO v_tour_id
  FROM delivery_tours
  WHERE access_token = tour_token
    AND status IN ('active', 'draft');

  IF v_tour_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Tour nicht gefunden oder nicht aktiv');
  END IF;

  -- Fahrername und Startzeit setzen
  UPDATE delivery_tours
  SET
    driver_name = p_driver_name,
    driver_started_at = COALESCE(driver_started_at, NOW()) -- Nur beim ersten Mal setzen
  WHERE id = v_tour_id
  RETURNING * INTO v_tour;

  RETURN to_jsonb(v_tour);
END;
$$;

GRANT EXECUTE ON FUNCTION set_driver_name_by_token TO anon;
GRANT EXECUTE ON FUNCTION set_driver_name_by_token TO authenticated;

-- RPC-Funktion: Feierabend - Arbeitszeit-Ende tracken
CREATE OR REPLACE FUNCTION end_driver_shift_by_token(
  tour_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tour_id UUID;
  v_tour RECORD;
BEGIN
  -- Tour per Token finden
  SELECT id INTO v_tour_id
  FROM delivery_tours
  WHERE access_token = tour_token;

  IF v_tour_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Tour nicht gefunden');
  END IF;

  -- Feierabend-Zeit setzen
  UPDATE delivery_tours
  SET driver_ended_at = NOW()
  WHERE id = v_tour_id
  RETURNING * INTO v_tour;

  RETURN to_jsonb(v_tour);
END;
$$;

GRANT EXECUTE ON FUNCTION end_driver_shift_by_token TO anon;
GRANT EXECUTE ON FUNCTION end_driver_shift_by_token TO authenticated;
