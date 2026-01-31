import { Printer } from '@phosphor-icons/react'

/**
 * Popup for displaying fax PDFs
 * Extracted from App.jsx
 */
function FaxPdfPopup({
  theme,
  Icons,
  faxPdfPopup,
  setFaxPdfPopup,
}) {
  if (!faxPdfPopup) return null

  return (
    <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-50 p-4`}>
      <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-4xl h-[85vh] flex flex-col`}>
        <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
          <div className="flex items-center gap-3">
            <Printer size={24} className={theme.accentText} />
            <div>
              <h3 className={`text-lg font-semibold ${theme.text}`}>Fax-Ankündigung</h3>
              <p className={`text-sm ${theme.textMuted}`}>{faxPdfPopup.absender || 'Unbekannter Absender'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFaxPdfPopup(null)}
            className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
          >
            <Icons.X />
          </button>
        </div>
        <div className="flex-1 min-h-0 bg-gray-100">
          <iframe
            src={faxPdfPopup.pdfUrl}
            className="w-full h-full border-0"
            title="Fax PDF"
          />
        </div>
      </div>
    </div>
  )
}

export default FaxPdfPopup
