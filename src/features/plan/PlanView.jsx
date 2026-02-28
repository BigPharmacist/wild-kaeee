import { useState } from 'react'
import { useTheme, useAuth } from '../../context'
import usePlanData from '../dashboard/usePlanData'

const PlanView = () => {
  const { theme } = useTheme()
  const { session } = useAuth()

  const {
    planData,
    planLoading,
    planError,
    setPlanData,
    setPlanError,
    fetchPlanData,
  } = usePlanData({ session })

  const [selectedPlanDate, setSelectedPlanDate] = useState(() => {
    const today = new Date()
    return today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  })

  return (
  <>
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Plan</h2>
      <button
        type="button"
        onClick={() => { setPlanData(null); setPlanError(''); fetchPlanData(); }}
        className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
        title="Daten neu laden"
      >
        Aktualisieren
      </button>
    </div>

    {planLoading && (
      <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
        <p className={theme.textMuted}>Plandaten werden geladen...</p>
      </div>
    )}

    {!planLoading && planError && (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
        <p className="text-rose-400 text-sm">{planError}</p>
      </div>
    )}

    {!planLoading && !planError && planData && (
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow} h-fit`}>
          <p className={`text-xs font-medium mb-3 ${theme.textMuted}`}>Kalender</p>
          {(() => {
            const today = new Date()
            const todayStr = today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

            const currentDay = today.getDay()
            const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
            const startDate = new Date(today)
            startDate.setDate(today.getDate() + mondayOffset)

            const weeks = []
            for (let w = 0; w < 4; w++) {
              const week = []
              for (let d = 0; d < 7; d++) {
                const date = new Date(startDate)
                date.setDate(startDate.getDate() + w * 7 + d)
                const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                const dayNum = date.getDate()
                const hasData = planData.days[dateStr]
                const isSelected = selectedPlanDate === dateStr
                const isTodayDate = dateStr === todayStr
                const isWeekend = d >= 5

                week.push({ date, dateStr, dayNum, hasData, isSelected, isTodayDate, isWeekend })
              }
              weeks.push(week)
            }

            const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

            return (
              <div className="space-y-1">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day, idx) => (
                    <div key={day} className={`text-[10px] text-center ${idx >= 5 ? theme.textMuted : theme.textSecondary}`}>
                      {day}
                    </div>
                  ))}
                </div>
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-cols-7 gap-1">
                    {week.map((day) => (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() => day.hasData && setSelectedPlanDate(day.dateStr)}
                        disabled={!day.hasData}
                        className={`
                          w-8 h-8 rounded-lg text-xs font-medium transition-colors
                          ${day.isSelected
                            ? 'bg-[#334155] text-white'
                            : day.isTodayDate
                              ? `border-2 border-[#DC2626]/50 ${day.hasData ? theme.text : theme.textMuted}`
                              : day.hasData
                                ? `${theme.bgHover} ${day.isWeekend ? theme.textMuted : theme.text}`
                                : `${theme.textMuted} opacity-40 cursor-not-allowed`
                          }
                        `}
                        title={day.dateStr}
                      >
                        {day.dayNum}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )
          })()}
          <p className={`text-[10px] mt-3 ${theme.textMuted}`}>
            Quelle: {planData.usedFile}
          </p>
        </div>

        <div className="space-y-4 min-w-0">
          {(() => {
            const dayData = planData.days[selectedPlanDate]
            const today = new Date()
            const todayStr = today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
            const isToday = selectedPlanDate === todayStr

            const START_HOUR = 6
            const END_HOUR = 20
            const TOTAL_HOURS = END_HOUR - START_HOUR
            const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i)

            const parseTime = (timeStr) => {
              if (!timeStr) return null
              const [h, m] = timeStr.split(':').map(Number)
              return h + m / 60
            }

            const getBarStyle = (start, end) => {
              let displayStart = start
              let displayEnd = end

              if (end <= start && end < START_HOUR) {
                displayEnd = END_HOUR
              }

              if (displayStart < START_HOUR) {
                displayStart = START_HOUR
              }

              if (displayEnd > END_HOUR) {
                displayEnd = END_HOUR
              }

              displayStart = Math.max(START_HOUR, Math.min(END_HOUR, displayStart))
              displayEnd = Math.max(START_HOUR, Math.min(END_HOUR, displayEnd))

              const left = ((displayStart - START_HOUR) / TOTAL_HOURS) * 100
              const width = ((displayEnd - displayStart) / TOTAL_HOURS) * 100

              return { left: `${left}%`, width: `${Math.max(0, width)}%` }
            }

            if (!dayData) {
              return (
                <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
                  <p className={theme.textMuted}>Keine Daten für {selectedPlanDate} verfügbar.</p>
                </div>
              )
            }

            return (
              <div className={`${theme.panel} rounded-2xl p-5 border ${isToday ? 'border-[#DC2626]/40' : theme.border} ${theme.cardShadow}`}>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">{dayData.issueDate}</h3>
                  {isToday && (
                    <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-[#334155]/15 text-[#DC2626] border border-[#DC2626]/20">
                      Heute
                    </span>
                  )}
                </div>

                {Object.entries(dayData.groups).map(([groupName, employees]) => (
                  <div key={groupName} className="mb-6 last:mb-0">
                    <p className={`text-xs font-medium mb-3 ${theme.textMuted}`}>{groupName}</p>

                    <div className="relative mb-2">
                      <div className="flex justify-between text-[10px] text-[#64748B]">
                        {hours.map((h) => (
                          <span key={h} className="w-0 text-center" style={{ marginLeft: h === START_HOUR ? 0 : undefined }}>
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {employees.map((emp, idx) => {
                        const startTime = parseTime(emp.workStart)
                        const endTime = parseTime(emp.workStop)
                        const hasWork = startTime !== null && endTime !== null && emp.workStart !== emp.workStop
                        const isAbsent = emp.status === 'Urlaub' || emp.status === 'Krank'
                        const isFree = !hasWork && !isAbsent

                        const breakBlock = emp.timeblocks.find((tb) => tb.type === 'break')
                        const breakDuration = breakBlock ? breakBlock.duration : 0

                        let breakStart = null
                        let breakEnd = null
                        if (breakDuration > 0 && hasWork) {
                          let accumulated = 0
                          for (const tb of emp.timeblocks) {
                            if (tb.type === 'empty') {
                              accumulated += tb.duration
                            } else if (tb.type === 'work') {
                              accumulated += tb.duration
                            } else if (tb.type === 'break') {
                              breakStart = START_HOUR + accumulated / 60
                              breakEnd = breakStart + tb.duration / 60
                              break
                            }
                          }
                        }

                        return (
                          <div
                            key={`${emp.firstName}-${emp.lastName}-${idx}`}
                            className="relative h-7 rounded"
                          >
                            <div className="absolute inset-0 flex">
                              {hours.slice(0, -1).map((h) => (
                                <div key={h} className="flex-1 border-r border-[#E5E7EB]" />
                              ))}
                            </div>

                            {hasWork && !isAbsent && (
                              <>
                                <div
                                  className="absolute top-0.5 bottom-0.5 bg-[#334155] rounded"
                                  style={getBarStyle(startTime, endTime)}
                                />
                                {breakStart && breakEnd && (
                                  <div
                                    className="absolute top-0.5 bottom-0.5 bg-rose-500 rounded"
                                    style={getBarStyle(breakStart, breakEnd)}
                                  />
                                )}
                                <div
                                  className="absolute top-0.5 bottom-0.5 flex items-center justify-center overflow-hidden pointer-events-none"
                                  style={getBarStyle(startTime, endTime)}
                                >
                                  <span className="text-[11px] font-semibold text-white truncate px-2">
                                    {emp.firstName} {emp.lastName}
                                  </span>
                                </div>
                              </>
                            )}

                            {emp.status === 'Urlaub' && (
                              <div
                                className="absolute top-0.5 bottom-0.5 rounded flex items-center justify-center overflow-hidden"
                                style={{ left: '0%', width: '100%', backgroundColor: '#A481A2' }}
                              >
                                <span className="text-[11px] font-semibold text-[#1E293B] truncate px-2 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
                                  {emp.firstName} {emp.lastName} - Urlaub
                                </span>
                              </div>
                            )}

                            {emp.status === 'Krank' && (
                              <div
                                className="absolute top-0.5 bottom-0.5 rounded flex items-center justify-center overflow-hidden"
                                style={{ left: '0%', width: '100%', backgroundColor: '#FBBF24' }}
                              >
                                <span className="text-[11px] font-semibold text-[#1E293B] truncate px-2 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
                                  {emp.firstName} {emp.lastName} - Krank
                                </span>
                              </div>
                            )}

                            {isFree && (
                              <div className="absolute inset-0 flex items-center px-2">
                                <span className={`text-[11px] ${theme.textMuted} truncate`}>
                                  {emp.firstName} {emp.lastName}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div className={`flex flex-wrap gap-4 mt-4 pt-4 border-t ${theme.border} text-[10px] ${theme.textMuted}`}>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-[#334155]" />
                    <span>Arbeit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-rose-500" />
                    <span>Pause</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#A481A2' }} />
                    <span>Urlaub</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: '#FBBF24' }} />
                    <span>Krank</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    )}

    {!planLoading && !planError && !planData && (
      <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
        <p className={theme.textMuted}>Keine Plandaten verfügbar.</p>
      </div>
    )}
  </>
  )
}

export default PlanView
