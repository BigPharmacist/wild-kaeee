import { useState, useCallback } from 'react'
import { supabase } from '../../../../lib/supabase'

export function useMjMonthlyReports({ pharmacyId }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchReports = useCallback(async (year, month) => {
    if (!pharmacyId) return

    setLoading(true)
    const { data, error } = await supabase
      .from('mj_monthly_reports')
      .select('*, staff:staff!mj_monthly_reports_staff_id_fkey(id, first_name, last_name)')
      .eq('pharmacy_id', pharmacyId)
      .eq('year', year)
      .eq('month', month)
      .order('created_at')

    if (error) {
      console.error('Fehler beim Laden der Monatsberichte:', error)
    } else {
      setReports(data || [])
    }
    setLoading(false)
  }, [pharmacyId])

  // Calculate cumulative balance for a staff member up to (but not including) the given month
  // Sums ALL reports — no finalization filter
  const getCumulativeBalance = useCallback(async (staffId, year, month) => {
    if (!pharmacyId) return 0

    const { data, error } = await supabase
      .from('mj_monthly_reports')
      .select('hours_balance')
      .eq('pharmacy_id', pharmacyId)
      .eq('staff_id', staffId)
      .or(`year.lt.${year},and(year.eq.${year},month.lt.${month})`)
      .order('year')
      .order('month')

    if (error) {
      console.error('Fehler beim Laden des kumulativen Saldos:', error)
      return 0
    }

    return (data || []).reduce((sum, r) => sum + parseFloat(r.hours_balance || 0), 0)
  }, [pharmacyId])

  // Calculate report data for a specific employee and month
  // conditions: { hourly_rate, monthly_payment } from mj_monthly_conditions
  const calculateReport = useCallback(async (staffId, conditions, year, month) => {
    if (!pharmacyId) return null

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    // Fetch work records for this month (via schedules)
    const { data: schedules } = await supabase
      .from('mj_schedules')
      .select(`
        id, date, absent,
        shift:mj_shifts!mj_schedules_shift_id_fkey(id, name, hours)
      `)
      .eq('pharmacy_id', pharmacyId)
      .eq('staff_id', staffId)
      .gte('date', startDate)
      .lte('date', endDate)

    const scheduleIds = (schedules || []).map(s => s.id)
    let workRecords = []
    if (scheduleIds.length > 0) {
      const { data } = await supabase
        .from('mj_work_records')
        .select('*, schedule:mj_schedules!mj_work_records_schedule_id_fkey(id, date, shift:mj_shifts!mj_schedules_shift_id_fkey(id, name, start_time, end_time, hours))')
        .in('schedule_id', scheduleIds)

      workRecords = data || []
    }

    // Fetch manual hours
    const { data: manualEntries } = await supabase
      .from('mj_manual_hours')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .eq('staff_id', staffId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')

    // Calculate totals
    const plannedHours = (schedules || [])
      .filter(s => !s.absent)
      .reduce((sum, s) => sum + parseFloat(s.shift?.hours || 0), 0)

    const actualHoursFromRecords = workRecords.reduce((sum, wr) => sum + parseFloat(wr.actual_hours || 0), 0)
    const manualHoursTotal = (manualEntries || []).reduce((sum, mh) => sum + parseFloat(mh.hours || 0), 0)
    const actualHours = actualHoursFromRecords + manualHoursTotal

    const hourlyRate = parseFloat(conditions.hourly_rate || 0)
    const monthlyPayment = parseFloat(conditions.monthly_payment || 0)
    const paidHours = hourlyRate > 0 ? monthlyPayment / hourlyRate : 0

    const previousCumulative = await getCumulativeBalance(staffId, year, month)
    const monthBalance = actualHours - paidHours
    const cumulativeBalance = previousCumulative + monthBalance

    return {
      staffId,
      year,
      month,
      plannedHours: Math.round(plannedHours * 100) / 100,
      actualHours: Math.round(actualHours * 100) / 100,
      paidHours: Math.round(paidHours * 100) / 100,
      hoursBalance: Math.round(monthBalance * 100) / 100,
      cumulativeBalance: Math.round(cumulativeBalance * 100) / 100,
      previousCumulative: Math.round(previousCumulative * 100) / 100,
      monthlyPayment,
      hourlyRate,
      workRecords,
      manualEntries: manualEntries || [],
    }
  }, [pharmacyId, getCumulativeBalance])

  // Calculate report for an arbitrary date range (for Zeitraum-PDF)
  const calculateRangeReport = useCallback(async (staffId, startDate, endDate) => {
    if (!pharmacyId) return null

    // Fetch schedules in range
    const { data: schedules } = await supabase
      .from('mj_schedules')
      .select(`
        id, date, absent,
        shift:mj_shifts!mj_schedules_shift_id_fkey(id, name, hours)
      `)
      .eq('pharmacy_id', pharmacyId)
      .eq('staff_id', staffId)
      .gte('date', startDate)
      .lte('date', endDate)

    const scheduleIds = (schedules || []).map(s => s.id)
    let workRecords = []
    if (scheduleIds.length > 0) {
      const { data } = await supabase
        .from('mj_work_records')
        .select('*, schedule:mj_schedules!mj_work_records_schedule_id_fkey(id, date, shift:mj_shifts!mj_schedules_shift_id_fkey(id, name, start_time, end_time, hours))')
        .in('schedule_id', scheduleIds)

      workRecords = data || []
    }

    // Fetch manual hours
    const { data: manualEntries } = await supabase
      .from('mj_manual_hours')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .eq('staff_id', staffId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')

    const plannedHours = (schedules || [])
      .filter(s => !s.absent)
      .reduce((sum, s) => sum + parseFloat(s.shift?.hours || 0), 0)

    const actualHoursFromRecords = workRecords.reduce((sum, wr) => sum + parseFloat(wr.actual_hours || 0), 0)
    const manualHoursTotal = (manualEntries || []).reduce((sum, mh) => sum + parseFloat(mh.hours || 0), 0)
    const actualHours = actualHoursFromRecords + manualHoursTotal

    return {
      staffId,
      startDate,
      endDate,
      plannedHours: Math.round(plannedHours * 100) / 100,
      actualHours: Math.round(actualHours * 100) / 100,
      workRecords,
      manualEntries: manualEntries || [],
    }
  }, [pharmacyId])

  const saveReport = useCallback(async (reportData) => {
    if (!pharmacyId) return null

    const { data, error } = await supabase
      .from('mj_monthly_reports')
      .upsert({
        pharmacy_id: pharmacyId,
        staff_id: reportData.staffId,
        year: reportData.year,
        month: reportData.month,
        planned_hours: reportData.plannedHours,
        actual_hours: reportData.actualHours,
        paid_hours: reportData.paidHours,
        hours_balance: reportData.hoursBalance,
        cumulative_balance: reportData.cumulativeBalance,
        monthly_payment: reportData.monthlyPayment,
        hourly_rate: reportData.hourlyRate,
      }, { onConflict: 'staff_id,year,month' })
      .select('*, staff:staff!mj_monthly_reports_staff_id_fkey(id, first_name, last_name)')
      .single()

    if (error) {
      console.error('Fehler beim Speichern des Berichts:', error)
      return null
    }

    setReports(prev => {
      const idx = prev.findIndex(r => r.staff_id === reportData.staffId && r.year === reportData.year && r.month === reportData.month)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = data
        return updated
      }
      return [...prev, data]
    })

    return data
  }, [pharmacyId])

  return {
    reports,
    loading,
    fetchReports,
    calculateReport,
    calculateRangeReport,
    saveReport,
    getCumulativeBalance,
  }
}
