-- ============================================
-- Kalender für alle eingeloggten Nutzer sichtbar machen
-- Vorher: Nur Admins und Nutzer mit expliziten calendar_permissions konnten Kalender sehen
-- Nachher: Alle authentifizierten Nutzer können alle Kalender und Events lesen
-- Write/Admin-Rechte bleiben unverändert
-- ============================================

-- 1. view_calendars Policy öffnen: Alle eingeloggten Nutzer können Kalender sehen
DROP POLICY "view_calendars" ON public.calendars;
CREATE POLICY "view_calendars" ON public.calendars FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 2. can_read_calendar Funktion anpassen: Alle authentifizierten Nutzer können Events lesen
--    (wird von der view_events Policy auf calendar_events genutzt)
CREATE OR REPLACE FUNCTION public.can_read_calendar(cal_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT uid IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. view_own_permissions Policy erweitern: Alle eingeloggten Nutzer können Permissions lesen
--    (Frontend jointed calendar_permissions, um userPermission zu bestimmen)
DROP POLICY "view_own_permissions" ON public.calendar_permissions;
CREATE POLICY "view_own_permissions" ON public.calendar_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);
