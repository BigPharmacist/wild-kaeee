import { useState, useEffect, useCallback } from 'react'
import { useTheme, useStaff, useAuth } from '../../context'
import { useCalendarsQuery, useCalendarEventsQuery, useCalendarPermissionsQuery, useCreateEvent, useUpdateEvent, useDeleteEvent, useCreateCalendar, useUpdateCalendar, useAddCalendarPermission, useRemoveCalendarPermission } from './api'
import { useCalendarView, useEventForm, useCalendarForm } from './hooks'
import { supabase, supabaseUrl } from '../../lib/supabase'
import CalendarView from './CalendarView'
import { Icons } from '../../shared/ui'
import { lazyWithRetry } from '../../lib/lazyWithRetry'

const EventModal = lazyWithRetry(() => import('./modals/EventModal'))
const CalendarModal = lazyWithRetry(() => import('./modals/CalendarModal'))
const PermissionsModal = lazyWithRetry(() => import('./modals/PermissionsModal'))
const FaxPdfPopup = lazyWithRetry(() => import('../fax/modals/FaxPdfPopup'))

/**
 * CalendarPage - Self-sufficient calendar page with modals
 */
export default function CalendarPage() {
  const { theme } = useTheme()
  const { currentStaff, staff } = useStaff()
  const { session } = useAuth()

  // View state
  const {
    selectedCalendarId,
    setSelectedCalendarId,
    viewDate,
    setViewDate,
    viewMode,
    setViewMode,
    showWeekends,
    setShowWeekends,
    initializeSelection,
  } = useCalendarView()

  // TanStack Query hooks
  const {
    data: calendars = [],
    isLoading: calendarsLoading,
    error: calendarsQueryError,
  } = useCalendarsQuery(session?.user?.id)

  const {
    data: calendarEvents = [],
    isLoading: eventsLoading,
  } = useCalendarEventsQuery({
    calendarId: selectedCalendarId,
    viewDate,
    viewMode,
  })

  // Event form state
  const {
    editingEvent,
    eventForm,
    eventError,
    setEventForm,
    setEventError,
    openEventModal,
    closeEventModal,
  } = useEventForm()

  // Calendar form state
  const {
    editingCalendar,
    calendarForm,
    setCalendarForm,
    openCalendarModal,
    closeCalendarModal,
  } = useCalendarForm()

  // Permissions modal state
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false)

  // FaxPdfPopup state
  const [faxPdfPopup, setFaxPdfPopup] = useState(null)

  // Mutation saving state
  const [eventSaving, setEventSaving] = useState(false)
  const [calendarSaving, setCalendarSaving] = useState(false)

  // TanStack Query mutations
  const createEventMutation = useCreateEvent()
  const updateEventMutation = useUpdateEvent()
  const deleteEventMutation = useDeleteEvent()
  const createCalendarMutation = useCreateCalendar()
  const updateCalendarMutation = useUpdateCalendar()
  const addPermissionMutation = useAddCalendarPermission()
  const removePermissionMutation = useRemoveCalendarPermission()

  // Permissions query
  const {
    data: calendarPermissions = [],
    isLoading: permissionsLoading,
  } = useCalendarPermissionsQuery(permissionsModalOpen ? selectedCalendarId : null)

  // Auto-select when calendars load
  useEffect(() => {
    initializeSelection(calendars)
  }, [calendars, initializeSelection])

  // Get current calendar's user permission
  const canWriteCurrentCalendar = useCallback(() => {
    if (!selectedCalendarId || selectedCalendarId === 'all') return false
    const cal = calendars.find((c) => c.id === selectedCalendarId)
    return cal?.userPermission === 'write'
  }, [selectedCalendarId, calendars])

  // Get event color based on calendar
  const getEventColor = useCallback((event) => {
    const cal = calendars.find((c) => c.id === event.calendar_id)
    return cal?.color || '#0D9488'
  }, [calendars])

  // Fetch permissions for a calendar (triggers query by opening modal)
  const fetchCalendarPermissions = useCallback(() => {
    // Handled by useCalendarPermissionsQuery when permissionsModalOpen is true
  }, [])

  // Create event
  const createEvent = useCallback(async () => {
    if (!eventForm.title.trim() || !selectedCalendarId || selectedCalendarId === 'all') return
    setEventSaving(true)
    setEventError('')

    try {
      await createEventMutation.mutateAsync({ calendarId: selectedCalendarId, form: eventForm })
      closeEventModal()
    } catch (err) {
      setEventError(err.message)
    } finally {
      setEventSaving(false)
    }
  }, [eventForm, selectedCalendarId, createEventMutation, closeEventModal, setEventError])

  // Update event
  const updateEvent = useCallback(async (eventId) => {
    setEventSaving(true)
    setEventError('')

    try {
      await updateEventMutation.mutateAsync({ eventId, form: eventForm })
      closeEventModal()
    } catch (err) {
      setEventError(err.message)
    } finally {
      setEventSaving(false)
    }
  }, [eventForm, updateEventMutation, closeEventModal, setEventError])

  // Delete event
  const deleteEvent = useCallback(async (eventId) => {
    if (!confirm('Termin wirklich löschen?')) return

    try {
      await deleteEventMutation.mutateAsync(eventId)
      closeEventModal()
    } catch (err) {
      console.error('Event löschen fehlgeschlagen:', err)
    }
  }, [deleteEventMutation, closeEventModal])

  // Create calendar
  const createCalendar = useCallback(async () => {
    if (!calendarForm.name.trim()) return
    setCalendarSaving(true)

    try {
      await createCalendarMutation.mutateAsync({
        name: calendarForm.name,
        description: calendarForm.description,
        color: calendarForm.color,
        ownerId: session?.user?.id,
      })
      closeCalendarModal()
    } catch (err) {
      console.error('Kalender erstellen fehlgeschlagen:', err)
    } finally {
      setCalendarSaving(false)
    }
  }, [calendarForm, session?.user?.id, createCalendarMutation, closeCalendarModal])

  // Update calendar
  const updateCalendar = useCallback(async (calendarId) => {
    setCalendarSaving(true)

    try {
      await updateCalendarMutation.mutateAsync({
        calendarId,
        name: calendarForm.name,
        description: calendarForm.description,
        color: calendarForm.color,
      })
      closeCalendarModal()
    } catch (err) {
      console.error('Kalender aktualisieren fehlgeschlagen:', err)
    } finally {
      setCalendarSaving(false)
    }
  }, [calendarForm, updateCalendarMutation, closeCalendarModal])

  // Add calendar permission
  const addCalendarPermission = useCallback(async (calendarId, userId, permission) => {
    try {
      await addPermissionMutation.mutateAsync({ calendarId, userId, permission })
    } catch (err) {
      console.error('Berechtigung hinzufügen fehlgeschlagen:', err)
    }
  }, [addPermissionMutation])

  // Remove calendar permission
  const removeCalendarPermission = useCallback(async (permissionId, calendarId) => {
    try {
      await removePermissionMutation.mutateAsync({ permissionId, calendarId })
    } catch (err) {
      console.error('Berechtigung entfernen fehlgeschlagen:', err)
    }
  }, [removePermissionMutation])

  // Fax-PDF Popup öffnen
  const openFaxPdfPopup = useCallback(async (faxId) => {
    try {
      const { data: fax, error } = await supabase
        .from('faxe')
        .select('id, absender, storage_url, storage_path')
        .eq('id', faxId)
        .single()

      if (error || !fax) {
        console.error('Fax nicht gefunden:', error)
        return
      }

      let pdfUrl = null
      if (fax.storage_url) {
        const match = fax.storage_url.match(/\/storage\/v1\/object\/public\/(.+)$/)
        if (match) {
          pdfUrl = `${supabaseUrl}/storage/v1/object/public/${match[1]}`
        }
      }
      if (!pdfUrl && fax.storage_path) {
        pdfUrl = `${supabaseUrl}/storage/v1/object/public/${fax.storage_path}`
      }

      if (pdfUrl) {
        setFaxPdfPopup({ id: fax.id, pdfUrl, absender: fax.absender })
      }
    } catch (err) {
      console.error('Fehler beim Laden des Fax:', err)
    }
  }, [])

  // Error message
  const calendarsError = calendarsQueryError?.message || ''

  return (
    <>
      <div className="max-w-5xl">
        <CalendarView
          theme={theme}
          calendars={calendars}
          selectedCalendarId={selectedCalendarId}
          setSelectedCalendarId={setSelectedCalendarId}
          calendarViewMode={viewMode}
          setCalendarViewMode={setViewMode}
          calendarViewDate={viewDate}
          setCalendarViewDate={setViewDate}
          Icons={Icons}
          currentStaff={currentStaff}
          openCalendarModal={openCalendarModal}
          setPermissionsModalOpen={setPermissionsModalOpen}
          fetchCalendarPermissions={fetchCalendarPermissions}
          calendarsLoading={calendarsLoading}
          eventsLoading={eventsLoading}
          calendarsError={calendarsError}
          calendarEvents={calendarEvents}
          showWeekends={showWeekends}
          setShowWeekends={setShowWeekends}
          canWriteCurrentCalendar={canWriteCurrentCalendar}
          openEventModal={openEventModal}
          getEventColor={getEventColor}
        />
      </div>

      <EventModal
        theme={theme}
        Icons={Icons}
        editingEvent={editingEvent}
        eventForm={eventForm}
        setEventForm={setEventForm}
        eventSaving={eventSaving}
        eventError={eventError}
        canWriteCurrentCalendar={canWriteCurrentCalendar}
        onClose={closeEventModal}
        onCreate={createEvent}
        onUpdate={updateEvent}
        onDelete={deleteEvent}
        onOpenFaxPdfPopup={openFaxPdfPopup}
      />

      <CalendarModal
        theme={theme}
        Icons={Icons}
        editingCalendar={editingCalendar}
        calendarForm={calendarForm}
        setCalendarForm={setCalendarForm}
        calendarSaving={calendarSaving}
        onClose={closeCalendarModal}
        onCreate={createCalendar}
        onUpdate={updateCalendar}
      />

      <PermissionsModal
        theme={theme}
        Icons={Icons}
        permissionsModalOpen={permissionsModalOpen}
        setPermissionsModalOpen={setPermissionsModalOpen}
        calendarPermissions={calendarPermissions}
        permissionsLoading={permissionsLoading}
        staff={staff}
        selectedCalendarId={selectedCalendarId}
        onAddPermission={addCalendarPermission}
        onRemovePermission={removeCalendarPermission}
      />

      <FaxPdfPopup
        theme={theme}
        Icons={Icons}
        faxPdfPopup={faxPdfPopup}
        setFaxPdfPopup={setFaxPdfPopup}
      />
    </>
  )
}
