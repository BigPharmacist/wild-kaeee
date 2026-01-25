import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { User, MapPin, Clock, Package, Check, FirstAid } from '@phosphor-icons/react'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons
const createIcon = (color, type = 'stop') => {
  const svg = type === 'driver'
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="white"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="40"><path d="M12 0C7.31 0 3.5 3.81 3.5 8.5C3.5 14.88 12 24 12 24S20.5 14.88 20.5 8.5C20.5 3.81 16.69 0 12 0Z" fill="${color}" stroke="white" stroke-width="1.5"/><circle cx="12" cy="8.5" r="4" fill="white"/></svg>`

  return L.divIcon({
    className: 'custom-marker',
    html: svg,
    iconSize: type === 'driver' ? [32, 32] : [28, 40],
    iconAnchor: type === 'driver' ? [16, 16] : [14, 40],
    popupAnchor: [0, type === 'driver' ? -16 : -40],
  })
}

const stopIcons = {
  pending: createIcon('#6B7280'), // gray
  in_progress: createIcon('#3B82F6'), // blue
  completed: createIcon('#22C55E'), // green
  skipped: createIcon('#F59E0B'), // amber
  urgent: createIcon('#EF4444'), // red
}

const driverIcon = createIcon('#8B5CF6', 'driver') // purple

// Pharmacy icon (green cross)
const pharmacyIcon = L.divIcon({
  className: 'custom-marker',
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="36" height="36">
    <circle cx="16" cy="16" r="14" fill="#0D9488" stroke="white" stroke-width="2"/>
    <rect x="13" y="8" width="6" height="16" rx="1" fill="white"/>
    <rect x="8" y="13" width="16" height="6" rx="1" fill="white"/>
  </svg>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
})

// Component to auto-fit map bounds (only on tour change, not on every render)
function MapBounds({ positions, tourId }) {
  const map = useMap()
  const lastTourIdRef = useRef(null)

  useEffect(() => {
    // Only fit bounds when tour changes, not on every render
    if (positions && positions.length > 0 && tourId !== lastTourIdRef.current) {
      lastTourIdRef.current = tourId
      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, positions, tourId])

  return null
}

export function TourMap({
  theme,
  stops = [],
  driverLocations = [],
  selectedTourId,
  onSelectStop,
  showTrack = false,
  tourTrack = [],
  pharmacy = null, // Apotheke als Start/Endpunkt
  routePolyline = null, // Google Maps Directions Route
}) {
  const [mapCenter, setMapCenter] = useState([50.0, 8.0]) // Default: Germany center
  const mapRef = useRef(null)

  // Filter stops with coordinates
  const stopsWithCoords = stops.filter(s => s.latitude && s.longitude)

  // Pharmacy position
  const pharmacyPosition = pharmacy?.latitude && pharmacy?.longitude
    ? [parseFloat(pharmacy.latitude), parseFloat(pharmacy.longitude)]
    : null

  // Get all positions for bounds calculation
  const allPositions = [
    ...(pharmacyPosition ? [pharmacyPosition] : []),
    ...stopsWithCoords.map(s => [parseFloat(s.latitude), parseFloat(s.longitude)]),
    ...driverLocations.map(d => [parseFloat(d.latitude), parseFloat(d.longitude)]),
  ]

  // Calculate center if we have positions
  useEffect(() => {
    if (allPositions.length > 0) {
      const avgLat = allPositions.reduce((sum, p) => sum + p[0], 0) / allPositions.length
      const avgLng = allPositions.reduce((sum, p) => sum + p[1], 0) / allPositions.length
      setMapCenter([avgLat, avgLng])
    }
  }, [stopsWithCoords.length, driverLocations.length])

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Create polyline for tour track
  const trackPositions = tourTrack
    .filter(t => t.latitude && t.longitude)
    .map(t => [parseFloat(t.latitude), parseFloat(t.longitude)])

  // Create polyline connecting stops in order (from pharmacy -> stops -> pharmacy)
  const stopsPolyline = [
    ...(pharmacyPosition ? [pharmacyPosition] : []),
    ...stopsWithCoords.map(s => [parseFloat(s.latitude), parseFloat(s.longitude)]),
    ...(pharmacyPosition ? [pharmacyPosition] : []), // zurück zur Apotheke
  ]

  return (
    <div className={`${theme.surface} ${theme.border} border rounded-xl overflow-hidden`}>
      <div className="p-4 border-b border-gray-100">
        <h2 className={`font-semibold ${theme.textPrimary}`}>Karte</h2>
        <p className={`text-sm ${theme.textMuted}`}>
          {stopsWithCoords.length} Stops mit Koordinaten
          {driverLocations.length > 0 && ` • ${driverLocations.length} aktive Fahrer`}
        </p>
      </div>

      <div className="h-[500px]">
        <MapContainer
          center={mapCenter}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {allPositions.length > 0 && <MapBounds positions={allPositions} tourId={selectedTourId} />}

          {/* Pharmacy marker (Start/End) */}
          {pharmacyPosition && (
            <Marker
              position={pharmacyPosition}
              icon={pharmacyIcon}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <FirstAid size={18} className="text-teal-600" weight="fill" />
                    <span className="font-medium">{pharmacy.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {pharmacy.street}
                    <br />
                    {pharmacy.postal_code} {pharmacy.city}
                  </p>
                  <p className="text-xs text-teal-600 mt-2 font-medium">
                    Start &amp; Ziel der Tour
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Stop markers */}
          {stopsWithCoords.map((stop, index) => {
            const icon = stop.priority === 'urgent'
              ? stopIcons.urgent
              : stopIcons[stop.status] || stopIcons.pending

            return (
              <Marker
                key={stop.id}
                position={[parseFloat(stop.latitude), parseFloat(stop.longitude)]}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectStop && onSelectStop(stop),
                }}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium">
                        {stop.customer_name || stop.customer?.name || 'Unbekannt'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {stop.street}
                      {(stop.postal_code || stop.city) && <><br />{stop.postal_code} {stop.city}</>}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {stop.package_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Package size={12} />
                          {stop.package_count} Pakete
                        </span>
                      )}
                      {stop.status === 'completed' && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Check size={12} />
                          Erledigt
                        </span>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Driver markers */}
          {driverLocations.map(driver => (
            <Marker
              key={driver.id}
              position={[parseFloat(driver.latitude), parseFloat(driver.longitude)]}
              icon={driverIcon}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-purple-600" />
                    <span className="font-medium">
                      {driver.first_name} {driver.last_name}
                    </span>
                  </div>
                  {driver.tour_name && (
                    <p className="text-sm text-gray-600">{driver.tour_name}</p>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Clock size={12} />
                    {formatTime(driver.created_at)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Route polyline - Google Maps optimized route or fallback to straight lines */}
          {routePolyline && routePolyline.length > 1 ? (
            <Polyline
              positions={routePolyline}
              color="#4285F4"
              weight={4}
              opacity={0.9}
            />
          ) : stopsPolyline.length > 1 && (
            <Polyline
              positions={stopsPolyline}
              color="#F59E0B"
              weight={3}
              opacity={0.7}
              dashArray="10, 5"
            />
          )}

          {/* Track polyline (actual driver path) */}
          {showTrack && trackPositions.length > 1 && (
            <Polyline
              positions={trackPositions}
              color="#8B5CF6"
              weight={3}
              opacity={0.8}
            />
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="p-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs">
        {pharmacyPosition && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">+</span>
            </div>
            <span className={theme.textMuted}>Apotheke (Start/Ziel)</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-500" />
          <span className={theme.textMuted}>Ausstehend</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className={theme.textMuted}>In Bearbeitung</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className={theme.textMuted}>Erledigt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className={theme.textMuted}>Dringend</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-500 ring-2 ring-white" />
          <span className={theme.textMuted}>Fahrer</span>
        </div>
        {routePolyline ? (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-[#4285F4] rounded" />
            <span className={theme.textMuted}>Google Maps Route</span>
          </div>
        ) : stopsPolyline.length > 1 && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-amber-500 rounded" style={{ borderStyle: 'dashed' }} />
            <span className={theme.textMuted}>Geplante Route</span>
          </div>
        )}
      </div>
    </div>
  )
}
