import { useState, useCallback } from 'react'

const initialEventForm = {
  title: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  allDay: false,
  location: '',
}

/**
 * Hook für Event-Form-State
 */
export function useEventForm() {
  const [editingEvent, setEditingEvent] = useState(null)
  const [eventForm, setEventForm] = useState(initialEventForm)
  const [eventError, setEventError] = useState('')

  // Event Modal öffnen
  const openEventModal = useCallback((event = null, clickedDate = null) => {
    const today = new Date()
    const dateStr = today.toISOString().substring(0, 10)
    const timeStr = today.toTimeString().substring(0, 5)

    if (event?.id) {
      // Editing existing event
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
      // Creating new event
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
  }, [])

  // Event Modal schließen
  const closeEventModal = useCallback(() => {
    setEditingEvent(null)
    setEventError('')
  }, [])

  // Form input handler
  const handleEventInput = useCallback((field, value) => {
    setEventForm(prev => ({ ...prev, [field]: value }))
  }, [])

  // Validate form
  const validateEventForm = useCallback(() => {
    if (!eventForm.title.trim()) {
      setEventError('Titel erforderlich')
      return false
    }
    if (!eventForm.startDate) {
      setEventError('Startdatum erforderlich')
      return false
    }
    if (!eventForm.endDate) {
      setEventError('Enddatum erforderlich')
      return false
    }
    return true
  }, [eventForm])

  return {
    editingEvent,
    eventForm,
    eventError,
    setEventForm,
    setEventError,
    openEventModal,
    closeEventModal,
    handleEventInput,
    validateEventForm,
    isNewEvent: !editingEvent?.id,
    isModalOpen: editingEvent !== null,
  }
}
