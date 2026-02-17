import { useState, useEffect } from 'react'
import { X, Plus } from '@phosphor-icons/react'
import { useMjMonthlyConditions } from '../hooks/useMjMonthlyConditions'

const monthNames = [
  'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
]

export function MonthlyConditionsView({ theme, isOpen, profile, pharmacyId, onClose }) {
  const { fetchConditionsHistory, upsertConditions } = useMjMonthlyConditions({ pharmacyId })
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  // Form state
  const now = new Date()
  const [formYear, setFormYear] = useState(now.getFullYear())
  const [formMonth, setFormMonth] = useState(now.getMonth() + 1)
  const [formRate, setFormRate] = useState('')
  const [formPayment, setFormPayment] = useState('')

  // Bulk mode
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkEndYear, setBulkEndYear] = useState(now.getFullYear())
  const [bulkEndMonth, setBulkEndMonth] = useState(12)

  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen && profile?.staff_id) {
      setLoading(true)
      fetchConditionsHistory(profile.staff_id).then(data => {
        setHistory(data)
        setLoading(false)
      })
    }
  }, [isOpen, profile?.staff_id, fetchConditionsHistory])

  const handleSave = async () => {
    if (!formRate || !formPayment) return
    setSaving(true)

    const rate = parseFloat(formRate)
    const payment = parseFloat(formPayment)

    if (bulkMode) {
      // Generate all months from start to end
      let y = formYear
      let m = formMonth
      const endVal = bulkEndYear * 12 + bulkEndMonth
      const results = []

      while (y * 12 + m <= endVal) {
        const result = await upsertConditions(profile.staff_id, y, m, rate, payment)
        if (result) results.push(result)
        m++
        if (m > 12) { m = 1; y++ }
      }

      // Refresh history
      const data = await fetchConditionsHistory(profile.staff_id)
      setHistory(data)
    } else {
      const result = await upsertConditions(profile.staff_id, formYear, formMonth, rate, payment)
      if (result) {
        const data = await fetchConditionsHistory(profile.staff_id)
        setHistory(data)
      }
    }

    setFormRate('')
    setFormPayment('')
    setSaving(false)
  }

  if (!isOpen) return null

  const name = profile?.staff
    ? `${profile.staff.first_name} ${profile.staff.last_name}`
    : 'Unbekannt'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>Konditionen</h2>
            <p className={`text-sm ${theme.textSecondary}`}>{name}</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}>
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]" />
            </div>
          ) : (
            <>
              {/* History table */}
              <div>
                <h3 className={`text-sm font-semibold ${theme.textPrimary} mb-3`}>Gesetzte Monate</h3>
                {history.length > 0 ? (
                  <div className="space-y-1.5">
                    {history.map(entry => (
                      <div key={entry.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                        <span className={`font-medium ${theme.textPrimary}`}>
                          {monthNames[entry.month - 1]} {entry.year}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className={theme.textSecondary}>
                            {parseFloat(entry.hourly_rate).toFixed(2).replace('.', ',')} &euro;/Std.
                          </span>
                          <span className={theme.textSecondary}>
                            {parseFloat(entry.monthly_payment).toFixed(2).replace('.', ',')} &euro;/Mon.
                          </span>
                          <span className={theme.textMuted} title="Soll-Stunden">
                            {parseFloat(entry.hourly_rate) > 0
                              ? (parseFloat(entry.monthly_payment) / parseFloat(entry.hourly_rate)).toFixed(1).replace('.', ',')
                              : '0'} h
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${theme.textMuted}`}>Noch keine Konditionen gesetzt</p>
                )}
              </div>

              {/* Add form */}
              <div className={`p-4 rounded-xl border ${theme.border} space-y-3`}>
                <h3 className={`text-sm font-semibold ${theme.textPrimary}`}>Konditionen setzen</h3>

                {/* Month selector */}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className={`block text-xs ${theme.textMuted} mb-1`}>Monat</label>
                    <select
                      value={formMonth}
                      onChange={e => setFormMonth(parseInt(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
                    >
                      {monthNames.map((name, i) => (
                        <option key={i} value={i + 1}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className={`block text-xs ${theme.textMuted} mb-1`}>Jahr</label>
                    <input
                      type="number"
                      value={formYear}
                      onChange={e => setFormYear(parseInt(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
                    />
                  </div>
                </div>

                {/* Rate & Payment */}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className={`block text-xs ${theme.textMuted} mb-1`}>Stundenlohn (&euro;)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formRate}
                      onChange={e => setFormRate(e.target.value)}
                      placeholder={profile?.hourly_rate?.toString()}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={`block text-xs ${theme.textMuted} mb-1`}>Pauschale (&euro;)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formPayment}
                      onChange={e => setFormPayment(e.target.value)}
                      placeholder={profile?.monthly_payment?.toString()}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
                    />
                  </div>
                </div>

                {/* Bulk mode toggle */}
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkMode}
                    onChange={e => setBulkMode(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className={theme.textSecondary}>Mehrere Monate setzen</span>
                </label>

                {bulkMode && (
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className={`block text-xs ${theme.textMuted} mb-1`}>Bis Monat</label>
                      <select
                        value={bulkEndMonth}
                        onChange={e => setBulkEndMonth(parseInt(e.target.value))}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
                      >
                        {monthNames.map((name, i) => (
                          <option key={i} value={i + 1}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className={`block text-xs ${theme.textMuted} mb-1`}>Bis Jahr</label>
                      <input
                        type="number"
                        value={bulkEndYear}
                        onChange={e => setBulkEndYear(parseInt(e.target.value))}
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={!formRate || !formPayment || saving}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium text-sm disabled:opacity-50`}
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Plus size={16} weight="bold" />
                  )}
                  {saving ? 'Speichere...' : bulkMode ? 'Monate setzen' : 'Speichern'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
