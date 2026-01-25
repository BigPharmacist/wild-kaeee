-- Migration: Tour-Abschluss Felder und RPC-Funktion
-- Ermöglicht Fahrern, Tour-Feedback und Fahrzeugprobleme zu melden

-- Neue Spalten für Tour-Feedback
ALTER TABLE delivery_tours
ADD COLUMN IF NOT EXISTS driver_notes TEXT,
ADD COLUMN IF NOT EXISTS vehicle_issues TEXT,
ADD COLUMN IF NOT EXISTS driver_completed_at TIMESTAMPTZ;

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
