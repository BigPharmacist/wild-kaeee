-- Migration: KI-Assistent Einstellungen
-- Datum: 2026-01-14

-- Tabelle für KI-Einstellungen (global, eine Zeile)
CREATE TABLE IF NOT EXISTS ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT DEFAULT '',
  model TEXT DEFAULT 'Qwen/Qwen2.5-72B-Instruct',
  system_prompt TEXT DEFAULT 'Du bist ein professioneller E-Mail-Assistent. Schreibe höfliche, klare und professionelle E-Mails auf Deutsch. Verwende eine angemessene Anrede und Grußformel. Halte den Text prägnant aber freundlich.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initiale Zeile einfügen falls nicht vorhanden
INSERT INTO ai_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM ai_settings);

-- RLS aktivieren
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Alle authentifizierten Benutzer können lesen
CREATE POLICY "Authenticated users can read ai_settings"
  ON ai_settings FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Nur Admins können bearbeiten (via staff.is_admin)
CREATE POLICY "Admins can update ai_settings"
  ON ai_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.auth_user_id = auth.uid()
      AND staff.is_admin = true
    )
  );

COMMENT ON TABLE ai_settings IS 'Globale Einstellungen für den KI-Assistenten';
COMMENT ON COLUMN ai_settings.api_key IS 'Nebius API Key';
COMMENT ON COLUMN ai_settings.model IS 'Ausgewähltes KI-Modell';
COMMENT ON COLUMN ai_settings.system_prompt IS 'System-Prompt für E-Mail-Generierung';
