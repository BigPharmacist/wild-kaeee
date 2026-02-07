import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Hook für Dashboard-Events (Termine-Widget)
 * Extrahiert aus useCalendar - lädt nur die für das Dashboard relevanten Events
 */
export default function useDashboardEvents({ session }) {
  const [dashboardEvents, setDashboardEvents] = useState([])
  const [dashboardEventsLoading, setDashboardEventsLoading] = useState(false)

  const fetchDashboardEvents = useCallback(async () => {
    if (!session?.user?.id) return

    setDashboardEventsLoading(true)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(today)
    endOfWeek.setDate(today.getDate() + 7)
    endOfWeek.setHours(23, 59, 59, 999)

    const { data: calsData } = await supabase
      .from('calendars')
      .select('id, name, color')

    const calendarsList = calsData || []
    if (calendarsList.length === 0) {
      setDashboardEvents([])
      setDashboardEventsLoading(false)
      return
    }

    const notdienstCalendar = calendarsList.find((c) => c.name === 'Notdienst')
    const notdienstCalendarId = notdienstCalendar?.id

    const { data: weekEventsData } = await supabase
      .from('calendar_events')
      .select('id, title, start_time, end_time, all_day, calendar_id, location')
      .gte('start_time', today.toISOString())
      .lte('start_time', endOfWeek.toISOString())
      .order('start_time')

    let nextFiveQuery = supabase
      .from('calendar_events')
      .select('id, title, start_time, end_time, all_day, calendar_id, location')
      .gte('start_time', today.toISOString())
      .order('start_time')
      .limit(20)

    if (notdienstCalendarId) {
      nextFiveQuery = nextFiveQuery.neq('calendar_id', notdienstCalendarId)
    }

    const { data: nextEventsData } = await nextFiveQuery

    const weekEvents = weekEventsData || []
    const nextEvents = nextEventsData || []
    const allEventIds = new Set(weekEvents.map((e) => e.id))
    const uniqueNextEvents = nextEvents.filter((e) => !allEventIds.has(e.id))
    const combinedEvents = [...weekEvents, ...uniqueNextEvents]

    const enrichedEvents = combinedEvents.map((event) => {
      const cal = calendarsList.find((c) => c.id === event.calendar_id)
      return {
        ...event,
        calendarName: cal?.name || '',
        calendarColor: cal?.color || '#0D9488',
      }
    })

    enrichedEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

    setDashboardEvents(enrichedEvents)
    setDashboardEventsLoading(false)
  }, [session?.user?.id])

  useEffect(() => {
    fetchDashboardEvents()
  }, [fetchDashboardEvents])

  return {
    dashboardEvents,
    dashboardEventsLoading,
    fetchDashboardEvents,
  }
}
