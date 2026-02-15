import { useState, useCallback } from 'react'
import { supabase } from '../../../../lib/supabase'

export function useMjSchedules({ pharmacyId }) {
  const [schedules, setSchedules] = useState([])
  const [shifts, setShifts] = useState([])
  const [holidays, setHolidays] = useState([])
  const [standardWeeks, setStandardWeeks] = useState([])
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

  const copyFromTwoWeeksAgo = useCallback(async (targetStartDate, targetEndDate) => {
    if (!pharmacyId) return false

    // Calculate 2 weeks ago
    const start = new Date(targetStartDate)
    const twoWeeksAgo = new Date(start)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const twoWeeksAgoEnd = new Date(targetEndDate)
    twoWeeksAgoEnd.setDate(twoWeeksAgoEnd.getDate() - 14)

    const srcStart = twoWeeksAgo.toISOString().split('T')[0]
    const srcEnd = twoWeeksAgoEnd.toISOString().split('T')[0]

    // Fetch source schedules
    const { data: srcSchedules, error } = await supabase
      .from('mj_schedules')
      .select('staff_id, shift_id, date, absent, absent_reason')
      .eq('pharmacy_id', pharmacyId)
      .gte('date', srcStart)
      .lte('date', srcEnd)

    if (error) {
      console.error('Fehler beim Laden der Quell-Woche:', error)
      return false
    }

    if (!srcSchedules || srcSchedules.length === 0) return false

    // Map to new dates (+14 days)
    const entries = srcSchedules.map(s => ({
      staff_id: s.staff_id,
      shift_id: s.shift_id,
      date: addDays(s.date, 14),
      absent: s.absent,
      absent_reason: s.absent_reason,
    }))

    return await bulkInsertSchedules(entries)
  }, [pharmacyId, bulkInsertSchedules])

  // Standard Weeks
  const fetchStandardWeeks = useCallback(async () => {
    if (!pharmacyId) return

    const { data, error } = await supabase
      .from('mj_standard_weeks')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('week_number')

    if (error) {
      console.error('Fehler beim Laden der Standard-Wochen:', error)
    } else {
      setStandardWeeks(data || [])
    }
  }, [pharmacyId])

  const saveStandardWeek = useCallback(async (weekNumber, name, scheduleData) => {
    if (!pharmacyId) return null

    const { data, error } = await supabase
      .from('mj_standard_weeks')
      .upsert({
        pharmacy_id: pharmacyId,
        week_number: weekNumber,
        name,
        schedule_data: scheduleData,
      }, { onConflict: 'pharmacy_id,week_number' })
      .select()
      .single()

    if (error) {
      console.error('Fehler beim Speichern der Standard-Woche:', error)
      return null
    }

    setStandardWeeks(prev => {
      const idx = prev.findIndex(w => w.week_number === weekNumber)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = data
        return updated
      }
      return [...prev, data]
    })
    return data
  }, [pharmacyId])

  const applyStandardWeek = useCallback(async (weekNumber, targetStartDate) => {
    const week = standardWeeks.find(w => w.week_number === weekNumber)
    if (!week?.schedule_data) return false

    const dayMap = { Montag: 0, Dienstag: 1, Mittwoch: 2, Donnerstag: 3, Freitag: 4, Samstag: 5 }
    const start = new Date(targetStartDate)
    const entries = []

    for (const [dayName, assignments] of Object.entries(week.schedule_data)) {
      const dayOffset = dayMap[dayName]
      if (dayOffset === undefined) continue

      const date = new Date(start)
      date.setDate(date.getDate() + dayOffset)
      const dateStr = date.toISOString().split('T')[0]

      for (const assignment of assignments) {
        if (assignment.staff_id && assignment.shift_id) {
          entries.push({
            staff_id: assignment.staff_id,
            shift_id: assignment.shift_id,
            date: dateStr,
          })
        }
      }
    }

    if (entries.length === 0) return false
    return await bulkInsertSchedules(entries)
  }, [standardWeeks, bulkInsertSchedules])

  return {
    schedules,
    shifts,
    holidays,
    standardWeeks,
    loading,
    fetchShifts,
    fetchSchedules,
    fetchHolidays,
    createScheduleEntry,
    updateScheduleEntry,
    deleteScheduleEntry,
    deleteSchedulesForWeek,
    bulkInsertSchedules,
    copyFromTwoWeeksAgo,
    fetchStandardWeeks,
    saveStandardWeek,
    applyStandardWeek,
  }
}

// Helper
function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
