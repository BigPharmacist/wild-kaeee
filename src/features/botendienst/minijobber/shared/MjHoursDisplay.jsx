export function MjHoursDisplay({ hours, showSign = false, className = '' }) {
  const value = parseFloat(hours) || 0
  const formatted = value.toFixed(2).replace('.', ',')
  const display = showSign && value > 0 ? `+${formatted}` : formatted

  let color = ''
  if (showSign) {
    if (value > 0) color = 'text-green-600'
    else if (value < 0) color = 'text-red-600'
  }

  return (
    <span className={`${color} ${className}`}>
      {display} Std.
    </span>
  )
}
