-- ============================================
-- APOTHEKE KALENDER + BESUCHSTERMIN-VERKNÜPFUNG
-- Führe dieses SQL in Supabase SQL Editor aus
-- ============================================

-- 1. Kalender "Apotheke" erstellen (falls nicht vorhanden)
-- Die Farbe ist ein pharmazeutisches Grün
INSERT INTO public.calendars (name, description, color, is_active)
SELECT 'Apotheke', 'Termine der Apotheke (Vertreterbesuche, etc.)', '#059669', TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM public.calendars WHERE name = 'Apotheke'
);

-- 2. Allen bestehenden Usern Lesezugriff auf den Apotheke-Kalender geben
-- (Admins haben ohnehin vollen Zugriff durch is_calendar_admin())
INSERT INTO public.calendar_permissions (calendar_id, user_id, permission)
SELECT
  c.id,
  s.auth_user_id,
  'read'::calendar_permission_level
FROM public.calendars c
CROSS JOIN public.staff s
WHERE c.name = 'Apotheke'
  AND s.auth_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.calendar_permissions cp
    WHERE cp.calendar_id = c.id AND cp.user_id = s.auth_user_id
  );

-- 3. Index für schnellere Suche nach Fax-verknüpften Events
CREATE INDEX IF NOT EXISTS idx_calendar_events_fax
  ON public.calendar_events(external_id, external_source)
  WHERE external_source = 'fax_besuchsankuendigung';

-- ============================================
-- FERTIG!
-- Nun können Besuchsankündigungen aus Faxen
-- automatisch als Termine angelegt werden.
-- external_id = fax.id
-- external_source = 'fax_besuchsankuendigung'
-- ============================================
