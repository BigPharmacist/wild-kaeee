-- Add route_polyline column to delivery_tours
-- Stores the Google Maps encoded polyline for persistent route display

ALTER TABLE delivery_tours
ADD COLUMN IF NOT EXISTS route_polyline TEXT;

-- Optional: Add estimated duration
ALTER TABLE delivery_tours
ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;

COMMENT ON COLUMN delivery_tours.route_polyline IS 'Google Maps encoded polyline string for route visualization';
COMMENT ON COLUMN delivery_tours.estimated_duration_minutes IS 'Estimated total tour duration in minutes';
