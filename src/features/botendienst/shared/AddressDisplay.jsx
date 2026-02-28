import { MapPin, Phone, Note, Key, NavigationArrow } from '@phosphor-icons/react'

export function AddressDisplay({
  name,
  street,
  postalCode,
  city,
  phone,
  deliveryNotes,
  accessInfo,
  showNavigation = false,
  onNavigate,
  compact = false,
  theme,
}) {
  const textClass = theme?.textPrimary || 'text-gray-900'
  const mutedClass = theme?.textMuted || 'text-gray-500'

  if (compact) {
    return (
      <div className="flex items-start gap-2">
        <MapPin size={16} className={mutedClass} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${textClass}`}>{name}</p>
          <p className={`text-xs ${mutedClass} truncate`}>
            {street}{postalCode || city ? `, ${postalCode} ${city}` : ''}
          </p>
        </div>
        {showNavigation && (
          <button
            onClick={onNavigate}
            className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
            title="Navigation starten"
          >
            <NavigationArrow size={16} weight="fill" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Name and Address */}
      <div className="flex items-start gap-2">
        <MapPin size={18} className={`${mutedClass} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${textClass}`}>{name}</p>
          <p className={`text-sm ${mutedClass}`}>{street}</p>
          {(postalCode || city) && (
            <p className={`text-sm ${mutedClass}`}>
              {postalCode} {city}
            </p>
          )}
        </div>
        {showNavigation && (
          <button
            onClick={onNavigate}
            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
            title="Navigation starten"
          >
            <NavigationArrow size={20} weight="fill" />
          </button>
        )}
      </div>

      {/* Phone */}
      {phone && (
        <div className="flex items-center gap-2">
          <Phone size={18} className={`${mutedClass} flex-shrink-0`} />
          <a
            href={`tel:${phone}`}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            {phone}
          </a>
        </div>
      )}

      {/* Delivery Notes */}
      {deliveryNotes && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
          <Note size={18} className="text-red-700 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{deliveryNotes}</p>
        </div>
      )}

      {/* Access Info */}
      {accessInfo && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
          <Key size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">{accessInfo}</p>
        </div>
      )}
    </div>
  )
}
