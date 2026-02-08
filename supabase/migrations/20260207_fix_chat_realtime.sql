-- Chat Realtime Fix
-- Problem: Realtime rate limit (max_events_per_second: 100) war zu niedrig,
-- was zu "MessagePerSecondRateLimitReached" Fehlern und Postgrex-Disconnects führte.
--
-- Fix 1: Publication sicherstellen (war bereits korrekt, aber zur Absicherung)
-- Fix 2: Rate Limits über custom seeds.exs auf 500 events/s erhöht
--         (siehe /supabase/docker/volumes/realtime/seeds.exs)
--
-- Die Tabellen waren bereits in der Publication, aber sicherheitshalber:
DO $$
BEGIN
  -- chat_messages
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;

  -- chat_message_reads
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_message_reads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reads;
  END IF;

  -- chat_message_reactions (war schon drin via reactions migration)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reactions;
  END IF;
END $$;
