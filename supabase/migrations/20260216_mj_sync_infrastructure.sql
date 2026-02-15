-- Sync-Infrastruktur für Einweg-Sync: Supabase Cloud → Lokale Kaeee mj_* Tabellen
-- Cloud ist Source of Truth bis zur vollständigen Migration nach Kaeee.

-- ============================================
-- 1. ID-Mapping: Cloud-UUID → Lokale-UUID
-- ============================================
CREATE TABLE IF NOT EXISTS mj_cloud_id_map (
  cloud_id TEXT NOT NULL,
  table_name TEXT NOT NULL,
  local_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (cloud_id, table_name)
);

CREATE INDEX IF NOT EXISTS idx_mj_cloud_id_map_local ON mj_cloud_id_map(local_id);

-- ============================================
-- 2. Sync-Status (Singleton)
-- ============================================
CREATE TABLE IF NOT EXISTS mj_sync_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_sync_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Helper: Stabile ID-Zuordnung
-- ============================================
-- Gibt die lokale UUID für eine Cloud-ID zurück.
-- Erstellt automatisch eine neue Zuordnung wenn keine existiert.
-- p_fixed_id: Optional feste UUID (z.B. für Matthias).
CREATE OR REPLACE FUNCTION get_or_create_local_id(
  p_cloud_id TEXT,
  p_table_name TEXT,
  p_fixed_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT local_id INTO v_id
  FROM mj_cloud_id_map
  WHERE cloud_id = p_cloud_id AND table_name = p_table_name;

  IF v_id IS NULL THEN
    v_id := COALESCE(p_fixed_id, gen_random_uuid());
    INSERT INTO mj_cloud_id_map (cloud_id, table_name, local_id)
    VALUES (p_cloud_id, p_table_name, v_id);
  END IF;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
