import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { eventKeys } from './queries'

/**
 * Calculate view range based on date and mode
 */
export function getCalendarViewRange(viewDate, viewMode) {
  const d = new Date(viewDate)
  let startDate, endDate

  if (viewMode === 'month') {
    // Für unendliches Scrollen: 12 Monate vor und nach dem aktuellen Datum laden
    startDate = new Date(d.getFullYear(), d.getMonth() - 12, 1)
    endDate = new Date(d.getFullYear(), d.getMonth() + 13, 0, 23, 59, 59)
  } else if (viewMode === 'week') {
    const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1
    startDate = new Date(d)
    startDate.setDate(d.getDate() - dayOfWeek)
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    endDate.setHours(23, 59, 59, 999)
  } else {
    startDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
    endDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  }
}

/**
 * Fetch calendar events
 */
async function fetchCalendarEvents({ calendarId, viewDate, viewMode }) {
  const { startDate, endDate } = getCalendarViewRange(viewDate, viewMode)

  let query = supabase
    .from('calendar_events')
    .select('*')
    .gte('start_time', startDate)
    .lte('start_time', endDate)
    .order('start_time')

  if (calendarId !== 'all') {
    query = query.eq('calendar_id', calendarId)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * Hook für Kalender-Events mit TanStack Query
 */
export function useCalendarEventsQuery({ calendarId, viewDate, viewMode }) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: eventKeys.list({ calendarId, viewDate: viewDate?.toISOString(), viewMode }),
    queryFn: () => fetchCalendarEvents({ calendarId, viewDate, viewMode }),
    enabled: !!calendarId,
    staleTime: 30_000,
  })

  // Realtime Subscription für Event-Updates
  useEffect(() => {
    if (!calendarId) return

    const subscriptionConfig = calendarId === 'all'
      ? { event: '*', schema: 'public', table: 'calendar_events' }
      : { event: '*', schema: 'public', table: 'calendar_events', filter: `calendar_id=eq.${calendarId}` }

    const channel = supabase
      .channel(`calendar_events_${calendarId}`)
      .on('postgres_changes', subscriptionConfig, () => {
        queryClient.invalidateQueries({ queryKey: eventKeys.lists() })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [calendarId, queryClient])

  return query
}

/**
 * Fetch dashboard events (next 7 days)
 */
async function fetchDashboardEvents() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(today)
  endOfWeek.setDate(today.getDate() + 7)
  endOfWeek.setHours(23, 59, 59, 999)

  // First get calendars for colors
  const { data: calsData } = await supabase
    .from('calendars')
    .select('id, name, color')

  const calendarsList = calsData || []
  if (calendarsList.length === 0) {
    return []
  }

  const { data: eventsData, error } = await supabase
    .from('calendar_events')
    .select('id, title, start_time, end_time, all_day, calendar_id, location')
    .gte('start_time', today.toISOString())
    .lte('start_time', endOfWeek.toISOString())
    .order('start_time')

  if (error) throw error

  // Enrich events with calendar info
  return (eventsData || []).map((event) => {
    const cal = calendarsList.find((c) => c.id === event.calendar_id)
    return {
      ...event,
      calendarName: cal?.name || '',
      calendarColor: cal?.color || '#0D9488',
    }
  })
}

/**
 * Hook für Dashboard-Events
 */
export function useDashboardEventsQuery(enabled = true) {
  return useQuery({
    queryKey: eventKeys.dashboard(),
    queryFn: fetchDashboardEvents,
    enabled,
    staleTime: 60_000,
  })
}
