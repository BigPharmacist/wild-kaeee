-- Inventur-Scanner Tabelle für gescannte Barcodes/QR-Codes

CREATE TABLE IF NOT EXISTS inventory_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  session_name TEXT,
  code TEXT NOT NULL,
  code_type TEXT,
  quantity INTEGER DEFAULT 1,
  scanned_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index für schnelle Abfragen nach Session
CREATE INDEX IF NOT EXISTS idx_inventory_scans_session ON inventory_scans(session_id);

-- Index für schnelle Abfragen nach Code
CREATE INDEX IF NOT EXISTS idx_inventory_scans_code ON inventory_scans(code);

-- Index für Benutzer-Abfragen
CREATE INDEX IF NOT EXISTS idx_inventory_scans_user ON inventory_scans(user_id);

-- Row Level Security aktivieren
ALTER TABLE inventory_scans ENABLE ROW LEVEL SECURITY;

-- Policy: Benutzer können nur ihre eigenen Scans sehen
CREATE POLICY "Users can view their own scans"
  ON inventory_scans
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Benutzer können eigene Scans erstellen
CREATE POLICY "Users can create their own scans"
  ON inventory_scans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Benutzer können eigene Scans aktualisieren
CREATE POLICY "Users can update their own scans"
  ON inventory_scans
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Benutzer können eigene Scans löschen
CREATE POLICY "Users can delete their own scans"
  ON inventory_scans
  FOR DELETE
  USING (auth.uid() = user_id);

-- Kommentar zur Tabelle
COMMENT ON TABLE inventory_scans IS 'Speichert gescannte Barcodes/QR-Codes für Inventur-Sessions';
COMMENT ON COLUMN inventory_scans.session_id IS 'Gruppiert Scans einer Inventur-Session';
COMMENT ON COLUMN inventory_scans.code IS 'Der gescannte Barcode oder QR-Code Inhalt';
COMMENT ON COLUMN inventory_scans.code_type IS 'Typ des Codes: EAN_13, QR_CODE, CODE_128, etc.';
COMMENT ON COLUMN inventory_scans.quantity IS 'Anzahl der gescannten Artikel';
