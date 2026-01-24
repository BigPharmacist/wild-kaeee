import { useState, useEffect, useRef, useCallback, memo } from 'react'

// Helper: Generate weeks for a given month
const generateMonthWeeks = (year, month, todayStr, calendarEvents) => {
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startOffset)

  const weeks = []
  const currentDate = new Date(startDate)

  for (let w = 0; w < 6; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const dayDate = new Date(currentDate)
      const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`
      const isCurrentMonth = dayDate.getMonth() === month
      const isToday = dateStr === todayStr
      const isWeekend = d >= 5

      const dayEvents = calendarEvents.filter((e) => {
        const eventDate = e.start_time.substring(0, 10)
        return eventDate === dateStr
      })

      week.push({ date: dayDate, dateStr, isCurrentMonth, isToday, events: dayEvents, isWeekend })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weeks.push(week)
  }

  return weeks
}

// Single Month Component
const MonthGrid = ({
  year,
  month,
  todayStr,
  calendarEvents,
  showWeekends,
  theme,
  canWriteCurrentCalendar,
  openEventModal,
  getEventColor,
  monthRef,
  isCurrentMonth,
}) => {
  const weeks = generateMonthWeeks(year, month, todayStr, calendarEvents)
  const weekDays = showWeekends ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] : ['Mo', 'Di', 'Mi', 'Do', 'Fr']
  const gridCols = showWeekends ? 'grid-cols-7' : 'grid-cols-5'
  const monthName = new Date(year, month, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  return (
    <div ref={monthRef} className="mb-8" data-month={`${year}-${month}`}>
      <div className={`sticky top-0 z-10 py-2 mb-2 ${theme.panel} border-b ${theme.border}`}>
        <h3 className={`text-lg font-semibold ${theme.text} ${isCurrentMonth ? theme.accentText : ''}`}>
          {monthName}
        </h3>
      </div>

      <div className={`grid ${gridCols} gap-1 mb-2`}>
        {weekDays.map((day, idx) => (
          <div
            key={day}
            className={`text-xs font-medium text-center py-2 ${showWeekends && idx >= 5 ? theme.textMuted : theme.textSecondary}`}
          >
            {day}
          </div>
        ))}
      </div>

      {weeks.map((week, wIdx) => (
        <div key={wIdx} className={`grid ${gridCols} gap-1`}>
          {week.filter((day) => showWeekends || !day.isWeekend).map((day) => (
            <div
              key={day.dateStr}
              onClick={() => canWriteCurrentCalendar() && openEventModal(null, day.date)}
              className={`
                min-h-24 p-1 rounded-lg border transition-colors
                ${day.isCurrentMonth ? theme.panel : `${theme.panel} opacity-40`}
                ${day.isToday ? 'border-[#1E293B] border-2 bg-[#334155] ring-4 ring-[#1E293B]/30 shadow-lg shadow-[#1E293B]/25' : theme.border}
                ${canWriteCurrentCalendar ? 'cursor-pointer ' + (day.isToday ? 'hover:bg-[#475569]' : theme.bgHover) : ''}
              `}
            >
              <div
                className={`text-xs font-medium mb-1 ${
                  day.isToday ? 'text-white' : day.isCurrentMonth ? theme.text : theme.textMuted
                }`}
              >
                {day.date.getDate()}
              </div>

              <div className="space-y-0.5">
                {day.events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      openEventModal(event)
                    }}
                    className="text-[10px] px-1.5 py-0.5 rounded truncate text-white cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: getEventColor(event) }}
                    title={event.title}
                  >
                    {!event.all_day && (
                      <span className="opacity-75 mr-1">
                        {new Date(event.start_time).toLocaleTimeString('de-DE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                    {event.title}
                  </div>
                ))}
                {day.events.length > 3 && (
                  <div className={`text-[10px] ${theme.textMuted}`}>+{day.events.length - 3} weitere</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const CalendarView = memo(function CalendarView({
  theme,
  calendars,
  selectedCalendarId,
  setSelectedCalendarId,
  calendarViewMode,
  setCalendarViewMode,
  calendarViewDate,
  setCalendarViewDate,
  Icons, // eslint-disable-line no-unused-vars -- used as Icons.X etc
  currentStaff,
  openCalendarModal,
  setPermissionsModalOpen,
  fetchCalendarPermissions,
  calendarsLoading,
  eventsLoading,
  calendarsError,
  calendarEvents,
  showWeekends,
  setShowWeekends,
  canWriteCurrentCalendar,
  openEventModal,
  getEventColor,
}) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // For infinite scroll: offset range from current month
  const [monthRange, setMonthRange] = useState({ start: -2, end: 3 })
  const monthRangeRef = useRef(monthRange)
  const scrollContainerRef = useRef(null)
  const currentMonthRef = useRef(null)
  const topSentinelRef = useRef(null)
  const bottomSentinelRef = useRef(null)
  const hasScrolledToToday = useRef(false)
  const topTriggeredRef = useRef(false)
  const bottomTriggeredRef = useRef(false)
  const scrollParentRef = useRef(null)
  const loadCooldownRef = useRef(0)
  const prevScrollHeightRef = useRef(0) // Für Scroll-Kompensation beim Laden nach oben
  const isLoadingTopRef = useRef(false) // Flag für Scroll-Kompensation

  // Sync monthRange to ref for access in scroll handler
  useEffect(() => {
    monthRangeRef.current = monthRange
  }, [monthRange])

  // Generate list of months to render
  const getMonthsToRender = useCallback(() => {
    const months = []
    for (let offset = monthRange.start; offset <= monthRange.end; offset++) {
      const d = new Date(today.getFullYear(), today.getMonth() + offset, 1)
      months.push({ year: d.getFullYear(), month: d.getMonth(), offset })
    }
    return months
  }, [monthRange.start, monthRange.end]) // eslint-disable-line react-hooks/exhaustive-deps -- today is stable within session

  // Scroll to current month on initial load
  useEffect(() => {
    if (calendarViewMode === 'month' && currentMonthRef.current && !hasScrolledToToday.current) {
      setTimeout(() => {
        currentMonthRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' })
        hasScrolledToToday.current = true
      }, 100)
    }
  }, [calendarViewMode, calendarsLoading, eventsLoading])

  // Scroll-based infinite loading
  useEffect(() => {
    if (calendarViewMode !== 'month') return
    if (!scrollContainerRef.current) return

    // Der scrollContainerRef ist jetzt selbst der scrollbare Container
    const scrollContainer = scrollContainerRef.current
    scrollParentRef.current = scrollContainer

    const canLoad = () => {
      const now = Date.now()
      if (now - loadCooldownRef.current < 200) return false
      loadCooldownRef.current = now
      return true
    }

    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer

        // Laden am unteren Ende
        if (scrollTop + clientHeight >= scrollHeight - 800 && canLoad()) {
          setMonthRange((prev) => ({ ...prev, end: prev.end + 3 }))
        }

        // Laden am oberen Ende mit Scroll-Kompensation
        if (scrollTop <= 800 && canLoad()) {
          prevScrollHeightRef.current = scrollHeight
          isLoadingTopRef.current = true
          setMonthRange((prev) => ({ ...prev, start: prev.start - 3 }))
        }

        ticking = false
      })
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [calendarViewMode, calendarsLoading, eventsLoading])

  // Scroll-Position kompensieren nach dem Laden von Monaten am Anfang
  useEffect(() => {
    if (!isLoadingTopRef.current) return
    if (!scrollParentRef.current) return

    // Warte einen Frame, damit React die neuen Monate gerendert hat
    requestAnimationFrame(() => {
      const scrollContainer = scrollParentRef.current
      if (!scrollContainer) return

      const heightDiff = scrollContainer.scrollHeight - prevScrollHeightRef.current

      if (heightDiff > 0) {
        scrollContainer.scrollTop += heightDiff
      }

      isLoadingTopRef.current = false
      prevScrollHeightRef.current = 0
    })
  }, [monthRange.start])

  // Scroll to today handler
  const scrollToToday = () => {
    if (calendarViewMode === 'month') {
      // Reset range to include current month
      setMonthRange({ start: -2, end: 3 })
      setTimeout(() => {
        currentMonthRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    } else {
      setCalendarViewDate(new Date())
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Kalender</h2>

          {calendars.length > 0 && (
            <select
              value={selectedCalendarId || ''}
              onChange={(e) => setSelectedCalendarId(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${theme.input} ${theme.text} text-sm`}
            >
              <option value="all">Alle Kalender</option>
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex rounded-lg border ${theme.border} overflow-hidden`}>
            {['month', 'week', 'day'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setCalendarViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  calendarViewMode === mode
                    ? 'bg-[#F59E0B] text-white'
                    : `${theme.panel} ${theme.textMuted} ${theme.bgHover}`
                }`}
              >
                {mode === 'month' ? 'Monat' : mode === 'week' ? 'Woche' : 'Tag'}
              </button>
            ))}
          </div>

          {calendarViewMode !== 'month' && (
            <>
              <button
                type="button"
                onClick={() => {
                  const d = new Date(calendarViewDate)
                  if (calendarViewMode === 'week') d.setDate(d.getDate() - 7)
                  else d.setDate(d.getDate() - 1)
                  setCalendarViewDate(d)
                }}
                className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                title="Zurück"
              >
                <Icons.ChevronLeft />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={scrollToToday}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${theme.bgHover} ${theme.textMuted}`}
          >
            Heute
          </button>

          {calendarViewMode !== 'month' && (
            <button
              type="button"
              onClick={() => {
                const d = new Date(calendarViewDate)
                if (calendarViewMode === 'week') d.setDate(d.getDate() + 7)
                else d.setDate(d.getDate() + 1)
                setCalendarViewDate(d)
              }}
              className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
              title="Vor"
            >
              <Icons.ChevronRight />
            </button>
          )}

          {currentStaff?.is_admin && (
            <>
              <button
                type="button"
                onClick={() => openCalendarModal()}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${theme.accent} text-white`}
              >
                + Kalender
              </button>
              {selectedCalendarId && selectedCalendarId !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setPermissionsModalOpen(true)
                    fetchCalendarPermissions(selectedCalendarId)
                  }}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                  title="Berechtigungen verwalten"
                >
                  <Icons.Settings />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {calendarViewMode !== 'month' && (
        <div className="mb-4">
          <h3 className={`text-lg font-medium ${theme.text}`}>
            {calendarViewDate.toLocaleDateString('de-DE', {
              month: 'long',
              year: 'numeric',
              ...(calendarViewMode === 'day' && { day: 'numeric', weekday: 'long' }),
            })}
          </h3>
        </div>
      )}

      {calendarsLoading || eventsLoading ? (
        <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
          <p className={theme.textMuted}>{calendarsLoading ? 'Kalender werden geladen...' : 'Termine werden geladen...'}</p>
        </div>
      ) : calendarsError ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <p className="text-rose-400 text-sm">{calendarsError}</p>
        </div>
      ) : calendars.length === 0 ? (
        <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
          <p className={theme.textMuted}>
            Keine Kalender verfügbar.
            {currentStaff?.is_admin && ' Erstelle einen neuen Kalender.'}
          </p>
        </div>
      ) : (
        <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow}`}>
          {calendarViewMode === 'month' && (
            <div ref={scrollContainerRef} className="relative h-[calc(100vh-220px)] overflow-auto p-4">
              <button
                type="button"
                onClick={() => setShowWeekends(!showWeekends)}
                className={`absolute right-0 top-0 z-20 p-1.5 rounded-lg ${theme.bgHover} ${theme.textMuted} ${theme.panel}`}
                title={showWeekends ? 'Wochenende ausblenden' : 'Wochenende einblenden'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {showWeekends ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  )}
                </svg>
              </button>

              {/* Top sentinel for loading previous months */}
              <div ref={topSentinelRef} className="h-1" />

              {getMonthsToRender().map(({ year, month, offset }) => (
                <MonthGrid
                  key={`${year}-${month}`}
                  year={year}
                  month={month}
                  todayStr={todayStr}
                  calendarEvents={calendarEvents}
                  showWeekends={showWeekends}
                  theme={theme}
                  canWriteCurrentCalendar={canWriteCurrentCalendar}
                  openEventModal={openEventModal}
                  getEventColor={getEventColor}
                  monthRef={offset === 0 ? currentMonthRef : null}
                  isCurrentMonth={offset === 0}
                />
              ))}

              {/* Bottom sentinel for loading future months */}
              <div ref={bottomSentinelRef} className="h-1" />
            </div>
          )}

          {calendarViewMode === 'week' && (() => {
            const startOfWeek = new Date(calendarViewDate)
            startOfWeek.setDate(calendarViewDate.getDate() - ((calendarViewDate.getDay() + 6) % 7))

            const days = []
            for (let i = 0; i < 7; i++) {
              const d = new Date(startOfWeek)
              d.setDate(startOfWeek.getDate() + i)
              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
              const dayEvents = calendarEvents.filter((e) => e.start_time.substring(0, 10) === dateStr)
              days.push({ date: d, dateStr, isToday: dateStr === todayStr, events: dayEvents })
            }

            const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr']
            const weekendDays = ['Sa', 'So']
            const workDays = days.slice(0, 5)
            const weekend = days.slice(5, 7)
            const weekendEvents = [...weekend[0].events, ...weekend[1].events]

            return (
              <div className="space-y-3">
                {weekendEvents.length > 0 && (
                  <div className={`p-3 rounded-xl border ${theme.border} ${theme.panel}`}>
                    <div className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>
                      Wochenende ({weekend[0].date.getDate()}.–{weekend[1].date.getDate()}.)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {weekend.map((day, idx) => (
                        day.events.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => openEventModal(event)}
                            className="text-[11px] px-2 py-1 rounded-lg text-white cursor-pointer hover:opacity-80 flex items-center gap-1.5"
                            style={{ backgroundColor: getEventColor(event) }}
                          >
                            <span className="opacity-75 font-medium">{weekendDays[idx]}</span>
                            {!event.all_day && (
                              <span className="opacity-75">
                                {new Date(event.start_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            <span className="truncate max-w-32">{event.title}</span>
                          </div>
                        ))
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-5 gap-2">
                  {workDays.map((day, idx) => (
                    <div
                      key={day.dateStr}
                      className={`min-h-48 p-2 rounded-lg border ${day.isToday ? 'border-[#1E293B] border-2 bg-[#334155] ring-4 ring-[#1E293B]/30 shadow-lg shadow-[#1E293B]/25' : theme.border} ${theme.panel}`}
                    >
                      <div className={`text-xs font-medium mb-2 ${day.isToday ? 'text-white' : theme.textSecondary}`}>
                        {weekDays[idx]} {day.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {day.events.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => openEventModal(event)}
                            className="text-[10px] px-1.5 py-1 rounded text-white cursor-pointer hover:opacity-80"
                            style={{ backgroundColor: getEventColor(event) }}
                          >
                            {!event.all_day && (
                              <div className="opacity-75">
                                {new Date(event.start_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                            <div className="truncate">{event.title}</div>
                          </div>
                        ))}
                      </div>
                      {canWriteCurrentCalendar() && (
                        <button
                          type="button"
                          onClick={() => openEventModal(null, day.date)}
                          className={`mt-2 w-full text-[10px] py-1 rounded ${theme.bgHover} ${theme.textMuted}`}
                        >
                          + Termin
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {calendarViewMode === 'day' && (() => {
            const dateStr = `${calendarViewDate.getFullYear()}-${String(calendarViewDate.getMonth() + 1).padStart(2, '0')}-${String(calendarViewDate.getDate()).padStart(2, '0')}`
            const dayEvents = calendarEvents.filter((e) => e.start_time.substring(0, 10) === dateStr)

            return (
              <div className="space-y-2">
                {dayEvents.length === 0 ? (
                  <p className={theme.textMuted}>Keine Termine an diesem Tag.</p>
                ) : (
                  dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => openEventModal(event)}
                      className={`p-3 rounded-xl border ${theme.border} cursor-pointer ${theme.bgHover}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-1 h-12 rounded" style={{ backgroundColor: getEventColor(event) }} />
                        <div>
                          <p className={`font-medium ${theme.text}`}>{event.title}</p>
                          <p className={`text-xs ${theme.textMuted}`}>
                            {event.all_day
                              ? 'Ganztägig'
                              : `${new Date(event.start_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.end_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                          {event.location && <p className={`text-xs ${theme.textMuted}`}>{event.location}</p>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {canWriteCurrentCalendar() && (
                  <button
                    type="button"
                    onClick={() => openEventModal(null, calendarViewDate)}
                    className={`w-full py-2 rounded-xl border ${theme.border} ${theme.bgHover} ${theme.textMuted} text-sm`}
                  >
                    + Neuer Termin
                  </button>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {canWriteCurrentCalendar() && calendars.length > 0 && (
        <button
          type="button"
          onClick={() => openEventModal()}
          className={`fixed bottom-6 right-6 p-4 rounded-full ${theme.accent} text-white shadow-lg hover:scale-105 transition-transform z-30`}
          title="Neuer Termin"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </>
  )
})

export default CalendarView
