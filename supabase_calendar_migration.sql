-- ============================================
-- KALENDER-SYSTEM MIGRATION für Kaeee
-- Führe dieses SQL in Supabase SQL Editor aus
-- ============================================

-- 1. Berechtigungs-Enum erstellen
CREATE TYPE calendar_permission_level AS ENUM ('read', 'write');

-- 2. Kalender-Tabelle
CREATE TABLE public.calendars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#10b981',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

COMMENT ON TABLE public.calendars IS 'Kalender, die von Admins erstellt werden können';

-- 3. Events-Tabelle
CREATE TABLE public.calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id UUID NOT NULL REFERENCES public.calendars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  recurrence_rule TEXT,
  external_id TEXT,
  external_source TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.calendar_events IS 'Termine in Kalendern';

-- Index für schnelle Zeitabfragen
CREATE INDEX idx_calendar_events_time ON public.calendar_events(calendar_id, start_time, end_time);
CREATE INDEX idx_calendar_events_external ON public.calendar_events(external_id) WHERE external_id IS NOT NULL;

-- 4. Berechtigungen-Tabelle
CREATE TABLE public.calendar_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id UUID NOT NULL REFERENCES public.calendars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission calendar_permission_level NOT NULL DEFAULT 'read',
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(calendar_id, user_id)
);

COMMENT ON TABLE public.calendar_permissions IS 'Benutzerberechtigungen pro Kalender';

-- ============================================
-- HILFSFUNKTIONEN
-- ============================================

-- Admin-Check Funktion
CREATE OR REPLACE FUNCTION public.is_calendar_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE auth_user_id = check_user_id
    AND is_admin = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Kann Kalender lesen?
CREATE OR REPLACE FUNCTION public.can_read_calendar(cal_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_calendar_admin(uid) OR EXISTS (
    SELECT 1 FROM public.calendar_permissions
    WHERE calendar_id = cal_id AND user_id = uid
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Kann Kalender schreiben?
CREATE OR REPLACE FUNCTION public.can_write_calendar(cal_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_calendar_admin(uid) OR EXISTS (
    SELECT 1 FROM public.calendar_permissions
    WHERE calendar_id = cal_id AND user_id = uid AND permission = 'write'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- RLS aktivieren
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_permissions ENABLE ROW LEVEL SECURITY;

-- Policies für calendars
CREATE POLICY "view_calendars" ON public.calendars FOR SELECT
  USING (
    public.is_calendar_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.calendar_permissions
      WHERE calendar_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "insert_calendars" ON public.calendars FOR INSERT
  WITH CHECK (public.is_calendar_admin(auth.uid()));

CREATE POLICY "update_calendars" ON public.calendars FOR UPDATE
  USING (public.is_calendar_admin(auth.uid()));

CREATE POLICY "delete_calendars" ON public.calendars FOR DELETE
  USING (public.is_calendar_admin(auth.uid()));

-- Policies für calendar_events
CREATE POLICY "view_events" ON public.calendar_events FOR SELECT
  USING (public.can_read_calendar(calendar_id, auth.uid()));

CREATE POLICY "insert_events" ON public.calendar_events FOR INSERT
  WITH CHECK (public.can_write_calendar(calendar_id, auth.uid()));

CREATE POLICY "update_events" ON public.calendar_events FOR UPDATE
  USING (public.can_write_calendar(calendar_id, auth.uid()));

CREATE POLICY "delete_events" ON public.calendar_events FOR DELETE
  USING (public.can_write_calendar(calendar_id, auth.uid()));

-- Policies für calendar_permissions
CREATE POLICY "view_own_permissions" ON public.calendar_permissions FOR SELECT
  USING (user_id = auth.uid() OR public.is_calendar_admin(auth.uid()));

CREATE POLICY "insert_permissions" ON public.calendar_permissions FOR INSERT
  WITH CHECK (public.is_calendar_admin(auth.uid()));

CREATE POLICY "update_permissions" ON public.calendar_permissions FOR UPDATE
  USING (public.is_calendar_admin(auth.uid()));

CREATE POLICY "delete_permissions" ON public.calendar_permissions FOR DELETE
  USING (public.is_calendar_admin(auth.uid()));

-- ============================================
-- REALTIME aktivieren
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;

-- ============================================
-- FERTIG!
-- ============================================
