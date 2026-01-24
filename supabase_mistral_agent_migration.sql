-- Migration: Mistral Agent ID speichern
-- Datum: 2026-01-24

-- Neues Feld für Mistral Agent ID in ai_settings
ALTER TABLE ai_settings
ADD COLUMN IF NOT EXISTS mistral_agent_id TEXT DEFAULT NULL;

COMMENT ON COLUMN ai_settings.mistral_agent_id IS 'Persistente Mistral Agent ID für den KI-Chat mit Web-Search';
