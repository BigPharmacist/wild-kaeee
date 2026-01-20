-- Trigger-Funktion aktualisieren: Nur bei gültigem Datum Termin erstellen
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
  IF NEW.besuche IS NULL OR jsonb_array_length(NEW.besuche) = 0 THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_calendar_id FROM public.calendars WHERE name = 'Apotheke' LIMIT 1;
  IF v_calendar_id IS NULL THEN RETURN NEW; END IF;

  IF EXISTS (
    SELECT 1 FROM public.calendar_events
    WHERE external_id = NEW.id::TEXT AND external_source = 'fax_besuchsankuendigung'
  ) THEN
    RETURN NEW;
  END IF;

  v_besuch := NEW.besuche->0;
  v_datum := v_besuch->>'datum';

  -- WICHTIG: Nur fortfahren wenn Datum vorhanden
  IF v_datum IS NULL OR v_datum = '' THEN
    RETURN NEW;
  END IF;

  -- Bei Datumsbereichen nur das erste Datum nehmen
  IF v_datum LIKE '%-%' THEN
    v_datum := TRIM(SPLIT_PART(v_datum, '-', 1));
  END IF;

  -- WICHTIG: Nur bei gültigem Datumsformat (DD.MM.YYYY) fortfahren
  IF NOT (v_datum ~ '^\d{2}\.\d{2}\.\d{4}$') THEN
    RETURN NEW;
  END IF;

  v_uhrzeit := COALESCE(v_besuch->>'uhrzeit', '09:00');
  IF LENGTH(v_uhrzeit) > 5 THEN
    v_uhrzeit := SUBSTRING(v_uhrzeit FROM 1 FOR 5);
  END IF;

  v_day := SUBSTRING(v_datum FROM 1 FOR 2);
  v_month := SUBSTRING(v_datum FROM 4 FOR 2);
  v_year := SUBSTRING(v_datum FROM 7 FOR 4);
  v_hours := COALESCE(NULLIF(SPLIT_PART(v_uhrzeit, ':', 1), '')::INT, 9);
  v_minutes := COALESCE(NULLIF(SPLIT_PART(v_uhrzeit, ':', 2), '')::INT, 0);
  v_start_time := make_timestamptz(v_year::INT, v_month::INT, v_day::INT, v_hours, v_minutes, 0, 'Europe/Berlin');
  v_end_time := v_start_time + INTERVAL '1 hour';

  v_title := COALESCE(v_besuch->>'firma', 'Unbekannte Firma');
  IF v_besuch->>'name' IS NOT NULL AND v_besuch->>'name' != '' THEN
    v_title := v_title || ' - ' || (v_besuch->>'name');
  END IF;

  v_description := '';
  IF v_besuch->>'thema' IS NOT NULL AND v_besuch->>'thema' != '' THEN
    v_description := (v_besuch->>'thema') || E'\n\n';
  END IF;
  v_description := v_description || '[fax:' || NEW.id::TEXT || ']';

  INSERT INTO public.calendar_events (
    calendar_id, title, description, start_time, end_time, all_day, external_id, external_source
  ) VALUES (
    v_calendar_id, v_title, v_description, v_start_time, v_end_time, FALSE, NEW.id::TEXT, 'fax_besuchsankuendigung'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
