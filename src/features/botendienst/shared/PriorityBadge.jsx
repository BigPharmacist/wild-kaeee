import { CaretUp, CaretDown, Minus, Warning } from '@phosphor-icons/react'

const priorityConfig = {
  low: {
    label: 'Niedrig',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    icon: CaretDown,
  },
  normal: {
    label: 'Normal',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    icon: Minus,
  },
  high: {
    label: 'Hoch',
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    icon: CaretUp,
  },
  urgent: {
    label: 'Dringend',
    bg: 'bg-red-100',
    text: 'text-red-700',
    icon: Warning,
  },
}

export function PriorityBadge({ priority, size = 'sm', showLabel = true }) {
  const config = priorityConfig[priority] || priorityConfig.normal
  const Icon = config.icon

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs gap-0.5',
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-2.5 py-1.5 text-sm gap-1.5',
  }

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 16,
  }

  if (!showLabel) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full ${config.bg} ${config.text} w-6 h-6`}
        title={config.label}
      >
        <Icon size={iconSizes[size]} weight="bold" />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses[size]}`}
    >
      <Icon size={iconSizes[size]} weight="bold" />
      {config.label}
    </span>
  )
}
