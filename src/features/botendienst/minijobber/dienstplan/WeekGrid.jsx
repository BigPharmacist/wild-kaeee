import { toLocalDateStr } from '../shared/staffColors'
import { WeekBlock } from './WeekBlock'

const dayNamesShort = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

export function WeekGrid({ theme, profiles, weekDates, schedules, shifts, holidayMap, onCellClick }) {
  const days = weekDates.map(date => {
    const dateStr = toLocalDateStr(date)
    return {
      date,
      dateStr,
      dayName: dayNamesShort[date.getDay()],
      isToday: dateStr === toLocalDateStr(new Date()),
      isHoliday: !!holidayMap[dateStr],
      holidayName: holidayMap[dateStr] || null,
    }
  })

  return (
    <div className={`${theme.surface} border ${theme.border} rounded-2xl overflow-hidden shadow-[0_4px_12px_rgba(30,41,59,0.08)]`}>
      <WeekBlock
        theme={theme}
        days={days}
        schedules={schedules}
        shifts={shifts}
        profiles={profiles}
        onCellClick={onCellClick}
      />
    </div>
  )
}
