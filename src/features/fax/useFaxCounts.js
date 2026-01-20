import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const POLLING_INTERVAL = 30000 // 30 Sekunden
const FAX_NOTIFICATION_SOUND = 'https://proxy.notificationsounds.com/message-tones/relax-message-tone/download/file-sounds-1217-relax.mp3'

const playNotificationSound = () => {
  const audio = new Audio(FAX_NOTIFICATION_SOUND)
  audio.play().catch(() => {}) // Ignoriere Autoplay-Fehler, Modal ist wichtiger
}

/**
 * Hook für Fax Unread-Count mit Echtzeit-Updates
 * - Supabase Realtime für sofortige Updates
 * - Fallback Polling alle 30s
 * - Optimistic Updates für lokale Aktionen
 */
export default function useFaxCounts() {
  const [faxCount, setFaxCount] = useState(0)
  const channelRef = useRef(null)
  const prevCountRef = useRef(0)
  const lastFaxIdRef = useRef(null)

  const fetchCount = useCallback(async (checkForNew = false) => {
    const { count, error } = await supabase
      .from('faxe')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'neu')

    if (!error) {
      const newCount = count || 0

      // Prüfen ob neue Faxe hinzugekommen sind (nur beim Polling, nicht beim Initial-Load)
      if (checkForNew && newCount > prevCountRef.current) {
        // Neuestes Fax abrufen für Modal
        const { data: newestFax } = await supabase
          .from('faxe')
          .select('*')
          .eq('status', 'neu')
          .order('fax_received_at', { ascending: false })
          .limit(1)
          .single()

        if (newestFax && newestFax.id !== lastFaxIdRef.current) {
          lastFaxIdRef.current = newestFax.id
          window.dispatchEvent(new CustomEvent('new-fax-received', { detail: newestFax }))
          playNotificationSound()
        }
      }

      prevCountRef.current = newCount
      setFaxCount(newCount)
    }
  }, [])

  // Optimistic Update: Fax als erledigt markiert
  const decrementCount = useCallback(() => {
    setFaxCount(prev => Math.max(0, prev - 1))
  }, [])

  // Optimistic Update: Neues Fax empfangen
  const incrementCount = useCallback(() => {
    setFaxCount(prev => prev + 1)
  }, [])

  // Force Refresh
  const refresh = useCallback(async () => {
    await fetchCount()
  }, [fetchCount])

  // Initial fetch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCount()
  }, [fetchCount])

  // Fallback Polling (kürzer für bessere UX) - mit Check für neue Faxe
  useEffect(() => {
    const interval = setInterval(() => fetchCount(true), POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchCount])

  // Realtime subscription mit besserem Error-Handling
  useEffect(() => {
    // Unique Channel-Name mit Timestamp für Reconnects
    const channelName = `faxe_counts_${Date.now()}`

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'faxe'
      }, (payload) => {
        // Neues Fax - prüfen ob Status 'neu'
        if (payload.new?.status === 'neu') {
          setFaxCount(prev => prev + 1)
          // Modal-Event dispatchen
          window.dispatchEvent(new CustomEvent('new-fax-received', { detail: payload.new }))
          // Sound versuchen (funktioniert nur nach Benutzerinteraktion)
          playNotificationSound()
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'faxe'
      }, (payload) => {
        const oldStatus = payload.old?.status
        const newStatus = payload.new?.status

        // Status von 'neu' zu 'erledigt' gewechselt
        if (oldStatus === 'neu' && newStatus === 'erledigt') {
          setFaxCount(prev => Math.max(0, prev - 1))
        }
        // Status von 'erledigt' zu 'neu' gewechselt (Wiederherstellung)
        if (oldStatus === 'erledigt' && newStatus === 'neu') {
          setFaxCount(prev => prev + 1)
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'faxe'
      }, (payload) => {
        // Gelöschtes Fax war noch 'neu'
        if (payload.old?.status === 'neu') {
          setFaxCount(prev => Math.max(0, prev - 1))
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Fax Realtime verbunden')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Fax Realtime Fehler - Fallback auf Polling')
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  // Optimistic Update Event Listener
  useEffect(() => {
    const handleFaxArchived = () => {
      setFaxCount(prev => Math.max(0, prev - 1))
    }

    const handleFaxRestored = () => {
      setFaxCount(prev => prev + 1)
    }

    window.addEventListener('fax-archived', handleFaxArchived)
    window.addEventListener('fax-restored', handleFaxRestored)
    return () => {
      window.removeEventListener('fax-archived', handleFaxArchived)
      window.removeEventListener('fax-restored', handleFaxRestored)
    }
  }, [])

  return {
    count: faxCount,
    decrementCount,
    incrementCount,
    refresh,
  }
}
