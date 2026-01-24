-- ============================================
-- CHAT UNREAD COUNTS MIGRATION für Kaeee
-- Führe dieses SQL in Supabase SQL Editor aus
-- ============================================

-- RPC-Funktion für effiziente Chat-Unread-Counts
-- Zählt direkt in der Datenbank statt alle Nachrichten zu laden

CREATE OR REPLACE FUNCTION public.get_chat_unread_counts(p_user_id UUID)
RETURNS TABLE (
  chat_type TEXT,
  chat_id UUID,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  -- Gruppenchat (recipient_id IS NULL)
  SELECT
    'group'::TEXT AS chat_type,
    NULL::UUID AS chat_id,
    COUNT(*)::BIGINT AS unread_count
  FROM public.chat_messages m
  WHERE m.recipient_id IS NULL
    AND m.user_id != p_user_id
    AND m.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_message_reads r
      WHERE r.message_id = m.id
        AND r.user_id = p_user_id
    )

  UNION ALL

  -- Direktchats (Nachrichten an mich, gruppiert nach Absender)
  SELECT
    'direct'::TEXT AS chat_type,
    m.user_id AS chat_id,
    COUNT(*)::BIGINT AS unread_count
  FROM public.chat_messages m
  WHERE m.recipient_id = p_user_id
    AND m.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_message_reads r
      WHERE r.message_id = m.id
        AND r.user_id = p_user_id
    )
  GROUP BY m.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Index für bessere Performance (falls nicht existiert)
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient
  ON public.chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_recipient
  ON public.chat_messages(user_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_reads_lookup
  ON public.chat_message_reads(message_id, user_id);

-- ============================================
-- FERTIG! Nach Ausführung kann der Hook
-- die RPC-Funktion nutzen.
-- ============================================
