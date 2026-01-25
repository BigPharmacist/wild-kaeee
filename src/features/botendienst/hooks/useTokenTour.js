import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

/**
 * Hook für Token-basierten Zugriff auf Touren (ohne Login)
 */
export function useTokenTour(token) {
  const [tour, setTour] = useState(null)
  const [stops, setStops] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Tour per Token laden
  const fetchTour = useCallback(async () => {
    if (!token) {
      setLoading(false)
      setError('Kein Token angegeben')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase
        .rpc('get_tour_by_token', { tour_token: token })

      if (rpcError) throw rpcError

      if (!data || !data.tour) {
        setError('Tour nicht gefunden oder nicht mehr aktiv')
        setTour(null)
        setStops([])
      } else {
        setTour(data.tour)
        setStops(data.stops || [])
      }
    } catch (err) {
      console.error('Fehler beim Laden der Tour:', err)
      setError('Fehler beim Laden der Tour')
    } finally {
      setLoading(false)
    }
  }, [token])

  // Initial laden
  useEffect(() => {
    fetchTour()
  }, [fetchTour])

  // Stop aktualisieren
  const updateStop = useCallback(async (stopId, updates) => {
    if (!token) return false

    try {
      const { data, error: rpcError } = await supabase
        .rpc('update_stop_by_token', {
          tour_token: token,
          stop_id: stopId,
          new_status: updates.status || null,
          new_cash_collected: updates.cash_collected ?? null,
          new_cash_collected_amount: updates.cash_collected_amount ?? null,
          new_cash_notes: updates.cash_notes || null,
          new_stop_notes: updates.stop_notes || null,
          new_completed_at: updates.completed_at || null,
        })

      if (rpcError) throw rpcError
      if (data?.error) throw new Error(data.error)

      // Lokalen State aktualisieren
      setStops(prev => prev.map(s =>
        s.id === stopId ? { ...s, ...updates } : s
      ))

      return true
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Stops:', err)
      return false
    }
  }, [token])

  // Stop als erledigt markieren
  const completeStop = useCallback(async (stopId) => {
    return updateStop(stopId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
  }, [updateStop])

  // Kassierung markieren
  const markCashCollected = useCallback(async (stopId, amount, notes) => {
    return updateStop(stopId, {
      cash_collected: true,
      cash_collected_amount: amount,
      cash_notes: notes,
    })
  }, [updateStop])

  // Foto hinzufügen
  const addPhoto = useCallback(async (stopId, photoUrl, caption) => {
    if (!token) return null

    try {
      const { data, error: rpcError } = await supabase
        .rpc('add_photo_by_token', {
          tour_token: token,
          p_stop_id: stopId,
          p_photo_url: photoUrl,
          p_caption: caption || null,
        })

      if (rpcError) throw rpcError
      if (data?.error) throw new Error(data.error)

      // Lokalen State aktualisieren
      setStops(prev => prev.map(s =>
        s.id === stopId
          ? { ...s, photos: [...(s.photos || []), data] }
          : s
      ))

      return data
    } catch (err) {
      console.error('Fehler beim Hinzufügen des Fotos:', err)
      return null
    }
  }, [token])

  // Signatur hinzufügen
  const addSignature = useCallback(async (stopId, signatureUrl, signerName, latitude, longitude) => {
    if (!token) return null

    try {
      const { data, error: rpcError } = await supabase
        .rpc('add_signature_by_token', {
          tour_token: token,
          p_stop_id: stopId,
          p_signature_url: signatureUrl,
          p_signer_name: signerName || null,
          p_latitude: latitude || null,
          p_longitude: longitude || null,
        })

      if (rpcError) throw rpcError
      if (data?.error) throw new Error(data.error)

      // Lokalen State aktualisieren
      setStops(prev => prev.map(s =>
        s.id === stopId
          ? { ...s, signature: [...(s.signature || []), data] }
          : s
      ))

      return data
    } catch (err) {
      console.error('Fehler beim Hinzufügen der Signatur:', err)
      return null
    }
  }, [token])

  // Statistiken berechnen
  const getStats = useCallback(() => {
    const totalStops = stops.length
    const completedStops = stops.filter(s => s.status === 'completed').length
    const totalPackages = stops.reduce((sum, s) => sum + (s.package_count || 0), 0)
    const totalCash = stops.reduce((sum, s) => sum + (s.cash_amount || 0), 0)
    const collectedCash = stops
      .filter(s => s.cash_collected)
      .reduce((sum, s) => sum + (s.cash_collected_amount || s.cash_amount || 0), 0)
    const progress = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0

    return { totalStops, completedStops, totalPackages, totalCash, collectedCash, progress }
  }, [stops])

  // Fahrername setzen (einmalig)
  const setDriverName = useCallback(async (driverName) => {
    if (!token || !driverName) return null

    try {
      const { data, error: rpcError } = await supabase
        .rpc('set_driver_name_by_token', {
          tour_token: token,
          p_driver_name: driverName,
        })

      if (rpcError) throw rpcError

      // Tour-State aktualisieren
      if (data) {
        setTour(data)
      }

      return data
    } catch (err) {
      console.error('Fehler beim Setzen des Fahrernamens:', err)
      return null
    }
  }, [token])

  // Tour-Abschluss mit Notizen speichern
  const submitTourCompletion = useCallback(async (driverNotes, vehicleIssues) => {
    if (!token) return false

    try {
      const { data, error: rpcError } = await supabase
        .rpc('complete_tour_by_token', {
          tour_token: token,
          p_driver_notes: driverNotes || null,
          p_vehicle_issues: vehicleIssues || null,
        })

      if (rpcError) throw rpcError
      if (data?.error) throw new Error(data.error)

      // Tour-State aktualisieren
      if (data) {
        setTour(data)
      }

      return true
    } catch (err) {
      console.error('Fehler beim Abschließen der Tour:', err)
      return false
    }
  }, [token])

  return {
    tour,
    stops,
    loading,
    error,
    refresh: fetchTour,
    updateStop,
    completeStop,
    markCashCollected,
    addPhoto,
    addSignature,
    getStats,
    setDriverName,
    submitTourCompletion,
  }
}
