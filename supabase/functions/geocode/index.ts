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
    const { address, apiKey } = await req.json()

    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Adresse fehlt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API Key fehlt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call Google Maps Geocoding API
    const params = new URLSearchParams({
      address: address,
      key: apiKey,
      language: 'de',
      region: 'de',
    })

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`
    )

    const data = await response.json()

    if (data.status !== 'OK') {
      console.log('Geocoding failed:', data.status, data.error_message)
      return new Response(
        JSON.stringify({
          error: data.error_message || `Geocoding Status: ${data.status}`,
          latitude: null,
          longitude: null,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = data.results[0]
    const location = result.geometry.location

    return new Response(
      JSON.stringify({
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: result.formatted_address,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Geocode error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
