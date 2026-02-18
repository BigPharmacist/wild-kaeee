import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr']

function toLocalDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getMonday(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

const staffColors = [
  { bg: 'bg-[#A8637A]', barBg: 'bg-[#f2b8c6]', text: 'text-white', initials: 'text-[10px]' },
  { bg: 'bg-[#5A9660]', barBg: 'bg-[#a6e0b8]', text: 'text-white', initials: 'text-[10px]' },
  { bg: 'bg-[#7E6AAF]', barBg: 'bg-[#d4b0e3]', text: 'text-white', initials: 'text-[10px]' },
  { bg: 'bg-[#B08840]', barBg: 'bg-[#fad6a6]', text: 'text-white', initials: 'text-[10px]' },
  { bg: 'bg-[#5B82A8]', barBg: 'bg-[#addbef]', text: 'text-white', initials: 'text-[10px]' },
  { bg: 'bg-[#4A9298]', barBg: 'bg-[#a8e5e2]', text: 'text-white', initials: 'text-[10px]' },
  { bg: 'bg-[#B07848]', barBg: 'bg-[#e8c9a0]', text: 'text-white', initials: 'text-[10px]' },
  { bg: 'bg-[#9468A8]', barBg: 'bg-[#c9b8e8]', text: 'text-white', initials: 'text-[10px]' },
]

// Stable color map built from sorted staff IDs
const colorMap = new Map()
function buildColorMap(schedules) {
  colorMap.clear()
  const ids = [...new Set(schedules.map(s => s.staff_id))].sort()
  ids.forEach((id, i) => colorMap.set(id, staffColors[i % staffColors.length]))
}
function getStaffColor(staffId) {
  return colorMap.get(staffId) || staffColors[0]
}

export function BotenWidgetContent({ theme, pharmacyId }) {
  const [schedules, setSchedules] = useState([])
  const [shifts, setShifts] = useState([])
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(true)

  const monday = getMonday(new Date())
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  const weekDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })

  const todayStr = toLocalDateStr(new Date())

  const fetchData = useCallback(async () => {
    if (!pharmacyId) return
    setLoading(true)

    const [{ data: shiftsData }, { data: schedulesData }, { data: holidaysData }] = await Promise.all([
      supabase
        .from('mj_shifts')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .eq('active', true)
        .order('start_time'),
      supabase
        .from('mj_schedules')
        .select('*, staff:staff!mj_schedules_staff_id_fkey(first_name, last_name), shift:mj_shifts!mj_schedules_shift_id_fkey(name, active)')
        .eq('pharmacy_id', pharmacyId)
        .gte('date', toLocalDateStr(monday))
        .lte('date', toLocalDateStr(friday)),
      supabase
        .from('mj_holidays')
        .select('date, name')
        .eq('pharmacy_id', pharmacyId)
        .gte('date', toLocalDateStr(monday))
        .lte('date', toLocalDateStr(friday)),
    ])

    setShifts(shiftsData || [])
    const filtered = (schedulesData || []).filter(s => s.shift?.active !== false)
    setSchedules(filtered)
    setHolidays(holidaysData || [])
    buildColorMap(filtered)
    setLoading(false)
  }, [pharmacyId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData() }, [fetchData])

  // Holiday map
  const holidayMap = {}
  holidays.forEach(h => { holidayMap[h.date] = h.name })

  // Schedule map: date → shiftId → [entries]
  const scheduleMap = {}
  schedules.forEach(s => {
    if (!scheduleMap[s.date]) scheduleMap[s.date] = {}
    const sid = s.shift_id || '_none'
    if (!scheduleMap[s.date][sid]) scheduleMap[s.date][sid] = []
    scheduleMap[s.date][sid].push(s)
  })

  // Shift order
  const shiftOrder = ['Vormittag', 'Nachmittag']
  const sortedShifts = [...shifts].sort((a, b) => {
    const iA = shiftOrder.indexOf(a.name)
    const iB = shiftOrder.indexOf(b.name)
    if (iA !== -1 && iB !== -1) return iA - iB
    if (iA !== -1) return -1
    if (iB !== -1) return 1
    return a.name.localeCompare(b.name)
  })

  // Days with metadata
  const days = weekDates.map(date => {
    const dateStr = toLocalDateStr(date)
    return {
      date,
      dateStr,
      dayName: dayLabels[date.getDay() - 1],
      isToday: dateStr === todayStr,
      isHoliday: !!holidayMap[dateStr],
      holidayName: holidayMap[dateStr] || null,
    }
  })

  if (loading) {
    return <p className={`text-xs ${theme.textMuted}`}>Boten werden geladen...</p>
  }

  if (schedules.length === 0) {
    return <p className={`text-sm ${theme.textMuted}`}>Keine Boten eingeteilt.</p>
  }

  return (
    <div className="space-y-0.5">
      {/* Day headers */}
      <div className="grid grid-cols-5">
        {days.map(day => (
          <div
            key={day.dateStr}
            className={`text-center py-1 ${
              day.isToday ? 'bg-[#FEF3C7]/50 rounded-t-md' :
              day.isHoliday ? 'bg-red-50/50 rounded-t-md' : ''
            }`}
          >
            <span className={`text-[10px] font-bold ${
              day.isToday ? 'text-[#92400E]' :
              day.isHoliday ? 'text-red-600' :
              theme.textMuted
            }`}>
              {day.dayName}
            </span>
            <span className={`text-[9px] ml-0.5 ${
              day.isToday ? 'text-[#92400E]/70' :
              day.isHoliday ? 'text-red-400' :
              theme.textMuted
            }`}>
              {day.date.getDate()}.
            </span>
          </div>
        ))}
      </div>

      {/* Shift rows with Gantt bars */}
      {sortedShifts.map(shift => {
        // Build segments
        const entriesPerDay = days.map(day => scheduleMap[day.dateStr]?.[shift.id] || [])
        const segments = []
        let currentBar = null

        days.forEach((day, i) => {
          if (day.isHoliday) {
            if (currentBar) { segments.push(currentBar); currentBar = null }
            segments.push({ type: 'holiday', colStart: i, colSpan: 1 })
            return
          }

          const entries = entriesPerDay[i]
          const primary = entries.find(e => !e.absent) || null
          const staffId = primary?.staff_id || null

          if (!primary) {
            if (currentBar) { segments.push(currentBar); currentBar = null }
            segments.push({ type: 'empty', colStart: i, colSpan: 1, absent: entries.some(e => e.absent), absentName: entries[0]?.staff?.first_name })
            return
          }

          if (currentBar && staffId === currentBar.staffId) {
            currentBar.colSpan++
          } else {
            if (currentBar) segments.push(currentBar)
            currentBar = {
              type: 'staff',
              staffId,
              colStart: i,
              colSpan: 1,
              name: primary.staff?.first_name || '?',
              initials: ((primary.staff?.first_name?.[0] || '') + (primary.staff?.last_name?.[0] || '')).toUpperCase(),
            }
          }
        })
        if (currentBar) segments.push(currentBar)

        return (
          <div key={shift.id}>
            <div className="relative">
              {/* Background columns for today/holiday */}
              <div className="absolute inset-0 grid grid-cols-5">
                {days.map((day, i) => (
                  <div
                    key={`bg-${i}`}
                    className={`${
                      day.isToday ? 'bg-[#FEF3C7]/30' :
                      day.isHoliday ? 'bg-red-100/60' : ''
                    }`}
                  />
                ))}
              </div>

              {/* Bars */}
              <div className="relative grid grid-cols-5" style={{ minHeight: '26px' }}>
                {segments.map(seg => {
                  const gridStyle = { gridColumn: `${seg.colStart + 1} / span ${seg.colSpan}` }

                  if (seg.type === 'holiday') {
                    return <div key={`h-${seg.colStart}`} style={gridStyle} />
                  }

                  if (seg.type === 'empty') {
                    return (
                      <div key={`e-${seg.colStart}`} className="flex items-center justify-center" style={gridStyle}>
                        {seg.absent ? (
                          <span className="text-[9px] text-gray-400 line-through">{seg.absentName}</span>
                        ) : (
                          <span className={`text-[9px] ${theme.textMuted}`}>–</span>
                        )}
                      </div>
                    )
                  }

                  // Staff Gantt bar
                  const color = getStaffColor(seg.staffId)
                  return (
                    <div key={`s-${seg.staffId}-${seg.colStart}`} className="p-0.5" style={gridStyle}>
                      <div className={`${color.barBg} rounded-md h-full flex items-center gap-1 px-1.5 min-h-[22px]`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${color.bg} ${color.text}`}>
                          {seg.initials}
                        </span>
                        <span className={`text-[10px] font-semibold truncate ${theme.textPrimary}`}>
                          {seg.name}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}

      {/* Footer */}
      <p className={`text-[10px] ${theme.textMuted} pt-1`}>
        KW {getWeekNumber(monday)}
      </p>
    </div>
  )
}

function getWeekNumber(d) {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
  const week1 = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
}
