import { useEffect, useState, lazy } from 'react'
import { useTheme } from '../../context'
import { useRechnungen } from './useRechnungen'
import { Icons, LoadingSpinner } from '../../shared/ui'

const PdfModal = lazy(() => import('./modals/PdfModal'))
const PaperlessPdfModal = lazy(() => import('./modals/PaperlessPdfModal'))

export default function RechnungenPage() {
  const { theme } = useTheme()
  const [rechnungenTab, setRechnungenTab] = useState('alt')

  const {
    rechnungen,
    rechnungenLoading,
    pdfModalOpen,
    selectedPdf,
    closePdfModal,
    fetchRechnungen,
    paperlessRechnungen,
    paperlessLoading,
    paperlessPdfModalOpen,
    selectedPaperlessPdf,
    fetchPaperlessRechnungen,
    closePaperlessPdfModal,
  } = useRechnungen()

  useEffect(() => {
    if (rechnungenTab === 'alt' && rechnungen.length === 0 && !rechnungenLoading) {
      fetchRechnungen()
    }
    if (rechnungenTab === 'neu' && paperlessRechnungen.length === 0 && !paperlessLoading) {
      fetchPaperlessRechnungen()
    }
  }, [rechnungenTab]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Großhandelsrechnungen</h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setRechnungenTab('alt')}
            className={`px-3 py-1.5 text-sm rounded-[6px] font-medium transition-colors ${rechnungenTab === 'alt' ? 'bg-[#FEF3C7] text-[#1E293B]' : `${theme.textSecondary} hover:bg-[#FEF3C7]/50`}`}
          >
            Alt
          </button>
          <button
            type="button"
            onClick={() => setRechnungenTab('neu')}
            className={`px-3 py-1.5 text-sm rounded-[6px] font-medium transition-colors ${rechnungenTab === 'neu' ? 'bg-[#FEF3C7] text-[#1E293B]' : `${theme.textSecondary} hover:bg-[#FEF3C7]/50`}`}
          >
            Neu
          </button>
        </div>
      </div>
      {rechnungenTab === 'neu' ? (
        paperlessLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className={theme.textMuted}>Paperless Rechnungen Ansicht</div>
        )
      ) : (
        <div className={theme.textMuted}>Alte Rechnungen Ansicht</div>
      )}

      <PdfModal
        theme={theme}
        Icons={Icons}
        pdfModalOpen={pdfModalOpen}
        selectedPdf={selectedPdf}
        closePdfModal={closePdfModal}
      />

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
