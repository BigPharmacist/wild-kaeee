-- Migration: KI-Chat Einstellungen
-- Datum: 2026-01-24

-- Neues Feld für Chat-System-Prompt in ai_settings
ALTER TABLE ai_settings
ADD COLUMN IF NOT EXISTS chat_system_prompt TEXT DEFAULT 'Du bist ein hilfreicher KI-Assistent für eine deutsche Apotheken-Management-App namens "Kaeee".
Du antwortest auf Deutsch, freundlich und prägnant.
Du kannst bei allgemeinen Fragen helfen, Texte formulieren, Ideen geben und Probleme analysieren.
Halte deine Antworten kurz und praktisch, außer der Nutzer bittet um ausführlichere Erklärungen.';

COMMENT ON COLUMN ai_settings.chat_system_prompt IS 'System-Prompt für den Floating KI-Chat Assistenten';
