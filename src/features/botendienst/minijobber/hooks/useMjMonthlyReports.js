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

  const fetchAllReportsForStaff = useCallback(async (staffIds) => {
    if (!pharmacyId || !staffIds || staffIds.length === 0) return []

    setLoading(true)
    const { data, error } = await supabase
      .from('mj_monthly_reports')
      .select('staff_id, year, month, planned_hours, actual_hours, paid_hours, hours_balance, cumulative_balance, monthly_payment, hourly_rate')
      .eq('pharmacy_id', pharmacyId)
      .in('staff_id', staffIds)
      .order('staff_id')
      .order('year')
      .order('month')

    if (error) {
      console.error('Fehler beim Laden der Monatsberichte (alle):', error)
    }

    setReports(data || [])
    setLoading(false)
    return data || []
  }, [pharmacyId])

  // Fetch detailed report for a single month (aggregates from DB + work records & manual entries for display)
  const calculateReport = useCallback(async (staffId, conditions, year, month) => {
    if (!pharmacyId) return null

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    // Fetch aggregate data from mj_monthly_reports (already calculated by DB trigger)
    const [reportRes, schedulesRes, manualRes] = await Promise.all([
      supabase
        .from('mj_monthly_reports')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .eq('staff_id', staffId)
        .eq('year', year)
        .eq('month', month)
        .maybeSingle(),
      supabase
        .from('mj_schedules')
        .select(`
          id, date, absent,
          shift:mj_shifts!mj_schedules_shift_id_fkey(id, name, hours)
        `)
        .eq('pharmacy_id', pharmacyId)
        .eq('staff_id', staffId)
        .gte('date', startDate)
        .lte('date', endDate),
      supabase
        .from('mj_manual_hours')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .eq('staff_id', staffId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date'),
    ])

    const scheduleIds = (schedulesRes.data || []).map(s => s.id)
    let workRecords = []
    if (scheduleIds.length > 0) {
      const { data } = await supabase
        .from('mj_work_records')
        .select('*, schedule:mj_schedules!mj_work_records_schedule_id_fkey(id, date, shift:mj_shifts!mj_schedules_shift_id_fkey(id, name, start_time, end_time, hours))')
        .in('schedule_id', scheduleIds)

      workRecords = data || []
    }

    const report = reportRes.data

    // Use DB-calculated aggregates if available, otherwise fall back to conditions
    const actualHours = report ? parseFloat(report.actual_hours) : 0
    const paidHours = report ? parseFloat(report.paid_hours) : 0
    const cumulativeBalance = report ? parseFloat(report.cumulative_balance) : 0
    const hoursBalance = report ? parseFloat(report.hours_balance) : 0
    const plannedHours = report ? parseFloat(report.planned_hours) : 0
    const hourlyRate = report ? parseFloat(report.hourly_rate) : parseFloat(conditions.hourly_rate || 0)
    const monthlyPayment = report ? parseFloat(report.monthly_payment) : parseFloat(conditions.monthly_payment || 0)

    // previousCumulative = cumulativeBalance - hoursBalance (simple math, no extra query needed)
    const previousCumulative = cumulativeBalance - hoursBalance

    return {
      staffId,
      year,
      month,
      plannedHours: Math.round(plannedHours * 100) / 100,
      actualHours: Math.round(actualHours * 100) / 100,
      paidHours: Math.round(paidHours * 100) / 100,
      hoursBalance: Math.round(hoursBalance * 100) / 100,
      cumulativeBalance: Math.round(cumulativeBalance * 100) / 100,
      previousCumulative: Math.round(previousCumulative * 100) / 100,
      monthlyPayment,
      hourlyRate,
      workRecords,
      manualEntries: manualRes.data || [],
    }
  }, [pharmacyId])

  // Calculate report for an arbitrary date range (for Zeitraum-PDF)
  const calculateRangeReport = useCallback(async (staffId, startDate, endDate) => {
    if (!pharmacyId) return null

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

    const actualHoursFromRecords = workRecords.reduce((sum, wr) => {
      let hours = parseFloat(wr.actual_hours || 0)
      if (hours === 0 && wr.actual_start_time && wr.actual_end_time
          && wr.actual_start_time !== '00:00:00' && wr.actual_end_time !== '00:00:00') {
        const [sh, sm] = wr.actual_start_time.split(':').map(Number)
        const [eh, em] = wr.actual_end_time.split(':').map(Number)
        hours = Math.round(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 100) / 100
        if (hours < 0) hours = 0
      }
      return sum + hours
    }, 0)
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

  return {
    reports,
    loading,
    fetchReports,
    fetchAllReportsForStaff,
    calculateReport,
    calculateRangeReport,
  }
}
