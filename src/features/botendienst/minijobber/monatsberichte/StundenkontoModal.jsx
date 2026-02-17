import { useState, useEffect, useMemo, useRef } from 'react'
import { X } from '@phosphor-icons/react'
import { supabase } from '../../../../lib/supabase'
import { MjHoursDisplay } from '../shared/MjHoursDisplay'
import { MonatsberichtDetail } from './MonatsberichtDetail'

const monthNames = [
  'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
]

const monthNamesFull = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

function EditableCell({ value, onSave, theme }) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef(null)

  const startEdit = () => {
    setEditValue(parseFloat(value || 0).toFixed(2).replace('.', ','))
    setEditing(true)
  }

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const commit = () => {
    setEditing(false)
    const parsed = parseFloat(editValue.replace(',', '.'))
    if (!isNaN(parsed) && parsed !== parseFloat(value || 0)) {
      onSave(parsed)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="w-20 px-1.5 py-0.5 text-right text-sm border border-[#0D9488] rounded bg-white outline-none focus:ring-1 focus:ring-[#0D9488]"
      />
    )
  }

  return (
    <span
      onClick={startEdit}
      className={`cursor-pointer px-1.5 py-0.5 rounded hover:bg-amber-100 hover:text-amber-800 ${theme.textSecondary}`}
      title="Klicken zum Bearbeiten"
    >
      {parseFloat(value || 0).toFixed(2).replace('.', ',')}
    </span>
  )
}

export function StundenkontoModal({ theme, isOpen, staffId, profile, pharmacyId, allReports: passedReports, onClose }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detailMonth, setDetailMonth] = useState(null) // { year, month }

  const fetchFromDb = async () => {
    if (!staffId || !pharmacyId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('mj_monthly_reports')
      .select('year, month, planned_hours, actual_hours, paid_hours, hours_balance, cumulative_balance, hourly_rate, monthly_payment')
      .eq('pharmacy_id', pharmacyId)
      .eq('staff_id', staffId)
      .order('year')
      .order('month')
    if (error) {
      console.error('Fehler beim Laden des Stundenkontos:', error)
    } else {
      setRows(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!isOpen) return

    if (passedReports && passedReports.length > 0) {
      setRows(passedReports)
      return
    }

    fetchFromDb()
  }, [isOpen, staffId, pharmacyId, passedReports])

  const handleSaveCondition = async (year, month, field, value) => {
    if (!pharmacyId || !staffId) return

    setSaving(true)

    // Aktuelle Werte für diesen Monat aus den rows holen
    const currentRow = rows.find(r => r.year === year && r.month === month)
    const currentRate = parseFloat(currentRow?.hourly_rate || profile?.hourly_rate || 0)
    const currentPayment = parseFloat(currentRow?.monthly_payment || profile?.monthly_payment || 0)

    const hourlyRate = field === 'hourly_rate' ? value : currentRate
    const monthlyPayment = field === 'monthly_payment' ? value : currentPayment

    const { error } = await supabase
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

    if (error) {
      console.error('Fehler beim Speichern der Konditionen:', error)
    } else {
      // Trigger hat Reports neu berechnet → frisch laden
      await fetchFromDb()
    }
    setSaving(false)
  }

  // Neuester Monat oben
  const displayRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => (b.year * 100 + b.month) - (a.year * 100 + a.month))
    return sorted
  }, [rows])

  if (!isOpen) return null

  const name = profile?.staff
    ? `${profile.staff.first_name} ${profile.staff.last_name}`
    : 'Unbekannt'

  const initialBalance = parseFloat(profile?.initial_balance || 0)
  const latestBalance = rows.length > 0
    ? parseFloat([...rows].sort((a, b) => (b.year * 100 + b.month) - (a.year * 100 + a.month))[0].cumulative_balance || 0)
    : initialBalance

  const fmt = (v) => parseFloat(v || 0).toFixed(2).replace('.', ',')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>Stundenkonto</h2>
            <p className={`text-sm ${theme.textSecondary}`}>{name}</p>
          </div>
          <div className="flex items-center gap-4">
            {saving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0D9488]" />
            )}
            <div className="text-right">
              <p className={`text-xs ${theme.textMuted}`}>Aktueller Stand</p>
              <MjHoursDisplay hours={latestBalance} showSign className="font-bold text-lg" />
            </div>
            <button onClick={onClose} className={`p-2 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]" />
            </div>
          ) : rows.length === 0 ? (
            <div className={`text-center py-12 ${theme.textMuted}`}>
              Noch keine Monatsberichte vorhanden.
            </div>
          ) : (
            <table className="w-full text-sm border-collapse tabular-nums">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className={`px-3 py-2.5 text-left font-semibold ${theme.textPrimary} border-b-2 border-gray-300`}>Monat</th>
                  <th className={`px-3 py-2.5 text-right font-semibold ${theme.textPrimary} border-b-2 border-gray-300`}>Ist</th>
                  <th className={`px-3 py-2.5 text-right font-semibold ${theme.textPrimary} border-b-2 border-gray-300`}>Soll</th>
                  <th className={`px-3 py-2.5 text-right font-semibold ${theme.textPrimary} border-b-2 border-gray-300`}>+/−</th>
                  <th className={`px-3 py-2.5 text-right font-semibold ${theme.textPrimary} border-b-2 border-gray-300`}>€/Std.</th>
                  <th className={`px-3 py-2.5 text-right font-semibold ${theme.textPrimary} border-b-2 border-gray-300`}>Auszahl.</th>
                  <th className={`px-3 py-2.5 text-right font-semibold ${theme.textPrimary} border-b-2 border-gray-300`}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((r, i) => (
                  <tr key={`${r.year}-${r.month}`} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-amber-50/40`}>
                    <td
                      className={`px-3 py-2 font-medium ${theme.textPrimary} border-b border-gray-200 cursor-pointer hover:text-[#0D9488] hover:underline`}
                      onClick={() => setDetailMonth({ year: r.year, month: r.month })}
                      title="Details anzeigen"
                    >
                      {monthNames[r.month - 1]} {r.year}
                    </td>
                    <td className={`px-3 py-2 text-right ${theme.textPrimary} border-b border-gray-200`}>
                      {fmt(r.actual_hours)}
                    </td>
                    <td className={`px-3 py-2 text-right ${theme.textSecondary} border-b border-gray-200`}>
                      {fmt(r.paid_hours)}
                    </td>
                    <td className={`px-3 py-2 text-right border-b border-gray-200`}>
                      <MjHoursDisplay hours={r.hours_balance} showSign className="font-medium" />
                    </td>
                    <td className={`px-3 py-2 text-right border-b border-gray-200`}>
                      <EditableCell
                        value={r.hourly_rate}
                        theme={theme}
                        onSave={(v) => handleSaveCondition(r.year, r.month, 'hourly_rate', v)}
                      />
                    </td>
                    <td className={`px-3 py-2 text-right border-b border-gray-200`}>
                      <EditableCell
                        value={r.monthly_payment}
                        theme={theme}
                        onSave={(v) => handleSaveCondition(r.year, r.month, 'monthly_payment', v)}
                      />
                    </td>
                    <td className={`px-3 py-2 text-right border-b border-gray-200`}>
                      <MjHoursDisplay hours={r.cumulative_balance} showSign className="font-semibold" />
                    </td>
                  </tr>
                ))}

                {initialBalance !== 0 && (
                  <tr className="bg-amber-50/50">
                    <td className={`px-3 py-2 font-medium italic ${theme.textSecondary} border-b border-gray-200`} colSpan={6}>
                      Anfangsbestand
                    </td>
                    <td className="px-3 py-2 text-right border-b border-gray-200">
                      <MjHoursDisplay hours={initialBalance} showSign className="font-semibold italic" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Monatsdetail-Modal */}
      {detailMonth && (
        <MonatsberichtDetail
          theme={theme}
          isOpen={!!detailMonth}
          staffId={staffId}
          profile={profile}
          calculatedReport={null}
          savedReport={null}
          pharmacyId={pharmacyId}
          year={detailMonth.year}
          month={detailMonth.month}
          monthName={monthNamesFull[detailMonth.month - 1]}
          onClose={() => setDetailMonth(null)}
        />
      )}
    </div>
  )
}
