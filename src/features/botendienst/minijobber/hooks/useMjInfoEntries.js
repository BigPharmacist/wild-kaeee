import { useState, useCallback } from 'react'
import { supabase } from '../../../../lib/supabase'

export function useMjInfoEntries({ pharmacyId }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchEntries = useCallback(async (year, month) => {
    if (!pharmacyId) return

    setLoading(true)
    const { data, error } = await supabase
      .from('mj_info_entries')
      .select('*, staff:staff!mj_info_entries_staff_id_fkey(id, first_name, last_name)')
      .eq('pharmacy_id', pharmacyId)
      .eq('year', year)
      .eq('month', month)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fehler beim Laden der Info-Einträge:', error)
    } else {
      setEntries(data || [])
    }
    setLoading(false)
  }, [pharmacyId])

  const createEntry = useCallback(async (year, month, text, staffId) => {
    if (!pharmacyId) return null

    const { data, error } = await supabase
      .from('mj_info_entries')
      .insert({
        pharmacy_id: pharmacyId,
        year,
        month,
        text,
        staff_id: staffId || null,
      })
      .select('*, staff:staff!mj_info_entries_staff_id_fkey(id, first_name, last_name)')
      .single()

    if (error) {
      console.error('Fehler beim Erstellen:', error)
      return null
    }

    setEntries(prev => [data, ...prev])
    return data
  }, [pharmacyId])

  const updateEntry = useCallback(async (id, text) => {
    const { error } = await supabase
      .from('mj_info_entries')
      .update({ text })
      .eq('id', id)

    if (error) {
      console.error('Fehler beim Aktualisieren:', error)
      return false
    }

    setEntries(prev => prev.map(e => e.id === id ? { ...e, text } : e))
    return true
  }, [])

  const deleteEntry = useCallback(async (id) => {
    const { error } = await supabase
      .from('mj_info_entries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Fehler beim Löschen:', error)
      return false
    }

    setEntries(prev => prev.filter(e => e.id !== id))
    return true
  }, [])

  return {
    entries,
    loading,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
  }
}
