-- Migration: E-Mail-Signatur zu email_accounts hinzufügen
-- Datum: 2026-01-14

-- Signatur-Feld hinzufügen (HTML-formatiert)
ALTER TABLE email_accounts
ADD COLUMN IF NOT EXISTS signature TEXT DEFAULT '';

-- Kommentar zur Spalte
COMMENT ON COLUMN email_accounts.signature IS 'HTML-formatierte E-Mail-Signatur';
