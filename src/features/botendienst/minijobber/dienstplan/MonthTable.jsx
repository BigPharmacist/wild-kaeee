const dayNamesShort = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function toLocalDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getISOWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
}

// Stabile Farbe pro Mitarbeiter (basierend auf ID-Hash)
const staffColors = [
  { dot: 'bg-blue-500', text: 'text-blue-800' },
  { dot: 'bg-emerald-500', text: 'text-emerald-800' },
  { dot: 'bg-violet-500', text: 'text-violet-800' },
  { dot: 'bg-amber-500', text: 'text-amber-800' },
  { dot: 'bg-rose-500', text: 'text-rose-800' },
  { dot: 'bg-cyan-500', text: 'text-cyan-800' },
  { dot: 'bg-orange-500', text: 'text-orange-800' },
  { dot: 'bg-fuchsia-500', text: 'text-fuchsia-800' },
]

function getStaffColor(staffId) {
  let hash = 0
  for (let i = 0; i < staffId.length; i++) {
    hash = ((hash << 5) - hash) + staffId.charCodeAt(i)
    hash |= 0
  }
  return staffColors[Math.abs(hash) % staffColors.length]
}

export function MonthTable({ theme, profiles, schedules, shifts, holidayMap, year, month, onCellClick }) {
  const profileMap = {}
  profiles.forEach(p => {
    const firstName = p.staff?.first_name || '?'
    profileMap[p.staff_id] = { ...p, firstName }
  })

  // Nur aktive Schichten, sortiert: Vormittag zuerst, dann Nachmittag, dann Rest
  const shiftOrder = ['Vormittag', 'Nachmittag']
  const sortedShifts = shifts.filter(s => s.active !== false).sort((a, b) => {
    const iA = shiftOrder.indexOf(a.name)
    const iB = shiftOrder.indexOf(b.name)
    if (iA !== -1 && iB !== -1) return iA - iB
    if (iA !== -1) return -1
    if (iB !== -1) return 1
    return a.name.localeCompare(b.name)
  })

  // Tage des Monats generieren (Mo–Fr)
  const todayStr = toLocalDateStr(new Date())
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1)
    const dateStr = toLocalDateStr(d)
    const dow = d.getDay()
    return {
      date: d,
      dateStr,
      dayOfWeek: dow,
      dayName: dayNamesShort[dow],
      isToday: dateStr === todayStr,
      isHoliday: !!holidayMap[dateStr],
      holidayName: holidayMap[dateStr] || null,
    }
  }).filter(d => d.dayOfWeek >= 1 && d.dayOfWeek <= 5)

  // Nach KW gruppieren
  const weeks = []
  let currentKw = null
  let currentWeek = null
  for (const day of days) {
    const kw = getISOWeek(day.date)
    if (kw !== currentKw) {
      currentKw = kw
      currentWeek = { kw, days: [] }
      weeks.push(currentWeek)
    }
    currentWeek.days.push(day)
  }

  // Schedules nach Datum + Schicht gruppieren
  const scheduleMap = {}
  schedules.forEach(s => {
    if (!scheduleMap[s.date]) scheduleMap[s.date] = {}
    const shiftId = s.shift_id || '_none'
    if (!scheduleMap[s.date][shiftId]) scheduleMap[s.date][shiftId] = []
    scheduleMap[s.date][shiftId].push(s)
  })

  return (
    <div className={`${theme.surface} border ${theme.border} rounded-xl overflow-hidden ${theme.cardShadow} max-w-3xl`}>
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="border-b-2 border-[#CBD5E1] bg-white">
            <th className={`text-left pl-3 pr-2 py-2 text-[11px] font-semibold uppercase tracking-wider ${theme.textMuted}`}>
              Tag
            </th>
            {sortedShifts.map(shift => (
              <th key={shift.id} className={`text-left px-2 py-2 text-[11px] font-semibold uppercase tracking-wider ${theme.textMuted}`}>
                {shift.name}
                <span className={`ml-1 text-[9px] font-normal normal-case tracking-normal ${theme.textMuted}`}>
                  {shift.start_time?.slice(0, 5)}&ndash;{shift.end_time?.slice(0, 5)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wIdx) => (
            week.days.map((day, dIdx) => {
              const daySchedules = scheduleMap[day.dateStr] || {}
              const isFirstOfWeek = dIdx === 0
              const isLastOfWeek = dIdx === week.days.length - 1

              return (
                <tr
                  key={day.dateStr}
                  className={`${
                    isFirstOfWeek && wIdx > 0 ? 'border-t-[3px] border-[#CBD5E1]' :
                    !isLastOfWeek ? 'border-b border-[#F1F5F9]' : ''
                  } ${
                    day.isToday ? 'bg-[#FEF3C7]/40' :
                    day.isHoliday ? 'bg-red-50/40' :
                    ''
                  } hover:bg-[#F8FAFC] transition-colors`}
                >
                  {/* Datum-Spalte */}
                  <td className="pl-3 pr-2 py-[5px] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {isFirstOfWeek && (
                        <span className="text-[9px] font-bold text-[#94A3B8] w-[26px] shrink-0">{week.kw}</span>
                      )}
                      {!isFirstOfWeek && <span className="w-[26px] shrink-0" />}
                      <span className={`text-[11px] font-semibold w-5 ${
                        day.isToday ? 'text-[#F59E0B]' :
                        day.isHoliday ? 'text-red-500' :
                        theme.textMuted
                      }`}>
                        {day.dayName}
                      </span>
                      <span className={`text-[13px] tabular-nums ${
                        day.isToday ? 'font-bold text-[#F59E0B]' :
                        day.isHoliday ? 'font-semibold text-red-600' :
                        `font-medium ${theme.textPrimary}`
                      }`}>
                        {day.date.getDate()}.
                      </span>
                      {day.isHoliday && (
                        <span className="text-[9px] text-red-400 italic truncate max-w-[80px]" title={day.holidayName}>
                          {day.holidayName}
                        </span>
                      )}
                      {day.isToday && !day.isHoliday && (
                        <span className="text-[9px] font-semibold text-[#F59E0B]">heute</span>
                      )}
                    </div>
                  </td>

                  {/* Schicht-Spalten */}
                  {sortedShifts.map(shift => {
                    const entries = daySchedules[shift.id] || []
                    return (
                      <td
                        key={shift.id}
                        className="px-2 py-[5px] cursor-pointer group"
                        onClick={() => {
                          const staffId = entries[0]?.staff_id || profiles?.[0]?.staff_id
                          if (staffId) onCellClick(staffId, day.dateStr)
                        }}
                      >
                        {entries.length === 0 ? (
                          <span className="text-[11px] text-[#CBD5E1] group-hover:text-[#94A3B8] transition-colors">&mdash;</span>
                        ) : (
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                            {entries.map(sched => {
                              const profile = profileMap[sched.staff_id]
                              if (!profile) return null
                              const isAbsent = sched.absent
                              const color = getStaffColor(sched.staff_id)
                              return (
                                <span
                                  key={sched.id}
                                  className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${
                                    isAbsent
                                      ? 'text-red-400 line-through'
                                      : color.text
                                  }`}
                                  title={isAbsent ? `${profile.firstName} (${sched.absent_reason || 'abwesend'})` : profile.firstName}
                                >
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                                    isAbsent ? 'bg-red-300' : color.dot
                                  }`} />
                                  {profile.firstName}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          ))}
        </tbody>
      </table>
    </div>
  )
}
