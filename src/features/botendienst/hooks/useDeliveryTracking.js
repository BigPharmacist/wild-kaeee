import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

export function useDeliveryTracking({ session, currentStaff, tourId, isActive = false }) {
  const [isTracking, setIsTracking] = useState(false)
  const [trackingError, setTrackingError] = useState(null)
  const [currentPosition, setCurrentPosition] = useState(null)
  const [driverLocations, setDriverLocations] = useState([])
  const [locationsLoading, setLocationsLoading] = useState(false)

  const watchIdRef = useRef(null)
  const intervalRef = useRef(null)
  const pollingRef = useRef(null)

  // ============================================
  // SEND POSITION TO DATABASE
  // ============================================

  const sendPosition = useCallback(async (position) => {
    if (!currentStaff?.id) return

    const { latitude, longitude, accuracy } = position.coords

    try {
      const { error } = await supabase
        .from('delivery_driver_locations')
        .insert({
          tour_id: tourId || null,
          staff_id: currentStaff.id,
          latitude,
          longitude,
          accuracy,
        })

      if (error) throw error

      setCurrentPosition({
        latitude,
        longitude,
        accuracy,
        timestamp: new Date(),
      })
      setTrackingError(null)
    } catch (err) {
      console.error('Fehler beim Senden der Position:', err)
      setTrackingError(err.message)
    }
  }, [currentStaff?.id, tourId])

  // ============================================
  // START TRACKING
  // ============================================

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setTrackingError('Geolocation wird von diesem Browser nicht unterstützt')
      return
    }

    setTrackingError(null)
    setIsTracking(true)

    // Start geolocation watch
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        sendPosition(position)
      },
      (error) => {
        console.error('Geolocation Fehler:', error)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setTrackingError('Standortzugriff wurde verweigert')
            break
          case error.POSITION_UNAVAILABLE:
            setTrackingError('Standort nicht verfügbar')
            break
          case error.TIMEOUT:
            setTrackingError('Standortabfrage Timeout')
            break
          default:
            setTrackingError('Unbekannter Fehler')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )

    // Also send position every 30 seconds as backup
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => sendPosition(position),
        () => {}, // Ignore errors, watchPosition handles them
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      )
    }, 30000)
  }, [sendPosition])

  // ============================================
  // STOP TRACKING
  // ============================================

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsTracking(false)
  }, [])

  // ============================================
  // GET CURRENT POSITION ONCE
  // ============================================

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation nicht unterstützt'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          resolve({ latitude, longitude, accuracy })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    })
  }, [])

  // ============================================
  // FETCH ALL DRIVER LOCATIONS (for admin map)
  // ============================================

  const fetchDriverLocations = useCallback(async () => {
    if (!session || !currentStaff?.is_admin) return

    setLocationsLoading(true)

    try {
      const { data, error } = await supabase
        .from('delivery_driver_latest_locations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDriverLocations(data || [])
    } catch (err) {
      console.error('Fehler beim Laden der Fahrer-Positionen:', err)
    } finally {
      setLocationsLoading(false)
    }
  }, [session, currentStaff?.is_admin])

  // ============================================
  // FETCH TOUR TRACK (all positions for a tour)
  // ============================================

  const fetchTourTrack = useCallback(async (tourIdToFetch) => {
    if (!session) return []

    try {
      const { data, error } = await supabase
        .from('delivery_driver_locations')
        .select('*')
        .eq('tour_id', tourIdToFetch)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Fehler beim Laden des Tour-Tracks:', err)
      return []
    }
  }, [session])

  // ============================================
  // AUTO-START/STOP TRACKING
  // ============================================

  useEffect(() => {
    if (isActive && !isTracking) {
      startTracking()
    } else if (!isActive && isTracking) {
      stopTracking()
    }
  }, [isActive, isTracking, startTracking, stopTracking])

  // ============================================
  // CLEANUP ON UNMOUNT
  // ============================================

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  // ============================================
  // POLLING FOR ADMIN VIEW
  // ============================================

  useEffect(() => {
    if (!currentStaff?.is_admin || !session) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      return
    }

    // Initial fetch
    fetchDriverLocations()

    // Poll every 30 seconds
    pollingRef.current = setInterval(() => {
      fetchDriverLocations()
    }, 30000)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [currentStaff?.is_admin, session, fetchDriverLocations])

  // ============================================
  // REALTIME SUBSCRIPTION FOR DRIVER LOCATIONS
  // ============================================

  useEffect(() => {
    if (!session || !currentStaff?.is_admin) return

    const channel = supabase
      .channel('driver_locations_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_driver_locations',
        },
        () => {
          fetchDriverLocations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session, currentStaff?.is_admin, fetchDriverLocations])

  return {
    // State
    isTracking,
    trackingError,
    currentPosition,
    driverLocations,
    locationsLoading,

    // Actions
    startTracking,
    stopTracking,
    getCurrentPosition,
    fetchDriverLocations,
    fetchTourTrack,
  }
}
