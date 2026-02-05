-- News-Tabelle für interne Mitteilungen
-- Erstellt am 2026-02-05

CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titel TEXT NOT NULL,
  info TEXT NOT NULL,                              -- Markdown-Format
  autor_name TEXT NOT NULL,
  kategorie TEXT NOT NULL DEFAULT 'Info',          -- Info, Wichtig, Update, Wartung, Event
  prioritaet TEXT NOT NULL DEFAULT 'normal',       -- hoch, normal, niedrig
  gueltig_bis TIMESTAMP WITH TIME ZONE,            -- NULL = unbegrenzt gültig
  erstellt_am TIMESTAMP WITH TIME ZONE DEFAULT now(),
  aktualisiert_am TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index für schnelle Abfragen nach Gültigkeit
CREATE INDEX IF NOT EXISTS idx_news_gueltig_bis ON news(gueltig_bis);

-- Index für Sortierung nach Erstelldatum
CREATE INDEX IF NOT EXISTS idx_news_erstellt_am ON news(erstellt_am DESC);

-- RLS aktivieren
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Policy: Alle authentifizierten Benutzer können News lesen
CREATE POLICY "Authentifizierte Benutzer können News lesen"
  ON news
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Nur Admins können News erstellen
CREATE POLICY "Admins können News erstellen"
  ON news
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.auth_user_id = auth.uid()
      AND staff.is_admin = true
    )
  );

-- Policy: Nur Admins können News aktualisieren
CREATE POLICY "Admins können News aktualisieren"
  ON news
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.auth_user_id = auth.uid()
      AND staff.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.auth_user_id = auth.uid()
      AND staff.is_admin = true
    )
  );

-- Policy: Nur Admins können News löschen
CREATE POLICY "Admins können News löschen"
  ON news
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.auth_user_id = auth.uid()
      AND staff.is_admin = true
    )
  );

-- Trigger für automatische Aktualisierung von aktualisiert_am
CREATE OR REPLACE FUNCTION update_news_aktualisiert_am()
RETURNS TRIGGER AS $$
BEGIN
  NEW.aktualisiert_am = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_news_aktualisiert_am
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_news_aktualisiert_am();

-- Kommentar zur Tabelle
COMMENT ON TABLE news IS 'Interne News/Mitteilungen für alle Benutzer';

-- Realtime aktivieren für Live-Updates im Browser
ALTER PUBLICATION supabase_realtime ADD TABLE news;
COMMENT ON COLUMN news.info IS 'Inhalt im Markdown-Format';
COMMENT ON COLUMN news.kategorie IS 'Mögliche Werte: Info, Wichtig, Update, Wartung, Event';
COMMENT ON COLUMN news.prioritaet IS 'Mögliche Werte: hoch, normal, niedrig';
COMMENT ON COLUMN news.gueltig_bis IS 'NULL bedeutet unbegrenzt gültig';
