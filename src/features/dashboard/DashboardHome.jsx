import { memo } from 'react'
import { Sparkle, CheckCircle, Warning, Clock } from '@phosphor-icons/react'

const DashboardHome = memo(function DashboardHome({
  theme,
  openWeatherModal,
  weatherLoading,
  weatherError,
  weatherData,
  weatherLocation,
  weatherDescription,
  WeatherIcon, // eslint-disable-line no-unused-vars -- used as component
  Icons, // eslint-disable-line no-unused-vars -- used as Icons.X etc
  dashboardEventsLoading,
  dashboardEvents,
  setActiveView,
  pollenData,
  pollenLoading,
  pollenError,
  pollenRegion,
  pollenNames,
  severityLabels,
  severityColors,
  biowetterLoading,
  biowetterError,
  biowetterZone,
  getBiowetterForecasts,
  biowetterLastUpdate,
  biowetterAiRecommendation,
  biowetterAiLoading,
  openBiowetterModal,
  // Tasks Widget Props
  dashboardTasks,
  dashboardTasksLoading,
  dashboardTasksError,
  tasksByDue,
}) {
  return (
  <>
    <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Dashboard</h2>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-medium ${theme.text}`}>Wetter</h3>
          <button
            type="button"
            onClick={openWeatherModal}
            className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
            title="Ort einstellen"
          >
            <Icons.Settings />
          </button>
        </div>

        {weatherLoading && (
          <p className={`text-sm ${theme.textMuted}`}>Wetterdaten werden geladen...</p>
        )}
        {!weatherLoading && weatherError && (
          <p className="text-rose-400 text-sm">{weatherError}</p>
        )}
        {!weatherLoading && !weatherError && weatherData && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className={`${theme.textSecondary} flex-shrink-0`}>
                <WeatherIcon code={weatherData.weatherCode} className="w-16 h-16" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-4xl font-semibold tracking-tight">
                  {Math.round(weatherData.temperature)}°C
                </p>
                <p className={`text-sm font-medium ${theme.primary}`}>
                  {weatherData.name || weatherLocation}
                </p>
                <p className={`text-sm ${theme.text}`}>
                  {weatherDescription(weatherData.weatherCode)}
                </p>
                <p className={`text-xs ${theme.textMuted}`}>
                  Gefühlt {Math.round(weatherData.feelsLike ?? weatherData.temperature)}°C
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <p className={theme.textSecondary}>
                Min {Math.round(weatherData.daily?.[0]?.min ?? 0)}°C · Max {Math.round(weatherData.daily?.[0]?.max ?? 0)}°C
              </p>
              <div className={`flex items-center gap-1 ${theme.textSecondary}`}>
                <Icons.Droplet className="w-4 h-4" />
                <span>{weatherData.daily?.[0]?.precipitationProbability ?? 0}%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {weatherData.daily?.slice(0, 3).map((day, index) => {
                const dayLabel = index === 0 ? 'Heute' : index === 1 ? 'Morgen' : new Date(day.date).toLocaleDateString('de-DE', { weekday: 'short' })
                return (
                  <div key={day.date} className={`bg-[#FEF3C7] rounded-lg px-2 py-1.5 text-center`}>
                    <p className={`text-xs font-medium ${theme.textSecondary}`}>{dayLabel}</p>
                    <div className={`flex justify-center ${theme.textSecondary}`}>
                      <WeatherIcon code={day.weatherCode ?? weatherData.weatherCode} className="w-6 h-6" />
                    </div>
                    <p className={`text-sm font-semibold ${theme.text} leading-tight`}>
                      {Math.round(day.max ?? 0)}° / {Math.round(day.min ?? 0)}°
                    </p>
                    <div className={`flex items-center justify-center gap-0.5 text-xs ${theme.textMuted}`}>
                      <Icons.Droplet className="w-3 h-3" />
                      <span>{day.precipitationProbability ?? 0}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {!weatherLoading && !weatherError && !weatherData && (
          <p className={theme.textMuted}>
            Kein Wetter verfügbar.
          </p>
        )}
      </div>

      <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow} flex flex-col gap-3`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-medium ${theme.text}`}>Termine</h3>
          <button
            type="button"
            onClick={() => setActiveView('calendar')}
            className={`text-xs ${theme.accentText} hover:underline`}
          >
            Kalender öffnen
          </button>
        </div>
        {dashboardEventsLoading && (
          <p className={`text-xs ${theme.textMuted}`}>Termine werden geladen...</p>
        )}
        {!dashboardEventsLoading && dashboardEvents.length === 0 && (
          <p className={theme.textMuted}>Keine kommenden Termine.</p>
        )}
        {!dashboardEventsLoading && dashboardEvents.length > 0 && (() => {
          const today = new Date()
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

          const endOfWeek = new Date(today)
          const daysUntilSunday = 7 - today.getDay()
          endOfWeek.setDate(today.getDate() + (today.getDay() === 0 ? 0 : daysUntilSunday))
          const endOfWeekStr = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`

          // Notdienst-Kalender ausfiltern
          const isNotNotdienst = (e) => e.calendarName !== 'Notdienst'

          const todayEvents = dashboardEvents.filter((e) => e.start_time.substring(0, 10) === todayStr && isNotNotdienst(e))
          const weekEvents = dashboardEvents.filter((e) => {
            const eventDate = e.start_time.substring(0, 10)
            return eventDate > todayStr && eventDate <= endOfWeekStr && isNotNotdienst(e)
          })
          // Nächste 5 Termine (ohne Notdienste)
          const nextFiveEvents = dashboardEvents
            .filter(isNotNotdienst)
            .slice(0, 5)

          const formatTime = (dateStr) => {
            return new Date(dateStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
          }

          const formatDate = (dateStr) => {
            return new Date(dateStr).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
          }

          return (
            <div className="space-y-4 text-sm">
              <div>
                <p className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Heute</p>
                {todayEvents.length === 0 ? (
                  <p className={`text-xs ${theme.textMuted}`}>Keine Termine</p>
                ) : (
                  <div className="space-y-1.5">
                    {todayEvents.map((event) => (
                      <div key={event.id} className="flex items-center gap-2">
                        <div className="w-1 h-4 rounded" style={{ backgroundColor: event.calendarColor }} />
                        <span className={`text-xs ${theme.textMuted} w-10`}>
                          {event.all_day ? 'Ganz.' : formatTime(event.start_time)}
                        </span>
                        <span className={`text-xs ${theme.text} truncate`}>{event.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Diese Woche</p>
                {weekEvents.length === 0 ? (
                  <p className={`text-xs ${theme.textMuted}`}>Keine Termine</p>
                ) : (
                  <div className="space-y-1.5">
                    {weekEvents.map((event) => (
                      <div key={event.id} className="flex items-center gap-2">
                        <div className="w-1 h-4 rounded" style={{ backgroundColor: event.calendarColor }} />
                        <span className={`text-xs ${theme.textMuted} w-16`}>{formatDate(event.start_time)}</span>
                        <span className={`text-xs ${theme.text} truncate`}>{event.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Nächste 5 Termine</p>
                {nextFiveEvents.length === 0 ? (
                  <p className={`text-xs ${theme.textMuted}`}>Keine Termine</p>
                ) : (
                  <div className="space-y-1.5">
                    {nextFiveEvents.map((event) => (
                      <div key={event.id} className="flex items-center gap-2">
                        <div className="w-1 h-4 rounded" style={{ backgroundColor: event.calendarColor }} />
                        <span className={`text-xs ${theme.textMuted} w-16`}>{formatDate(event.start_time)}</span>
                        <span className={`text-xs ${theme.text} truncate`}>{event.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>

      <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-medium ${theme.text}`}>Pollenflug</h3>
          {pollenRegion && (
            <span className={`text-xs ${theme.textMuted}`}>
              {pollenRegion.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {pollenLoading && (
          <p className={`text-sm ${theme.textMuted}`}>Pollendaten werden geladen...</p>
        )}
        {!pollenLoading && pollenError && (
          <p className="text-rose-400 text-sm">{pollenError}</p>
        )}
        {!pollenLoading && !pollenError && pollenData && pollenData.pollen && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span></span>
              <div className="flex gap-1 text-xs text-[#6B7280]">
                <span className="w-16 text-center">Heute</span>
                <span className="w-16 text-center">Morgen</span>
              </div>
            </div>
            {pollenData.pollen
              .filter(p => p.today?.severity !== '-1' && p.today?.severity !== undefined)
              .sort((a, b) => {
                const order = { '3': 0, '2-3': 1, '2': 2, '1-2': 3, '1': 4, '0-1': 5, '0': 6 }
                return (order[a.today?.severity] ?? 7) - (order[b.today?.severity] ?? 7)
              })
              .map(pollen => (
                <div key={pollen.name} className="flex items-center justify-between">
                  <span className={`text-sm ${theme.text}`}>
                    {pollenNames[pollen.name] || pollen.name}
                  </span>
                  <div className="flex gap-1">
                    <span
                      className={`text-xs w-16 text-center py-0.5 rounded ${severityColors[pollen.today?.severity] || 'bg-gray-100'}`}
                    >
                      {severityLabels[pollen.today?.severity] || pollen.today?.severity}
                    </span>
                    <span
                      className={`text-xs w-16 text-center py-0.5 rounded ${pollen.tomorrow?.severity && pollen.tomorrow.severity !== '-1' ? severityColors[pollen.tomorrow?.severity] || 'bg-gray-100' : 'bg-transparent'}`}
                    >
                      {pollen.tomorrow?.severity && pollen.tomorrow.severity !== '-1'
                        ? (severityLabels[pollen.tomorrow?.severity] || pollen.tomorrow?.severity)
                        : '–'}
                    </span>
                  </div>
                </div>
              ))}
            {pollenData.pollen.filter(p => p.today?.severity !== '-1' && p.today?.severity !== undefined).length === 0 && (
              <p className={`text-sm ${theme.textMuted}`}>Aktuell keine Pollenbelastung.</p>
            )}
          </div>
        )}
        {!pollenLoading && !pollenError && !pollenData && (
          <p className={theme.textMuted}>Keine Pollendaten verfügbar.</p>
        )}
      </div>

      <div
        className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow} cursor-pointer hover:border-[#4C8BF5] transition-colors overflow-hidden`}
        onClick={openBiowetterModal}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-medium ${theme.text}`}>Biowetter</h3>
          {biowetterZone && (
            <span className={`text-xs ${theme.textMuted}`}>
              Zone {biowetterZone}
            </span>
          )}
        </div>

        {biowetterLoading && (
          <p className={`text-sm ${theme.textMuted}`}>Biowetter wird geladen...</p>
        )}
        {!biowetterLoading && biowetterError && (
          <p className="text-rose-400 text-sm">{biowetterError}</p>
        )}
        {!biowetterLoading && !biowetterError && getBiowetterForecasts && (() => {
          const forecasts = getBiowetterForecasts()
          if (!forecasts || !forecasts.slots) {
            return <p className={theme.textMuted}>Keine Biowetter-Daten verfügbar.</p>
          }

          // Nur verfügbare Slots filtern
          const availableSlots = forecasts.slots.filter(slot => slot.available)

          // Alle Effekte aus verfügbaren Slots sammeln (nur mit Belastung)
          const allEffectLabels = new Map()
          const slotEffectsMap = availableSlots.map(slot => {
            const effectMap = new Map()
            slot.effects.forEach(e => {
              allEffectLabels.set(e.label, e.label)
              effectMap.set(e.label, e)
            })
            return effectMap
          })

          const effectList = Array.from(allEffectLabels.keys())
          const hasAnyEffects = effectList.length > 0

          // Wochentage berechnen
          const weekdayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
          const today = new Date()
          const getWeekday = (daysFromNow) => weekdayNames[(today.getDay() + daysFromNow) % 7]

          // Tage für Header gruppieren (nur mit verfügbaren Slots)
          const days = [
            { label: getWeekday(0), slots: availableSlots.filter(s => s.dayLabel === 'Heute') },
            { label: getWeekday(1), slots: availableSlots.filter(s => s.dayLabel === 'Morgen') },
            { label: getWeekday(2), slots: availableSlots.filter(s => s.dayLabel === 'Überm.') },
          ].filter(day => day.slots.length > 0)

          return (
            <div className="space-y-3">
              {hasAnyEffects ? (
                <>
                  {/* Tabelle mit durchgängigen Trennlinien */}
                  <div className="flex min-w-0 overflow-hidden">
                    {/* Labels-Spalte */}
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="h-5" /> {/* Platz für Tage-Header */}
                      <div className="h-4 mb-1" /> {/* Platz für VM/NM-Header */}
                      <div className="space-y-1">
                        {effectList.map((label) => (
                          <div key={label} className="h-4 flex items-center">
                            <span className={`text-xs ${theme.text} truncate`}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Tages-Spalten */}
                    {days.map((day, dayIdx) => (
                      <div
                        key={day.label}
                        className={`flex-shrink-0 ${dayIdx > 0 ? 'border-l border-[#E5E7EB] pl-1 ml-1' : ''}`}
                      >
                        {/* Tages-Header */}
                        <div className="h-5 flex justify-center items-center">
                          <span className="text-[10px] text-[#6B7280]">{day.label}</span>
                        </div>
                        {/* VM/NM-Header */}
                        <div className="h-4 mb-1 flex gap-px justify-center items-center">
                          {day.slots.map((slot) => (
                            <div key={slot.key} className="w-[18px] text-center">
                              <span className="text-[8px] text-[#9CA3AF]">{slot.label}</span>
                            </div>
                          ))}
                        </div>
                        {/* Werte */}
                        <div className="space-y-1">
                          {effectList.map((label) => (
                            <div key={label} className="h-4 flex gap-px justify-center items-center">
                              {day.slots.map((slot) => {
                                const slotIdx = availableSlots.findIndex(s => s.key === slot.key)
                                const effect = slotEffectsMap[slotIdx]?.get(label)
                                return (
                                  <div key={slot.key} className="w-[18px] flex justify-center items-center">
                                    {effect ? (
                                      <span
                                        className={`w-3 h-3 rounded-sm ${effect.dotColor}`}
                                        title={`${slot.dayLabel} ${slot.label}: ${effect.value}`}
                                      />
                                    ) : (
                                      <span className="w-3 h-3 rounded-sm bg-[#27AE60]" title={`${slot.dayLabel} ${slot.label}: kein Einfluss`} />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className={`text-sm ${theme.textMuted}`}>Kein Einfluss erwartet.</p>
              )}

              {/* KI-Empfehlung (gekürzt) */}
              <div className={`pt-3 border-t ${theme.border}`}>
                {biowetterAiLoading ? (
                  <div className="flex items-center gap-2">
                    <Sparkle size={16} weight="fill" className="text-[#9CA3AF] animate-pulse" />
                    <p className={`text-xs ${theme.textMuted} italic`}>...</p>
                  </div>
                ) : biowetterAiRecommendation ? (
                  <div className="flex items-start gap-2">
                    <Sparkle size={16} weight="fill" className="text-violet-500 flex-shrink-0 mt-0.5" />
                    <p className={`text-xs ${theme.textMuted} line-clamp-2`}>
                      {biowetterAiRecommendation.split('.')[0]}.
                    </p>
                  </div>
                ) : null}
              </div>

              {biowetterLastUpdate && (
                <p className={`text-xs ${theme.textMuted} mt-2`}>
                  Stand: {biowetterLastUpdate}
                </p>
              )}
            </div>
          )
        })()}
      </div>

      {/* Tasks Widget */}
      <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow} flex flex-col gap-3`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-medium ${theme.text}`}>Aufgaben</h3>
          <button
            type="button"
            onClick={() => setActiveView('tasks')}
            className={`text-xs ${theme.accentText} hover:underline`}
          >
            Alle anzeigen
          </button>
        </div>

        {dashboardTasksLoading && (
          <p className={`text-xs ${theme.textMuted}`}>Aufgaben werden geladen...</p>
        )}
        {!dashboardTasksLoading && dashboardTasksError && (
          <p className="text-rose-400 text-sm">{dashboardTasksError}</p>
        )}
        {!dashboardTasksLoading && !dashboardTasksError && tasksByDue && (() => {
          const { overdue, today, tomorrow, thisWeek, noDue } = tasksByDue
          const hasAnyTasks = overdue.length > 0 || today.length > 0 || tomorrow.length > 0 || thisWeek.length > 0 || noDue.length > 0

          if (!hasAnyTasks) {
            return (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle size={32} weight="light" className="text-[#0D9488] mb-2" />
                <p className={theme.textMuted}>Keine offenen Aufgaben!</p>
              </div>
            )
          }

          const formatDueDate = (dateStr) => {
            if (!dateStr) return ''
            return new Date(dateStr).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
          }

          const TaskItem = ({ task, isOverdue = false }) => (
            <div className="flex items-start gap-2">
              {task.priority && (
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                  task.priority === 'A' ? 'bg-rose-100 text-rose-700' :
                  task.priority === 'B' ? 'bg-orange-100 text-orange-700' :
                  task.priority === 'C' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {task.priority}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${theme.text} truncate`}>{task.text}</p>
                {task.projects?.name && (
                  <p className={`text-[10px] ${theme.textMuted}`}>
                    {task.projects.name}
                  </p>
                )}
              </div>
              {isOverdue && task.due_date && (
                <span className="text-[10px] text-rose-500 flex-shrink-0">
                  {formatDueDate(task.due_date)}
                </span>
              )}
            </div>
          )

          return (
            <div className="space-y-4 text-sm">
              {overdue.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Warning size={14} className="text-rose-500" />
                    <p className="text-xs font-medium text-rose-500">Überfällig ({overdue.length})</p>
                  </div>
                  <div className="space-y-2 pl-0.5">
                    {overdue.slice(0, 3).map((task) => (
                      <TaskItem key={task.id} task={task} isOverdue />
                    ))}
                    {overdue.length > 3 && (
                      <p className={`text-xs ${theme.textMuted}`}>+{overdue.length - 3} weitere</p>
                    )}
                  </div>
                </div>
              )}

              {today.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock size={14} className="text-amber-500" />
                    <p className={`text-xs font-medium text-amber-600`}>Heute ({today.length})</p>
                  </div>
                  <div className="space-y-2 pl-0.5">
                    {today.slice(0, 3).map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                    {today.length > 3 && (
                      <p className={`text-xs ${theme.textMuted}`}>+{today.length - 3} weitere</p>
                    )}
                  </div>
                </div>
              )}

              {tomorrow.length > 0 && (
                <div>
                  <p className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Morgen ({tomorrow.length})</p>
                  <div className="space-y-2 pl-0.5">
                    {tomorrow.slice(0, 2).map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                    {tomorrow.length > 2 && (
                      <p className={`text-xs ${theme.textMuted}`}>+{tomorrow.length - 2} weitere</p>
                    )}
                  </div>
                </div>
              )}

              {thisWeek.length > 0 && (
                <div>
                  <p className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Diese Woche ({thisWeek.length})</p>
                  <div className="space-y-2 pl-0.5">
                    {thisWeek.slice(0, 2).map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                    {thisWeek.length > 2 && (
                      <p className={`text-xs ${theme.textMuted}`}>+{thisWeek.length - 2} weitere</p>
                    )}
                  </div>
                </div>
              )}

              {noDue.length > 0 && (
                <div>
                  <p className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Ohne Termin ({noDue.length})</p>
                  <div className="space-y-2 pl-0.5">
                    {noDue.slice(0, 3).map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                    {noDue.length > 3 && (
                      <p className={`text-xs ${theme.textMuted}`}>+{noDue.length - 3} weitere</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })()}
        {!dashboardTasksLoading && !dashboardTasksError && dashboardTasks?.length === 0 && !tasksByDue && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle size={32} weight="light" className="text-[#0D9488] mb-2" />
            <p className={theme.textMuted}>Keine offenen Aufgaben!</p>
          </div>
        )}
      </div>
    </div>
  </>
  )
})

export default DashboardHome
