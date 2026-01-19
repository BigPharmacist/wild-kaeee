import { useState, useEffect } from 'react'
import { ArrowsClockwise, MapPin, NavigationArrow } from '@phosphor-icons/react'

const CourierTable = ({
  theme,
  courierLocations,
  locationsLoading,
  onRefresh,
}) => {
  const [addresses, setAddresses] = useState({})
  const [loadingAddresses, setLoadingAddresses] = useState({})

  // Reverse Geocoding mit Nominatim (OpenStreetMap)
  const fetchAddress = async (staffId, lat, lng) => {
    if (addresses[staffId] || loadingAddresses[staffId]) return

    setLoadingAddresses((prev) => ({ ...prev, [staffId]: true }))

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'de',
          },
        }
      )
      const data = await response.json()

      if (data.address) {
        const { road, house_number, postcode, city, town, village } = data.address
        const street = road ? `${road}${house_number ? ` ${house_number}` : ''}` : null
        const place = city || town || village || ''
        const address = [street, postcode, place].filter(Boolean).join(', ')
        setAddresses((prev) => ({ ...prev, [staffId]: address || 'Unbekannt' }))
      } else {
        setAddresses((prev) => ({ ...prev, [staffId]: 'Unbekannt' }))
      }
    } catch (error) {
      console.error('Geocoding Fehler:', error)
      setAddresses((prev) => ({ ...prev, [staffId]: 'Fehler' }))
    }

    setLoadingAddresses((prev) => ({ ...prev, [staffId]: false }))
  }

  // Adressen für alle Standorte laden
  useEffect(() => {
    courierLocations.forEach((loc) => {
      if (!addresses[loc.staff_id] && !loadingAddresses[loc.staff_id]) {
        fetchAddress(loc.staff_id, loc.latitude, loc.longitude)
      }
    })
  }, [courierLocations]) // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Gerade eben'
    if (diffMins < 60) return `vor ${diffMins} Min.`
    if (diffMins < 1440) return `vor ${Math.floor(diffMins / 60)} Std.`

    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const openInMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
  }

  const activeLocations = courierLocations.filter((loc) => loc.is_active)
  const inactiveLocations = courierLocations.filter((loc) => !loc.is_active)

  return (
    <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow}`}>
      <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
        <div>
          <h3 className="text-base font-semibold">Boten-Standorte</h3>
          <p className={`text-xs ${theme.textMuted}`}>
            {activeLocations.length} aktiv, {inactiveLocations.length} inaktiv
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

      {courierLocations.length === 0 && !locationsLoading ? (
        <div className="p-8 text-center">
          <MapPin size={48} className={theme.textMuted} />
          <p className={`mt-2 ${theme.textMuted}`}>Keine Standortdaten vorhanden</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${theme.border} bg-[#F9FAFB]`}>
                <th className={`text-left py-3 px-4 font-medium ${theme.textMuted}`}>Bote</th>
                <th className={`text-left py-3 px-4 font-medium ${theme.textMuted}`}>Status</th>
                <th className={`text-left py-3 px-4 font-medium ${theme.textMuted}`}>Standort</th>
                <th className={`text-left py-3 px-4 font-medium ${theme.textMuted}`}>Genauigkeit</th>
                <th className={`text-left py-3 px-4 font-medium ${theme.textMuted}`}>Aktualisiert</th>
                <th className={`text-center py-3 px-4 font-medium ${theme.textMuted}`}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {courierLocations.map((location) => (
                <tr
                  key={location.id}
                  className={`border-b ${theme.border} hover:bg-[#F9FAFB]`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {location.avatar_url ? (
                        <img
                          src={location.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover border border-[#E5E7EB]"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center text-[10px] text-[#6B7280] bg-[#F4F6FA]">
                          {(location.first_name?.[0] || '') + (location.last_name?.[0] || '')}
                        </div>
                      )}
                      <span className="font-medium">
                        {location.first_name} {location.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                      location.is_active
                        ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${location.is_active ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                      {location.is_active ? 'Auf Tour' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      {loadingAddresses[location.staff_id] ? (
                        <span className={`text-xs ${theme.textMuted}`}>Lade Adresse...</span>
                      ) : addresses[location.staff_id] ? (
                        <span className="text-sm">{addresses[location.staff_id]}</span>
                      ) : (
                        <span className={`text-xs ${theme.textMuted}`}>
                          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                        </span>
                      )}
                      {location.speed && location.speed > 0 && (
                        <span className={`block text-xs ${theme.textMuted}`}>
                          {Math.round(location.speed * 3.6)} km/h
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={theme.textMuted}>
                      ~{Math.round(location.accuracy || 0)}m
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={theme.textMuted}>
                      {formatTime(location.created_at)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => openInMaps(location.latitude, location.longitude)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#4C8BF5] text-white hover:bg-[#3A74D8] transition-colors"
                      title="In Google Maps öffnen"
                    >
                      <NavigationArrow size={14} />
                      Maps
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default CourierTable
