import { Check, X } from '@phosphor-icons/react'

const statusConfig = {
  active: {
    label: 'Aktiv',
    bg: 'bg-green-100',
    text: 'text-green-700',
    icon: Check,
  },
  inactive: {
    label: 'Inaktiv',
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    icon: X,
  },
}

export function MjStatusBadge({ active, size = 'sm' }) {
  const config = statusConfig[active ? 'active' : 'inactive']
  const Icon = config.icon

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs gap-1',
    sm: 'px-2 py-1 text-xs gap-1.5',
  }

  const iconSizes = { xs: 12, sm: 14 }

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses[size]}`}>
      <Icon size={iconSizes[size]} weight="bold" />
      {config.label}
    </span>
  )
}
