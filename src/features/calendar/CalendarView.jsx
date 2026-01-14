const CalendarView = ({
  theme,
  calendars,
  selectedCalendarId,
  setSelectedCalendarId,
  calendarViewMode,
  setCalendarViewMode,
  calendarViewDate,
  setCalendarViewDate,
  Icons,
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
}) => (
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
                  ? 'bg-[#FD8916] text-white'
                  : `${theme.panel} ${theme.textMuted} ${theme.bgHover}`
              }`}
            >
              {mode === 'month' ? 'Monat' : mode === 'week' ? 'Woche' : 'Tag'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            const d = new Date(calendarViewDate)
            if (calendarViewMode === 'month') d.setMonth(d.getMonth() - 1)
            else if (calendarViewMode === 'week') d.setDate(d.getDate() - 7)
            else d.setDate(d.getDate() - 1)
            setCalendarViewDate(d)
          }}
          className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
          title="Zurück"
        >
          <Icons.ChevronLeft />
        </button>

        <button
          type="button"
          onClick={() => setCalendarViewDate(new Date())}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${theme.bgHover} ${theme.textMuted}`}
        >
          Heute
        </button>

        <button
          type="button"
          onClick={() => {
            const d = new Date(calendarViewDate)
            if (calendarViewMode === 'month') d.setMonth(d.getMonth() + 1)
            else if (calendarViewMode === 'week') d.setDate(d.getDate() + 7)
            else d.setDate(d.getDate() + 1)
            setCalendarViewDate(d)
          }}
          className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
          title="Vor"
        >
          <Icons.ChevronRight />
        </button>

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

    <div className="mb-4">
      <h3 className={`text-lg font-medium ${theme.text}`}>
        {calendarViewDate.toLocaleDateString('de-DE', {
          month: 'long',
          year: 'numeric',
          ...(calendarViewMode === 'day' && { day: 'numeric', weekday: 'long' }),
        })}
      </h3>
    </div>

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
      <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow}`}>
        {calendarViewMode === 'month' && (() => {
          const today = new Date()
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

          const firstDay = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1)
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
              const isCurrentMonth = dayDate.getMonth() === calendarViewDate.getMonth()
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

          const weekDays = showWeekends ? ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] : ['Mo', 'Di', 'Mi', 'Do', 'Fr']
          const gridCols = showWeekends ? 'grid-cols-7' : 'grid-cols-5'

          return (
            <div className="space-y-1 relative">
              <button
                type="button"
                onClick={() => setShowWeekends(!showWeekends)}
                className={`absolute -right-1 top-0 p-1.5 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
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
                        ${day.isToday ? 'border-[#FD8916]/50' : theme.border}
                        ${canWriteCurrentCalendar() ? 'cursor-pointer ' + theme.bgHover : ''}
                      `}
                    >
                      <div
                        className={`text-xs font-medium mb-1 ${
                          day.isToday ? theme.accentText : day.isCurrentMonth ? theme.text : theme.textMuted
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
        })()}

        {calendarViewMode === 'week' && (() => {
          const today = new Date()
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

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
                    className={`min-h-48 p-2 rounded-lg border ${day.isToday ? 'border-[#FD8916]/50' : theme.border} ${theme.panel}`}
                  >
                    <div className={`text-xs font-medium mb-2 ${day.isToday ? theme.accentText : theme.textSecondary}`}>
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

export default CalendarView
