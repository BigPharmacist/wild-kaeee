-- Anfangsbestand pro Minijobber (Stundensaldo vor Systemstart)
ALTER TABLE mj_profiles ADD COLUMN IF NOT EXISTS initial_balance NUMERIC NOT NULL DEFAULT 0;
