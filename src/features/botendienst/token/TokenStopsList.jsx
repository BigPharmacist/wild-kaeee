import {
  MapPin,
  Package,
  Money,
  Check,
  NavigationArrow,
  Camera,
  PencilSimpleLine,
  Note,
  CaretDown,
  CaretUp,
  Phone,
  CircleNotch,
  CheckCircle,
  User,
  ArrowClockwise,
} from '@phosphor-icons/react'

export function TokenStopsList({
  tour,
  stops,
  stats,
  driverName,
  expandedStop,
  setExpandedStop,
  onCompleteStop,
  onShowCash,
  onShowPhoto,
  onShowSignature,
  onShowNotes,
  actionLoading,
  formatDate,
  formatCurrency,
  onRefresh,
}) {
  const getNavigationUrl = (stop) => {
    const address = `${stop.street}, ${stop.postal_code} ${stop.city}`
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
  }

  const sortedStops = [...stops].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {tour.name || 'Botendienst'}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{formatDate(tour.date)}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User size={14} />
                  {driverName}
                </span>
              </div>
            </div>
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Aktualisieren"
            >
              <ArrowClockwise size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Fortschritt</span>
              <span className="font-medium text-gray-900">
                {stats.completedStops} / {stats.totalStops} Stops
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <Package size={16} />
              <span>{stats.totalPackages} Pakete</span>
            </div>
            {stats.totalCash > 0 && (
              <div className="flex items-center gap-1 text-red-700">
                <Money size={16} />
                <span>{formatCurrency(stats.totalCash - stats.collectedCash)} offen</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stops List */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {sortedStops.map((stop, index) => {
          const isCompleted = stop.status === 'completed'
          const isExpanded = expandedStop === stop.id
          const hasPhoto = stop.photos?.length > 0
          const hasSignature = stop.signature?.length > 0

          return (
            <div
              key={stop.id}
              className={`bg-white rounded-xl border overflow-hidden transition-all ${
                isCompleted ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
              }`}
            >
              {/* Stop Header */}
              <button
                onClick={() => setExpandedStop(isExpanded ? null : stop.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  {/* Number Badge */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isCompleted ? <Check size={16} weight="bold" /> : index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium truncate ${isCompleted ? 'text-green-800' : 'text-gray-900'}`}>
                        {stop.customer_name || stop.customer?.name || 'Unbekannt'}
                      </span>
                      {stop.priority === 'urgent' && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                          Dringend
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                      {stop.street}, {stop.postal_code} {stop.city}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      {stop.package_count > 1 && (
                        <span className="flex items-center gap-0.5 text-gray-500">
                          <Package size={12} />
                          {stop.package_count}x
                        </span>
                      )}
                      {stop.cash_amount > 0 && (
                        <span className={`flex items-center gap-0.5 ${
                          stop.cash_collected ? 'text-green-600' : 'text-red-700 font-medium'
                        }`}>
                          <Money size={12} />
                          {formatCurrency(stop.cash_amount)}
                          {stop.cash_collected && <Check size={10} />}
                        </span>
                      )}
                      {(hasPhoto || hasSignature) && (
                        <span className="flex items-center gap-1 text-gray-400">
                          {hasPhoto && <Camera size={12} />}
                          {hasSignature && <PencilSimpleLine size={12} />}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand Icon */}
                  {isExpanded ? (
                    <CaretUp size={20} className="text-gray-400" />
                  ) : (
                    <CaretDown size={20} className="text-gray-400" />
                  )}
                </div>

                {/* Quick Actions - immer sichtbar */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  {/* Telefon */}
                  {stop.customer?.phone && (
                    <a
                      href={`tel:${stop.customer.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
                    >
                      <Phone size={16} />
                      <span className="truncate max-w-[100px]">{stop.customer.phone}</span>
                    </a>
                  )}
                  {/* Navigation */}
                  <a
                    href={getNavigationUrl(stop)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-sm font-medium"
                  >
                    <NavigationArrow size={16} />
                    Navigation
                  </a>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  {/* Notes */}
                  {(stop.stop_notes || stop.customer?.delivery_notes) && (
                    <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-start gap-2">
                        <Note size={16} className="text-red-700 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-800">
                          {stop.stop_notes || stop.customer?.delivery_notes}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 space-y-2">
                    {/* Complete Button */}
                    {!isCompleted && (
                      <>
                        <button
                          onClick={() => onCompleteStop(stop.id)}
                          disabled={actionLoading === stop.id}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                            actionLoading === stop.id
                              ? 'bg-green-400 text-white cursor-wait'
                              : 'bg-green-500 text-white hover:bg-green-600 active:scale-98'
                          }`}
                        >
                          {actionLoading === stop.id ? (
                            <CircleNotch size={20} className="animate-spin" />
                          ) : (
                            <CheckCircle size={20} />
                          )}
                          {actionLoading === stop.id ? 'Wird gespeichert...' : 'Als erledigt markieren'}
                        </button>
                      </>
                    )}

                    {/* Cash Collection */}
                    {stop.cash_amount > 0 && !stop.cash_collected && (
                      <button
                        onClick={() => onShowCash(stop)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-red-500 text-red-700 font-medium hover:bg-red-50"
                      >
                        <Money size={20} />
                        {formatCurrency(stop.cash_amount)} kassieren
                      </button>
                    )}

                    {/* Foto, Unterschrift, Notizen - Buttons */}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => onShowPhoto(stop)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-all ${
                          hasPhoto
                            ? 'border border-green-300 bg-green-50 text-green-700'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Camera size={18} />
                        Foto
                        {hasPhoto && <Check size={14} />}
                      </button>
                      <button
                        onClick={() => onShowSignature(stop)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-all ${
                          hasSignature
                            ? 'border border-green-300 bg-green-50 text-green-700'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <PencilSimpleLine size={18} />
                        Unterschrift
                        {hasSignature && <Check size={14} />}
                      </button>
                      <button
                        onClick={() => onShowNotes(stop)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                      >
                        <Note size={18} />
                        Notiz
                      </button>
                    </div>
                  </div>

                  {/* Completed Info */}
                  {isCompleted && stop.completed_at && (
                    <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle size={18} />
                        <span className="text-sm font-medium">
                          Erledigt um {new Date(stop.completed_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {sortedStops.length === 0 && (
          <div className="text-center py-12">
            <MapPin size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Keine Stops in dieser Tour</p>
          </div>
        )}
      </div>
    </div>
  )
}
