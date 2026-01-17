-- Migration: Neue Felder für pharmacies Tabelle
-- Datum: 2026-01-15
-- Felder: Umsatzsteuer-ID, Handelsregistereintrag, Amtsgericht, BGA/IDF-Nummer

-- Neue Spalten hinzufügen
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS vat_id TEXT;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS trade_register TEXT;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS registry_court TEXT;
ALTER TABLE pharmacies ADD COLUMN IF NOT EXISTS bga_idf_number TEXT;

-- Kommentare für Dokumentation
COMMENT ON COLUMN pharmacies.vat_id IS 'Umsatzsteuer-Identifikationsnummer';
COMMENT ON COLUMN pharmacies.trade_register IS 'Handelsregistereintrag (z.B. HRA 12345)';
COMMENT ON COLUMN pharmacies.registry_court IS 'Zuständiges Amtsgericht';
COMMENT ON COLUMN pharmacies.bga_idf_number IS 'BGA/IDF-Nummer der Apotheke';
