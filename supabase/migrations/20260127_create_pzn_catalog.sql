-- PZN Artikelkatalog für Produktnamen-Lookup

CREATE TABLE IF NOT EXISTS pzn_catalog (
  pzn TEXT PRIMARY KEY,
  article_name TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  manufacturer TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index für schnelle Suche nach Artikelname
CREATE INDEX IF NOT EXISTS idx_pzn_catalog_name ON pzn_catalog USING gin(to_tsvector('german', article_name));

-- Index für Hersteller
CREATE INDEX IF NOT EXISTS idx_pzn_catalog_manufacturer ON pzn_catalog(manufacturer);

-- RLS aktivieren (öffentlich lesbar)
ALTER TABLE pzn_catalog ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder kann lesen
CREATE POLICY "Anyone can read pzn_catalog"
  ON pzn_catalog
  FOR SELECT
  USING (true);

-- Policy: Nur authentifizierte Benutzer können schreiben
CREATE POLICY "Authenticated users can insert pzn_catalog"
  ON pzn_catalog
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update pzn_catalog"
  ON pzn_catalog
  FOR UPDATE
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE pzn_catalog IS 'Artikelkatalog mit PZN und Produktnamen';
