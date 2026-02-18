import { useState, useEffect, useMemo } from 'react'
import { FilePdf, CalendarBlank, ListBullets, CaretUp, CaretDown } from '@phosphor-icons/react'
import { useMjMonthlyReports } from '../hooks/useMjMonthlyReports'
import { useMjMonthlyConditions } from '../hooks/useMjMonthlyConditions'
import { MjMonthSelector } from '../shared/MjMonthSelector'
import { MjHoursDisplay } from '../shared/MjHoursDisplay'
import { MonatsberichtDetail } from './MonatsberichtDetail'
import { StundenkontoModal } from './StundenkontoModal'
import { ZeitraumPdfDialog } from './ZeitraumPdfDialog'
import { generateMonatsberichtPdf } from './MonatsberichtPdf'

const monthNames = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

export function MonatsberichteView({ theme, pharmacyId, pharmacies, profiles, swapSortOrder, currentStaff }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  // staffId → { allReports: [...], currentBalance: number }
  const [staffData, setStaffData] = useState({})
  const [detailStaffId, setDetailStaffId] = useState(null)
  const [stundenkontoStaffId, setStundenkontoStaffId] = useState(null)
  const [showZeitraumPdf, setShowZeitraumPdf] = useState(false)

  const { fetchAllReportsForStaff, calculateReport, calculateRangeReport, loading } = useMjMonthlyReports({ pharmacyId })
  const { getEffectiveConditions } = useMjMonthlyConditions({ pharmacyId })

  const pharmacy = pharmacies?.find(p => p.id === pharmacyId)

  const activeProfiles = useMemo(
    () => profiles.filter(p => p.active).sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
      const nameA = `${a.staff?.last_name} ${a.staff?.first_name}`.toLowerCase()
      const nameB = `${b.staff?.last_name} ${b.staff?.first_name}`.toLowerCase()
      return nameA.localeCompare(nameB)
    }),
    [profiles]
  )

  const activeProfileIds = useMemo(
    () => activeProfiles.map(p => p.staff_id).sort().join(','),
    [activeProfiles]
  )

  useEffect(() => {
    if (!pharmacyId || !activeProfileIds) return
    let mounted = true

    const staffIds = activeProfiles.map(p => p.staff_id)
    fetchAllReportsForStaff(staffIds).then(rows => {
      if (!mounted) return

      const result = {}
      for (const profile of activeProfiles) {
        result[profile.staff_id] = {
          allReports: [],
          currentBalance: parseFloat(profile.initial_balance || 0),
        }
      }

      for (const r of rows) {
        if (!result[r.staff_id]) {
          result[r.staff_id] = { allReports: [], currentBalance: 0 }
        }
        result[r.staff_id].allReports.push(r)
      }

      for (const profile of activeProfiles) {
        const data = result[profile.staff_id]
        if (data.allReports.length > 0) {
          data.currentBalance = parseFloat(data.allReports[data.allReports.length - 1].cumulative_balance || 0)
        }
      }

      setStaffData(result)
    })

    return () => { mounted = false }
  }, [pharmacyId, activeProfileIds, activeProfiles, fetchAllReportsForStaff])

  // Report für den gewählten Monat pro Mitarbeiter
  const getMonthReport = (staffId) => {
    const data = staffData[staffId]
    if (!data) return null
    return data.allReports.find(r => r.year === year && r.month === month) || null
  }

  const handlePdf = async (profile) => {
    const staffId = profile.staff_id
    const conditions = await getEffectiveConditions(staffId, year, month)
    if (!conditions) {
      alert('Keine Konditionen für diesen Monat vorhanden')
      return
    }

    const reportData = await calculateReport(staffId, conditions, year, month)
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
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className={`${theme.surface} border ${theme.border} rounded-xl p-12 flex flex-col items-center justify-center gap-3`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]" />
          <span className={`text-sm ${theme.textMuted}`}>Stundenkonten werden geladen…</span>
        </div>
      )}

      {/* Reports Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeProfiles.map((profile, idx) => {
            const data = staffData[profile.staff_id]
            const monthReport = getMonthReport(profile.staff_id)
            const currentBalance = data?.currentBalance ?? null
            const name = profile.staff
              ? `${profile.staff.first_name} ${profile.staff.last_name}`
              : 'Unbekannt'
            const isFirst = idx === 0
            const isLast = idx === activeProfiles.length - 1

            return (
              <div
                key={profile.id}
                className={`${theme.surface} border ${theme.border} rounded-xl ${theme.cardShadow}`}
              >
                {/* Card Header: Sort-Buttons + Name + aktueller Gesamtstand */}
                <div className="flex items-center justify-between px-4 py-3 rounded-t-xl bg-[#1E293B]">
                  <div className="flex items-center gap-1.5">
                    <div className="flex flex-col -my-1">
                      <button
                        onClick={() => swapSortOrder(profile, activeProfiles[idx - 1])}
                        disabled={isFirst}
                        className={`p-0.5 rounded ${isFirst ? 'opacity-20 cursor-default' : 'text-slate-400 hover:bg-slate-700 cursor-pointer'}`}
                        title="Nach oben"
                      >
                        <CaretUp size={14} weight="bold" />
                      </button>
                      <button
                        onClick={() => swapSortOrder(profile, activeProfiles[idx + 1])}
                        disabled={isLast}
                        className={`p-0.5 rounded ${isLast ? 'opacity-20 cursor-default' : 'text-slate-400 hover:bg-slate-700 cursor-pointer'}`}
                        title="Nach unten"
                      >
                        <CaretDown size={14} weight="bold" />
                      </button>
                    </div>
                    <span className="font-semibold text-white">{name}</span>
                  </div>
                  {currentBalance !== null && (
                    <MjHoursDisplay hours={currentBalance} showSign className="font-bold text-base !text-white" />
                  )}
                </div>

                {/* Card Body: gewählter Monat */}
                {monthReport ? (
                  <div className="p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Ist-Stunden</span>
                      <span className={`font-medium ${theme.textPrimary}`}>{parseFloat(monthReport.actual_hours || 0).toFixed(2).replace('.', ',')} h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Soll-Stunden</span>
                      <span className={theme.textPrimary}>{parseFloat(monthReport.paid_hours || 0).toFixed(2).replace('.', ',')} h</span>
                    </div>
                    <div className="border-t border-gray-100 pt-2 flex justify-between">
                      <span className={`font-medium ${theme.textSecondary}`}>Monatssaldo</span>
                      <MjHoursDisplay hours={monthReport.hours_balance} showSign className="font-semibold" />
                    </div>
                  </div>
                ) : (
                  <div className={`p-4 text-sm ${theme.textMuted} text-center`}>
                    Keine Daten für {monthNames[month - 1]} {year}
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
                    onClick={() => setStundenkontoStaffId(profile.staff_id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm ${theme.textSecondary} hover:bg-gray-100`}
                  >
                    <ListBullets size={16} />
                    Stundenkonto
                  </button>
                  <button
                    onClick={() => handlePdf(profile)}
                    disabled={!monthReport}
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

      {/* Detail Modal (Arbeitsstunden-Aufschlüsselung für gewählten Monat) */}
      {detailStaffId && (
        <MonatsberichtDetail
          theme={theme}
          isOpen={!!detailStaffId}
          staffId={detailStaffId}
          profile={profiles.find(p => p.staff_id === detailStaffId)}
          calculatedReport={null}
          savedReport={null}
          pharmacyId={pharmacyId}
          year={year}
          month={month}
          monthName={monthNames[month - 1]}
          onClose={() => setDetailStaffId(null)}
        />
      )}

      {/* Stundenkonto Modal (vollständige Tabelle aller Monate) */}
      {stundenkontoStaffId && (
        <StundenkontoModal
          theme={theme}
          isOpen={!!stundenkontoStaffId}
          staffId={stundenkontoStaffId}
          profile={profiles.find(p => p.staff_id === stundenkontoStaffId)}
          pharmacyId={pharmacyId}
          allReports={staffData[stundenkontoStaffId]?.allReports}
          onClose={() => setStundenkontoStaffId(null)}
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
