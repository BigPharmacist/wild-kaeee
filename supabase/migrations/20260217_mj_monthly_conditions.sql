-- MJ_MONTHLY_CONDITIONS (Monatliche Konditionen pro Minijobber)
-- Stundenlohn + Auszahlungsbetrag pro Monat → daraus ergibt sich Soll-Stunden

CREATE TABLE IF NOT EXISTS mj_monthly_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  monthly_payment NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_mj_monthly_conditions_pharmacy ON mj_monthly_conditions(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_mj_monthly_conditions_staff ON mj_monthly_conditions(staff_id);

-- RLS
ALTER TABLE mj_monthly_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY mj_monthly_conditions_select ON mj_monthly_conditions
  FOR SELECT USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

CREATE POLICY mj_monthly_conditions_insert ON mj_monthly_conditions
  FOR INSERT WITH CHECK (true);

CREATE POLICY mj_monthly_conditions_update ON mj_monthly_conditions
  FOR UPDATE USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

CREATE POLICY mj_monthly_conditions_delete ON mj_monthly_conditions
  FOR DELETE USING (pharmacy_id IN (SELECT get_user_pharmacy_ids()));

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON mj_monthly_conditions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON mj_monthly_conditions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON mj_monthly_conditions TO service_role;
