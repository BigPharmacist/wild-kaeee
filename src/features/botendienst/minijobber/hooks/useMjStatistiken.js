import { useState, useCallback } from 'react'
import { supabase } from '../../../../lib/supabase'

export function useMjStatistiken({ pharmacyId }) {
  const [reports, setReports] = useState([])
  const [schedules, setSchedules] = useState([])
  const [workRecords, setWorkRecords] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchStatistiken = useCallback(async (staffIds, year) => {
    if (!pharmacyId || !staffIds || staffIds.length === 0) return

    setLoading(true)

    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`

    const [reportsRes, schedulesRes, workRecordsRes] = await Promise.all([
      // 1. All monthly reports for the year
      supabase
        .from('mj_monthly_reports')
        .select('staff_id, year, month, planned_hours, actual_hours, paid_hours, hours_balance, cumulative_balance, monthly_payment, hourly_rate')
        .eq('pharmacy_id', pharmacyId)
        .eq('year', year)
        .in('staff_id', staffIds)
        .order('month'),

      // 2. All schedules for the year (with shift join)
      supabase
        .from('mj_schedules')
        .select(`
          id, staff_id, shift_id, date, absent, absent_reason,
          shift:mj_shifts!mj_schedules_shift_id_fkey(id, name, start_time, end_time, hours)
        `)
        .eq('pharmacy_id', pharmacyId)
        .in('staff_id', staffIds)
        .gte('date', startDate)
        .lte('date', endDate),

      // 3. All work records for the year (via pharmacy, then filter by schedule date)
      supabase
        .from('mj_work_records')
        .select(`
          id, schedule_id, actual_start_time, actual_end_time, actual_hours,
          schedule:mj_schedules!mj_work_records_schedule_id_fkey(
            id, staff_id, date,
            shift:mj_shifts!mj_schedules_shift_id_fkey(id, name, start_time, end_time, hours)
          )
        `)
        .eq('pharmacy_id', pharmacyId),
    ])

    if (reportsRes.error) {
      console.error('Fehler beim Laden der Reports:', reportsRes.error)
    }
    if (schedulesRes.error) {
      console.error('Fehler beim Laden der Schedules:', schedulesRes.error)
    }
    if (workRecordsRes.error) {
      console.error('Fehler beim Laden der Work Records:', workRecordsRes.error)
    }

    setReports(reportsRes.data || [])
    setSchedules(schedulesRes.data || [])

    // Filter work records to the year via their schedule date
    const filtered = (workRecordsRes.data || []).filter(wr => {
      const d = wr.schedule?.date
      return d && d >= startDate && d <= endDate && staffIds.includes(wr.schedule?.staff_id)
    })
    setWorkRecords(filtered)

    setLoading(false)
  }, [pharmacyId])

  return { reports, schedules, workRecords, loading, fetchStatistiken }
}
