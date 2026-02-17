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
  { bg: 'bg-blue-100', dot: 'bg-blue-500', text: 'text-blue-800' },
  { bg: 'bg-emerald-100', dot: 'bg-emerald-500', text: 'text-emerald-800' },
  { bg: 'bg-violet-100', dot: 'bg-violet-500', text: 'text-violet-800' },
  { bg: 'bg-amber-100', dot: 'bg-amber-500', text: 'text-amber-800' },
  { bg: 'bg-rose-100', dot: 'bg-rose-500', text: 'text-rose-800' },
  { bg: 'bg-cyan-100', dot: 'bg-cyan-500', text: 'text-cyan-800' },
  { bg: 'bg-orange-100', dot: 'bg-orange-500', text: 'text-orange-800' },
  { bg: 'bg-fuchsia-100', dot: 'bg-fuchsia-500', text: 'text-fuchsia-800' },
]

function getStaffColor(staffId) {
  let hash = 0
  for (let i = 0; i < staffId.length; i++) {
    hash = ((hash << 5) - hash) + staffId.charCodeAt(i)
    hash |= 0
  }
  return staffColors[Math.abs(hash) % staffColors.length]
}

export function BotenWidgetContent({ theme, pharmacyId }) {
  const [schedules, setSchedules] = useState([])
  const [shifts, setShifts] = useState([])
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

    const [{ data: shiftsData }, { data: schedulesData }] = await Promise.all([
      supabase
        .from('mj_shifts')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .eq('active', true)
        .order('start_time'),
      supabase
        .from('mj_schedules')
        .select('*, staff:staff!mj_schedules_staff_id_fkey(first_name), shift:mj_shifts!mj_schedules_shift_id_fkey(name, active)')
        .eq('pharmacy_id', pharmacyId)
        .gte('date', toLocalDateStr(monday))
        .lte('date', toLocalDateStr(friday)),
    ])

    setShifts(shiftsData || [])
    // Nur Schedules mit aktiven Schichten
    setSchedules((schedulesData || []).filter(s => s.shift?.active !== false))
    setLoading(false)
  }, [pharmacyId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData() }, [fetchData])

  // Shift-Reihenfolge
  const shiftOrder = ['Vormittag', 'Nachmittag']
  const sortedShifts = [...shifts].sort((a, b) => {
    const iA = shiftOrder.indexOf(a.name)
    const iB = shiftOrder.indexOf(b.name)
    if (iA !== -1 && iB !== -1) return iA - iB
    if (iA !== -1) return -1
    if (iB !== -1) return 1
    return a.name.localeCompare(b.name)
  })

  if (loading) {
    return <p className={`text-xs ${theme.textMuted}`}>Boten werden geladen...</p>
  }

  if (schedules.length === 0) {
    return <p className={`text-sm ${theme.textMuted}`}>Keine Boten eingeteilt.</p>
  }

  return (
    <div>
      {/* Tage-Header */}
          <div className="grid grid-cols-5 gap-1 mb-1.5">
            {weekDates.map((date, i) => {
              const dateStr = toLocalDateStr(date)
              const isToday = dateStr === todayStr
              return (
                <div key={dateStr} className="text-center">
                  <span className={`text-[10px] font-semibold ${isToday ? theme.accentText : theme.textMuted}`}>
                    {dayLabels[i]}
                  </span>
                  <br />
                  <span className={`text-[9px] ${isToday ? theme.accentText : theme.textMuted}`}>
                    {date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Pro Schicht eine Zeile */}
          {sortedShifts.map(shift => (
            <div key={shift.id} className="mb-1.5">
              <p className={`text-[9px] font-medium ${theme.textMuted} mb-0.5 uppercase tracking-wider`}>
                {shift.name}
              </p>
              <div className="grid grid-cols-5 gap-1">
                {weekDates.map(date => {
                  const dateStr = toLocalDateStr(date)
                  const isToday = dateStr === todayStr
                  const dayEntries = schedules.filter(s => s.date === dateStr && s.shift_id === shift.id && !s.absent)
                  const absentEntries = schedules.filter(s => s.date === dateStr && s.shift_id === shift.id && s.absent)

                  return (
                    <div
                      key={dateStr}
                      className={`rounded-md px-1 py-0.5 min-h-[22px] flex flex-col items-center justify-center ${
                        isToday ? 'ring-1 ring-[#F59E0B]/40 ' : ''
                      }${dayEntries.length > 0 || absentEntries.length > 0 ? 'bg-gray-50' : 'bg-gray-50'}`}
                    >
                      {dayEntries.map(s => {
                        const color = getStaffColor(s.staff_id)
                        return (
                          <span key={s.id} className={`text-[10px] font-semibold leading-tight truncate w-full text-center ${color.text}`}>
                            {s.staff?.first_name}
                          </span>
                        )
                      })}
                      {absentEntries.map(s => (
                        <span key={s.id} className="text-[9px] text-gray-400 line-through leading-tight truncate w-full text-center">
                          {s.staff?.first_name}
                        </span>
                      ))}
                      {dayEntries.length === 0 && absentEntries.length === 0 && (
                        <span className={`text-[10px] ${theme.textMuted}`}>–</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

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
