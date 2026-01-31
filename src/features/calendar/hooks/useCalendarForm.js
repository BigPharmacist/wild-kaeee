import { useState, useCallback } from 'react'

const initialCalendarForm = {
  name: '',
  description: '',
  color: '#10b981',
}

/**
 * Hook für Kalender-Form-State
 */
export function useCalendarForm() {
  const [editingCalendar, setEditingCalendar] = useState(null)
  const [calendarForm, setCalendarForm] = useState(initialCalendarForm)

  // Calendar Modal öffnen
  const openCalendarModal = useCallback((calendar = null) => {
    if (calendar?.id) {
      setEditingCalendar(calendar)
      setCalendarForm({
        name: calendar.name,
        description: calendar.description || '',
        color: calendar.color || '#10b981',
      })
    } else {
      setEditingCalendar({ id: null })
      setCalendarForm(initialCalendarForm)
    }
  }, [])

  // Calendar Modal schließen
  const closeCalendarModal = useCallback(() => {
    setEditingCalendar(null)
  }, [])

  // Form input handler
  const handleCalendarInput = useCallback((field, value) => {
    setCalendarForm(prev => ({ ...prev, [field]: value }))
  }, [])

  // Reset form
  const resetCalendarForm = useCallback(() => {
    setCalendarForm(initialCalendarForm)
  }, [])

  return {
    editingCalendar,
    calendarForm,
    setCalendarForm,
    openCalendarModal,
    closeCalendarModal,
    handleCalendarInput,
    resetCalendarForm,
    isNewCalendar: !editingCalendar?.id,
    isModalOpen: editingCalendar !== null,
  }
}
