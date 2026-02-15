import { Plus } from '@phosphor-icons/react'

const dayNamesFull = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

function toLocalDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Schichtfarben: Vormittag = blau, Nachmittag = grün, Rest = grau
function getShiftColors(shiftName) {
  const name = (shiftName || '').toLowerCase()
  if (name.includes('vormittag') || name.includes('früh') || name.includes('morgen')) {
    return 'bg-blue-50 border-blue-200'
  }
  if (name.includes('nachmittag') || name.includes('spät')) {
    return 'bg-green-50 border-green-200'
  }
  return 'bg-gray-50 border-gray-200'
}

function getShiftLabelColors(shiftName) {
  const name = (shiftName || '').toLowerCase()
  if (name.includes('vormittag') || name.includes('früh') || name.includes('morgen')) {
    return 'text-blue-700 bg-blue-100/60'
  }
  if (name.includes('nachmittag') || name.includes('spät')) {
    return 'text-green-700 bg-green-100/60'
  }
  return 'text-gray-600 bg-gray-100'
}

export function WeekGrid({ theme, profiles, weekDates, schedules, shifts, holidayMap, dayNames, onCellClick }) {
  const profileMap = {}
  profiles.forEach(p => {
    const firstName = p.staff?.first_name || 'Unbekannt'
    const fullName = p.staff ? `${p.staff.first_name} ${p.staff.last_name}` : 'Unbekannt'
    profileMap[p.staff_id] = { ...p, firstName, fullName }
  })

  // Active shift IDs for filtering
  const activeShiftIds = new Set(shifts.filter(s => s.active !== false).map(s => s.id))

  // Shift ordering
  const shiftOrder = ['Vormittag', 'Nachmittag']

  return (
    <div className="grid grid-cols-6 gap-3">
      {weekDates.map((date, i) => {
        const dateStr = toLocalDateStr(date)
        const isToday = dateStr === toLocalDateStr(new Date())
        const isHoliday = !!holidayMap[dateStr]

        const daySchedules = schedules.filter(s => s.date === dateStr && activeShiftIds.has(s.shift_id))

        // Group by shift
        const grouped = {}
        daySchedules.forEach(sched => {
          const shiftName = sched.absent ? '_absent' : (sched.shift?.name || '_other')
          if (!grouped[shiftName]) grouped[shiftName] = []
          grouped[shiftName].push(sched)
        })
        const sortedKeys = Object.keys(grouped).sort((a, b) => {
          const iA = shiftOrder.indexOf(a)
          const iB = shiftOrder.indexOf(b)
          if (iA !== -1 && iB !== -1) return iA - iB
          if (iA !== -1) return -1
          if (iB !== -1) return 1
          return a.localeCompare(b)
        })

        // For the add button
        const staffEntries = {}
        daySchedules.forEach(sched => { staffEntries[sched.staff_id] = true })

        return (
          <div
            key={dateStr}
            className={`${theme.surface} border ${theme.border} rounded-xl overflow-hidden ${theme.cardShadow} flex flex-col`}
          >
            {/* Day Header */}
            <div className={`px-3 py-3 border-b ${theme.border} ${
              isToday ? 'bg-[#FEF3C7]' : isHoliday ? 'bg-red-50' : ''
            }`}>
              <div className={`text-sm font-semibold ${isToday ? 'text-[#F59E0B]' : isHoliday ? 'text-red-600' : theme.textPrimary}`}>
                {dayNamesFull[i]}
              </div>
              <div className={`text-xs ${isToday ? 'text-[#F59E0B]/70' : theme.textMuted}`}>
                {date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
              {isHoliday && (
                <div className="text-[10px] text-red-500 mt-0.5 truncate" title={holidayMap[dateStr]}>
                  {holidayMap[dateStr]}
                </div>
              )}
            </div>

            {/* Shift Cards */}
            <div className="flex-1 p-2 space-y-2 min-h-[80px]">
              {daySchedules.length === 0 ? (
                <div className={`text-xs ${theme.textMuted} text-center py-4`}>—</div>
              ) : (
                sortedKeys.map(shiftName => {
                  const isAbsent = shiftName === '_absent'
                  const displayName = isAbsent ? 'Abwesend' : shiftName === '_other' ? 'Sonstige' : shiftName
                  const cardColors = isAbsent ? 'bg-red-50 border-red-200' : getShiftColors(shiftName)
                  const labelColors = isAbsent ? 'text-red-600 bg-red-100/60' : getShiftLabelColors(shiftName)

                  return (
                    <div key={shiftName} className={`border rounded-lg ${cardColors} overflow-hidden`}>
                      {/* Shift label */}
                      <div className={`px-2.5 py-1 text-xs font-medium ${labelColors}`}>
                        {displayName}
                      </div>
                      {/* Staff names */}
                      {grouped[shiftName].map(sched => {
                        const profile = profileMap[sched.staff_id]
                        if (!profile) return null
                        return (
                          <div
                            key={sched.id}
                            onClick={() => onCellClick(sched.staff_id, dateStr)}
                            className="px-2.5 py-1.5 cursor-pointer hover:bg-white/50 transition-colors"
                          >
                            <span className={`text-base font-bold ${isAbsent ? 'text-red-700 line-through' : theme.textPrimary}`}>
                              {profile.firstName}
                            </span>
                            {sched.absent && sched.absent_reason && (
                              <span className="ml-1.5 text-[10px] text-red-500">
                                ({sched.absent_reason})
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })
              )}
            </div>

            {/* Add button */}
            <button
              onClick={() => {
                const unscheduledStaff = activeProfiles.find(p => !staffEntries[p.staff_id])
                if (unscheduledStaff) {
                  onCellClick(unscheduledStaff.staff_id, dateStr)
                } else if (activeProfiles.length > 0) {
                  onCellClick(activeProfiles[0].staff_id, dateStr)
                }
              }}
              className={`mx-2 mb-2 p-1.5 rounded-lg text-xs ${theme.textMuted} hover:bg-gray-100 hover:text-gray-600 transition-colors flex items-center justify-center gap-1`}
            >
              <Plus size={12} weight="bold" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
