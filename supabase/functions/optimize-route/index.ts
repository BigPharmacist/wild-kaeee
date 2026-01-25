import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { stops, startAddress, apiKey } = await req.json()

    if (!stops || stops.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Mindestens 2 Stops erforderlich' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API Key fehlt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build waypoints from stops (alle Adressen)
    const waypoints = stops
      .filter((s: any) => s.street && (s.postal_code || s.city))
      .map((s: any) => {
        const address = `${s.street}, ${s.postal_code || ''} ${s.city || ''}, Germany`
        return address.trim()
      })

    if (waypoints.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Nicht genügend gültige Adressen' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Rundfahrt: Start und Ende = Apotheke (oder erster Waypoint wenn keine Apotheke angegeben)
    const origin = startAddress || waypoints[0]
    const destination = startAddress || waypoints[0]  // Zurück zum Start = Rundfahrt

    // ALLE Stops sind Waypoints mit optimize:true
    const allWaypoints = startAddress ? waypoints : waypoints.slice(1) // Wenn startAddress, alle Stops als Waypoints

    // Build Google Maps Directions API URL
    const params = new URLSearchParams({
      origin,
      destination,
      key: apiKey,
      mode: 'driving',
      language: 'de',
    })

    // Alle Waypoints mit optimize:true - Google optimiert die Reihenfolge
    if (allWaypoints.length > 0) {
      params.set('waypoints', 'optimize:true|' + allWaypoints.join('|'))
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
    )

    const data = await response.json()

    if (data.status !== 'OK') {
      return new Response(
        JSON.stringify({ error: data.error_message || `API Status: ${data.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract optimized order from response
    const route = data.routes[0]
    const waypointOrder = route.waypoint_order || []

    // Calculate total distance and duration
    let totalDistance = 0
    let totalDuration = 0

    route.legs.forEach((leg: any) => {
      totalDistance += leg.distance.value
      totalDuration += leg.duration.value
    })

    // Build optimized stops array based on waypoint_order
    // waypoint_order enthält die optimierte Reihenfolge als Indizes der Waypoints
    const stopsWithValidAddress = stops.filter((s: any) => s.street && (s.postal_code || s.city))
    const stopsWithoutAddress = stops.filter((s: any) => !s.street || (!s.postal_code && !s.city))

    // Wenn startAddress angegeben, beziehen sich die Indizes auf alle Stops
    // Sonst auf stops ab Index 1 (weil stop[0] als origin verwendet wurde)
    const relevantStops = startAddress ? stopsWithValidAddress : stopsWithValidAddress.slice(1)

    let optimizedStops: any[] = []

    if (waypointOrder.length > 0) {
      // Sortiere nach Google's optimierter Reihenfolge
      waypointOrder.forEach((orderIndex: number) => {
        if (relevantStops[orderIndex]) {
          optimizedStops.push(relevantStops[orderIndex])
        }
      })
    } else {
      // Keine Optimierung nötig (nur 1 Waypoint)
      optimizedStops = [...relevantStops]
    }

    // Wenn kein startAddress, füge ersten Stop wieder vorne ein
    if (!startAddress && stopsWithValidAddress.length > 0) {
      optimizedStops = [stopsWithValidAddress[0], ...optimizedStops]
    }

    // Stops ohne gültige Adresse am Ende anhängen
    optimizedStops = [...optimizedStops, ...stopsWithoutAddress]

    // Update sort_order on optimized stops
    const result = optimizedStops.map((stop: any, index: number) => ({
      ...stop,
      sort_order: index,
    }))

    const details = {
      totalDistanceKm: (totalDistance / 1000).toFixed(2),
      totalDurationMin: Math.round(totalDuration / 60),
      legs: route.legs.map((leg: any) => ({
        distance: leg.distance.text,
        duration: leg.duration.text,
        startAddress: leg.start_address,
        endAddress: leg.end_address,
      })),
    }

    // Encoded polyline für Kartendarstellung
    const encodedPolyline = route.overview_polyline?.points || null

    return new Response(
      JSON.stringify({
        optimizedStops: result,
        details,
        encodedPolyline,
        message: `Route optimiert: ${details.totalDistanceKm} km, ca. ${details.totalDurationMin} Min.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
