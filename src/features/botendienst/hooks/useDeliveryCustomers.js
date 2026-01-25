import { useState, useCallback } from 'react'
import { supabase, supabaseUrl } from '../../../lib/supabase'

// Cache for Google Maps API Key
let cachedGoogleMapsKey = null

// Get Google Maps API Key from database
async function getGoogleMapsApiKey() {
  if (cachedGoogleMapsKey) return cachedGoogleMapsKey

  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('key')
      .eq('name', 'Google Maps Routes')
      .single()

    if (error) throw error
    cachedGoogleMapsKey = data?.key
    return cachedGoogleMapsKey
  } catch (err) {
    console.error('Fehler beim Laden des Google Maps API Keys:', err)
    return null
  }
}

// Internal geocoding function using Google Maps API via Edge Function
async function geocodeAddressInternal(street, postalCode, city) {
  try {
    const apiKey = await getGoogleMapsApiKey()
    if (!apiKey) {
      console.warn('Google Maps API Key nicht gefunden, Geocoding übersprungen')
      return null
    }

    const address = `${street}, ${postalCode} ${city}, Germany`
    console.log('Google Geocoding:', address)

    const response = await fetch(`${supabaseUrl}/functions/v1/geocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address, apiKey }),
    })

    const data = await response.json()

    if (data.error) {
      console.warn('Geocoding Fehler:', data.error)
      return null
    }

    if (data.latitude && data.longitude) {
      console.log('Koordinaten gefunden:', data.latitude, data.longitude, data.formattedAddress)
      return {
        latitude: data.latitude,
        longitude: data.longitude,
      }
    }

    return null
  } catch (err) {
    console.error('Geocoding Fehler:', err)
    return null
  }
}

export function useDeliveryCustomers({ session, pharmacyId }) {
  const [customers, setCustomers] = useState([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customersError, setCustomersError] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Customer form state
  const [customerForm, setCustomerForm] = useState({
    name: '',
    street: '',
    postal_code: '',
    city: '',
    phone: '',
    delivery_notes: '',
    access_info: '',
  })

  // ============================================
  // FETCH ALL CUSTOMERS
  // ============================================

  const fetchCustomers = useCallback(async () => {
    if (!session || !pharmacyId) return

    setCustomersLoading(true)
    setCustomersError(null)

    try {
      const { data, error } = await supabase
        .from('delivery_customers')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('name', { ascending: true })

      if (error) throw error
      setCustomers(data || [])
    } catch (err) {
      console.error('Fehler beim Laden der Kunden:', err)
      setCustomersError(err.message)
    } finally {
      setCustomersLoading(false)
    }
  }, [session, pharmacyId])

  // ============================================
  // SEARCH CUSTOMERS
  // ============================================

  const searchCustomers = useCallback(async (query) => {
    if (!session || !pharmacyId || !query || query.length < 2) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)

    try {
      const { data, error } = await supabase
        .from('delivery_customers')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .or(`name.ilike.%${query}%,street.ilike.%${query}%`)
        .order('name', { ascending: true })
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (err) {
      console.error('Fehler bei der Kundensuche:', err)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [session, pharmacyId])

  // ============================================
  // CREATE CUSTOMER
  // ============================================

  const createCustomer = useCallback(async (customerData) => {
    if (!session || !pharmacyId) return null

    try {
      // Auto-geocode if coordinates are missing
      let { latitude, longitude } = customerData
      if (!latitude || !longitude) {
        if (customerData.street && (customerData.postal_code || customerData.city)) {
          console.log('Geocoding Adresse:', customerData.street, customerData.postal_code, customerData.city)
          const coords = await geocodeAddressInternal(
            customerData.street,
            customerData.postal_code || '',
            customerData.city || ''
          )
          if (coords) {
            latitude = coords.latitude
            longitude = coords.longitude
            console.log('Koordinaten gefunden:', latitude, longitude)
          } else {
            console.log('Keine Koordinaten gefunden')
          }
        }
      }

      const { data, error } = await supabase
        .from('delivery_customers')
        .insert({
          pharmacy_id: pharmacyId,
          name: customerData.name,
          street: customerData.street,
          postal_code: customerData.postal_code,
          city: customerData.city,
          phone: customerData.phone || null,
          delivery_notes: customerData.delivery_notes || null,
          access_info: customerData.access_info || null,
          latitude: latitude || null,
          longitude: longitude || null,
        })
        .select()
        .single()

      if (error) throw error

      // Refresh customers list
      await fetchCustomers()
      return data
    } catch (err) {
      console.error('Fehler beim Erstellen des Kunden:', err)
      setCustomersError(err.message)
      return null
    }
  }, [session, pharmacyId, fetchCustomers])

  // ============================================
  // UPDATE CUSTOMER
  // ============================================

  const updateCustomer = useCallback(async (customerId, updates) => {
    if (!session) return false

    try {
      const { error } = await supabase
        .from('delivery_customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId)

      if (error) throw error

      // Refresh customers list
      await fetchCustomers()
      return true
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Kunden:', err)
      setCustomersError(err.message)
      return false
    }
  }, [session, fetchCustomers])

  // ============================================
  // DELETE CUSTOMER
  // ============================================

  const deleteCustomer = useCallback(async (customerId) => {
    if (!session) return false

    try {
      const { error } = await supabase
        .from('delivery_customers')
        .delete()
        .eq('id', customerId)

      if (error) throw error

      // Refresh customers list
      await fetchCustomers()
      return true
    } catch (err) {
      console.error('Fehler beim Löschen des Kunden:', err)
      setCustomersError(err.message)
      return false
    }
  }, [session, fetchCustomers])

  // ============================================
  // FIND OR CREATE CUSTOMER
  // ============================================

  const findOrCreateCustomer = useCallback(async (customerData) => {
    if (!session || !pharmacyId) return null

    try {
      // First try to find existing customer by name and street
      const { data: existing, error: searchError } = await supabase
        .from('delivery_customers')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .ilike('name', customerData.name)
        .ilike('street', customerData.street)
        .limit(1)
        .single()

      if (searchError && searchError.code !== 'PGRST116') throw searchError

      if (existing) {
        let updatedCustomer = { ...existing }
        let needsUpdate = false
        const updates = {}

        // NICHT mehr automatisch delivery_notes überschreiben!
        // Tour-spezifische Hinweise werden jetzt als stop_notes beim Stop gespeichert.
        // Kunden-delivery_notes sind nur für persistente Hinweise (manuell im Kundenstamm gepflegt).

        // Geocode if coordinates are missing
        if (!existing.latitude || !existing.longitude) {
          const street = existing.street || customerData.street
          const postalCode = existing.postal_code || customerData.postal_code
          const city = existing.city || customerData.city
          if (street && (postalCode || city)) {
            console.log('Geocoding existierenden Kunden:', existing.name, street)
            const coords = await geocodeAddressInternal(street, postalCode || '', city || '')
            if (coords) {
              updates.latitude = coords.latitude
              updates.longitude = coords.longitude
              updatedCustomer.latitude = coords.latitude
              updatedCustomer.longitude = coords.longitude
              needsUpdate = true
              console.log('Koordinaten für existierenden Kunden gefunden:', coords.latitude, coords.longitude)
            }
          }
        }

        if (needsUpdate) {
          await updateCustomer(existing.id, updates)
        }
        return updatedCustomer
      }

      // Create new customer
      return await createCustomer(customerData)
    } catch (err) {
      console.error('Fehler bei findOrCreateCustomer:', err)
      return null
    }
  }, [session, pharmacyId, createCustomer, updateCustomer])

  // ============================================
  // GEOCODE ADDRESS
  // ============================================

  const geocodeAddress = useCallback(async (street, postalCode, city) => {
    try {
      const query = encodeURIComponent(`${street}, ${postalCode} ${city}, Germany`)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'KaeeeApp/1.0',
          },
        }
      )

      if (!response.ok) throw new Error('Geocoding fehlgeschlagen')

      const data = await response.json()
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        }
      }
      return null
    } catch (err) {
      console.error('Geocoding Fehler:', err)
      return null
    }
  }, [])

  // ============================================
  // UPDATE CUSTOMER COORDINATES
  // ============================================

  const updateCustomerCoordinates = useCallback(async (customerId, street, postalCode, city) => {
    const coords = await geocodeAddress(street, postalCode, city)
    if (coords) {
      return updateCustomer(customerId, {
        latitude: coords.latitude,
        longitude: coords.longitude,
      })
    }
    return false
  }, [geocodeAddress, updateCustomer])

  return {
    // State
    customers,
    customersLoading,
    customersError,
    searchResults,
    searchLoading,
    customerForm,
    setCustomerForm,

    // Actions
    fetchCustomers,
    searchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    findOrCreateCustomer,
    geocodeAddress,
    updateCustomerCoordinates,
  }
}
