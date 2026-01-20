export default function BusinessCardScanOverlay({ theme, show }) {
  if (!show) return null

  return (
    <div className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}>
      <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} px-8 py-6 flex flex-col items-center gap-4`}>
        <svg className="w-10 h-10 animate-spin text-[#F59E0B]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <div className="text-center">
          <p className={`text-sm font-medium ${theme.textPrimary}`}>Visitenkarte wird verarbeitet</p>
          <p className={`text-xs ${theme.textMuted} mt-1`}>OCR und Texterkennung läuft...</p>
        </div>
      </div>
    </div>
  )
}
