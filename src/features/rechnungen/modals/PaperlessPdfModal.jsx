/**
 * Modal for displaying Paperless PDF invoices
 * Extracted from App.jsx
 */
function PaperlessPdfModal({
  theme,
  Icons,
  paperlessPdfModalOpen,
  selectedPaperlessPdf,
  closePaperlessPdfModal,
}) {
  if (!paperlessPdfModalOpen || !selectedPaperlessPdf) return null

  return (
    <div
      className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
      onClick={closePaperlessPdfModal}
    >
      <div
        className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-5xl h-[90vh] flex flex-col`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border} flex-shrink-0`}>
          <div>
            <h3 className="text-base font-semibold">{selectedPaperlessPdf.correspondentName} - {selectedPaperlessPdf.title}</h3>
            <p className={`text-xs ${theme.textMuted}`}>
              {selectedPaperlessPdf.datum ? new Date(selectedPaperlessPdf.datum).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'Unbekanntes Datum'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={selectedPaperlessPdf.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-lg ${theme.bgHover} ${theme.textSecondary}`}
              title="In neuem Tab öffnen"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <a
              href={selectedPaperlessPdf.url}
              download={selectedPaperlessPdf.original_file_name || `${selectedPaperlessPdf.title}.pdf`}
              className={`p-2 rounded-lg ${theme.bgHover} ${theme.textSecondary}`}
              title="Herunterladen"
            >
              <Icons.Download />
            </a>
            <button
              type="button"
              onClick={closePaperlessPdfModal}
              className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
              title="Schließen"
            >
              <Icons.X />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe
            src={selectedPaperlessPdf.url}
            className="w-full h-full border-0"
            title={`PDF ${selectedPaperlessPdf.title}`}
          />
        </div>
      </div>
    </div>
  )
}

export default PaperlessPdfModal
