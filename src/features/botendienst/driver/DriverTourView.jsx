import { useState, useEffect } from 'react'
import {
  MapPin,
  Package,
  Money,
  Phone,
  NavigationArrow,
  Check,
  X,
  ArrowClockwise,
  Camera,
  PencilSimpleLine,
  Note,
  Key,
  CaretRight,
  Clock,
  House,
} from '@phosphor-icons/react'
import { StopStatusBadge, PriorityBadge } from '../shared'

export function DriverTourView({
  theme,
  tour,
  stops,
  currentPosition,
  onCompleteStop,
  onSkipStop,
  onRescheduleStop,
  onOpenSignature,
  onOpenPhoto,
  onOpenCash,
  onSelectStop,
  getNavigationUrl,
  onExitDriverMode,
}) {
  const [activeStopId, setActiveStopId] = useState(null)

  // Auto-select first pending stop
  useEffect(() => {
    if (stops.length > 0 && !activeStopId) {
      const firstPending = stops.find(s => s.status === 'pending' || s.status === 'in_progress')
      if (firstPending) {
        setActiveStopId(firstPending.id)
      }
    }
  }, [stops, activeStopId])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0)
  }

  // Calculate progress
  const completedStops = stops.filter(s => s.status === 'completed').length
  const totalStops = stops.length
  const progress = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0

  // Calculate totals
  const totalCash = stops.reduce((sum, s) => sum + parseFloat(s.cash_amount || 0), 0)
  const collectedCash = stops
    .filter(s => s.cash_collected)
    .reduce((sum, s) => sum + parseFloat(s.cash_amount || 0), 0)
  const remainingCash = totalCash - collectedCash

  if (!tour) {
    return (
      <div className={`flex flex-col items-center justify-center h-screen ${theme.surface}`}>
        <MapPin size={64} className={theme.textMuted} />
        <p className={`mt-4 text-lg font-medium ${theme.textPrimary}`}>
          Keine aktive Tour
        </p>
        <p className={`text-sm ${theme.textMuted}`}>
          Warte auf Zuweisung durch Admin
        </p>
        <button
          onClick={onExitDriverMode}
          className={`mt-6 flex items-center gap-2 px-4 py-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
        >
          <House size={18} />
          <span className="text-sm">Zurück zur App</span>
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Tour Header - Sticky */}
      <div className={`p-4 ${theme.surface} border-b ${theme.border} sticky top-0 z-10 flex-shrink-0`}>
        <div className="flex items-center justify-between mb-2">
          <h1 className={`text-lg font-semibold ${theme.textPrimary}`}>
            {tour.name || 'Aktive Tour'}
          </h1>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Aktiv
          </span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className={theme.textMuted}>Fortschritt</span>
              <span className={theme.textPrimary}>{completedStops}/{totalStops} Stops</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          {remainingCash > 0 && (
            <div className="text-right">
              <p className="text-xs text-green-600 font-medium">
                {formatCurrency(remainingCash)}
              </p>
              <p className="text-xs text-gray-500">offen</p>
            </div>
          )}
        </div>
      </div>

      {/* Stops List */}
      <div className="flex-1 overflow-auto overscroll-contain">
        {stops.map((stop, index) => {
          const isActive = activeStopId === stop.id
          const isCompleted = stop.status === 'completed'
          const isSkipped = stop.status === 'skipped'
          const isPending = stop.status === 'pending' || stop.status === 'in_progress'
          const deliveryNotes = stop.stop_notes || stop.customer?.delivery_notes
          const accessInfo = stop.customer?.access_info

          return (
            <div
              key={stop.id}
              className={`border-b ${theme.border} ${
                isActive ? 'bg-amber-50' : isCompleted ? 'bg-green-50/50' : ''
              }`}
            >
              {/* Stop Header - Always visible */}
              <button
                onClick={() => setActiveStopId(isActive ? null : stop.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  {/* Number */}
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isSkipped
                        ? 'bg-amber-500 text-white'
                        : stop.priority === 'urgent'
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                  }`}>
                    {isCompleted ? <Check size={16} weight="bold" /> : index + 1}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium truncate ${
                        isCompleted ? 'text-green-700' : theme.textPrimary
                      }`}>
                        {stop.customer_name || stop.customer?.name || 'Unbekannt'}
                      </h3>
                      {stop.priority !== 'normal' && (
                        <PriorityBadge priority={stop.priority} size="xs" showLabel={false} />
                      )}
                    </div>
                    <p className={`text-sm truncate ${theme.textMuted}`}>
                      {stop.street}
                    </p>
                  </div>

                  {/* Right side info */}
                  <div className="flex items-center gap-2">
                    {stop.cash_amount > 0 && !stop.cash_collected && isPending && (
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(stop.cash_amount)}
                      </span>
                    )}
                    {stop.cash_collected && (
                      <span className="text-sm text-green-600">
                        <Check size={16} weight="bold" />
                      </span>
                    )}
                    <CaretRight
                      size={20}
                      className={`transition-transform ${isActive ? 'rotate-90' : ''} ${theme.textMuted}`}
                    />
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {isActive && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Full Address */}
                  <div className={`p-3 rounded-lg ${theme.bg}`}>
                    <div className="flex items-start gap-2">
                      <MapPin size={18} className={`text-gray-500 mt-0.5`} />
                      <div className="flex-1">
                        <p className={`font-medium ${theme.textPrimary}`}>
                          {stop.customer_name || stop.customer?.name}
                        </p>
                        <p className={`text-sm ${theme.textSecondary}`}>{stop.street}</p>
                        <p className={`text-sm ${theme.textSecondary}`}>
                          {stop.postal_code} {stop.city}
                        </p>
                      </div>
                      <a
                        href={getNavigationUrl(stop)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-blue-500 text-white"
                      >
                        <NavigationArrow size={20} weight="fill" />
                      </a>
                    </div>

                    {/* Phone */}
                    {(stop.customer?.phone || stop.phone) && (
                      <a
                        href={`tel:${stop.customer?.phone || stop.phone}`}
                        className="mt-2 flex items-center gap-2 text-sm text-blue-600"
                      >
                        <Phone size={14} />
                        {stop.customer?.phone || stop.phone}
                      </a>
                    )}
                  </div>

                  {/* Notes */}
                  {deliveryNotes && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex items-start gap-2">
                        <Note size={16} className="text-amber-600 mt-0.5" />
                        <p className="text-sm text-amber-800">{deliveryNotes}</p>
                      </div>
                    </div>
                  )}

                  {accessInfo && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-start gap-2">
                        <Key size={16} className="text-blue-600 mt-0.5" />
                        <p className="text-sm text-blue-800">{accessInfo}</p>
                      </div>
                    </div>
                  )}

                  {/* Package & Cash Info */}
                  <div className="flex gap-4">
                    {stop.package_count > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package size={16} className="text-gray-500" />
                        <span>{stop.package_count} Paket{stop.package_count !== 1 ? 'e' : ''}</span>
                      </div>
                    )}
                    {stop.cash_amount > 0 && (
                      <div className={`flex items-center gap-2 text-sm ${
                        stop.cash_collected ? 'text-green-600' : 'text-amber-600 font-medium'
                      }`}>
                        <Money size={16} />
                        <span>
                          {formatCurrency(stop.cash_amount)}
                          {stop.cash_collected && ' kassiert'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {isPending && (
                    <div className="space-y-3">
                      {/* Primary Actions */}
                      {(() => {
                        const hasPhoto = stop.photos?.length > 0
                        const hasSignature = stop.signature?.length > 0
                        const hasProof = hasPhoto || hasSignature

                        return (
                          <>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                onClick={() => onOpenPhoto(stop.id)}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg ${hasPhoto ? 'bg-green-50 ring-2 ring-green-500' : theme.bg} hover:bg-gray-100`}
                              >
                                <Camera size={24} className={hasPhoto ? 'text-green-600' : 'text-gray-600'} />
                                <span className={`text-xs ${hasPhoto ? 'text-green-600 font-medium' : ''}`}>
                                  {hasPhoto ? '✓ Foto' : 'Foto'}
                                </span>
                              </button>
                              <button
                                onClick={() => onOpenSignature(stop.id)}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg ${hasSignature ? 'bg-green-50 ring-2 ring-green-500' : theme.bg} hover:bg-gray-100`}
                              >
                                <PencilSimpleLine size={24} className={hasSignature ? 'text-green-600' : 'text-gray-600'} />
                                <span className={`text-xs ${hasSignature ? 'text-green-600 font-medium' : ''}`}>
                                  {hasSignature ? '✓ Unterschrift' : 'Unterschrift'}
                                </span>
                              </button>
                              {stop.cash_amount > 0 && !stop.cash_collected && (
                                <button
                                  onClick={() => onOpenCash(stop.id, stop.cash_amount)}
                                  className="flex flex-col items-center gap-1 p-3 rounded-lg bg-green-50 hover:bg-green-100"
                                >
                                  <Money size={24} className="text-green-600" />
                                  <span className="text-xs text-green-600">Kassieren</span>
                                </button>
                              )}
                            </div>

                            {/* Hinweis wenn kein Nachweis */}
                            {!hasProof && (
                              <p className="text-xs text-amber-600 text-center">
                                Foto oder Unterschrift erforderlich
                              </p>
                            )}

                            {/* Complete / Skip */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => onCompleteStop(stop.id, currentPosition)}
                                disabled={!hasProof}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium ${
                                  hasProof
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                <Check size={20} weight="bold" />
                                Erledigt
                              </button>
                              <button
                                onClick={() => onSkipStop(stop.id)}
                                className="px-4 py-3 rounded-lg bg-amber-100 text-amber-700"
                                title="Überspringen"
                              >
                                <X size={20} weight="bold" />
                              </button>
                              <button
                                onClick={() => onRescheduleStop(stop.id)}
                                className="px-4 py-3 rounded-lg bg-purple-100 text-purple-700"
                                title="Verschieben"
                              >
                                <ArrowClockwise size={20} />
                              </button>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}

                  {/* Completed Info */}
                  {isCompleted && stop.completed_at && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Clock size={14} />
                      Erledigt um {new Date(stop.completed_at).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Exit Driver Mode */}
      <div className={`p-3 ${theme.surface} border-t ${theme.border} flex-shrink-0`}>
        <button
          onClick={onExitDriverMode}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
        >
          <House size={18} />
          <span className="text-sm">Zurück zur App</span>
        </button>
      </div>
    </div>
  )
}
