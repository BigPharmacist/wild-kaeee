import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowsClockwise, MapPin } from '@phosphor-icons/react'

// Fix für Leaflet Marker Icons in React
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom Marker Icon erstellen
const createCourierIcon = (isActive) => {
  return L.divIcon({
    className: 'courier-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${isActive ? '#10B981' : '#6B7280'};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="18" height="18" viewBox="0 0 256 256" fill="white">
          <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  })
}

// Komponente um Karte auf Marker zu zentrieren
const FitBounds = ({ locations }) => {
  const map = useMap()

  useEffect(() => {
    if (locations.length === 0) return

    const bounds = L.latLngBounds(
      locations.map((loc) => [loc.latitude, loc.longitude])
    )
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
  }, [locations, map])

  return null
}

const CourierMap = ({
  theme,
  courierLocations,
  locationsLoading,
  onRefresh,
}) => {
  const mapRef = useRef(null)

  // Standard-Zentrum (Deutschland)
  const defaultCenter = [51.1657, 10.4515]
  const defaultZoom = 6

  const formatTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Gerade eben'
    if (diffMins < 60) return `vor ${diffMins} Min.`

    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const activeLocations = courierLocations.filter((loc) => loc.is_active)

  return (
    <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} overflow-hidden`}>
      <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
        <div>
          <h3 className="text-base font-semibold">Boten-Standorte</h3>
          <p className={`text-xs ${theme.textMuted}`}>
            {activeLocations.length} {activeLocations.length === 1 ? 'Bote' : 'Boten'} aktiv
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={locationsLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${theme.accentText} hover:bg-[#E8F0FE] transition-colors disabled:opacity-50`}
        >
          <ArrowsClockwise size={14} className={locationsLoading ? 'animate-spin' : ''} />
          Aktualisieren
        </button>
      </div>

      <div className="h-[400px] relative">
        {courierLocations.length === 0 && !locationsLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <MapPin size={48} className={theme.textMuted} />
            <p className={`mt-2 ${theme.textMuted}`}>Keine aktiven Boten</p>
          </div>
        ) : (
          <MapContainer
            ref={mapRef}
            center={defaultCenter}
            zoom={defaultZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {courierLocations.map((location) => (
              <Marker
                key={location.id}
                position={[location.latitude, location.longitude]}
                icon={createCourierIcon(location.is_active)}
              >
                <Popup>
                  <div className="min-w-[150px]">
                    <div className="flex items-center gap-2 mb-2">
                      {location.avatar_url ? (
                        <img
                          src={location.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs text-zinc-600">
                          {(location.first_name?.[0] || '') + (location.last_name?.[0] || '')}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {location.first_name} {location.last_name}
                        </p>
                        <p className={`text-xs ${location.is_active ? 'text-emerald-600' : 'text-zinc-500'}`}>
                          {location.is_active ? 'Auf Tour' : 'Inaktiv'}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 space-y-0.5">
                      <p>Aktualisiert: {formatTime(location.created_at)}</p>
                      {location.accuracy && (
                        <p>Genauigkeit: ~{Math.round(location.accuracy)}m</p>
                      )}
                      {location.speed && location.speed > 0 && (
                        <p>Geschwindigkeit: {Math.round(location.speed * 3.6)} km/h</p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {courierLocations.length > 0 && <FitBounds locations={courierLocations} />}
          </MapContainer>
        )}
      </div>

      {/* Liste der Boten unter der Karte */}
      {courierLocations.length > 0 && (
        <div className="p-4 border-t border-[#E5E7EB]">
          <div className="flex flex-wrap gap-2">
            {courierLocations.map((location) => (
              <div
                key={location.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
                  location.is_active
                    ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                    : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${location.is_active ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                {location.first_name} {location.last_name}
                <span className="text-[10px] opacity-70">{formatTime(location.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default CourierMap
