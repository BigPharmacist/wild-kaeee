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

function getShiftLabelColor(shiftName) {
  const name = (shiftName || '').toLowerCase()
  if (name.includes('vormittag') || name.includes('früh') || name.includes('morgen')) {
    return 'bg-blue-50 text-blue-700'
  }
  if (name.includes('nachmittag') || name.includes('spät')) {
    return 'bg-green-50 text-green-700'
  }
  return 'bg-gray-50 text-gray-600'
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

  // Tage des Monats generieren
  const todayStr = toLocalDateStr(new Date())
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1)
    const dateStr = toLocalDateStr(d)
    return {
      date: d,
      dateStr,
      dayOfWeek: d.getDay(),
      dayName: dayNamesShort[d.getDay()],
      isToday: dateStr === todayStr,
      isHoliday: !!holidayMap[dateStr],
      holidayName: holidayMap[dateStr] || null,
      isSunday: d.getDay() === 0,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    }
  })

  // Schedules nach Datum + Schicht gruppieren
  const scheduleMap = {} // dateStr -> shiftId -> [schedules]
  schedules.forEach(s => {
    if (!scheduleMap[s.date]) scheduleMap[s.date] = {}
    const shiftId = s.shift_id || '_none'
    if (!scheduleMap[s.date][shiftId]) scheduleMap[s.date][shiftId] = []
    scheduleMap[s.date][shiftId].push(s)
  })

  return (
    <div className={`${theme.surface} border ${theme.border} rounded-xl overflow-hidden ${theme.cardShadow}`}>
      <table className="w-full">
        <thead>
          <tr className={`border-b ${theme.border} bg-gray-50/80`}>
            <th className={`text-left px-3 py-2.5 text-xs font-semibold ${theme.textSecondary} w-[140px]`}>
              Datum
            </th>
            {sortedShifts.map(shift => (
              <th key={shift.id} className={`text-left px-3 py-2.5 text-xs font-semibold ${theme.textSecondary}`}>
                {shift.name}
                <span className={`ml-1.5 text-[10px] font-normal ${theme.textMuted}`}>
                  {shift.start_time?.slice(0, 5)}–{shift.end_time?.slice(0, 5)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(() => {
            let lastKw = null
            let kwColorIdx = 0
            return days.map(day => {
            if (day.isSunday) return null

            const kw = getISOWeek(day.date)
            const isFirstOfWeek = kw !== lastKw
            if (isFirstOfWeek && lastKw !== null) kwColorIdx++
            lastKw = kw
            const weekBg = kwColorIdx % 2 === 1 ? 'bg-gray-100/80' : ''

            const daySchedules = scheduleMap[day.dateStr] || {}

            return (
              <tr
                key={day.dateStr}
                className={`border-b last:border-b-0 ${theme.border} ${
                  day.isToday ? 'bg-[#FEF3C7]/40' :
                  day.isHoliday ? 'bg-red-50/40' :
                  weekBg
                } hover:bg-gray-50/80 transition-colors`}
              >
                {/* Datum-Spalte */}
                <td className={`px-3 py-2 whitespace-nowrap`}>
                  <div className="flex items-center gap-2">
                    {isFirstOfWeek ? (
                      <span className={`text-[10px] font-semibold w-7 ${theme.textMuted}`}>KW{kw}</span>
                    ) : (
                      <span className="w-7" />
                    )}
                    <span className={`text-xs font-bold w-5 ${
                      day.isToday ? 'text-[#F59E0B]' : day.isHoliday ? 'text-red-500' : theme.textMuted
                    }`}>
                      {day.dayName}
                    </span>
                    <span className={`text-sm font-medium ${
                      day.isToday ? 'text-[#F59E0B]' : day.isHoliday ? 'text-red-600' : theme.textPrimary
                    }`}>
                      {day.date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                    </span>
                    {day.isHoliday && (
                      <span className="text-[10px] text-red-400 truncate max-w-[80px]" title={day.holidayName}>
                        {day.holidayName}
                      </span>
                    )}
                  </div>
                </td>

                {/* Eine Spalte pro Schicht */}
                {sortedShifts.map(shift => {
                  const entries = daySchedules[shift.id] || []
                  return (
                    <td
                      key={shift.id}
                      className="px-2 py-1.5 cursor-pointer"
                      onClick={() => {
                        const staffId = entries[0]?.staff_id || activeProfiles[0]?.staff_id
                        if (staffId) onCellClick(staffId, day.dateStr)
                      }}
                    >
                      {entries.length === 0 ? (
                        <span className={`text-xs ${theme.textMuted}`}>—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {entries.map(sched => {
                            const profile = profileMap[sched.staff_id]
                            if (!profile) return null
                            const isAbsent = sched.absent
                            return (
                              <span
                                key={sched.id}
                                className={`inline-block px-2 py-0.5 rounded text-sm font-semibold ${
                                  isAbsent
                                    ? 'bg-red-50 text-red-400 line-through'
                                    : getShiftLabelColor(shift.name)
                                }`}
                                title={isAbsent ? `${profile.firstName} (${sched.absent_reason || 'abwesend'})` : profile.firstName}
                              >
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
          })()}
        </tbody>
      </table>
    </div>
  )
}
