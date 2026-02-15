import { MjShiftBadge } from '../shared/MjShiftBadge'
import { Plus } from '@phosphor-icons/react'

export function WeekGrid({ theme, profiles, weekDates, schedules, shifts, holidayMap, dayNames, onCellClick }) {
  const activeProfiles = profiles.filter(p => p.active)

  // Build a lookup: staff_id -> profile info
  const profileMap = {}
  activeProfiles.forEach(p => {
    const name = p.staff ? `${p.staff.first_name} ${p.staff.last_name}` : 'Unbekannt'
    const initials = p.initials || name.split(' ').map(n => n[0]).join('')
    profileMap[p.staff_id] = { ...p, name, initials }
  })

  return (
    <div className={`grid grid-cols-6 gap-2`}>
      {weekDates.map((date, i) => {
        const dateStr = date.toISOString().split('T')[0]
        const isToday = dateStr === new Date().toISOString().split('T')[0]
        const isHoliday = !!holidayMap[dateStr]
        const isSunday = date.getDay() === 0

        // Get all schedules for this day, grouped by staff
        const daySchedules = schedules.filter(s => s.date === dateStr)

        // Group by staff_id so each person appears once with all their shifts
        const staffEntries = {}
        daySchedules.forEach(sched => {
          if (!staffEntries[sched.staff_id]) {
            staffEntries[sched.staff_id] = []
          }
          staffEntries[sched.staff_id].push(sched)
        })

        const staffIds = Object.keys(staffEntries)

        return (
          <div
            key={dateStr}
            className={`${theme.surface} border ${theme.border} rounded-xl overflow-hidden ${theme.cardShadow} flex flex-col`}
          >
            {/* Day Header */}
            <div className={`px-3 py-2.5 border-b ${theme.border} ${
              isToday ? 'bg-[#FEF3C7]' : isHoliday ? 'bg-red-50' : isSunday ? 'bg-gray-50' : 'bg-gray-50/50'
            }`}>
              <div className={`text-xs font-semibold ${isToday ? 'text-[#F59E0B]' : isHoliday ? 'text-red-600' : theme.textSecondary}`}>
                {dayNames[i]}
              </div>
              <div className={`text-sm font-medium ${isToday ? 'text-[#F59E0B]' : theme.textPrimary}`}>
                {date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
              </div>
              {isHoliday && (
                <div className="text-[10px] text-red-500 truncate" title={holidayMap[dateStr]}>
                  {holidayMap[dateStr]}
                </div>
              )}
            </div>

            {/* Scheduled Staff grouped by shift */}
            <div className="flex-1 p-1.5 min-h-[60px]">
              {daySchedules.length === 0 ? (
                <div className={`text-xs ${theme.textMuted} text-center py-3`}>—</div>
              ) : (() => {
                // Group schedules by shift name, ordered: Vormittag → Nachmittag → rest
                const shiftOrder = ['Vormittag', 'Nachmittag']
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

                return sortedKeys.map(shiftName => (
                  <div key={shiftName} className="mb-1">
                    <div className={`text-[10px] font-semibold ${theme.textMuted} uppercase tracking-wide px-2 pt-1`}>
                      {shiftName === '_absent' ? 'Abwesend' : shiftName === '_other' ? 'Sonstige' : shiftName}
                    </div>
                    {grouped[shiftName].map(sched => {
                      const profile = profileMap[sched.staff_id]
                      if (!profile) return null
                      return (
                        <div
                          key={sched.id}
                          onClick={() => onCellClick(sched.staff_id, dateStr)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer hover:bg-[#FEF3C7]/30 transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full bg-[#F59E0B]/10 flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-[#F59E0B]">
                            {profile.initials}
                          </div>
                          <span className={`text-xs ${theme.textPrimary} truncate`}>
                            {profile.name}
                          </span>
                          {sched.absent && (
                            <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-600" title={sched.absent_reason || 'Abwesend'}>
                              {sched.absent_reason ? sched.absent_reason.substring(0, 4) : 'Abw.'}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))
              })()}
            </div>

            {/* Add button */}
            <button
              onClick={() => {
                // Open modal for adding - pick first available staff or null
                const unscheduledStaff = activeProfiles.find(p => !staffEntries[p.staff_id])
                if (unscheduledStaff) {
                  onCellClick(unscheduledStaff.staff_id, dateStr)
                } else if (activeProfiles.length > 0) {
                  onCellClick(activeProfiles[0].staff_id, dateStr)
                }
              }}
              className={`mx-1.5 mb-1.5 p-1 rounded-lg text-xs ${theme.textMuted} hover:bg-gray-100 hover:text-gray-600 transition-colors flex items-center justify-center gap-1`}
            >
              <Plus size={12} weight="bold" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
