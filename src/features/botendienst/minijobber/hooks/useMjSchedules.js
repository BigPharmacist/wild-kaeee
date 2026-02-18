import { useState, useCallback } from 'react'
import { supabase } from '../../../../lib/supabase'

export function useMjSchedules({ pharmacyId }) {
  const [schedules, setSchedules] = useState([])
  const [shifts, setShifts] = useState([])
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchShifts = useCallback(async () => {
    if (!pharmacyId) return

    const { data, error } = await supabase
      .from('mj_shifts')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('start_time')

    if (error) {
      console.error('Fehler beim Laden der Schichten:', error)
      return
    }

    // Auto-create default shifts if none exist
    if (!data || data.length === 0) {
      const defaults = [
        { name: 'Vormittag', start_time: '09:00', end_time: '13:00', hours: 4.0 },
        { name: 'Nachmittag', start_time: '13:30', end_time: '17:30', hours: 4.0 },
        { name: 'Fahrradbote', start_time: '15:00', end_time: '17:00', hours: 2.0 },
      ]

      const { data: created, error: createErr } = await supabase
        .from('mj_shifts')
        .insert(defaults.map(s => ({ ...s, pharmacy_id: pharmacyId })))
        .select()

      if (createErr) {
        console.error('Fehler beim Anlegen der Standard-Schichten:', createErr)
      } else {
        setShifts(created || [])
      }
      return
    }

    setShifts(data)
  }, [pharmacyId])

  const fetchSchedules = useCallback(async (startDate, endDate) => {
    if (!pharmacyId) return

    setLoading(true)
    const { data, error } = await supabase
      .from('mj_schedules')
      .select('*, staff:staff!mj_schedules_staff_id_fkey(id, first_name, last_name), shift:mj_shifts!mj_schedules_shift_id_fkey(id, name, start_time, end_time, hours)')
      .eq('pharmacy_id', pharmacyId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')

    if (error) {
      console.error('Fehler beim Laden des Dienstplans:', error)
    } else {
      setSchedules(data || [])
    }
    setLoading(false)
  }, [pharmacyId])

  const fetchHolidays = useCallback(async (year) => {
    if (!pharmacyId) return

    const { data, error } = await supabase
      .from('mj_holidays')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .gte('date', `${year}-01-01`)
      .lte('date', `${year}-12-31`)
      .order('date')

    if (error) {
      console.error('Fehler beim Laden der Feiertage:', error)
    } else {
      setHolidays(data || [])
    }
  }, [pharmacyId])

  const createScheduleEntry = useCallback(async (staffId, shiftId, date) => {
    if (!pharmacyId) return null

    const { data, error } = await supabase
      .from('mj_schedules')
      .insert({
        pharmacy_id: pharmacyId,
        staff_id: staffId,
        shift_id: shiftId,
        date,
      })
      .select('*, staff:staff!mj_schedules_staff_id_fkey(id, first_name, last_name), shift:mj_shifts!mj_schedules_shift_id_fkey(id, name, start_time, end_time, hours)')
      .single()

    if (error) {
      console.error('Fehler beim Erstellen des Dienstplaneintrags:', error)
      return null
    }

    setSchedules(prev => [...prev, data])
    return data
  }, [pharmacyId])

  const updateScheduleEntry = useCallback(async (id, updates) => {
    const { error } = await supabase
      .from('mj_schedules')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Fehler beim Aktualisieren:', error)
      return false
    }

    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
    return true
  }, [])

  const deleteScheduleEntry = useCallback(async (id) => {
    const { error } = await supabase
      .from('mj_schedules')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Fehler beim Löschen:', error)
      return false
    }

    setSchedules(prev => prev.filter(s => s.id !== id))
    return true
  }, [])

  const deleteSchedulesForWeek = useCallback(async (startDate, endDate) => {
    if (!pharmacyId) return false

    const { error } = await supabase
      .from('mj_schedules')
      .delete()
      .eq('pharmacy_id', pharmacyId)
      .gte('date', startDate)
      .lte('date', endDate)

    if (error) {
      console.error('Fehler beim Löschen der Woche:', error)
      return false
    }

    setSchedules(prev => prev.filter(s => s.date < startDate || s.date > endDate))
    return true
  }, [pharmacyId])

  const bulkInsertSchedules = useCallback(async (entries) => {
    if (!pharmacyId || entries.length === 0) return false

    const rows = entries.map(e => ({
      pharmacy_id: pharmacyId,
      staff_id: e.staff_id,
      shift_id: e.shift_id,
      date: e.date,
      absent: e.absent || false,
      absent_reason: e.absent_reason || null,
    }))

    const { data, error } = await supabase
      .from('mj_schedules')
      .upsert(rows, { onConflict: 'staff_id,date,shift_id' })
      .select('*, staff:staff!mj_schedules_staff_id_fkey(id, first_name, last_name), shift:mj_shifts!mj_schedules_shift_id_fkey(id, name, start_time, end_time, hours)')

    if (error) {
      console.error('Fehler beim Bulk-Insert:', error)
      return false
    }

    setSchedules(prev => {
      const newIds = new Set((data || []).map(d => d.id))
      const filtered = prev.filter(s => !newIds.has(s.id))
      return [...filtered, ...(data || [])]
    })
    return true
  }, [pharmacyId])

  const copyWeekToWeek = useCallback(async (srcStartDate, srcEndDate, targetStartDate) => {
    if (!pharmacyId) return false

    // Montag der Quellwoche bestimmen
    const srcFirst = new Date(srcStartDate)
    const srcDow = srcFirst.getDay() || 7 // So=7
    const srcMonday = new Date(srcFirst)
    srcMonday.setDate(srcFirst.getDate() - (srcDow - 1))

    // Montag der Zielwoche bestimmen
    const tgtFirst = new Date(targetStartDate)
    const tgtDow = tgtFirst.getDay() || 7
    const tgtMonday = new Date(tgtFirst)
    tgtMonday.setDate(tgtFirst.getDate() - (tgtDow - 1))

    // Feiertage der Zielwoche laden
    const tgtFriday = new Date(tgtMonday)
    tgtFriday.setDate(tgtMonday.getDate() + 4)
    const { data: holidaysData } = await supabase
      .from('mj_holidays')
      .select('date')
      .eq('pharmacy_id', pharmacyId)
      .gte('date', toISODate(tgtMonday))
      .lte('date', toISODate(tgtFriday))
    const holidaySet = new Set((holidaysData || []).map(h => h.date))

    const { data: srcSchedules, error } = await supabase
      .from('mj_schedules')
      .select('staff_id, shift_id, date, absent, absent_reason')
      .eq('pharmacy_id', pharmacyId)
      .gte('date', srcStartDate)
      .lte('date', srcEndDate)

    if (error) {
      console.error('Fehler beim Laden der Quell-Woche:', error)
      return false
    }

    if (!srcSchedules || srcSchedules.length === 0) return false

    // Wochentag-basiertes Mapping: gleicher Wochentag in Zielwoche
    const offsetDays = Math.round((tgtMonday - srcMonday) / 86400000)

    const entries = srcSchedules
      .map(s => {
        const targetDate = addDays(s.date, offsetDays)
        return {
          staff_id: s.staff_id,
          shift_id: s.shift_id,
          date: targetDate,
          absent: s.absent,
          absent_reason: s.absent_reason,
        }
      })
      .filter(e => {
        // Wochenenden ausschließen
        const d = new Date(e.date)
        const dow = d.getDay()
        if (dow === 0 || dow === 6) return false
        // Feiertage ausschließen
        if (holidaySet.has(e.date)) return false
        return true
      })

    if (entries.length === 0) return false
    return await bulkInsertSchedules(entries)
  }, [pharmacyId, bulkInsertSchedules])

  const toggleShiftActive = useCallback(async (shiftId, active) => {
    const { error } = await supabase
      .from('mj_shifts')
      .update({ active })
      .eq('id', shiftId)

    if (error) {
      console.error('Fehler beim Umschalten der Schicht:', error)
      return false
    }

    setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, active } : s))
    return true
  }, [])

  return {
    schedules,
    shifts,
    holidays,
    loading,
    fetchShifts,
    fetchSchedules,
    fetchHolidays,
    createScheduleEntry,
    updateScheduleEntry,
    deleteScheduleEntry,
    deleteSchedulesForWeek,
    bulkInsertSchedules,
    copyWeekToWeek,
    toggleShiftActive,
  }
}

// Helper
function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
