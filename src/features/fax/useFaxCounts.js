import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const POLLING_INTERVAL = 60000 // 1 Minute für Counts

export default function useFaxCounts() {
  const [faxCount, setFaxCount] = useState(0)

  const fetchCount = useCallback(async () => {
    const { count, error } = await supabase
      .from('faxe')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'neu')

    if (!error) {
      setFaxCount(count || 0)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  // Polling
  useEffect(() => {
    const interval = setInterval(fetchCount, POLLING_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchCount])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('faxe_counts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'faxe'
      }, () => {
        fetchCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchCount])

  return faxCount
}
