-- Add color_index column to mj_profiles for persistent staff color assignment
ALTER TABLE mj_profiles ADD COLUMN IF NOT EXISTS color_index INT;
