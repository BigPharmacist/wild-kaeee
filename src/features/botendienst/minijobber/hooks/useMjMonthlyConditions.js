import { useState, useCallback } from 'react'
import { supabase } from '../../../../lib/supabase'

export function useMjMonthlyConditions({ pharmacyId }) {
  const [conditions, setConditions] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchConditionsForMonth = useCallback(async (year, month) => {
    if (!pharmacyId) return []

    setLoading(true)
    const { data, error } = await supabase
      .from('mj_monthly_conditions')
      .select('*, staff:staff!mj_monthly_conditions_staff_id_fkey(id, first_name, last_name)')
      .eq('pharmacy_id', pharmacyId)
      .eq('year', year)
      .eq('month', month)

    if (error) {
      console.error('Fehler beim Laden der Konditionen:', error)
      setLoading(false)
      return []
    }

    setConditions(data || [])
    setLoading(false)
    return data || []
  }, [pharmacyId])

  const fetchConditionsHistory = useCallback(async (staffId) => {
    if (!pharmacyId || !staffId) return []

    setLoading(true)
    const { data, error } = await supabase
      .from('mj_monthly_conditions')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .eq('staff_id', staffId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    setLoading(false)

    if (error) {
      console.error('Fehler beim Laden des Konditionsverlaufs:', error)
      return []
    }

    return data || []
  }, [pharmacyId])

  const upsertConditions = useCallback(async (staffId, year, month, hourlyRate, monthlyPayment) => {
    if (!pharmacyId) return null

    const { data, error } = await supabase
      .from('mj_monthly_conditions')
      .upsert({
        pharmacy_id: pharmacyId,
        staff_id: staffId,
        year,
        month,
        hourly_rate: hourlyRate,
        monthly_payment: monthlyPayment,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'staff_id,year,month' })
      .select()
      .single()

    if (error) {
      console.error('Fehler beim Speichern der Konditionen:', error)
      return null
    }

    return data
  }, [pharmacyId])

  // Lookup with fallback: exact month → last set month before → profile defaults
  const getEffectiveConditions = useCallback(async (staffId, year, month) => {
    if (!pharmacyId) return null

    // 1. Exact month
    const { data: exact } = await supabase
      .from('mj_monthly_conditions')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .eq('staff_id', staffId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle()

    if (exact) return exact

    // 2. Last set month before this one
    const { data: previous } = await supabase
      .from('mj_monthly_conditions')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .eq('staff_id', staffId)
      .or(`year.lt.${year},and(year.eq.${year},month.lt.${month})`)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (previous) return previous

    // 3. Profile defaults
    const { data: profile } = await supabase
      .from('mj_profiles')
      .select('hourly_rate, monthly_payment')
      .eq('pharmacy_id', pharmacyId)
      .eq('staff_id', staffId)
      .maybeSingle()

    if (profile) {
      return {
        staff_id: staffId,
        year,
        month,
        hourly_rate: profile.hourly_rate,
        monthly_payment: profile.monthly_payment,
      }
    }

    return null
  }, [pharmacyId])

  return {
    conditions,
    loading,
    fetchConditionsForMonth,
    fetchConditionsHistory,
    upsertConditions,
    getEffectiveConditions,
  }
}
