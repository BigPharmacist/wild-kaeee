-- Add cash collection details to delivery_stops
-- Allows partial payments and notes

ALTER TABLE delivery_stops
ADD COLUMN IF NOT EXISTS cash_collected_amount NUMERIC(10,2) DEFAULT 0;

ALTER TABLE delivery_stops
ADD COLUMN IF NOT EXISTS cash_notes TEXT;

COMMENT ON COLUMN delivery_stops.cash_collected_amount IS 'Actually collected amount (may be partial payment)';
COMMENT ON COLUMN delivery_stops.cash_notes IS 'Notes about cash collection (e.g., reason for partial payment)';
