const shiftConfig = {
  Vormittag: { bg: 'bg-blue-100', text: 'text-blue-700', short: 'VM' },
  Nachmittag: { bg: 'bg-orange-100', text: 'text-orange-700', short: 'NM' },
  Fahrradbote: { bg: 'bg-green-100', text: 'text-green-700', short: 'FB' },
}

export function MjShiftBadge({ shiftName, compact = false }) {
  const config = shiftConfig[shiftName] || { bg: 'bg-gray-100', text: 'text-gray-700', short: '?' }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {compact ? config.short : shiftName}
    </span>
  )
}
