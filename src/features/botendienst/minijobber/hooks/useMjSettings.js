import { useState, useCallback } from 'react'
import { supabase } from '../../../../lib/supabase'

export function useMjSettings({ pharmacyId }) {
  const [settings, setSettings] = useState(null)
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchSettings = useCallback(async () => {
    if (!pharmacyId) return

    setLoading(true)
    const { data, error } = await supabase
      .from('mj_settings')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Fehler beim Laden der Einstellungen:', error)
    }

    if (data) {
      setSettings(data)
    } else {
      // Create default settings
      const { data: created } = await supabase
        .from('mj_settings')
        .insert({ pharmacy_id: pharmacyId, default_hourly_rate: 12.41, monthly_limit: 538.00 })
        .select()
        .single()
      setSettings(created)
    }
    setLoading(false)
  }, [pharmacyId])

  const updateSettings = useCallback(async (updates) => {
    if (!settings?.id) return false

    const { error } = await supabase
      .from('mj_settings')
      .update(updates)
      .eq('id', settings.id)

    if (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error)
      return false
    }

    setSettings(prev => ({ ...prev, ...updates }))
    return true
  }, [settings?.id])

  // Holidays
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

  const addHoliday = useCallback(async (date, name) => {
    if (!pharmacyId) return null

    const { data, error } = await supabase
      .from('mj_holidays')
      .insert({ pharmacy_id: pharmacyId, date, name })
      .select()
      .single()

    if (error) {
      console.error('Fehler beim Anlegen des Feiertags:', error)
      return null
    }

    setHolidays(prev => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)))
    return data
  }, [pharmacyId])

  const deleteHoliday = useCallback(async (id) => {
    const { error } = await supabase
      .from('mj_holidays')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Fehler beim Löschen:', error)
      return false
    }

    setHolidays(prev => prev.filter(h => h.id !== id))
    return true
  }, [])

  const importRlpHolidays = useCallback(async (year) => {
    if (!pharmacyId) return false

    // Rheinland-Pfalz Feiertage (feste + bewegliche)
    const holidays = calculateRlpHolidays(year)

    for (const h of holidays) {
      // Skip if already exists
      const exists = await supabase
        .from('mj_holidays')
        .select('id')
        .eq('pharmacy_id', pharmacyId)
        .eq('date', h.date)
        .single()

      if (!exists.data) {
        await supabase.from('mj_holidays').insert({ pharmacy_id: pharmacyId, ...h })
      }
    }

    await fetchHolidays(year)
    return true
  }, [pharmacyId, fetchHolidays])

  return {
    settings,
    holidays,
    loading,
    fetchSettings,
    updateSettings,
    fetchHolidays,
    addHoliday,
    deleteHoliday,
    importRlpHolidays,
  }
}

// Calculate Rheinland-Pfalz holidays for a given year
function calculateRlpHolidays(year) {
  // Easter calculation (Gauss algorithm)
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const easterMonth = Math.floor((h + l - 7 * m + 114) / 31)
  const easterDay = ((h + l - 7 * m + 114) % 31) + 1

  const easter = new Date(year, easterMonth - 1, easterDay)
  const addDays = (d, days) => {
    const result = new Date(d)
    result.setDate(result.getDate() + days)
    return result.toISOString().split('T')[0]
  }

  const fmt = (m, d) => `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  return [
    { date: fmt(1, 1), name: 'Neujahr' },
    { date: addDays(easter, -2), name: 'Karfreitag' },
    { date: addDays(easter, 0), name: 'Ostersonntag' },
    { date: addDays(easter, 1), name: 'Ostermontag' },
    { date: fmt(5, 1), name: 'Tag der Arbeit' },
    { date: addDays(easter, 39), name: 'Christi Himmelfahrt' },
    { date: addDays(easter, 49), name: 'Pfingstsonntag' },
    { date: addDays(easter, 50), name: 'Pfingstmontag' },
    { date: addDays(easter, 60), name: 'Fronleichnam' },
    { date: fmt(10, 3), name: 'Tag der Deutschen Einheit' },
    { date: fmt(11, 1), name: 'Allerheiligen' },
    { date: fmt(12, 25), name: '1. Weihnachtsfeiertag' },
    { date: fmt(12, 26), name: '2. Weihnachtsfeiertag' },
  ]
}
