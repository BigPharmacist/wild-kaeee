import { MapPin, Play, Stop, Warning } from '@phosphor-icons/react'

const TrackingWidget = ({
  theme,
  isTracking,
  trackingError,
  lastPosition,
  canTrack,
  onStartTracking,
  onStopTracking,
}) => {
  if (!canTrack) {
    return null
  }

  const formatTime = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin size={20} weight="fill" className={isTracking ? 'text-emerald-500' : theme.textMuted} />
          <h3 className="text-sm font-semibold">Standort-Tracking</h3>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isTracking
            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
            : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
        }`}>
          {isTracking ? 'Aktiv' : 'Inaktiv'}
        </div>
      </div>

      {trackingError && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
          <Warning size={16} className="text-rose-500 flex-shrink-0" />
          <p className="text-rose-500 text-xs">{trackingError}</p>
        </div>
      )}

      {lastPosition && (
        <div className={`text-xs ${theme.textMuted} mb-3 space-y-1`}>
          <p>
            Letzte Position: {lastPosition.latitude.toFixed(5)}, {lastPosition.longitude.toFixed(5)}
          </p>
          <p>
            Genauigkeit: ~{Math.round(lastPosition.accuracy || 0)}m
          </p>
          <p>
            Aktualisiert: {formatTime(lastPosition.timestamp)}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={isTracking ? onStopTracking : onStartTracking}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isTracking
            ? 'bg-rose-500 hover:bg-rose-600 text-white'
            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
        }`}
      >
        {isTracking ? (
          <>
            <Stop size={18} weight="fill" />
            Tour beenden
          </>
        ) : (
          <>
            <Play size={18} weight="fill" />
            Tour starten
          </>
        )}
      </button>

      {!isTracking && (
        <p className={`text-xs ${theme.textMuted} mt-2 text-center`}>
          Dein Standort wird während der Tour alle 30 Sekunden übermittelt.
        </p>
      )}
    </div>
  )
}

export default TrackingWidget
