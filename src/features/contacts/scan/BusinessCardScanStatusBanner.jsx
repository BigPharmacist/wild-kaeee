export default function BusinessCardScanStatusBanner({
  businessCardScanning,
  ocrError,
  theme,
}) {
  if (!businessCardScanning && !ocrError) return null

  return (
    <div className="mt-3">
      {businessCardScanning && (
        <div className={`text-xs ${theme.textMuted}`}>
          OCR läuft...
        </div>
      )}
      {!businessCardScanning && ocrError && (
        <p className="text-xs text-rose-400">{ocrError}</p>
      )}
    </div>
  )
}
