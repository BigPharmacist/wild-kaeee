import { useEffect, useMemo } from 'react'
import { useTheme } from '../../context'
import { useRechnungen } from './useRechnungen'
import { Icons, LoadingSpinner } from '../../shared/ui'
import { lazyWithRetry } from '../../lib/lazyWithRetry'

const PaperlessPdfModal = lazyWithRetry(() => import('./modals/PaperlessPdfModal'))

const COLUMNS = [
  { key: 'phoenix', label: 'Phoenix', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { key: 'sanacorp', label: 'Sanacorp', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { key: 'ahd', label: 'AHD', color: 'bg-red-100 text-red-800 border-red-200' },
]

function formatDate(dateStr) {
  if (!dateStr) return 'Unbekannt'
  return new Date(dateStr).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })
}

function formatDayHeader(dateStr) {
  if (!dateStr) return 'Unbekannt'
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Heute'
  if (date.toDateString() === yesterday.toDateString()) return 'Gestern'
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  })
}

// Rechnungen nach Datum gruppieren (neueste zuerst)
function groupByDate(docs) {
  const byDate = {}
  for (const doc of docs) {
    const key = doc.datum || 'unbekannt'
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(doc)
  }
  return Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a))
}

export default function RechnungenPage() {
  const { theme } = useTheme()

  const {
    paperlessRechnungen,
    paperlessLoading,
    paperlessPdfModalOpen,
    selectedPaperlessPdf,
    fetchPaperlessRechnungen,
    openPaperlessPdfModal,
    closePaperlessPdfModal,
  } = useRechnungen()

  useEffect(() => {
    fetchPaperlessRechnungen()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Rechnungen nach Großhändler gruppieren
  const grouped = useMemo(() => {
    const result = { phoenix: [], sanacorp: [], ahd: [], sonstige: [] }
    for (const doc of paperlessRechnungen) {
      const key = doc.grosshaendler || 'sonstige'
      if (result[key]) {
        result[key].push(doc)
      } else {
        result.sonstige.push(doc)
      }
    }
    return result
  }, [paperlessRechnungen])

  if (paperlessLoading) {
    return (
      <>
        <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight mb-6">Großhandelsrechnungen</h2>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Großhandelsrechnungen</h2>
        <button
          type="button"
          onClick={fetchPaperlessRechnungen}
          className={`p-2 rounded-lg ${theme.bgHover} ${theme.textSecondary}`}
          title="Aktualisieren"
        >
          <Icons.Refresh />
        </button>
      </div>

      {paperlessRechnungen.length === 0 ? (
        <div className={`text-center py-12 ${theme.textMuted}`}>
          Keine Rechnungen in den letzten 8 Tagen
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => (
            <div key={col.key}>
              <div className={`flex items-center justify-between mb-3 px-1`}>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${col.color}`}>
                  {col.label}
                </span>
                <span className={`text-xs ${theme.textMuted}`}>
                  {grouped[col.key].length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {grouped[col.key].length === 0 ? (
                  <div className={`text-xs ${theme.textMuted} text-center py-6 border border-dashed ${theme.border} rounded-xl`}>
                    Keine Rechnungen
                  </div>
                ) : (
                  groupByDate(grouped[col.key]).map(([dateKey, docs]) => (
                    <div key={dateKey}>
                      <div className={`text-[11px] font-medium ${theme.textMuted} uppercase tracking-wide mb-1.5 px-1`}>
                        {formatDayHeader(dateKey)}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {docs.map(doc => (
                          <button
                            key={doc.id}
                            type="button"
                            onClick={() => openPaperlessPdfModal(doc)}
                            className={`${theme.surface} border ${theme.border} rounded-xl px-3 py-2 text-left hover:shadow-md transition-shadow cursor-pointer w-full`}
                          >
                            <div className={`text-sm font-medium ${theme.text} truncate`}>
                              {doc.title}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sonstige Rechnungen (falls vorhanden) */}
      {grouped.sonstige.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border bg-gray-100 text-gray-700 border-gray-200`}>
              Sonstige
            </span>
            <span className={`text-xs ${theme.textMuted}`}>
              {grouped.sonstige.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {grouped.sonstige.map(doc => (
              <button
                key={doc.id}
                type="button"
                onClick={() => openPaperlessPdfModal(doc)}
                className={`${theme.surface} border ${theme.border} rounded-xl px-3 py-2.5 text-left hover:shadow-md transition-shadow cursor-pointer`}
              >
                <div className={`text-sm font-medium ${theme.text} truncate`}>
                  {doc.title}
                </div>
                <div className={`text-xs ${theme.textMuted} mt-0.5`}>
                  {doc.correspondentName} &middot; {formatDate(doc.datum)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <PaperlessPdfModal
        theme={theme}
        Icons={Icons}
        paperlessPdfModalOpen={paperlessPdfModalOpen}
        selectedPaperlessPdf={selectedPaperlessPdf}
        closePaperlessPdfModal={closePaperlessPdfModal}
      />
    </>
  )
}
