import { useState, useEffect } from 'react'
import { useTheme, useStaff, useAuth } from '../../context'
import { useCalendarsQuery, useCalendarEventsQuery } from './api'
import { useCalendarView, useEventForm, useCalendarForm } from './hooks'
import CalendarView from './CalendarView'
import { Icons } from '../../shared/ui'

/**
 * CalendarPage - Wrapper-Komponente die TanStack Query Hooks verwendet
 */
export default function CalendarPage() {
  const { theme } = useTheme()
  const { currentStaff } = useStaff()
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
  const { openEventModal } = useEventForm()

  // Calendar form state
  const { openCalendarModal } = useCalendarForm()

  // Permissions modal state (permissionsModalOpen used by parent for modal rendering)
  const [_permissionsModalOpen, setPermissionsModalOpen] = useState(false)

  // Auto-select when calendars load
  useEffect(() => {
    initializeSelection(calendars)
  }, [calendars, initializeSelection])

  // Get current calendar's user permission
  const canWriteCurrentCalendar = () => {
    if (!selectedCalendarId || selectedCalendarId === 'all') return false
    const cal = calendars.find((c) => c.id === selectedCalendarId)
    return cal?.userPermission === 'write'
  }

  // Get event color based on calendar
  const getEventColor = (event) => {
    const cal = calendars.find((c) => c.id === event.calendar_id)
    return cal?.color || '#0D9488'
  }

  // Fetch permissions for a calendar (placeholder - handled by query)
  const fetchCalendarPermissions = () => {
    // Handled automatically by useCalendarPermissionsQuery when needed
  }

  // Error message
  const calendarsError = calendarsQueryError?.message || ''

  return (
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
  )
}
