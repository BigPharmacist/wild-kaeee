import { useState, useEffect } from 'react'
import { Calculator, FilePdf, CalendarBlank } from '@phosphor-icons/react'
import { useMjMonthlyReports } from '../hooks/useMjMonthlyReports'
import { useMjMonthlyConditions } from '../hooks/useMjMonthlyConditions'
import { MjMonthSelector } from '../shared/MjMonthSelector'
import { MjHoursDisplay } from '../shared/MjHoursDisplay'
import { MonatsberichtDetail } from './MonatsberichtDetail'
import { ZeitraumPdfDialog } from './ZeitraumPdfDialog'
import { generateMonatsberichtPdf } from './MonatsberichtPdf'

const monthNames = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

export function MonatsberichteView({ theme, pharmacyId, pharmacies, profiles, currentStaff }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [calculating, setCalculating] = useState(false)
  const [calculatedReports, setCalculatedReports] = useState({})
  const [detailStaffId, setDetailStaffId] = useState(null)
  const [showZeitraumPdf, setShowZeitraumPdf] = useState(false)

  const { reports, loading, fetchReports, calculateReport, calculateRangeReport, saveReport } = useMjMonthlyReports({ pharmacyId })
  const { getEffectiveConditions } = useMjMonthlyConditions({ pharmacyId })

  const pharmacy = pharmacies?.find(p => p.id === pharmacyId)

  useEffect(() => {
    if (pharmacyId) {
      fetchReports(year, month)
      setCalculatedReports({})
    }
  }, [pharmacyId, year, month, fetchReports])

  const handleCalculateAll = async () => {
    setCalculating(true)
    const results = {}

    for (const profile of activeProfiles) {
      const conditions = await getEffectiveConditions(profile.staff_id, year, month)
      if (!conditions) continue

      const reportData = await calculateReport(profile.staff_id, conditions, year, month)
      if (reportData) {
        results[profile.staff_id] = reportData
        await saveReport(reportData)
      }
    }

    setCalculatedReports(results)
    await fetchReports(year, month)
    setCalculating(false)
  }

  const handlePdf = async (profile) => {
    const staffId = profile.staff_id
    let reportData = calculatedReports[staffId]

    if (!reportData) {
      const conditions = await getEffectiveConditions(staffId, year, month)
      if (!conditions) {
        alert('Keine Konditionen für diesen Monat vorhanden')
        return
      }
      reportData = await calculateReport(staffId, conditions, year, month)
    }

    if (!reportData) {
      alert('Keine Daten für PDF vorhanden')
      return
    }

    const name = profile.staff
      ? `${profile.staff.first_name} ${profile.staff.last_name}`
      : 'Unbekannt'

    generateMonatsberichtPdf({
      pharmacy,
      employeeName: name,
      year,
      month,
      monthName: monthNames[month - 1],
      reportData,
    })
  }

  const activeProfiles = profiles.filter(p => p.active)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`${theme.surface} border ${theme.border} rounded-xl p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MjMonthSelector theme={theme} year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowZeitraumPdf(true)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border ${theme.border} ${theme.textSecondary} hover:bg-gray-100 font-medium text-sm`}
            >
              <CalendarBlank size={18} />
              Zeitraum-PDF
            </button>
            <button
              onClick={handleCalculateAll}
              disabled={calculating}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium text-sm`}
            >
              {calculating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Calculator size={18} weight="bold" />
              )}
              {calculating ? 'Berechne...' : 'Alle berechnen'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {(loading || calculating) && reports.length === 0 && (
        <div className={`${theme.surface} border ${theme.border} rounded-xl p-12 flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]" />
        </div>
      )}

      {/* Reports Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeProfiles.map(profile => {
            const report = reports.find(r => r.staff_id === profile.staff_id)
            const calculated = calculatedReports[profile.staff_id]
            const data = report || calculated
            const name = profile.staff
              ? `${profile.staff.first_name} ${profile.staff.last_name}`
              : 'Unbekannt'

            return (
              <div
                key={profile.id}
                className={`${theme.surface} border ${theme.border} rounded-xl ${theme.cardShadow}`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className={`font-semibold ${theme.textPrimary}`}>{name}</span>
                </div>

                {/* Card Body */}
                {data ? (
                  <div className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Geplante Stunden</span>
                      <span className={theme.textPrimary}>{parseFloat(data.planned_hours || 0).toFixed(2).replace('.', ',')} h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Ist-Stunden</span>
                      <span className={`font-medium ${theme.textPrimary}`}>{parseFloat(data.actual_hours || 0).toFixed(2).replace('.', ',')} h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Bezahlte Stunden</span>
                      <span className={theme.textPrimary}>{parseFloat(data.paid_hours || 0).toFixed(2).replace('.', ',')} h</span>
                    </div>
                    <div className="border-t border-gray-100 pt-2 flex justify-between">
                      <span className={`font-medium ${theme.textSecondary}`}>Monatssaldo</span>
                      <MjHoursDisplay hours={data.hours_balance} showSign className="font-semibold" />
                    </div>
                    <div className="flex justify-between">
                      <span className={`font-medium ${theme.textSecondary}`}>Kumulierter Saldo</span>
                      <MjHoursDisplay hours={data.cumulative_balance} showSign className="font-semibold" />
                    </div>
                  </div>
                ) : (
                  <div className={`p-4 text-sm ${theme.textMuted} text-center`}>
                    Noch nicht berechnet
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
                  <button
                    onClick={() => setDetailStaffId(profile.staff_id)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${theme.textSecondary} hover:bg-gray-100`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => handlePdf(profile)}
                    disabled={!data}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <FilePdf size={16} />
                    PDF
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeProfiles.length === 0 && !loading && (
        <div className={`${theme.surface} border ${theme.border} rounded-xl p-8 text-center ${theme.textMuted}`}>
          Keine aktiven Minijobber vorhanden
        </div>
      )}

      {/* Detail Modal */}
      {detailStaffId && (
        <MonatsberichtDetail
          theme={theme}
          isOpen={!!detailStaffId}
          staffId={detailStaffId}
          profile={profiles.find(p => p.staff_id === detailStaffId)}
          calculatedReport={calculatedReports[detailStaffId]}
          savedReport={reports.find(r => r.staff_id === detailStaffId)}
          pharmacyId={pharmacyId}
          year={year}
          month={month}
          monthName={monthNames[month - 1]}
          onClose={() => setDetailStaffId(null)}
        />
      )}

      {/* Zeitraum-PDF Dialog */}
      {showZeitraumPdf && (
        <ZeitraumPdfDialog
          theme={theme}
          isOpen={showZeitraumPdf}
          pharmacyId={pharmacyId}
          pharmacy={pharmacy}
          profiles={activeProfiles}
          calculateRangeReport={calculateRangeReport}
          onClose={() => setShowZeitraumPdf(false)}
        />
      )}
    </div>
  )
}
