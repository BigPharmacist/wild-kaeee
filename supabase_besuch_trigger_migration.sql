-- ============================================
-- AUTOMATISCHER TRIGGER für Besuchstermine
-- Erstellt Kalendertermine automatisch wenn
-- ein Fax mit besuche-Daten eingefügt wird
-- ============================================

-- Funktion die bei jedem INSERT/UPDATE auf faxe aufgerufen wird
CREATE OR REPLACE FUNCTION public.create_besuchstermin_from_fax()
RETURNS TRIGGER AS $$
DECLARE
  v_calendar_id UUID;
  v_besuch JSONB;
  v_datum TEXT;
  v_uhrzeit TEXT;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_title TEXT;
  v_description TEXT;
  v_day TEXT;
  v_month TEXT;
  v_year TEXT;
  v_hours INT;
  v_minutes INT;
BEGIN
  -- Nur fortfahren wenn besuche-Daten vorhanden
  IF NEW.besuche IS NULL OR jsonb_array_length(NEW.besuche) = 0 THEN
    RETURN NEW;
  END IF;

  -- Apotheke-Kalender ID holen
  SELECT id INTO v_calendar_id
  FROM public.calendars
  WHERE name = 'Apotheke'
  LIMIT 1;

  -- Wenn kein Kalender existiert, abbrechen
  IF v_calendar_id IS NULL THEN
    RAISE NOTICE 'Apotheke-Kalender nicht gefunden';
    RETURN NEW;
  END IF;

  -- Prüfen ob bereits ein Termin für dieses Fax existiert
  IF EXISTS (
    SELECT 1 FROM public.calendar_events
    WHERE external_id = NEW.id::TEXT
    AND external_source = 'fax_besuchsankuendigung'
  ) THEN
    RETURN NEW;
  END IF;

  -- Erstes Besuchs-Objekt aus dem Array holen
  v_besuch := NEW.besuche->0;

  -- Datum extrahieren (Format: "DD.MM.YYYY" oder "DD.MM.YYYY - DD.MM.YYYY")
  v_datum := v_besuch->>'datum';

  -- Bei Datumsbereichen nur das erste Datum nehmen
  IF v_datum LIKE '%-%' THEN
    v_datum := TRIM(SPLIT_PART(v_datum, '-', 1));
  END IF;

  -- Uhrzeit extrahieren (Default: 09:00)
  v_uhrzeit := COALESCE(v_besuch->>'uhrzeit', '09:00');

  -- Uhrzeit bereinigen (nur HH:MM behalten)
  IF LENGTH(v_uhrzeit) > 5 THEN
    v_uhrzeit := SUBSTRING(v_uhrzeit FROM 1 FOR 5);
  END IF;

  -- Datum parsen (DD.MM.YYYY)
  IF v_datum ~ '^\d{2}\.\d{2}\.\d{4}$' THEN
    v_day := SUBSTRING(v_datum FROM 1 FOR 2);
    v_month := SUBSTRING(v_datum FROM 4 FOR 2);
    v_year := SUBSTRING(v_datum FROM 7 FOR 4);

    -- Uhrzeit parsen
    v_hours := COALESCE(NULLIF(SPLIT_PART(v_uhrzeit, ':', 1), '')::INT, 9);
    v_minutes := COALESCE(NULLIF(SPLIT_PART(v_uhrzeit, ':', 2), '')::INT, 0);

    -- Start-Zeit konstruieren
    v_start_time := make_timestamptz(
      v_year::INT, v_month::INT, v_day::INT,
      v_hours, v_minutes, 0, 'Europe/Berlin'
    );

    -- End-Zeit: 1 Stunde später
    v_end_time := v_start_time + INTERVAL '1 hour';
  ELSE
    -- Ungültiges Datumsformat - 7 Tage in der Zukunft als Fallback
    RAISE NOTICE 'Ungültiges Datumsformat: %', v_datum;
    v_start_time := NOW() + INTERVAL '7 days';
    v_end_time := v_start_time + INTERVAL '1 hour';
  END IF;

  -- Titel zusammensetzen
  v_title := COALESCE(v_besuch->>'firma', 'Unbekannte Firma');
  IF v_besuch->>'name' IS NOT NULL AND v_besuch->>'name' != '' THEN
    v_title := v_title || ' - ' || (v_besuch->>'name');
  END IF;

  -- Beschreibung
  v_description := 'Vertreterbesuch';
  IF v_besuch->>'thema' IS NOT NULL AND v_besuch->>'thema' != '' THEN
    v_description := 'Vertreterbesuch: ' || (v_besuch->>'thema');
  END IF;

  -- Termin erstellen
  INSERT INTO public.calendar_events (
    calendar_id,
    title,
    description,
    start_time,
    end_time,
    all_day,
    external_id,
    external_source
  ) VALUES (
    v_calendar_id,
    v_title,
    v_description,
    v_start_time,
    v_end_time,
    FALSE,
    NEW.id::TEXT,
    'fax_besuchsankuendigung'
  );

  RAISE NOTICE 'Besuchstermin erstellt: % am %', v_title, v_start_time;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger erstellen
DROP TRIGGER IF EXISTS trg_create_besuchstermin ON public.faxe;

CREATE TRIGGER trg_create_besuchstermin
  AFTER INSERT OR UPDATE OF besuche
  ON public.faxe
  FOR EACH ROW
  EXECUTE FUNCTION public.create_besuchstermin_from_fax();

-- ============================================
-- Bestehende Faxe mit besuche-Daten verarbeiten
-- ============================================
DO $$
DECLARE
  v_fax RECORD;
BEGIN
  FOR v_fax IN
    SELECT * FROM public.faxe
    WHERE besuche IS NOT NULL
    AND besuche != '[]'::jsonb
    AND NOT EXISTS (
      SELECT 1 FROM public.calendar_events
      WHERE external_id = faxe.id::TEXT
      AND external_source = 'fax_besuchsankuendigung'
    )
  LOOP
    -- Trigger manuell auslösen durch Update
    UPDATE public.faxe SET besuche = besuche WHERE id = v_fax.id;
  END LOOP;
END $$;

-- ============================================
-- FERTIG!
-- Termine werden nun automatisch erstellt.
-- ============================================
