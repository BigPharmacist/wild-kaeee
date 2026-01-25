-- Migration: delivery_stop_items Tabelle für Medikamente/Artikel pro Lieferung
-- Erstellt: 2026-01-25

-- Tabelle für Artikel pro Stop
CREATE TABLE IF NOT EXISTS delivery_stop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stop_id UUID NOT NULL REFERENCES delivery_stops(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  article_name TEXT NOT NULL,
  package_size TEXT, -- z.B. "10 St", "5X10 ml", "30 g"
  manufacturer_code TEXT, -- z.B. "HIKMA", "RATIO", "HEXAL"
  pzn TEXT, -- Pharmazentralnummer (falls vorhanden)
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_delivery_stop_items_stop_id ON delivery_stop_items(stop_id);

-- RLS aktivieren
ALTER TABLE delivery_stop_items ENABLE ROW LEVEL SECURITY;

-- Policy: Alle authentifizierten Benutzer können lesen
CREATE POLICY "delivery_stop_items_select" ON delivery_stop_items
  FOR SELECT TO authenticated USING (true);

-- Policy: Alle authentifizierten Benutzer können einfügen
CREATE POLICY "delivery_stop_items_insert" ON delivery_stop_items
  FOR INSERT TO authenticated WITH CHECK (true);

-- Policy: Alle authentifizierten Benutzer können aktualisieren
CREATE POLICY "delivery_stop_items_update" ON delivery_stop_items
  FOR UPDATE TO authenticated USING (true);

-- Policy: Alle authentifizierten Benutzer können löschen
CREATE POLICY "delivery_stop_items_delete" ON delivery_stop_items
  FOR DELETE TO authenticated USING (true);

-- Kommentar zur Tabelle
COMMENT ON TABLE delivery_stop_items IS 'Artikel/Medikamente pro Lieferstop - nur für Admin sichtbar, nicht für Fahrer';
COMMENT ON COLUMN delivery_stop_items.quantity IS 'Anzahl der Packungen';
COMMENT ON COLUMN delivery_stop_items.article_name IS 'Vollständiger Artikelname inkl. Wirkstoff und Darreichungsform';
COMMENT ON COLUMN delivery_stop_items.package_size IS 'Packungsgröße z.B. "10 St", "5X10 ml"';
COMMENT ON COLUMN delivery_stop_items.manufacturer_code IS 'Hersteller-Kurzcode z.B. "HIKMA", "RATIO"';
