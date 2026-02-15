import { useState, useEffect } from 'react'
import { X, Plus, Clock } from '@phosphor-icons/react'

export function HourlyRateHistory({ theme, isOpen, profile, pharmacyId, profilesHook, onClose }) {
  const { fetchRateHistory, addRateEntry, addPaymentEntry } = profilesHook
  const [hourlyRates, setHourlyRates] = useState([])
  const [monthlyPayments, setMonthlyPayments] = useState([])
  const [loading, setLoading] = useState(false)

  const [newRate, setNewRate] = useState('')
  const [newRateDate, setNewRateDate] = useState('')
  const [newPayment, setNewPayment] = useState('')
  const [newPaymentDate, setNewPaymentDate] = useState('')

  useEffect(() => {
    if (isOpen && profile?.staff_id) {
      setLoading(true)
      fetchRateHistory(profile.staff_id).then(({ hourlyRates: hr, monthlyPayments: mp }) => {
        setHourlyRates(hr)
        setMonthlyPayments(mp)
        setLoading(false)
      })
    }
  }, [isOpen, profile?.staff_id, fetchRateHistory])

  const handleAddRate = async () => {
    if (!newRate || !newRateDate) return
    const result = await addRateEntry(profile.staff_id, parseFloat(newRate), newRateDate)
    if (result) {
      setHourlyRates(prev => [result, ...prev])
      setNewRate('')
      setNewRateDate('')
    }
  }

  const handleAddPayment = async () => {
    if (!newPayment || !newPaymentDate) return
    const result = await addPaymentEntry(profile.staff_id, parseFloat(newPayment), newPaymentDate)
    if (result) {
      setMonthlyPayments(prev => [result, ...prev])
      setNewPayment('')
      setNewPaymentDate('')
    }
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
              <Clock size={20} className="text-[#F59E0B]" />
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>Verlauf</h2>
              <p className={`text-sm ${theme.textSecondary}`}>{name}</p>
            </div>
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
              {/* Hourly Rate History */}
              <div>
                <h3 className={`text-sm font-semibold ${theme.textPrimary} mb-3`}>Stundenlohn-Verlauf</h3>
                <div className="space-y-2">
                  {hourlyRates.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                      <span className={theme.textSecondary}>
                        ab {new Date(entry.valid_from).toLocaleDateString('de-DE')}
                      </span>
                      <span className={`font-medium ${theme.textPrimary}`}>
                        {parseFloat(entry.rate).toFixed(2).replace('.', ',')} &euro;/Std.
                      </span>
                    </div>
                  ))}
                  {hourlyRates.length === 0 && (
                    <p className={`text-sm ${theme.textMuted}`}>Kein Verlauf vorhanden</p>
                  )}
                </div>

                {/* Add new rate */}
                <div className="flex items-end gap-2 mt-3">
                  <div className="flex-1">
                    <label className={`block text-xs ${theme.textMuted} mb-1`}>Gültig ab</label>
                    <input
                      type="date"
                      value={newRateDate}
                      onChange={(e) => setNewRateDate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={`block text-xs ${theme.textMuted} mb-1`}>Stundenlohn (&euro;)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
                    />
                  </div>
                  <button
                    onClick={handleAddRate}
                    disabled={!newRate || !newRateDate}
                    className={`p-2 rounded-lg ${theme.accent} text-white disabled:opacity-50`}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {/* Monthly Payment History */}
              <div>
                <h3 className={`text-sm font-semibold ${theme.textPrimary} mb-3`}>Pauschale-Verlauf</h3>
                <div className="space-y-2">
                  {monthlyPayments.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
                      <span className={theme.textSecondary}>
                        ab {new Date(entry.valid_from).toLocaleDateString('de-DE')}
                      </span>
                      <span className={`font-medium ${theme.textPrimary}`}>
                        {parseFloat(entry.amount).toFixed(2).replace('.', ',')} &euro;/Monat
                      </span>
                    </div>
                  ))}
                  {monthlyPayments.length === 0 && (
                    <p className={`text-sm ${theme.textMuted}`}>Kein Verlauf vorhanden</p>
                  )}
                </div>

                {/* Add new payment */}
                <div className="flex items-end gap-2 mt-3">
                  <div className="flex-1">
                    <label className={`block text-xs ${theme.textMuted} mb-1`}>Gültig ab</label>
                    <input
                      type="date"
                      value={newPaymentDate}
                      onChange={(e) => setNewPaymentDate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className={`block text-xs ${theme.textMuted} mb-1`}>Pauschale (&euro;)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newPayment}
                      onChange={(e) => setNewPayment(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
                    />
                  </div>
                  <button
                    onClick={handleAddPayment}
                    disabled={!newPayment || !newPaymentDate}
                    className={`p-2 rounded-lg ${theme.accent} text-white disabled:opacity-50`}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
