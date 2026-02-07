import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function useCalendar({ session, activeView }) {
  // Kalender State
  const [calendars, setCalendars] = useState([])
  const [calendarsLoading, setCalendarsLoading] = useState(false)
  const [calendarsError, setCalendarsError] = useState('')
  const [selectedCalendarId, setSelectedCalendarId] = useState(null)
  const [calendarEvents, setCalendarEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [calendarViewDate, setCalendarViewDate] = useState(new Date())
  const [calendarViewMode, setCalendarViewMode] = useState('month')
  const [showWeekends, setShowWeekends] = useState(false)

  // Event Modal State
  const [editingEvent, setEditingEvent] = useState(null)
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    allDay: false,
    location: '',
  })
  const [eventSaving, setEventSaving] = useState(false)
  const [eventError, setEventError] = useState('')

  // Calendar Modal State
  const [editingCalendar, setEditingCalendar] = useState(null)
  const [calendarForm, setCalendarForm] = useState({
    name: '',
    description: '',
    color: '#10b981',
  })
  const [calendarSaving, setCalendarSaving] = useState(false)

  // Permissions State
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false)
  const [calendarPermissions, setCalendarPermissions] = useState([])
  const [permissionsLoading, setPermissionsLoading] = useState(false)

  // Dashboard Events
  const [dashboardEvents, setDashboardEvents] = useState([])
  const [dashboardEventsLoading, setDashboardEventsLoading] = useState(false)

  // Kalender laden
  const fetchCalendars = async () => {
    setCalendarsLoading(true)
    setCalendarsError('')
    const { data, error } = await supabase
      .from('calendars')
      .select(`
        *,
        calendar_permissions(permission)
      `)
      .eq('calendar_permissions.user_id', session?.user?.id)
      .order('name')

    if (error) {
      setCalendarsError(error.message)
      setCalendars([])
    } else {
      const calendarsWithPermission = (data || []).map((cal) => ({
        ...cal,
        userPermission: cal.calendar_permissions?.[0]?.permission || 'read',
      }))
      setCalendars(calendarsWithPermission)

      // Auto-select "all" wenn kein Kalender gewählt
      if (!selectedCalendarId && calendarsWithPermission.length > 0) {
        setSelectedCalendarId('all')
      }
    }
    setCalendarsLoading(false)
  }

  // View-Range berechnen
  const getCalendarViewRange = () => {
    const d = new Date(calendarViewDate)
    let startDate, endDate

    if (calendarViewMode === 'month') {
      // Für unendliches Scrollen: 12 Monate vor und nach dem aktuellen Datum laden
      startDate = new Date(d.getFullYear(), d.getMonth() - 12, 1)
      endDate = new Date(d.getFullYear(), d.getMonth() + 13, 0, 23, 59, 59)
    } else if (calendarViewMode === 'week') {
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

  // Events laden
  const fetchCalendarEvents = async (calendarId) => {
    if (!calendarId) return
    setEventsLoading(true)

    const { startDate, endDate } = getCalendarViewRange()
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
    if (error) {
      console.error('Events laden fehlgeschlagen:', error.message)
      setCalendarEvents([])
    } else {
      setCalendarEvents(data || [])
    }
    setEventsLoading(false)
  }

  // Berechtigungen laden
  const fetchCalendarPermissions = async (calendarId) => {
    setPermissionsLoading(true)
    const { data, error } = await supabase
      .from('calendar_permissions')
      .select('*, staff:user_id(first_name, last_name)')
      .eq('calendar_id', calendarId)

    if (!error && data) {
      const permissionsWithStaff = data.map((p) => ({
        ...p,
        staffName: p.staff ? `${p.staff.first_name} ${p.staff.last_name}` : 'Unbekannt',
      }))
      setCalendarPermissions(permissionsWithStaff)
    }
    setPermissionsLoading(false)
  }

  // Dashboard Events laden
  const fetchDashboardEvents = async () => {
    setDashboardEventsLoading(true)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Anfang des Tages, damit heutige Termine gefunden werden
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

    // Notdienst-Kalender-ID ermitteln
    const notdienstCalendar = calendarsList.find((c) => c.name === 'Notdienst')
    const notdienstCalendarId = notdienstCalendar?.id

    // 1. Events der nächsten 7 Tage (für Heute/Diese Woche)
    const { data: weekEventsData } = await supabase
      .from('calendar_events')
      .select('id, title, start_time, end_time, all_day, calendar_id, location')
      .gte('start_time', today.toISOString())
      .lte('start_time', endOfWeek.toISOString())
      .order('start_time')

    // 2. Nächste 5 Nicht-Notdienst-Termine (ohne Zeitlimit)
    let nextFiveQuery = supabase
      .from('calendar_events')
      .select('id, title, start_time, end_time, all_day, calendar_id, location')
      .gte('start_time', today.toISOString())
      .order('start_time')
      .limit(20) // Mehr holen, falls Notdienst-Events dabei sind

    if (notdienstCalendarId) {
      nextFiveQuery = nextFiveQuery.neq('calendar_id', notdienstCalendarId)
    }

    const { data: nextEventsData } = await nextFiveQuery

    // Events zusammenführen (Duplikate vermeiden)
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

    // Nach start_time sortieren
    enrichedEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

    setDashboardEvents(enrichedEvents)
    setDashboardEventsLoading(false)
  }

  // Kalender erstellen
  const createCalendar = async () => {
    if (!calendarForm.name.trim()) return
    setCalendarSaving(true)

    const { data, error } = await supabase
      .from('calendars')
      .insert({
        name: calendarForm.name.trim(),
        description: calendarForm.description.trim(),
        color: calendarForm.color,
        owner_id: session?.user?.id,
      })
      .select()
      .single()

    if (!error && data) {
      await supabase
        .from('calendar_permissions')
        .insert({
          calendar_id: data.id,
          user_id: session?.user?.id,
          permission: 'write',
        })
      await fetchCalendars()
      setEditingCalendar(null)
      setCalendarForm({ name: '', description: '', color: '#10b981' })
    }
    setCalendarSaving(false)
  }

  // Kalender aktualisieren
  const updateCalendar = async (calendarId) => {
    setCalendarSaving(true)

    const { error } = await supabase
      .from('calendars')
      .update({
        name: calendarForm.name.trim(),
        description: calendarForm.description.trim(),
        color: calendarForm.color,
      })
      .eq('id', calendarId)

    if (!error) {
      await fetchCalendars()
      setEditingCalendar(null)
    }
    setCalendarSaving(false)
  }

  // Event erstellen
  const createEvent = async () => {
    if (!eventForm.title.trim() || !selectedCalendarId || selectedCalendarId === 'all') return
    setEventSaving(true)
    setEventError('')

    const startTime = eventForm.allDay
      ? new Date(eventForm.startDate + 'T00:00:00')
      : new Date(eventForm.startDate + 'T' + eventForm.startTime)

    const endTime = eventForm.allDay
      ? new Date(eventForm.endDate + 'T23:59:59')
      : new Date(eventForm.endDate + 'T' + eventForm.endTime)

    const { error } = await supabase
      .from('calendar_events')
      .insert({
        calendar_id: selectedCalendarId,
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        all_day: eventForm.allDay,
        location: eventForm.location.trim(),
      })

    if (error) {
      setEventError(error.message)
    } else {
      await fetchCalendarEvents(selectedCalendarId)
      closeEventModal()
    }
    setEventSaving(false)
  }

  // Event aktualisieren
  const updateEvent = async (eventId) => {
    setEventSaving(true)
    setEventError('')

    const startTime = eventForm.allDay
      ? new Date(eventForm.startDate + 'T00:00:00')
      : new Date(eventForm.startDate + 'T' + eventForm.startTime)

    const endTime = eventForm.allDay
      ? new Date(eventForm.endDate + 'T23:59:59')
      : new Date(eventForm.endDate + 'T' + eventForm.endTime)

    const { error } = await supabase
      .from('calendar_events')
      .update({
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        all_day: eventForm.allDay,
        location: eventForm.location.trim(),
      })
      .eq('id', eventId)

    if (error) {
      setEventError(error.message)
    } else {
      await fetchCalendarEvents(selectedCalendarId)
      closeEventModal()
    }
    setEventSaving(false)
  }

  // Event löschen
  const deleteEvent = async (eventId) => {
    if (!confirm('Termin wirklich löschen?')) return

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)

    if (!error) {
      await fetchCalendarEvents(selectedCalendarId)
      closeEventModal()
    }
  }

  // Berechtigung hinzufügen
  const addCalendarPermission = async (calendarId, userId, permission) => {
    await supabase
      .from('calendar_permissions')
      .upsert(
        {
          calendar_id: calendarId,
          user_id: userId,
          permission,
        },
        { onConflict: 'calendar_id,user_id' },
      )

    await fetchCalendarPermissions(calendarId)
  }

  // Berechtigung entfernen
  const removeCalendarPermission = async (permissionId, calendarId) => {
    await supabase
      .from('calendar_permissions')
      .delete()
      .eq('id', permissionId)

    await fetchCalendarPermissions(calendarId)
  }

  // Event Modal öffnen
  const openEventModal = (event = null, clickedDate = null) => {
    const today = new Date()
    const dateStr = today.toISOString().substring(0, 10)
    const timeStr = today.toTimeString().substring(0, 5)

    if (event) {
      const startDate = event.start_time.substring(0, 10)
      const endDate = event.end_time.substring(0, 10)
      const start = new Date(event.start_time)
      const end = new Date(event.end_time)

      setEditingEvent(event)
      setEventForm({
        title: event.title,
        description: event.description || '',
        startDate,
        startTime: start.toTimeString().substring(0, 5),
        endDate,
        endTime: end.toTimeString().substring(0, 5),
        allDay: event.all_day,
        location: event.location || '',
      })
    } else {
      const selectedDate = clickedDate || dateStr
      setEditingEvent({ id: null })
      setEventForm({
        title: '',
        description: '',
        startDate: selectedDate,
        startTime: timeStr,
        endDate: selectedDate,
        endTime: timeStr,
        allDay: false,
        location: '',
      })
    }
    setEventError('')
  }

  // Event Modal schließen
  const closeEventModal = () => {
    setEditingEvent(null)
    setEventError('')
  }

  // Calendar Modal öffnen
  const openCalendarModal = (calendar = null) => {
    if (calendar) {
      setEditingCalendar(calendar)
      setCalendarForm({
        name: calendar.name,
        description: calendar.description || '',
        color: calendar.color || '#10b981',
      })
    } else {
      setEditingCalendar({ id: null })
      setCalendarForm({ name: '', description: '', color: '#10b981' })
    }
  }

  // Calendar Modal schließen
  const closeCalendarModal = () => {
    setEditingCalendar(null)
  }

  // Aktuelle Berechtigung prüfen
  const currentCalendarPermission = () => {
    if (!selectedCalendarId) return null
    if (selectedCalendarId === 'all') return null
    const cal = calendars.find((c) => c.id === selectedCalendarId)
    return cal?.userPermission || null
  }

  const canWriteCurrentCalendar = () => currentCalendarPermission() === 'write'

  // Event-Farbe basierend auf Kalender
  const getEventColor = (event) => {
    const cal = calendars.find((c) => c.id === event.calendar_id)
    return cal?.color || '#0D9488'
  }

  // useEffect: Dashboard Events laden
  useEffect(() => {
    if (session && activeView === 'dashboard') {
       
      fetchDashboardEvents()
    }
     
  }, [session, activeView])

  // useEffect: Kalender laden
  useEffect(() => {
    if (session && activeView === 'planung') {

      fetchCalendars()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, activeView])

  // useEffect: Events laden bei Kalender/Datum-Wechsel
  useEffect(() => {
    if (session && activeView === 'planung' && selectedCalendarId) {
       
      fetchCalendarEvents(selectedCalendarId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCalendarId, calendarViewDate, calendarViewMode])

  // useEffect: Realtime-Subscription für Events
  useEffect(() => {
    if (!session || activeView !== 'planung' || !selectedCalendarId) return

    const subscriptionConfig = selectedCalendarId === 'all'
      ? { event: '*', schema: 'public', table: 'calendar_events' }
      : { event: '*', schema: 'public', table: 'calendar_events', filter: `calendar_id=eq.${selectedCalendarId}` }

    const channel = supabase
      .channel(`calendar_events_${selectedCalendarId}`)
      .on('postgres_changes', subscriptionConfig, () => {
        fetchCalendarEvents(selectedCalendarId)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, session, selectedCalendarId])

  return {
    // State
    calendars,
    calendarsLoading,
    calendarsError,
    selectedCalendarId,
    setSelectedCalendarId,
    calendarEvents,
    eventsLoading,
    calendarViewDate,
    setCalendarViewDate,
    calendarViewMode,
    setCalendarViewMode,
    showWeekends,
    setShowWeekends,
    editingEvent,
    eventForm,
    setEventForm,
    eventSaving,
    eventError,
    editingCalendar,
    calendarForm,
    setCalendarForm,
    calendarSaving,
    permissionsModalOpen,
    setPermissionsModalOpen,
    calendarPermissions,
    permissionsLoading,
    dashboardEvents,
    dashboardEventsLoading,
    // Funktionen
    fetchCalendars,
    fetchCalendarEvents,
    fetchCalendarPermissions,
    fetchDashboardEvents,
    createCalendar,
    updateCalendar,
    createEvent,
    updateEvent,
    deleteEvent,
    addCalendarPermission,
    removeCalendarPermission,
    openEventModal,
    closeEventModal,
    openCalendarModal,
    closeCalendarModal,
    currentCalendarPermission,
    canWriteCurrentCalendar,
    getEventColor,
  }
}
