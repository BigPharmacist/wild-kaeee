import { useState, useCallback } from 'react'

/**
 * Hook für Kalender-Ansichts-State
 */
export function useCalendarView() {
  const [selectedCalendarId, setSelectedCalendarId] = useState(null)
  const [viewDate, setViewDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month') // 'month' | 'week' | 'day'
  const [showWeekends, setShowWeekends] = useState(false)

  // Auto-select "all" wenn Kalender geladen werden
  const initializeSelection = useCallback((calendars) => {
    if (!selectedCalendarId && calendars?.length > 0) {
      setSelectedCalendarId('all')
    }
  }, [selectedCalendarId])

  // Navigation helpers
  const goToToday = useCallback(() => {
    setViewDate(new Date())
  }, [])

  const goToPrevious = useCallback(() => {
    setViewDate(prev => {
      const d = new Date(prev)
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() - 1)
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() - 7)
      } else {
        d.setDate(d.getDate() - 1)
      }
      return d
    })
  }, [viewMode])

  const goToNext = useCallback(() => {
    setViewDate(prev => {
      const d = new Date(prev)
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() + 1)
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() + 7)
      } else {
        d.setDate(d.getDate() + 1)
      }
      return d
    })
  }, [viewMode])

  return {
    selectedCalendarId,
    setSelectedCalendarId,
    viewDate,
    setViewDate,
    viewMode,
    setViewMode,
    showWeekends,
    setShowWeekends,
    initializeSelection,
    goToToday,
    goToPrevious,
    goToNext,
  }
}
