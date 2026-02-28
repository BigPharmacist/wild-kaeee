import { useState, useEffect } from 'react'
import { X } from '@phosphor-icons/react'
import { useMjMonthlyReports } from '../hooks/useMjMonthlyReports'
import { useMjMonthlyConditions } from '../hooks/useMjMonthlyConditions'
import { MjShiftBadge } from '../shared/MjShiftBadge'
import { MjHoursDisplay } from '../shared/MjHoursDisplay'

export function MonatsberichtDetail({ theme, isOpen, staffId, profile, calculatedReport, savedReport, pharmacyId, year, month, monthName, onClose }) {
  const { calculateReport } = useMjMonthlyReports({ pharmacyId })
  const { getEffectiveConditions } = useMjMonthlyConditions({ pharmacyId })
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && staffId && profile) {
      if (calculatedReport) {
        setReportData(calculatedReport)
      } else {
        setLoading(true)
        getEffectiveConditions(staffId, year, month).then(conditions => {
          if (!conditions) {
            setLoading(false)
            return
          }
          calculateReport(staffId, conditions, year, month).then(data => {
            setReportData(data)
            setLoading(false)
          })
        })
      }
    }
  }, [isOpen, staffId, profile, calculatedReport, year, month, calculateReport, getEffectiveConditions])

  if (!isOpen) return null

  const name = profile?.staff
    ? `${profile.staff.first_name} ${profile.staff.last_name}`
    : 'Unbekannt'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>{name}</h2>
            <p className={`text-sm ${theme.textSecondary}`}>{monthName} {year}</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DC2626]" />
            </div>
          ) : reportData ? (
            <>
              {/* Summary */}
              <div className={`p-4 rounded-xl border ${theme.border} space-y-2`}>
                <div className="flex justify-between text-sm">
                  <span className={theme.textSecondary}>Übertrag aus Vormonat</span>
                  <MjHoursDisplay hours={reportData.previousCumulative} showSign className="font-medium" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className={theme.textSecondary}>+ Stunden diesen Monat</span>
                  <span className={`font-medium ${theme.textPrimary}`}>+{parseFloat(reportData.actualHours).toFixed(2).replace('.', ',')} h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={theme.textSecondary}>- Bezahlte Stunden ({parseFloat(reportData.monthlyPayment).toFixed(2).replace('.', ',')} &euro; / {parseFloat(reportData.hourlyRate).toFixed(2).replace('.', ',')} &euro;)</span>
                  <span className={`font-medium ${theme.textPrimary}`}>-{parseFloat(reportData.paidHours).toFixed(2).replace('.', ',')} h</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className={`font-semibold ${theme.textPrimary}`}>= Neuer Gesamtstand</span>
                  <MjHoursDisplay hours={reportData.cumulativeBalance} showSign className="font-bold text-base" />
                </div>
              </div>

              {/* Work Records Table */}
              {reportData.workRecords?.length > 0 && (
                <div>
                  <h3 className={`text-sm font-semibold ${theme.textPrimary} mb-2`}>Geleistete Stunden (Dienstplan)</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className={`px-3 py-2 text-left ${theme.textSecondary} font-medium`}>Datum</th>
                        <th className={`px-3 py-2 text-left ${theme.textSecondary} font-medium`}>Schicht</th>
                        <th className={`px-3 py-2 text-left ${theme.textSecondary} font-medium`}>Zeit</th>
                        <th className={`px-3 py-2 text-right ${theme.textSecondary} font-medium`}>Stunden</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.workRecords
                        .sort((a, b) => (a.schedule?.date || '').localeCompare(b.schedule?.date || ''))
                        .map(wr => (
                          <tr key={wr.id} className="border-b border-gray-50">
                            <td className={`px-3 py-2 ${theme.textPrimary}`}>
                              {wr.schedule?.date ? new Date(wr.schedule.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }) : '–'}
                            </td>
                            <td className="px-3 py-2">
                              <MjShiftBadge shiftName={wr.schedule?.shift?.name} compact />
                            </td>
                            <td className={`px-3 py-2 ${theme.textSecondary}`}>
                              {wr.actual_start_time?.substring(0, 5)} – {wr.actual_end_time?.substring(0, 5)}
                            </td>
                            <td className={`px-3 py-2 text-right font-medium ${theme.textPrimary}`}>
                              {parseFloat(wr.actual_hours || 0).toFixed(2).replace('.', ',')}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Manual Hours */}
              {reportData.manualEntries?.length > 0 && (
                <div>
                  <h3 className={`text-sm font-semibold ${theme.textPrimary} mb-2`}>Manuell hinzugefügte Stunden</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className={`px-3 py-2 text-left ${theme.textSecondary} font-medium`}>Datum</th>
                        <th className={`px-3 py-2 text-left ${theme.textSecondary} font-medium`}>Beschreibung</th>
                        <th className={`px-3 py-2 text-right ${theme.textSecondary} font-medium`}>Stunden</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.manualEntries.map(mh => (
                        <tr key={mh.id} className="border-b border-gray-50">
                          <td className={`px-3 py-2 ${theme.textPrimary}`}>
                            {new Date(mh.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                          </td>
                          <td className={`px-3 py-2 ${theme.textSecondary}`}>{mh.description || '–'}</td>
                          <td className={`px-3 py-2 text-right font-medium ${theme.textPrimary}`}>
                            {parseFloat(mh.hours).toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Total */}
              <div className={`flex justify-between items-center p-3 rounded-lg bg-gray-50 text-sm`}>
                <span className={`font-semibold ${theme.textPrimary}`}>Gesamt Ist-Stunden</span>
                <span className={`font-bold ${theme.textPrimary}`}>{parseFloat(reportData.actualHours).toFixed(2).replace('.', ',')} h</span>
              </div>
            </>
          ) : (
            <div className={`text-center py-8 ${theme.textMuted}`}>
              Keine Daten für diesen Monat vorhanden.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
