-- Chat Message Reactions Migration
-- Tabelle für Emoji-Reaktionen auf Chat-Nachrichten

CREATE TABLE IF NOT EXISTS public.chat_message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ein User kann pro Emoji nur einmal reagieren
  UNIQUE(message_id, user_id, emoji)
);

-- Index für schnelle Abfragen nach message_id
CREATE INDEX IF NOT EXISTS idx_chat_reactions_message
  ON public.chat_message_reactions(message_id);

-- RLS Policies
ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;

-- Jeder authentifizierte User kann Reaktionen lesen
CREATE POLICY "Reactions are viewable by authenticated users"
  ON public.chat_message_reactions
  FOR SELECT
  TO authenticated
  USING (true);

-- User können eigene Reaktionen hinzufügen
CREATE POLICY "Users can insert own reactions"
  ON public.chat_message_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User können eigene Reaktionen löschen
CREATE POLICY "Users can delete own reactions"
  ON public.chat_message_reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Realtime aktivieren
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_message_reactions;
