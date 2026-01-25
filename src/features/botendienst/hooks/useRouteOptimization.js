import { useState, useCallback } from 'react'

// Decode Google Maps encoded polyline
function decodePolyline(encoded) {
  if (!encoded) return []

  const points = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const dlat = result & 1 ? ~(result >> 1) : result >> 1
    lat += dlat

    shift = 0
    result = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const dlng = result & 1 ? ~(result >> 1) : result >> 1
    lng += dlng

    points.push([lat / 1e5, lng / 1e5])
  }

  return points
}

export function useRouteOptimization() {
  const [optimizing, setOptimizing] = useState(false)
  const [optimizationError, setOptimizationError] = useState(null)
  const [routeDetails, setRouteDetails] = useState(null)
  const [routePolyline, setRoutePolyline] = useState(null) // Decoded polyline points

  // ============================================
  // OPTIMIZE ROUTE WITH GOOGLE MAPS DIRECTIONS API (via Edge Function)
  // ============================================

  const optimizeRoute = useCallback(async (stops, startAddress = null, apiKey, supabaseUrl) => {
    if (!stops || stops.length < 2) {
      setOptimizationError('Mindestens 2 Stops für Optimierung erforderlich')
      return null
    }

    if (!apiKey) {
      setOptimizationError('Google Maps API Key fehlt')
      return null
    }

    setOptimizing(true)
    setOptimizationError(null)
    setRouteDetails(null)
    setRoutePolyline(null)

    try {
      // Call Edge Function to avoid CORS issues
      const response = await fetch(`${supabaseUrl}/functions/v1/optimize-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stops,
          startAddress,
          apiKey,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Routenoptimierung fehlgeschlagen')
      }

      setRouteDetails(data.details)

      // Decode and store polyline for map display
      const decodedPolyline = data.encodedPolyline ? decodePolyline(data.encodedPolyline) : null
      setRoutePolyline(decodedPolyline)

      return {
        optimizedStops: data.optimizedStops,
        details: data.details,
        routePolyline: decodedPolyline,
        encodedPolyline: data.encodedPolyline, // For DB storage
        message: data.message,
      }
    } catch (err) {
      console.error('Route optimization error:', err)
      setOptimizationError(err.message)
      return null
    } finally {
      setOptimizing(false)
    }
  }, [])

  // ============================================
  // SIMPLE DISTANCE-BASED OPTIMIZATION (No API)
  // ============================================

  const optimizeRouteSimple = useCallback((stops) => {
    if (!stops || stops.length < 2) {
      return { stops, method: 'none', message: 'Mindestens 2 Stops erforderlich' }
    }

    // Filter stops with coordinates
    const stopsWithCoords = stops.filter(s => s.latitude && s.longitude)
    const stopsWithoutCoords = stops.filter(s => !s.latitude || !s.longitude)

    // If we have enough coordinates, use nearest-neighbor algorithm
    if (stopsWithCoords.length >= 2) {
      const optimized = [stopsWithCoords[0]]
      const remaining = [...stopsWithCoords.slice(1)]

      while (remaining.length > 0) {
        const current = optimized[optimized.length - 1]
        let nearestIndex = 0
        let nearestDistance = Infinity

        remaining.forEach((stop, index) => {
          const distance = calculateDistance(
            current.latitude,
            current.longitude,
            stop.latitude,
            stop.longitude
          )
          if (distance < nearestDistance) {
            nearestDistance = distance
            nearestIndex = index
          }
        })

        optimized.push(remaining[nearestIndex])
        remaining.splice(nearestIndex, 1)
      }

      // Add stops without coordinates at the end
      const result = [...optimized, ...stopsWithoutCoords].map((stop, index) => ({
        ...stop,
        sort_order: index,
      }))

      return { stops: result, method: 'coordinates', message: 'Nach Entfernung optimiert' }
    }

    // Fallback: Sort by postal code (rough geographic sorting)
    const sorted = [...stops].sort((a, b) => {
      const plzA = a.postal_code || ''
      const plzB = b.postal_code || ''
      return plzA.localeCompare(plzB)
    })

    const result = sorted.map((stop, index) => ({
      ...stop,
      sort_order: index,
    }))

    return { stops: result, method: 'postal_code', message: 'Nach PLZ sortiert (keine Koordinaten vorhanden)' }
  }, [])

  // ============================================
  // CALCULATE DISTANCE BETWEEN TWO POINTS (Haversine)
  // ============================================

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth's radius in km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const toRad = (deg) => deg * (Math.PI / 180)

  // ============================================
  // GET DIRECTIONS URL FOR GOOGLE MAPS
  // ============================================

  const getGoogleMapsUrl = useCallback((stops) => {
    if (!stops || stops.length === 0) return null

    const addresses = stops
      .filter(s => s.street)
      .map(s => encodeURIComponent(`${s.street}, ${s.postal_code || ''} ${s.city || ''}`))

    if (addresses.length === 0) return null

    if (addresses.length === 1) {
      return `https://www.google.com/maps/search/?api=1&query=${addresses[0]}`
    }

    const origin = addresses[0]
    const destination = addresses[addresses.length - 1]
    const waypoints = addresses.slice(1, -1).join('|')

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
    if (waypoints) {
      url += `&waypoints=${waypoints}`
    }
    url += '&travelmode=driving'

    return url
  }, [])

  // ============================================
  // GET DIRECTIONS URL FOR SINGLE ADDRESS
  // ============================================

  const getNavigationUrl = useCallback((stop) => {
    if (!stop || !stop.street) return null

    const address = encodeURIComponent(
      `${stop.street}, ${stop.postal_code || ''} ${stop.city || ''}, Germany`
    )

    // Return Google Maps navigation URL
    return `https://www.google.com/maps/dir/?api=1&destination=${address}&travelmode=driving`
  }, [])

  // Load polyline from stored encoded string (e.g., from database)
  const loadEncodedPolyline = useCallback((encodedString) => {
    if (!encodedString) {
      setRoutePolyline(null)
      return null
    }
    const decoded = decodePolyline(encodedString)
    setRoutePolyline(decoded)
    return decoded
  }, [])

  return {
    // State
    optimizing,
    optimizationError,
    routeDetails,
    routePolyline,

    // Actions
    optimizeRoute,
    optimizeRouteSimple,
    getGoogleMapsUrl,
    getNavigationUrl,
    calculateDistance,
    clearRoutePolyline: () => setRoutePolyline(null),
    loadEncodedPolyline,
  }
}
