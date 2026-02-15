import { CaretLeft, CaretRight } from '@phosphor-icons/react'

const monthNames = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

export function MjMonthSelector({ theme, year, month, onChange }) {
  const goBack = () => {
    if (month === 1) {
      onChange(year - 1, 12)
    } else {
      onChange(year, month - 1)
    }
  }

  const goForward = () => {
    if (month === 12) {
      onChange(year + 1, 1)
    } else {
      onChange(year, month + 1)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={goBack}
        className={`p-1.5 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
        title="Vorheriger Monat"
      >
        <CaretLeft size={18} weight="bold" />
      </button>
      <span className={`text-sm font-semibold ${theme.textPrimary} min-w-[140px] text-center`}>
        {monthNames[month - 1]} {year}
      </span>
      <button
        onClick={goForward}
        className={`p-1.5 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
        title="Nächster Monat"
      >
        <CaretRight size={18} weight="bold" />
      </button>
    </div>
  )
}
