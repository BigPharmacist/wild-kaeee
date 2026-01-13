-- ============================================
-- UNREAD-BADGE MIGRATION für Kaeee
-- Führe dieses SQL in Supabase SQL Editor aus
-- ============================================

-- 1. Enum für Meldungstypen (falls nicht existiert)
DO $$ BEGIN
  CREATE TYPE message_type AS ENUM ('amk', 'recall', 'lav');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Read-Status Tabelle
CREATE TABLE IF NOT EXISTS public.message_read_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type message_type NOT NULL,
  message_id UUID NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, message_type, message_id)
);

COMMENT ON TABLE public.message_read_status IS 'Speichert welche Meldungen ein Benutzer gelesen hat';

-- 3. Indices für Performance
CREATE INDEX IF NOT EXISTS idx_message_read_status_user
  ON public.message_read_status(user_id);
CREATE INDEX IF NOT EXISTS idx_message_read_status_type
  ON public.message_read_status(message_type);
CREATE INDEX IF NOT EXISTS idx_message_read_status_lookup
  ON public.message_read_status(user_id, message_type, message_id);

-- 4. RLS aktivieren
ALTER TABLE public.message_read_status ENABLE ROW LEVEL SECURITY;

-- 5. Policies (mit DROP falls existiert)
DROP POLICY IF EXISTS "view_own_read_status" ON public.message_read_status;
CREATE POLICY "view_own_read_status" ON public.message_read_status
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_read_status" ON public.message_read_status;
CREATE POLICY "insert_own_read_status" ON public.message_read_status
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_read_status" ON public.message_read_status;
CREATE POLICY "delete_own_read_status" ON public.message_read_status
  FOR DELETE USING (user_id = auth.uid());

-- 6. Funktion für Unread-Counts
CREATE OR REPLACE FUNCTION public.get_unread_counts(
  p_user_id UUID,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER
)
RETURNS TABLE (
  message_type message_type,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'amk'::message_type, COUNT(*)::BIGINT
  FROM public.abda_amk_messages m
  WHERE EXTRACT(YEAR FROM m.date) = p_year
    AND NOT EXISTS (
      SELECT 1 FROM public.message_read_status r
      WHERE r.user_id = p_user_id
        AND r.message_type = 'amk'
        AND r.message_id = m.id
    )
  UNION ALL
  SELECT 'recall'::message_type, COUNT(*)::BIGINT
  FROM public.abda_recall m
  WHERE EXTRACT(YEAR FROM m.date) = p_year
    AND NOT EXISTS (
      SELECT 1 FROM public.message_read_status r
      WHERE r.user_id = p_user_id
        AND r.message_type = 'recall'
        AND r.message_id = m.id
    )
  UNION ALL
  SELECT 'lav'::message_type, COUNT(*)::BIGINT
  FROM public.lav_ausgaben m
  WHERE EXTRACT(YEAR FROM m.datum) = p_year
    AND NOT EXISTS (
      SELECT 1 FROM public.message_read_status r
      WHERE r.user_id = p_user_id
        AND r.message_type = 'lav'
        AND r.message_id = m.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- FERTIG! Nach Ausführung dieses Skripts
-- kann das Frontend die Tabelle nutzen.
-- ============================================
