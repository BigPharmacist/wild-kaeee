-- Migration: Füge tracking_enabled Feld zur staff Tabelle hinzu
-- Datum: 2026-01-18

-- Spalte hinzufügen (standardmäßig deaktiviert)
ALTER TABLE staff
ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN DEFAULT FALSE;

-- Kommentar zur Dokumentation
COMMENT ON COLUMN staff.tracking_enabled IS 'Aktiviert Standort-Tracking für diesen Mitarbeiter (z.B. Boten)';
