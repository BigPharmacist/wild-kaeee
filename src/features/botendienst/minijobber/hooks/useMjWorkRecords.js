import { useState, useCallback } from 'react'
import { supabase } from '../../../../lib/supabase'

export function useMjWorkRecords({ pharmacyId }) {
  const [workRecords, setWorkRecords] = useState([])
  const [manualHours, setManualHours] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchWorkRecords = useCallback(async (year, month) => {
    if (!pharmacyId) return

    setLoading(true)

    // Calculate date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    // Fetch work records via schedules in date range
    const { data, error } = await supabase
      .from('mj_work_records')
      .select(`
        *,
        schedule:mj_schedules!mj_work_records_schedule_id_fkey(
          id, staff_id, date, absent, absent_reason,
          staff:staff!mj_schedules_staff_id_fkey(id, first_name, last_name),
          shift:mj_shifts!mj_schedules_shift_id_fkey(id, name, start_time, end_time, hours)
        )
      `)
      .eq('pharmacy_id', pharmacyId)

    if (error) {
      console.error('Fehler beim Laden der Zeiterfassung:', error)
      setLoading(false)
      return
    }

    // Filter by date range (via schedule.date)
    const filtered = (data || []).filter(wr => {
      const d = wr.schedule?.date
      return d && d >= startDate && d <= endDate
    })

    setWorkRecords(filtered)
    setLoading(false)
  }, [pharmacyId])

  const fetchOpenSchedules = useCallback(async (year, month) => {
    if (!pharmacyId) return []

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    // Get all schedules for the month
    const { data: schedules, error } = await supabase
      .from('mj_schedules')
      .select(`
        id, staff_id, shift_id, date, absent, absent_reason,
        staff:staff!mj_schedules_staff_id_fkey(id, first_name, last_name),
        shift:mj_shifts!mj_schedules_shift_id_fkey(id, name, start_time, end_time, hours)
      `)
      .eq('pharmacy_id', pharmacyId)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('absent', false)
      .order('date')

    if (error) {
      console.error('Fehler beim Laden der offenen Schichten:', error)
      return []
    }

    // Get all work records for these schedules
    const scheduleIds = (schedules || []).map(s => s.id)
    if (scheduleIds.length === 0) return []

    const { data: records } = await supabase
      .from('mj_work_records')
      .select('schedule_id')
      .in('schedule_id', scheduleIds)

    const recordedIds = new Set((records || []).map(r => r.schedule_id))

    // Return schedules without work records
    return (schedules || []).filter(s => !recordedIds.has(s.id))
  }, [pharmacyId])

  const createWorkRecord = useCallback(async (scheduleId, startTime, endTime) => {
    if (!pharmacyId) return null

    // Calculate actual hours from times
    const actualHours = calculateHours(startTime, endTime)

    const { data, error } = await supabase
      .from('mj_work_records')
      .insert({
        pharmacy_id: pharmacyId,
        schedule_id: scheduleId,
        actual_start_time: startTime,
        actual_end_time: endTime,
        actual_hours: actualHours,
      })
      .select(`
        *,
        schedule:mj_schedules!mj_work_records_schedule_id_fkey(
          id, staff_id, date, absent,
          staff:staff!mj_schedules_staff_id_fkey(id, first_name, last_name),
          shift:mj_shifts!mj_schedules_shift_id_fkey(id, name, start_time, end_time, hours)
        )
      `)
      .single()

    if (error) {
      console.error('Fehler beim Erstellen der Zeiterfassung:', error)
      return null
    }

    setWorkRecords(prev => [...prev, data])
    return data
  }, [pharmacyId])

  const updateWorkRecord = useCallback(async (id, startTime, endTime) => {
    const actualHours = calculateHours(startTime, endTime)

    const { error } = await supabase
      .from('mj_work_records')
      .update({
        actual_start_time: startTime,
        actual_end_time: endTime,
        actual_hours: actualHours,
      })
      .eq('id', id)

    if (error) {
      console.error('Fehler beim Aktualisieren:', error)
      return false
    }

    setWorkRecords(prev => prev.map(wr =>
      wr.id === id ? { ...wr, actual_start_time: startTime, actual_end_time: endTime, actual_hours: actualHours } : wr
    ))
    return true
  }, [])

  const deleteWorkRecord = useCallback(async (id) => {
    const { error } = await supabase
      .from('mj_work_records')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Fehler beim Löschen:', error)
      return false
    }

    setWorkRecords(prev => prev.filter(wr => wr.id !== id))
    return true
  }, [])

  // Manual hours
  const fetchManualHours = useCallback(async (year, month) => {
    if (!pharmacyId) return

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('mj_manual_hours')
      .select('*, staff:staff!mj_manual_hours_staff_id_fkey(id, first_name, last_name)')
      .eq('pharmacy_id', pharmacyId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')

    if (error) {
      console.error('Fehler beim Laden der manuellen Stunden:', error)
    } else {
      setManualHours(data || [])
    }
  }, [pharmacyId])

  const createManualHours = useCallback(async (staffId, date, hours, description) => {
    if (!pharmacyId) return null

    const { data, error } = await supabase
      .from('mj_manual_hours')
      .insert({
        pharmacy_id: pharmacyId,
        staff_id: staffId,
        date,
        hours,
        description,
      })
      .select('*, staff:staff!mj_manual_hours_staff_id_fkey(id, first_name, last_name)')
      .single()

    if (error) {
      console.error('Fehler beim Erstellen:', error)
      return null
    }

    setManualHours(prev => [...prev, data])
    return data
  }, [pharmacyId])

  const deleteManualHours = useCallback(async (id) => {
    const { error } = await supabase
      .from('mj_manual_hours')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Fehler beim Löschen:', error)
      return false
    }

    setManualHours(prev => prev.filter(mh => mh.id !== id))
    return true
  }, [])

  return {
    workRecords,
    manualHours,
    loading,
    fetchWorkRecords,
    fetchOpenSchedules,
    createWorkRecord,
    updateWorkRecord,
    deleteWorkRecord,
    fetchManualHours,
    createManualHours,
    deleteManualHours,
  }
}

function calculateHours(startTime, endTime) {
  if (!startTime || !endTime) return 0
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  const minutes = (eh * 60 + em) - (sh * 60 + sm)
  return Math.round(minutes / 60 * 100) / 100
}
