import { Plus } from '@phosphor-icons/react'
import { getStaffColor, getStaffInitials } from '../shared/staffColors'

const SHIFT_ORDER = ['Vormittag', 'Nachmittag']

function getShiftColors() {
  return { bg: 'bg-white', badge: 'bg-gray-100 text-gray-600' }
}

function formatTime(t) {
  return t ? t.substring(0, 5) : ''
}

/**
 * Gantt-style week block for the month view.
 * CSS Grid: 150px label column + 5 × 1fr day columns.
 */
export function GanttWeekBlock({ theme, days, schedules, shifts, profiles, onCellClick }) {
  // Profile lookup
  const profileMap = {}
  profiles.forEach(p => {
    profileMap[p.staff_id] = { ...p, firstName: p.staff?.first_name || '?' }
  })
  const activeProfiles = profiles.filter(p => p.active)

  // Sort active shifts
  const activeShifts = shifts.filter(s => s.active !== false).sort((a, b) => {
    const iA = SHIFT_ORDER.indexOf(a.name)
    const iB = SHIFT_ORDER.indexOf(b.name)
    if (iA !== -1 && iB !== -1) return iA - iB
    if (iA !== -1) return -1
    if (iB !== -1) return 1
    return a.name.localeCompare(b.name)
  })

  // Build schedule map: dateStr → shiftId → [entries]
  const scheduleMap = {}
  schedules.forEach(s => {
    if (!scheduleMap[s.date]) scheduleMap[s.date] = {}
    const shiftId = s.shift_id || '_none'
    if (!scheduleMap[s.date][shiftId]) scheduleMap[s.date][shiftId] = []
    scheduleMap[s.date][shiftId].push(s)
  })

  return (
    <div>
      {/* ── Day headers: label spacer + 5 day columns ── */}
      <div className="grid" style={{ gridTemplateColumns: '150px repeat(5, 1fr)' }}>
        {/* Label spacer */}
        <div className="border-b border-[#CBD5E1]" />

        {days.map((day, i) => (
          <div
            key={day.dateStr || `empty-${i}`}
            className={`px-3 py-2.5 border-b border-[#CBD5E1] ${
              i > 0 ? 'border-l border-l-[#E2E8F0]' : 'border-l border-l-[#E2E8F0]'
            } ${
              day.empty ? '' :
              day.isToday ? 'bg-[#FEE2E2]/50' :
              day.isHoliday ? 'bg-red-50/50' : ''
            }`}
          >
            {day.empty ? (
              <div className="h-5" />
            ) : (
              <div className="flex items-center gap-1">
                <span className={`text-sm font-bold ${
                  day.isToday ? 'text-[#92400E]' :
                  day.isHoliday ? 'text-red-600' :
                  theme.textPrimary
                }`}>
                  {day.dayName}
                </span>
                <span className={`text-sm ${
                  day.isToday ? 'text-[#92400E]/70' :
                  day.isHoliday ? 'text-red-500' :
                  'text-gray-400'
                }`}>
                  {day.date.getDate()}.
                </span>
                {day.isToday && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#92400E] text-[9px] font-bold ml-auto">
                    Heute
                  </span>
                )}
                {day.isHoliday && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[9px] font-semibold truncate max-w-[80px] ml-auto" title={day.holidayName}>
                    {day.holidayName}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Shift sections (one row per shift) ── */}
      {activeShifts.map(shift => {
        const colors = getShiftColors(shift.name)
        const timeLabel = (shift.start_time && shift.end_time)
          ? `(${formatTime(shift.start_time)}–${formatTime(shift.end_time)})`
          : ''

        // Entries per day column
        const entriesPerDay = days.map(day =>
          day.empty ? [] : (scheduleMap[day.dateStr]?.[shift.id] || [])
        )

        // Build Gantt segments: consecutive days with same staff merge into bars
        const segments = []
        let currentBar = null

        days.forEach((day, i) => {
          if (day.empty) {
            if (currentBar) { segments.push(currentBar); currentBar = null }
            segments.push({ type: 'empty', colStart: i, colSpan: 1, day })
            return
          }

          const entries = entriesPerDay[i]
          const primaryEntry = entries[0] || null
          const staffId = primaryEntry?.staff_id || null

          if (!primaryEntry) {
            if (currentBar) { segments.push(currentBar); currentBar = null }
            segments.push({ type: 'add', colStart: i, colSpan: 1, day })
            return
          }

          if (currentBar && staffId === currentBar.staffId) {
            currentBar.colSpan++
            currentBar.dayEntries.push({ day, entry: primaryEntry, extras: entries.slice(1) })
          } else {
            if (currentBar) segments.push(currentBar)
            currentBar = {
              type: 'staff',
              staffId,
              colStart: i,
              colSpan: 1,
              dayEntries: [{ day, entry: primaryEntry, extras: entries.slice(1) }]
            }
          }
        })
        if (currentBar) segments.push(currentBar)

        return (
          <div key={shift.id} className="border-t border-[#E2E8F0]">
            <div className="grid" style={{ gridTemplateColumns: '150px 1fr' }}>
              {/* Shift label — spans full height */}
              <div className={`${colors.bg} px-3 py-2 flex flex-col justify-center border-r border-[#E2E8F0]`}>
                <span className={`inline-flex w-fit px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${colors.badge}`}>
                  {shift.name}
                </span>
                {timeLabel && (
                  <span className="text-[10px] text-gray-400 mt-0.5">{timeLabel}</span>
                )}
              </div>

              {/* Right side: Gantt bars */}
              <div className="relative">
                {/* Background columns for today/holiday highlighting */}
                <div className="absolute inset-0 grid grid-cols-5">
                  {days.map((day, i) => (
                    <div
                      key={`bg-${i}`}
                      className={`${
                        day.empty ? '' :
                        day.isToday ? 'bg-[#FEE2E2]/30' :
                        day.isHoliday ? 'bg-red-50/30' : ''
                      } ${i > 0 ? 'border-l border-[#F1F5F9]' : ''}`}
                    />
                  ))}
                </div>

                <div className="relative grid grid-cols-5">
                  {segments.map(seg => {
                    const gridStyle = { gridColumn: `${seg.colStart + 1} / span ${seg.colSpan}` }

                    if (seg.type === 'empty') {
                      return <div key={`empty-${seg.colStart}`} className="min-h-[44px]" style={gridStyle} />
                    }

                    if (seg.type === 'add') {
                      return (
                        <div
                          key={`add-${seg.colStart}`}
                          className="min-h-[44px] flex items-center justify-center group/empty cursor-pointer hover:bg-[#F8FAFC]/60"
                          style={gridStyle}
                          onClick={() => {
                            onCellClick(shift.id, seg.day.dateStr, null)
                          }}
                        >
                          <Plus size={12} className="text-transparent group-hover/empty:text-gray-300 transition-colors" weight="bold" />
                        </div>
                      )
                    }

                    // Staff bar
                    const color = getStaffColor(seg.staffId)
                    const profile = profileMap[seg.staffId]
                    if (!profile) return <div key={`unknown-${seg.colStart}`} className="min-h-[44px]" style={gridStyle} />

                    const initials = getStaffInitials(profile)
                    const anyAbsent = seg.dayEntries.some(de => de.entry.absent)

                    return (
                      <div
                        key={`${seg.staffId}-${seg.colStart}`}
                        className="p-0.5 min-h-[44px]"
                        style={gridStyle}
                      >
                        <div className={`${color.barBg} rounded-lg h-full flex items-center overflow-hidden ${
                          anyAbsent ? 'ring-2 ring-red-300' : ''
                        }`}>
                          {seg.dayEntries.map((de, idx) => (
                            <div
                              key={de.day.dateStr}
                              className={`flex-1 flex items-center gap-1.5 py-2 cursor-pointer hover:brightness-95 min-w-0 ${
                                idx === 0 ? 'pl-2 pr-1' : 'px-1'
                              }`}
                              onClick={() => onCellClick(shift.id, de.day.dateStr, seg.staffId)}
                            >
                              {idx === 0 && (
                                <>
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    de.entry.absent ? `${color.bg} ${color.text} ring-2 ring-red-300` : `${color.bg} ${color.text}`
                                  }`}>
                                    {initials}
                                  </span>
                                  <span className={`text-xs font-medium truncate ${
                                    de.entry.absent ? 'text-red-500 line-through' : theme.textPrimary
                                  }`}>
                                    {profile.firstName}
                                  </span>
                                </>
                              )}
                              {de.entry.absent && idx > 0 && (
                                <span className="text-[9px] text-red-400">abw.</span>
                              )}
                              {de.extras.length > 0 && (
                                <span className="text-[9px] text-gray-500 font-medium ml-auto">+{de.extras.length}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
