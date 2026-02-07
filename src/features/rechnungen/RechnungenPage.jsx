import { useEffect, lazy } from 'react'
import { useTheme, useNavigation } from '../../context'
import { useRechnungen } from './useRechnungen'
import { Icons, LoadingSpinner } from '../../shared/ui'

const PdfModal = lazy(() => import('./modals/PdfModal'))
const PaperlessPdfModal = lazy(() => import('./modals/PaperlessPdfModal'))

export default function RechnungenPage() {
  const { theme } = useTheme()
  const { rechnungenTab } = useNavigation()

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
      <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Großhandelsrechnungen</h2>
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
