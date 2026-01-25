import { Check, Clock, X, ArrowClockwise, FastForward } from '@phosphor-icons/react'

const statusConfig = {
  pending: {
    label: 'Ausstehend',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    icon: Clock,
  },
  in_progress: {
    label: 'In Bearbeitung',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    icon: FastForward,
  },
  completed: {
    label: 'Erledigt',
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: Check,
  },
  skipped: {
    label: 'Übersprungen',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    icon: X,
  },
  rescheduled: {
    label: 'Verschoben',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    icon: ArrowClockwise,
  },
}

export function StopStatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || statusConfig.pending
  const Icon = config.icon

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs gap-1',
    sm: 'px-2 py-1 text-xs gap-1.5',
    md: 'px-2.5 py-1.5 text-sm gap-2',
  }

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 16,
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
