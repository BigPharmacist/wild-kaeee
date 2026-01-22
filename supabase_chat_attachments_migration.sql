-- Chat Attachments Migration
-- Erweitert chat_messages um Dateianhänge

-- Spalten für Dateianhänge hinzufügen
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT;

-- Kommentar zur Dokumentation
COMMENT ON COLUMN public.chat_messages.file_url IS 'URL zur Datei im Supabase Storage';
COMMENT ON COLUMN public.chat_messages.file_name IS 'Originaler Dateiname';
COMMENT ON COLUMN public.chat_messages.file_type IS 'MIME-Type der Datei (z.B. image/jpeg, application/pdf)';

-- Storage Bucket erstellen (muss manuell in Supabase Dashboard gemacht werden):
-- Name: chat-attachments
-- Public: true
-- File size limit: 25MB
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp, application/pdf
