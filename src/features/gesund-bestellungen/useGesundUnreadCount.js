import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const POLLING_INTERVAL = 30000

/**
 * Hook für Gesund.de ungelesene Bestellungen
 * Unseen = seen_at IS NULL OR updated_at > seen_at
 */
export default function useGesundUnreadCount() {
  const [count, setCount] = useState(0)
  const channelRef = useRef(null)

  const fetchCount = useCallback(async () => {
    // Query 1: Noch nie gesehen (seen_at IS NULL)
    const { count: c1, error: e1 } = await supabase
      .from('gesund_orders')
      .select('id', { count: 'exact', head: true })
      .is('seen_at', null)

    // Query 2: Seit letztem Öffnen aktualisiert (updated_at > seen_at)
    // PostgREST kann keine Spalte-gegen-Spalte-Vergleiche, daher client-seitig
    const { data: seenOrders, error: e2 } = await supabase
      .from('gesund_orders')
      .select('id, updated_at, seen_at')
      .not('seen_at', 'is', null)

    const c2 = !e2
      ? (seenOrders || []).filter(o => new Date(o.updated_at) > new Date(o.seen_at)).length
      : 0

    if (!e1) {
      setCount((c1 || 0) + c2)
    }
  }, [])

  const refresh = useCallback(() => {
    fetchCount()
  }, [fetchCount])

  // Optimistic: nach Öffnen einer Order
  const decrementCount = useCallback(() => {
    setCount(prev => Math.max(0, prev - 1))
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  // Polling fallback
  useEffect(() => {
    const interval = setInterval(fetchCount, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchCount])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`gesund_orders_unread_${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'gesund_orders',
      }, () => {
        fetchCount()
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Gesund.de Realtime Fehler - Fallback auf Polling')
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [fetchCount])

  // Event listener für optimistic updates
  useEffect(() => {
    const handleSeen = () => {
      setCount(prev => Math.max(0, prev - 1))
    }
    window.addEventListener('gesund-order-seen', handleSeen)
    return () => window.removeEventListener('gesund-order-seen', handleSeen)
  }, [])

  return { count, decrementCount, refresh }
}
