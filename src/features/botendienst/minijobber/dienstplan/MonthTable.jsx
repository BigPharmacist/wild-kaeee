import { Copy, ClipboardText, X } from '@phosphor-icons/react'
import { toLocalDateStr } from '../shared/staffColors'
import { GanttWeekBlock } from './GanttWeekBlock'

const dayNamesShort = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const dayNamesWeek = ['Mo', 'Di', 'Mi', 'Do', 'Fr']

function getISOWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
}

/** Pad a partial week to always have 5 slots (Mon–Fri). */
function padWeekDays(weekDays) {
  const padded = Array(5).fill(null)
  for (const day of weekDays) {
    padded[day.dayOfWeek - 1] = day // dayOfWeek 1=Mon … 5=Fri
  }
  return padded.map((d, i) => d || { empty: true, dayName: dayNamesWeek[i] })
}

export function MonthTable({ theme, profiles, schedules, shifts, holidayMap, year, month, onCellClick, copySourceWeek, onCopySource, onPasteWeek }) {
  const todayStr = toLocalDateStr(new Date())
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const allDays = Array.from({ length: daysInMonth }, (_, i) => {
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

  // Group by ISO week
  const weeks = []
  let currentKw = null
  let currentWeek = null
  for (const day of allDays) {
    const kw = getISOWeek(day.date)
    if (kw !== currentKw) {
      currentKw = kw
      currentWeek = { kw, days: [] }
      weeks.push(currentWeek)
    }
    currentWeek.days.push(day)
  }
  for (const week of weeks) {
    week.startDate = week.days[0].dateStr
    week.endDate = week.days[week.days.length - 1].dateStr
  }

  return (
    <div className="space-y-4">
      {weeks.map(week => (
        <div
          key={week.kw}
          className={`${theme.surface} border ${theme.border} rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(30,41,59,0.08)]`}
        >
          {/* ── KW Header with Copy/Paste ── */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#F8FAFC] border-b border-[#CBD5E1]">
            <div className="group/kw flex items-center shrink-0">
              {copySourceWeek?.kw === week.kw ? (
                /* Source week selected */
                <>
                  <span className="inline-flex items-center justify-center bg-amber-400 text-white rounded-full px-2.5 py-0.5 text-xs font-bold ring-2 ring-amber-300">
                    KW {week.kw}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCopySource(null) }}
                    className="ml-1 p-0.5 rounded-full text-amber-500 hover:bg-amber-100"
                    title="Kopieren abbrechen"
                  >
                    <X size={14} weight="bold" />
                  </button>
                </>
              ) : copySourceWeek ? (
                /* Other week — show paste button */
                <>
                  <span className="inline-flex items-center justify-center bg-[#FEF3C7] text-[#92400E] rounded-full px-2.5 py-0.5 text-xs font-bold">
                    KW {week.kw}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onPasteWeek({ kw: week.kw, startDate: week.startDate, endDate: week.endDate }) }}
                    className="ml-1 p-0.5 rounded-full text-amber-600 hover:bg-amber-100"
                    title={`In KW ${week.kw} einfügen`}
                  >
                    <ClipboardText size={14} weight="bold" />
                  </button>
                </>
              ) : (
                /* Normal — hover to show copy */
                <>
                  <span className="inline-flex items-center justify-center bg-[#FEF3C7] text-[#92400E] rounded-full px-2.5 py-0.5 text-xs font-bold">
                    KW {week.kw}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onCopySource({ kw: week.kw, startDate: week.startDate, endDate: week.endDate }) }}
                    className="ml-1 p-0.5 rounded-full text-gray-400 hover:text-amber-600 hover:bg-amber-100 opacity-0 group-hover/kw:opacity-100 transition-opacity"
                    title={`KW ${week.kw} kopieren`}
                  >
                    <Copy size={14} weight="bold" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Week grid ── */}
          <GanttWeekBlock
            theme={theme}
            days={padWeekDays(week.days)}
            schedules={schedules}
            shifts={shifts}
            profiles={profiles}
            onCellClick={onCellClick}
          />
        </div>
      ))}
    </div>
  )
}
