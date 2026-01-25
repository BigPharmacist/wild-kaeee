import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

export function useBotendienst({ session, currentStaff, pharmacyId }) {
  // Tours state
  const [tours, setTours] = useState([])
  const [toursLoading, setToursLoading] = useState(false)
  const [toursError, setToursError] = useState(null)

  // Selected tour and its stops
  const [selectedTour, setSelectedTour] = useState(null)
  const [stops, setStops] = useState([])
  const [stopsLoading, setStopsLoading] = useState(false)

  // Active tour for driver
  const [activeTour, setActiveTour] = useState(null)

  // Action loading states
  const [actionLoading, setActionLoading] = useState(null) // 'starting' | 'completing' | 'cancelling' | null

  // Form state for new tour
  const [tourForm, setTourForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    driver_staff_id: null,
  })

  // Form state for new stop
  const [stopForm, setStopForm] = useState({
    customer_name: '',
    street: '',
    postal_code: '',
    city: '',
    package_count: 1,
    cash_amount: 0,
    priority: 'normal',
    stop_notes: '',
  })

  // ============================================
  // TOURS CRUD
  // ============================================

  const fetchTours = useCallback(async (statusFilter = null) => {
    if (!session || !pharmacyId) return

    setToursLoading(true)
    setToursError(null)

    try {
      let query = supabase
        .from('delivery_tours')
        .select(`
          *,
          driver:staff!delivery_tours_driver_staff_id_fkey(id, first_name, last_name),
          creator:staff!delivery_tours_created_by_fkey(id, first_name, last_name),
          stops:delivery_stops(id, status, package_count, cash_amount, cash_collected)
        `)
        .eq('pharmacy_id', pharmacyId)
        .order('date', { ascending: false })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setTours(data || [])
    } catch (err) {
      console.error('Fehler beim Laden der Touren:', err)
      setToursError(err.message)
    } finally {
      setToursLoading(false)
    }
  }, [session, pharmacyId])

  const createTour = useCallback(async (tourData) => {
    if (!session || !pharmacyId || !currentStaff?.id) return null

    try {
      const { data, error } = await supabase
        .from('delivery_tours')
        .insert({
          pharmacy_id: pharmacyId,
          name: tourData.name || `Tour ${new Date().toLocaleDateString('de-DE')}`,
          date: tourData.date || new Date().toISOString().split('T')[0],
          driver_staff_id: tourData.driver_staff_id || null,
          status: 'draft',
          created_by: currentStaff.id,
        })
        .select()
        .single()

      if (error) throw error

      // Refresh tours list
      await fetchTours()
      return data
    } catch (err) {
      console.error('Fehler beim Erstellen der Tour:', err)
      setToursError(err.message)
      return null
    }
  }, [session, pharmacyId, currentStaff?.id, fetchTours])

  const updateTour = useCallback(async (tourId, updates) => {
    if (!session) return false

    try {
      const { data, error } = await supabase
        .from('delivery_tours')
        .update(updates)
        .eq('id', tourId)
        .select(`
          *,
          driver:staff!delivery_tours_driver_staff_id_fkey(id, first_name, last_name),
          creator:staff!delivery_tours_created_by_fkey(id, first_name, last_name),
          stops:delivery_stops(id, status, package_count, cash_amount, cash_collected)
        `)
        .single()

      if (error) throw error

      // Update selectedTour if it's the one being updated
      if (selectedTour?.id === tourId && data) {
        setSelectedTour(data)
      }

      // Refresh tours list
      await fetchTours()
      return true
    } catch (err) {
      console.error('Fehler beim Aktualisieren der Tour:', err)
      setToursError(err.message)
      return false
    }
  }, [session, fetchTours, selectedTour?.id])

  const deleteTour = useCallback(async (tourId) => {
    if (!session) return false

    try {
      const { error } = await supabase
        .from('delivery_tours')
        .delete()
        .eq('id', tourId)

      if (error) throw error

      // Refresh tours list
      await fetchTours()
      return true
    } catch (err) {
      console.error('Fehler beim Löschen der Tour:', err)
      setToursError(err.message)
      return false
    }
  }, [session, fetchTours])

  const startTour = useCallback(async (tourId) => {
    setActionLoading('starting')
    try {
      return await updateTour(tourId, {
        status: 'active',
        started_at: new Date().toISOString(),
      })
    } finally {
      setActionLoading(null)
    }
  }, [updateTour])

  const completeTour = useCallback(async (tourId) => {
    setActionLoading('completing')
    try {
      return await updateTour(tourId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
    } finally {
      setActionLoading(null)
    }
  }, [updateTour])

  const cancelTour = useCallback(async (tourId) => {
    setActionLoading('cancelling')
    try {
      return await updateTour(tourId, {
        status: 'cancelled',
      })
    } finally {
      setActionLoading(null)
    }
  }, [updateTour])

  // ============================================
  // STOPS CRUD
  // ============================================

  const fetchStops = useCallback(async (tourId) => {
    if (!session || !tourId) return

    setStopsLoading(true)

    try {
      const { data, error } = await supabase
        .from('delivery_stops')
        .select(`
          *,
          customer:delivery_customers(id, name, phone, delivery_notes, access_info),
          photos:delivery_stop_photos(id, photo_url, caption),
          signature:delivery_signatures(id, signature_url, signer_name, signed_at),
          items:delivery_stop_items(id, quantity, article_name, package_size, manufacturer_code, sort_order)
        `)
        .eq('tour_id', tourId)
        .order('sort_order', { ascending: true })

      if (error) throw error
      setStops(data || [])
    } catch (err) {
      console.error('Fehler beim Laden der Stops:', err)
    } finally {
      setStopsLoading(false)
    }
  }, [session])

  const addStop = useCallback(async (tourId, stopData) => {
    if (!session || !currentStaff?.id) return null

    try {
      // Get max sort_order for this tour
      const { data: existingStops } = await supabase
        .from('delivery_stops')
        .select('sort_order')
        .eq('tour_id', tourId)
        .order('sort_order', { ascending: false })
        .limit(1)

      const nextOrder = existingStops?.[0]?.sort_order + 1 || 0

      const { data, error } = await supabase
        .from('delivery_stops')
        .insert({
          tour_id: tourId,
          customer_id: stopData.customer_id || null,
          customer_name: stopData.customer_name,
          street: stopData.street,
          postal_code: stopData.postal_code,
          city: stopData.city,
          latitude: stopData.latitude || null,
          longitude: stopData.longitude || null,
          package_count: stopData.package_count || 1,
          cash_amount: stopData.cash_amount || 0,
          priority: stopData.priority || 'normal',
          stop_notes: stopData.stop_notes || null,
          sort_order: nextOrder,
          added_by: currentStaff.id,
        })
        .select()
        .single()

      if (error) throw error

      // Artikel speichern wenn vorhanden
      if (stopData.items && stopData.items.length > 0 && data?.id) {
        const itemsToInsert = stopData.items.map((item, idx) => ({
          stop_id: data.id,
          quantity: item.quantity || 1,
          article_name: item.article_name,
          package_size: item.package_size || null,
          manufacturer_code: item.manufacturer_code || null,
          sort_order: item.sort_order ?? idx,
        }))

        const { error: itemsError } = await supabase
          .from('delivery_stop_items')
          .insert(itemsToInsert)

        if (itemsError) {
          console.error('Fehler beim Speichern der Artikel:', itemsError)
          // Nicht abbrechen - Stop wurde erstellt, Artikel optional
        }
      }

      // Refresh stops list
      await fetchStops(tourId)
      return data
    } catch (err) {
      console.error('Fehler beim Hinzufügen des Stops:', err)
      return null
    }
  }, [session, currentStaff?.id, fetchStops])

  const updateStop = useCallback(async (stopId, updates) => {
    if (!session) return false

    try {
      const { error } = await supabase
        .from('delivery_stops')
        .update(updates)
        .eq('id', stopId)

      if (error) throw error

      // Refresh stops if we have a selected tour
      if (selectedTour?.id) {
        await fetchStops(selectedTour.id)
      }
      return true
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Stops:', err)
      return false
    }
  }, [session, selectedTour?.id, fetchStops])

  const deleteStop = useCallback(async (stopId) => {
    if (!session) return false

    try {
      const { error } = await supabase
        .from('delivery_stops')
        .delete()
        .eq('id', stopId)

      if (error) throw error

      // Refresh stops if we have a selected tour
      if (selectedTour?.id) {
        await fetchStops(selectedTour.id)
      }
      return true
    } catch (err) {
      console.error('Fehler beim Löschen des Stops:', err)
      return false
    }
  }, [session, selectedTour?.id, fetchStops])

  const completeStop = useCallback(async (stopId, position = null) => {
    const updates = {
      status: 'completed',
      completed_at: new Date().toISOString(),
    }

    if (position) {
      updates.completed_latitude = position.latitude
      updates.completed_longitude = position.longitude
    }

    return updateStop(stopId, updates)
  }, [updateStop])

  const skipStop = useCallback(async (stopId, reason = null) => {
    return updateStop(stopId, {
      status: 'skipped',
      stop_notes: reason ? `Übersprungen: ${reason}` : 'Übersprungen',
    })
  }, [updateStop])

  const rescheduleStop = useCallback(async (stopId, newDate, reason = null) => {
    return updateStop(stopId, {
      status: 'rescheduled',
      rescheduled_to: newDate,
      rescheduled_reason: reason,
    })
  }, [updateStop])

  const markCashCollected = useCallback(async (stopId, collectedAmount = null, notes = null) => {
    const updates = {
      cash_collected: true,
    }

    if (collectedAmount !== null) {
      updates.cash_collected_amount = collectedAmount
    }

    if (notes) {
      updates.cash_notes = notes
    }

    return updateStop(stopId, updates)
  }, [updateStop])

  const reorderStops = useCallback(async (tourId, stopIds) => {
    if (!session) return false

    try {
      // Update sort_order for each stop
      const updates = stopIds.map((id, index) => ({
        id,
        sort_order: index,
      }))

      for (const update of updates) {
        await supabase
          .from('delivery_stops')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
      }

      // Refresh stops
      await fetchStops(tourId)
      return true
    } catch (err) {
      console.error('Fehler beim Neuordnen der Stops:', err)
      return false
    }
  }, [session, fetchStops])

  // ============================================
  // REALTIME SUBSCRIPTIONS
  // ============================================

  useEffect(() => {
    if (!session || !pharmacyId) return

    // Subscribe to tour changes
    const toursChannel = supabase
      .channel('delivery_tours_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_tours',
          filter: `pharmacy_id=eq.${pharmacyId}`,
        },
        () => {
          fetchTours()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(toursChannel)
    }
  }, [session, pharmacyId, fetchTours])

  useEffect(() => {
    if (!session || !selectedTour?.id) return

    // Subscribe to stop changes for selected tour
    const stopsChannel = supabase
      .channel('delivery_stops_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_stops',
          filter: `tour_id=eq.${selectedTour.id}`,
        },
        () => {
          fetchStops(selectedTour.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(stopsChannel)
    }
  }, [session, selectedTour?.id, fetchStops])

  // ============================================
  // DRIVER MODE - Get active tour
  // ============================================

  const fetchActiveTourForDriver = useCallback(async () => {
    if (!session || !currentStaff?.id) return

    try {
      const { data, error } = await supabase
        .from('delivery_tours')
        .select(`
          *,
          stops:delivery_stops(
            *,
            customer:delivery_customers(id, name, phone, delivery_notes, access_info),
            photos:delivery_stop_photos(id, photo_url, caption),
            signature:delivery_signatures(id, signature_url, signer_name, signed_at)
          )
        `)
        .eq('driver_staff_id', currentStaff.id)
        .eq('status', 'active')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle() // maybeSingle statt single - gibt null zurück wenn keine Zeile gefunden

      if (error) throw error
      setActiveTour(data)
    } catch (err) {
      console.error('Fehler beim Laden der aktiven Tour:', err)
      setActiveTour(null)
    }
  }, [session, currentStaff?.id])

  // ============================================
  // STATISTICS
  // ============================================

  const getTourStats = useCallback((tour) => {
    if (!tour || !tour.stops) return null

    const totalStops = tour.stops.length
    const completedStops = tour.stops.filter(s => s.status === 'completed').length
    const pendingStops = tour.stops.filter(s => s.status === 'pending').length
    const skippedStops = tour.stops.filter(s => s.status === 'skipped').length
    const totalPackages = tour.stops.reduce((sum, s) => sum + (s.package_count || 0), 0)
    const totalCash = tour.stops.reduce((sum, s) => sum + parseFloat(s.cash_amount || 0), 0)
    const collectedCash = tour.stops
      .filter(s => s.cash_collected)
      .reduce((sum, s) => sum + parseFloat(s.cash_amount || 0), 0)

    return {
      totalStops,
      completedStops,
      pendingStops,
      skippedStops,
      totalPackages,
      totalCash,
      collectedCash,
      progress: totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0,
    }
  }, [])

  return {
    // Tours
    tours,
    toursLoading,
    toursError,
    actionLoading,
    selectedTour,
    setSelectedTour,
    tourForm,
    setTourForm,
    fetchTours,
    createTour,
    updateTour,
    deleteTour,
    startTour,
    completeTour,
    cancelTour,

    // Stops
    stops,
    stopsLoading,
    stopForm,
    setStopForm,
    fetchStops,
    addStop,
    updateStop,
    deleteStop,
    completeStop,
    skipStop,
    rescheduleStop,
    markCashCollected,
    reorderStops,

    // Driver mode
    activeTour,
    fetchActiveTourForDriver,

    // Stats
    getTourStats,
  }
}
