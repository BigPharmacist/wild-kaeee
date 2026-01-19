import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export function useTracking({ currentStaff, session, isTrackingViewOpen = false }) {
  const [isTracking, setIsTracking] = useState(false)
  const [trackingError, setTrackingError] = useState(null)
  const [lastPosition, setLastPosition] = useState(null)
  const [courierLocations, setCourierLocations] = useState([])
  const [locationsLoading, setLocationsLoading] = useState(false)

  const watchIdRef = useRef(null)
  const intervalRef = useRef(null)
  const pollingRef = useRef(null)

  // Prüfe ob Tracking für den aktuellen User aktiviert ist
  const canTrack = currentStaff?.tracking_enabled === true

  // Position an Supabase senden
  const sendPosition = useCallback(async (position) => {
    if (!currentStaff?.id) return

    const { latitude, longitude, accuracy, heading, speed } = position.coords

    const { error } = await supabase
      .from('courier_locations')
      .insert({
        staff_id: currentStaff.id,
        latitude,
        longitude,
        accuracy,
        heading: heading || null,
        speed: speed || null,
        is_active: true,
      })

    if (error) {
      console.error('Fehler beim Senden der Position:', error)
      setTrackingError(error.message)
    } else {
      setLastPosition({ latitude, longitude, accuracy, timestamp: new Date() })
      setTrackingError(null)
    }
  }, [currentStaff?.id])

  // Tracking starten
  const startTracking = useCallback(() => {
    if (!canTrack) {
      setTrackingError('Tracking ist für diesen Account nicht aktiviert')
      return
    }

    if (!navigator.geolocation) {
      setTrackingError('Geolocation wird von diesem Browser nicht unterstützt')
      return
    }

    setTrackingError(null)
    setIsTracking(true)

    // Geolocation Watch starten
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

    // Zusätzlich alle 30 Sekunden Position senden (falls watchPosition nicht triggert)
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => sendPosition(position),
        () => {}, // Fehler ignorieren, watchPosition kümmert sich darum
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      )
    }, 30000)
  }, [canTrack, sendPosition])

  // Tracking stoppen
  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Letzten Eintrag als inaktiv markieren
    if (currentStaff?.id && lastPosition) {
      await supabase
        .from('courier_locations')
        .insert({
          staff_id: currentStaff.id,
          latitude: lastPosition.latitude,
          longitude: lastPosition.longitude,
          accuracy: lastPosition.accuracy,
          is_active: false,
        })
    }

    setIsTracking(false)
  }, [currentStaff?.id, lastPosition])

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Alle aktiven Boten-Standorte laden (für Admins)
  const fetchCourierLocations = useCallback(async () => {
    if (!currentStaff?.is_admin) return

    setLocationsLoading(true)
    const { data, error } = await supabase
      .from('courier_latest_locations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fehler beim Laden der Standorte:', error)
    } else {
      setCourierLocations(data || [])
    }
    setLocationsLoading(false)
  }, [currentStaff?.is_admin])

  // Polling alle 5 Minuten wenn Tracking-Seite offen ist
  useEffect(() => {
    if (!currentStaff?.is_admin || !session || !isTrackingViewOpen) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      return
    }

    // Initial laden
    fetchCourierLocations()

    // Alle 5 Minuten aktualisieren
    pollingRef.current = setInterval(() => {
      fetchCourierLocations()
    }, 5 * 60 * 1000) // 5 Minuten

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [currentStaff?.is_admin, session, isTrackingViewOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    isTracking,
    trackingError,
    lastPosition,
    canTrack,
    courierLocations,
    locationsLoading,
    // Actions
    startTracking,
    stopTracking,
    fetchCourierLocations,
  }
}
