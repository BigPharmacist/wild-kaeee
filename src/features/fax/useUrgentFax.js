import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Hook für dringende Faxe (ROT/ORANGE) im Header
 * - Zeigt nur unerledigte Faxe mit Priorität ROT oder ORANGE
 * - Realtime-Updates für sofortige Anzeige
 */
export default function useUrgentFax() {
  const [urgentFaxe, setUrgentFaxe] = useState([])
  const channelRef = useRef(null)

  const fetchUrgentFaxe = useCallback(async () => {
    const { data, error } = await supabase
      .from('faxe')
      .select('id, absender, zusammenfassung, prioritaet, fax_received_at')
      .eq('status', 'neu')
      .in('prioritaet', ['ROT', 'ORANGE'])
      .order('fax_received_at', { ascending: false })

    if (!error) {
      setUrgentFaxe(data || [])
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchUrgentFaxe()
  }, [fetchUrgentFaxe])

  // Realtime subscription
  useEffect(() => {
    const channelName = `urgent_faxe_${Date.now()}`

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'faxe'
      }, (payload) => {
        // Neues dringendes Fax
        if (payload.new?.status === 'neu' &&
            (payload.new?.prioritaet === 'ROT' || payload.new?.prioritaet === 'ORANGE')) {
          setUrgentFaxe(prev => [{
            id: payload.new.id,
            absender: payload.new.absender,
            zusammenfassung: payload.new.zusammenfassung,
            prioritaet: payload.new.prioritaet,
            fax_received_at: payload.new.fax_received_at
          }, ...prev])
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'faxe'
      }, (payload) => {
        const { id, status, prioritaet, absender, zusammenfassung, fax_received_at } = payload.new
        const isUrgent = (prioritaet === 'ROT' || prioritaet === 'ORANGE') && status === 'neu'

        if (isUrgent) {
          // Fax ist (noch) dringend - aktualisieren oder hinzufügen
          setUrgentFaxe(prev => {
            const exists = prev.some(f => f.id === id)
            if (exists) {
              return prev.map(f => f.id === id ? { id, absender, zusammenfassung, prioritaet, fax_received_at } : f)
            }
            return [{ id, absender, zusammenfassung, prioritaet, fax_received_at }, ...prev]
          })
        } else {
          // Fax ist nicht mehr dringend (erledigt oder andere Priorität)
          setUrgentFaxe(prev => prev.filter(f => f.id !== id))
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'faxe'
      }, (payload) => {
        setUrgentFaxe(prev => prev.filter(f => f.id !== payload.old.id))
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  // Optimistic Update Event Listener
  useEffect(() => {
    const handleFaxChange = () => {
      // Bei Archivierung oder Wiederherstellung neu laden
      fetchUrgentFaxe()
    }

    window.addEventListener('fax-archived', handleFaxChange)
    window.addEventListener('fax-restored', handleFaxChange)
    return () => {
      window.removeEventListener('fax-archived', handleFaxChange)
      window.removeEventListener('fax-restored', handleFaxChange)
    }
  }, [fetchUrgentFaxe])

  return {
    urgentFaxe,
    hasUrgent: urgentFaxe.length > 0,
    refresh: fetchUrgentFaxe,
  }
}
