-- Migration: Tabelle für Boten-Standorte
-- Datum: 2026-01-18

-- Tabelle für Standort-Tracking
CREATE TABLE IF NOT EXISTS courier_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION, -- Genauigkeit in Metern
  heading DOUBLE PRECISION, -- Richtung in Grad (0-360)
  speed DOUBLE PRECISION, -- Geschwindigkeit in m/s
  is_active BOOLEAN DEFAULT TRUE, -- Ist der Bote gerade aktiv/auf Tour?
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Abfragen nach staff_id und Zeit
CREATE INDEX IF NOT EXISTS idx_courier_locations_staff_id ON courier_locations(staff_id);
CREATE INDEX IF NOT EXISTS idx_courier_locations_created_at ON courier_locations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courier_locations_active ON courier_locations(staff_id, is_active) WHERE is_active = TRUE;

-- View für den aktuellsten Standort jedes aktiven Boten
CREATE OR REPLACE VIEW courier_latest_locations AS
SELECT DISTINCT ON (cl.staff_id)
  cl.id,
  cl.staff_id,
  s.first_name,
  s.last_name,
  s.avatar_url,
  cl.latitude,
  cl.longitude,
  cl.accuracy,
  cl.heading,
  cl.speed,
  cl.is_active,
  cl.created_at
FROM courier_locations cl
JOIN staff s ON s.id = cl.staff_id
WHERE s.tracking_enabled = TRUE
ORDER BY cl.staff_id, cl.created_at DESC;

-- RLS (Row Level Security) aktivieren
ALTER TABLE courier_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder authentifizierte User kann seinen eigenen Standort einfügen
CREATE POLICY "Users can insert own location" ON courier_locations
  FOR INSERT
  WITH CHECK (
    staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Admins können alle Standorte lesen
CREATE POLICY "Admins can read all locations" ON courier_locations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff WHERE auth_user_id = auth.uid() AND is_admin = TRUE
    )
  );

-- Policy: User können ihren eigenen Standort lesen
CREATE POLICY "Users can read own location" ON courier_locations
  FOR SELECT
  USING (
    staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: User können ihren eigenen Standort updaten
CREATE POLICY "Users can update own location" ON courier_locations
  FOR UPDATE
  USING (
    staff_id IN (
      SELECT id FROM staff WHERE auth_user_id = auth.uid()
    )
  );

-- Kommentare
COMMENT ON TABLE courier_locations IS 'Speichert GPS-Standorte von Boten für Tracking';
COMMENT ON COLUMN courier_locations.accuracy IS 'Genauigkeit der GPS-Position in Metern';
COMMENT ON COLUMN courier_locations.is_active IS 'True wenn Bote gerade auf Tour ist';
