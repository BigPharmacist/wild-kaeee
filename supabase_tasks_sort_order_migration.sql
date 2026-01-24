-- Migration: sort_order Feld für manuelle Task-Sortierung
-- Ermöglicht Drag & Drop Reihenfolge innerhalb einer Prioritäts-Gruppe

-- Neues Feld für manuelle Sortierung (höhere Werte = weiter unten)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Index für Performance bei Sortierung
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(priority, sort_order);

-- Bestehende Tasks mit sort_order initialisieren (basierend auf created_at)
UPDATE tasks
SET sort_order = sub.row_num * 1000
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY priority ORDER BY created_at) as row_num
  FROM tasks
) sub
WHERE tasks.id = sub.id AND tasks.sort_order = 0;
