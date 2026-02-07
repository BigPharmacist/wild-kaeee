import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const POLLING_INTERVAL = 30000

/**
 * Hook für Gesund.de ungelesene Bestellungen
 * Unseen = seen_at IS NULL (nur neue Bestellungen, nicht Statusänderungen)
 */
export default function useGesundUnreadCount() {
  const [count, setCount] = useState(0)
  const channelRef = useRef(null)

  const fetchCount = useCallback(async () => {
    const { count: c1, error } = await supabase
      .from('gesund_orders')
      .select('id', { count: 'exact', head: true })
      .is('seen_at', null)

    if (!error) {
      setCount(c1 || 0)
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
        event: 'INSERT',
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
