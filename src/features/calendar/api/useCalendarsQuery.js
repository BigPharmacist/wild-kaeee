import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { calendarKeys } from './queries'

/**
 * Fetch calendars with user permissions
 */
async function fetchCalendars(userId) {
  const { data, error } = await supabase
    .from('calendars')
    .select(`
      *,
      calendar_permissions(permission)
    `)
    .eq('calendar_permissions.user_id', userId)
    .order('name')

  if (error) throw error

  // Add userPermission to each calendar
  return (data || []).map((cal) => ({
    ...cal,
    userPermission: cal.calendar_permissions?.[0]?.permission || 'read',
  }))
}

/**
 * Hook für Kalender-Liste mit TanStack Query
 */
export function useCalendarsQuery(userId) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: calendarKeys.list(userId),
    queryFn: () => fetchCalendars(userId),
    enabled: !!userId,
    staleTime: 60_000, // 1 Minute
  })

  // Realtime Subscription für Kalender-Updates
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('calendars_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendars' }, () => {
        queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_permissions' }, () => {
        queryClient.invalidateQueries({ queryKey: calendarKeys.lists() })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])

  return query
}

/**
 * Fetch calendar permissions
 */
async function fetchCalendarPermissions(calendarId) {
  const { data, error } = await supabase
    .from('calendar_permissions')
    .select('*, staff:user_id(first_name, last_name)')
    .eq('calendar_id', calendarId)

  if (error) throw error

  return (data || []).map((p) => ({
    ...p,
    staffName: p.staff ? `${p.staff.first_name} ${p.staff.last_name}` : 'Unbekannt',
  }))
}

/**
 * Hook für Kalender-Berechtigungen
 */
export function useCalendarPermissionsQuery(calendarId) {
  return useQuery({
    queryKey: calendarKeys.permissions(calendarId),
    queryFn: () => fetchCalendarPermissions(calendarId),
    enabled: !!calendarId,
    staleTime: 30_000,
  })
}
