-- Chat-Nachrichten serverseitige Verschlüsselung
-- Nachrichten werden mit pgcrypto (PGP symmetric) verschlüsselt in der DB gespeichert.
-- Der Encryption Key liegt im private-Schema und verlässt nie den Server.
-- Clients senden/empfangen weiterhin Klartext - die Kryptografie ist transparent.

-- ============================================================
-- 1.1 pgcrypto aktivieren
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1.2 Private Schema + Key-Tabelle
-- ============================================================
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.app_secrets (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Nur für superadmin erreichbar, nicht über PostgREST
REVOKE ALL ON private.app_secrets FROM PUBLIC, anon, authenticated;

-- Encryption Key generieren (idempotent)
INSERT INTO private.app_secrets (name, value)
VALUES ('chat_encryption_key', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 1.3 Private Helper-Funktion für Key-Abruf
-- ============================================================
CREATE OR REPLACE FUNCTION private.get_chat_key()
RETURNS TEXT AS $$
  SELECT value FROM private.app_secrets
  WHERE name = 'chat_encryption_key' LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Key-Funktion nur für postgres erreichbar, nicht über PostgREST
REVOKE ALL ON FUNCTION private.get_chat_key() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 1.4 Decrypt-Wrapper (SECURITY DEFINER → darf private.get_chat_key() aufrufen)
-- ============================================================
CREATE OR REPLACE FUNCTION public.decrypt_chat_message(p_message TEXT)
RETURNS TEXT AS $$
BEGIN
  IF p_message LIKE '-----BEGIN PGP MESSAGE-----%' THEN
    RETURN pgp_sym_decrypt(dearmor(p_message), private.get_chat_key());
  ELSE
    RETURN p_message;  -- Fallback für noch nicht migrierte Nachrichten
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
   SET search_path = public, extensions;

REVOKE ALL ON FUNCTION public.decrypt_chat_message(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decrypt_chat_message(TEXT) TO authenticated;

-- ============================================================
-- 1.5 Entschlüsselnde View
-- ============================================================
CREATE VIEW public.chat_messages_decrypted WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  recipient_id,
  public.decrypt_chat_message(message) AS message,
  created_at,
  deleted_at,
  edited_at,
  file_url,
  file_name,
  file_type
FROM public.chat_messages;

-- PostgREST braucht authenticator + authenticated Grants, anon nicht
REVOKE ALL ON public.chat_messages_decrypted FROM anon;
GRANT SELECT ON public.chat_messages_decrypted TO authenticator, authenticated;

-- ============================================================
-- 1.6 RPC: Nachricht senden (verschlüsselt)
-- ============================================================
CREATE OR REPLACE FUNCTION public.send_encrypted_message(
  p_message TEXT,
  p_recipient_id UUID DEFAULT NULL,
  p_file_url TEXT DEFAULT NULL,
  p_file_name TEXT DEFAULT NULL,
  p_file_type TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_key TEXT;
  v_encrypted TEXT;
  v_result RECORD;
BEGIN
  -- Key holen
  v_key := private.get_chat_key();

  -- Nachricht verschlüsseln (leere Nachrichten bei reinen Datei-Uploads bleiben leer)
  IF p_message IS NOT NULL AND p_message != '' THEN
    v_encrypted := armor(pgp_sym_encrypt(p_message, v_key));
  ELSE
    v_encrypted := '';
  END IF;

  -- Insert mit auth.uid() als Absender
  INSERT INTO public.chat_messages (user_id, message, recipient_id, file_url, file_name, file_type)
  VALUES (auth.uid(), v_encrypted, p_recipient_id, p_file_url, p_file_name, p_file_type)
  RETURNING * INTO v_result;

  -- Klartext zurückgeben (kein zweiter Roundtrip nötig)
  RETURN jsonb_build_object(
    'id', v_result.id,
    'user_id', v_result.user_id,
    'recipient_id', v_result.recipient_id,
    'message', p_message,
    'created_at', v_result.created_at,
    'deleted_at', v_result.deleted_at,
    'edited_at', v_result.edited_at,
    'file_url', v_result.file_url,
    'file_name', v_result.file_name,
    'file_type', v_result.file_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public, extensions;

-- Nur authentifizierte User dürfen senden
REVOKE ALL ON FUNCTION public.send_encrypted_message FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_encrypted_message TO authenticated;

-- ============================================================
-- 1.7 RPC: Nachricht bearbeiten (verschlüsselt)
-- ============================================================
CREATE OR REPLACE FUNCTION public.edit_encrypted_message(
  p_message_id UUID,
  p_new_text TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_key TEXT;
  v_encrypted TEXT;
  v_result RECORD;
BEGIN
  -- Key holen
  v_key := private.get_chat_key();

  -- Neuen Text verschlüsseln
  v_encrypted := armor(pgp_sym_encrypt(p_new_text, v_key));

  -- Update mit Server-seitigen Prüfungen
  UPDATE public.chat_messages
  SET message = v_encrypted,
      edited_at = now()
  WHERE id = p_message_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL
    AND created_at > now() - interval '5 minutes'
  RETURNING * INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Nachricht kann nicht bearbeitet werden (nicht gefunden, nicht berechtigt, gelöscht oder älter als 5 Minuten).';
  END IF;

  -- Klartext zurückgeben
  RETURN jsonb_build_object(
    'id', v_result.id,
    'user_id', v_result.user_id,
    'recipient_id', v_result.recipient_id,
    'message', p_new_text,
    'created_at', v_result.created_at,
    'deleted_at', v_result.deleted_at,
    'edited_at', v_result.edited_at,
    'file_url', v_result.file_url,
    'file_name', v_result.file_name,
    'file_type', v_result.file_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public, extensions;

-- Nur authentifizierte User dürfen bearbeiten
REVOKE ALL ON FUNCTION public.edit_encrypted_message FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.edit_encrypted_message TO authenticated;

-- ============================================================
-- 1.8 RPC: Einzelne Nachricht entschlüsselt abrufen (für Realtime)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_decrypted_message(p_message_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_key TEXT;
  v_msg RECORD;
  v_decrypted TEXT;
BEGIN
  -- Key holen
  v_key := private.get_chat_key();

  -- Nachricht laden mit Berechtigungsprüfung
  SELECT * INTO v_msg
  FROM public.chat_messages
  WHERE id = p_message_id
    AND (
      recipient_id IS NULL  -- Gruppennachricht
      OR user_id = auth.uid()
      OR recipient_id = auth.uid()
    );

  IF v_msg IS NULL THEN
    RETURN NULL;
  END IF;

  -- Entschlüsseln
  IF v_msg.message LIKE '-----BEGIN PGP MESSAGE-----%' THEN
    v_decrypted := pgp_sym_decrypt(dearmor(v_msg.message), v_key);
  ELSE
    v_decrypted := v_msg.message;
  END IF;

  RETURN jsonb_build_object(
    'id', v_msg.id,
    'user_id', v_msg.user_id,
    'recipient_id', v_msg.recipient_id,
    'message', v_decrypted,
    'created_at', v_msg.created_at,
    'deleted_at', v_msg.deleted_at,
    'edited_at', v_msg.edited_at,
    'file_url', v_msg.file_url,
    'file_name', v_msg.file_name,
    'file_type', v_msg.file_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
   SET search_path = public, extensions;

-- Nur authentifizierte User dürfen abrufen
REVOKE ALL ON FUNCTION public.get_decrypted_message FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_decrypted_message TO authenticated;

-- ============================================================
-- 1.9 Bestehende Nachrichten migrieren (batched, idempotent)
-- ============================================================
SET search_path = public, extensions;

DO $$
DECLARE
  v_key TEXT;
  v_batch_size INT := 500;
  v_updated INT;
BEGIN
  -- Key holen
  v_key := (SELECT value FROM private.app_secrets WHERE name = 'chat_encryption_key' LIMIT 1);

  LOOP
    -- Batch von unverschlüsselten Nachrichten verschlüsseln
    WITH batch AS (
      SELECT id, message
      FROM public.chat_messages
      WHERE message != ''
        AND message NOT LIKE '-----BEGIN PGP MESSAGE-----%'
      LIMIT v_batch_size
      FOR UPDATE SKIP LOCKED
    )
    UPDATE public.chat_messages cm
    SET message = armor(pgp_sym_encrypt(batch.message, v_key))
    FROM batch
    WHERE cm.id = batch.id;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    -- Keine weiteren Nachrichten → fertig
    EXIT WHEN v_updated = 0;

    -- Kurze Pause zwischen Batches
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;

RESET search_path;
