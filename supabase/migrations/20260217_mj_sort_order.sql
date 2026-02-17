-- Add sort_order column to mj_profiles for custom ordering in Monatsberichte
ALTER TABLE mj_profiles ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- Backfill: number active profiles alphabetically by name
WITH numbered AS (
  SELECT
    mp.id,
    ROW_NUMBER() OVER (
      ORDER BY s.last_name, s.first_name
    ) AS rn
  FROM mj_profiles mp
  JOIN staff s ON s.id = mp.staff_id
  WHERE mp.active = true
)
UPDATE mj_profiles
SET sort_order = numbered.rn
FROM numbered
WHERE mj_profiles.id = numbered.id;
