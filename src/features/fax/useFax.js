import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const POLLING_INTERVAL = 300000 // 5 Minuten (Realtime übernimmt sofortige Updates)

export default function useFax() {
  const [faxe, setFaxe] = useState([])
  const [faxeLoading, setFaxeLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedFax, setSelectedFax] = useState(null)
  const [selectedFolder, setSelectedFolder] = useState('eingang')
  const [counts, setCounts] = useState({ eingang: 0, papierkorb: 0 })
  const [lastUpdated, setLastUpdated] = useState(null)
  const pollingRef = useRef(null)

  const fetchFaxe = useCallback(async (folder = selectedFolder, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setFaxeLoading(true)
    }
    const status = folder === 'eingang' ? 'neu' : 'erledigt'

    let query = supabase
      .from('faxe')
      .select('*')
      .eq('status', status)
      .order('fax_received_at', { ascending: false })

    // Papierkorb: nur die letzten 20 Faxe laden
    if (folder === 'papierkorb') {
      query = query.limit(20)
    }

    const { data, error } = await query

    if (error) {
      console.error('Fehler beim Laden der Faxe:', error)
    } else {
      setFaxe(data || [])
      setLastUpdated(new Date())
    }
    setFaxeLoading(false)
    setRefreshing(false)
  }, [selectedFolder])

  const fetchCounts = useCallback(async () => {
    const [eingangResult, papierkorbResult] = await Promise.all([
      supabase.from('faxe').select('id', { count: 'exact', head: true }).eq('status', 'neu'),
      supabase.from('faxe').select('id', { count: 'exact', head: true }).eq('status', 'erledigt')
    ])

    setCounts({
      eingang: eingangResult.count || 0,
      papierkorb: papierkorbResult.count || 0
    })
  }, [])

  // Manuelle Aktualisierung
  const refresh = useCallback(() => {
    fetchFaxe(selectedFolder, true)
    fetchCounts()
  }, [selectedFolder, fetchFaxe, fetchCounts])

  const selectFolder = useCallback((folder) => {
    setSelectedFolder(folder)
    setSelectedFax(null)
  }, [])

  const selectFax = useCallback((fax) => {
    setSelectedFax(fax)
  }, [])

  const deleteFax = useCallback(async (id) => {
    const { error } = await supabase
      .from('faxe')
      .update({ status: 'erledigt' })
      .eq('id', id)

    if (error) {
      console.error('Fehler beim Löschen:', error)
      return false
    }

    setFaxe(prev => prev.filter(f => f.id !== id))
    if (selectedFax?.id === id) {
      setSelectedFax(null)
    }
    // Optimistic Update Event für Badge
    window.dispatchEvent(new CustomEvent('fax-archived'))
    fetchCounts()
    return true
  }, [selectedFax, fetchCounts])

  const restoreFax = useCallback(async (id) => {
    const { error } = await supabase
      .from('faxe')
      .update({ status: 'neu' })
      .eq('id', id)

    if (error) {
      console.error('Fehler beim Wiederherstellen:', error)
      return false
    }

    setFaxe(prev => prev.filter(f => f.id !== id))
    if (selectedFax?.id === id) {
      setSelectedFax(null)
    }
    // Optimistic Update Event für Badge
    window.dispatchEvent(new CustomEvent('fax-restored'))
    fetchCounts()
    return true
  }, [selectedFax, fetchCounts])

  // Fetch faxe when folder changes
  useEffect(() => {
    fetchFaxe(selectedFolder)
  }, [selectedFolder, fetchFaxe])

  // Initial counts fetch
  useEffect(() => {
    fetchCounts()
  }, [fetchCounts])

  // Polling - alle 30 Sekunden aktualisieren
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchFaxe(selectedFolder, true)
      fetchCounts()
    }, POLLING_INTERVAL)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [selectedFolder, fetchFaxe, fetchCounts])

  // Realtime subscription (zusätzlich zum Polling für sofortige Updates)
  useEffect(() => {
    const channel = supabase
      .channel('faxe_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'faxe'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          // Neues Fax - nur in aktuellen Ordner einfügen wenn Status passt
          const expectedStatus = selectedFolder === 'eingang' ? 'neu' : 'erledigt'
          if (payload.new.status === expectedStatus) {
            setFaxe(prev => [payload.new, ...prev])
            setLastUpdated(new Date())
          }
          fetchCounts()
        } else if (payload.eventType === 'UPDATE') {
          // Status geändert - aus Liste entfernen wenn nicht mehr passend
          const expectedStatus = selectedFolder === 'eingang' ? 'neu' : 'erledigt'
          if (payload.new.status !== expectedStatus) {
            setFaxe(prev => prev.filter(f => f.id !== payload.new.id))
          } else {
            setFaxe(prev => prev.map(f => f.id === payload.new.id ? payload.new : f))
          }
          setLastUpdated(new Date())
          fetchCounts()
        } else if (payload.eventType === 'DELETE') {
          setFaxe(prev => prev.filter(f => f.id !== payload.old.id))
          if (selectedFax?.id === payload.old.id) {
            setSelectedFax(null)
          }
          setLastUpdated(new Date())
          fetchCounts()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedFolder, selectedFax, fetchCounts])

  return {
    faxe,
    faxeLoading,
    refreshing,
    selectedFax,
    selectedFolder,
    counts,
    lastUpdated,
    selectFolder,
    selectFax,
    deleteFax,
    restoreFax,
    refresh
  }
}
