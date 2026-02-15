import { useEffect } from 'react'
import { useSignatureCanvas } from './hooks/useSignatureCanvas'

/**
 * Modal for documenting AMK and Recall messages
 * Extracted from App.jsx
 */
function ApoDokumentationModal({
  theme,
  Icons,
  show,
  onClose,
  selectedApoMessage,
  existingDokumentationen,
  dokumentationBemerkung,
  setDokumentationBemerkung,
  dokumentationSignature,
  setDokumentationSignature,
  showSignatureCanvas,
  setShowSignatureCanvas,
  dokumentationLoading,
  saveDokumentation,
  savedPznFotos,
  supabaseUrl,
}) {
  const {
    signatureCanvasRef,
    initSignatureCanvas,
    startDrawing,
    draw,
    stopDrawing,
    clearSignature,
  } = useSignatureCanvas({
    onSignatureChange: setDokumentationSignature,
  })

  // Initialize canvas when signature area is shown
  useEffect(() => {
    if (showSignatureCanvas) {
      const timer = setTimeout(initSignatureCanvas, 50)
      return () => clearTimeout(timer)
    }
  }, [showSignatureCanvas, initSignatureCanvas])

  if (!show || (selectedApoMessage?.type !== 'amk' && selectedApoMessage?.type !== 'recall')) {
    return null
  }

  const hasExistingSignature = existingDokumentationen.some(dok => dok.unterschrift_data)
  const hasSavedPznFotos = Object.keys(savedPznFotos).length > 0
  const hasContent = dokumentationBemerkung.trim() || hasSavedPznFotos
  const isDisabled = hasExistingSignature
    ? !hasContent
    : (!hasContent || !dokumentationSignature)

  return (
    <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-[60] p-4`}>
      <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-lg max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
          <h3 className={`text-lg font-semibold ${theme.text}`}>Dokumentation</h3>
          <button
            type="button"
            onClick={() => {
              onClose()
              setShowSignatureCanvas(false)
            }}
            className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
          >
            <Icons.X />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Bestehende Dokumentationen */}
          {existingDokumentationen.length > 0 && (
            <div className="space-y-3">
              <p className={`text-sm font-medium ${theme.textSecondary}`}>Bisherige Einträge:</p>
              {existingDokumentationen.map((dok) => (
                <div key={dok.id} className={`p-3 rounded-lg ${theme.surface} border ${theme.border}`}>
                  {dok.bemerkung && (
                    <p className={`text-sm ${theme.text} mb-2`}>{dok.bemerkung}</p>
                  )}
                  {dok.unterschrift_data && (
                    <img src={dok.unterschrift_data} alt="Unterschrift" className="h-16 border rounded" />
                  )}
                  {/* PZN-Fotos anzeigen */}
                  {dok.pzn_fotos && Object.keys(dok.pzn_fotos).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(dok.pzn_fotos).map(([pzn, path]) => (
                        <a
                          key={pzn}
                          href={`${supabaseUrl}/storage/v1/object/public/recall-fotos/${path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative block"
                        >
                          <img
                            src={`${supabaseUrl}/storage/v1/object/public/recall-fotos/${path}`}
                            alt={`PZN ${pzn}`}
                            className="h-16 rounded border hover:opacity-80 transition-opacity"
                          />
                          <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 text-center rounded-b">
                            {pzn}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                  <p className={`text-xs ${theme.textMuted} mt-2`}>
                    {dok.erstellt_am ? new Date(dok.erstellt_am).toLocaleString('de-DE') : ''}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Neuer Eintrag */}
          <div className="space-y-3">
            <p className={`text-sm font-medium ${theme.textSecondary}`}>
              {hasExistingSignature ? 'Ergänzung hinzufügen:' : 'Neuer Eintrag:'}
            </p>
            <textarea
              value={dokumentationBemerkung}
              onChange={(e) => setDokumentationBemerkung(e.target.value)}
              placeholder={hasExistingSignature ? 'Ergänzende Bemerkung...' : 'Bemerkung eingeben...'}
              rows={4}
              className={`w-full px-3 py-2 rounded-xl border ${theme.input} ${theme.inputPlaceholder} resize-none`}
            />

            {/* PZN-Fotos Vorschau (nur für Rückrufe) */}
            {selectedApoMessage?.type === 'recall' && Object.keys(savedPznFotos).length > 0 && (
              <div className="space-y-2">
                <p className={`text-sm font-medium ${theme.textSecondary}`}>
                  Gespeicherte PZN-Fotos ({Object.keys(savedPznFotos).length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(savedPznFotos).map(([pzn, path]) => (
                    <div key={pzn} className="relative">
                      <img
                        src={`${supabaseUrl}/storage/v1/object/public/recall-fotos/${path}`}
                        alt={`PZN ${pzn}`}
                        className="h-20 rounded border"
                      />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 text-center rounded-b">
                        {pzn}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unterschrift-Bereich - nur wenn noch keine Unterschrift existiert */}
            {!hasExistingSignature && !showSignatureCanvas && (
              <button
                type="button"
                onClick={() => setShowSignatureCanvas(true)}
                className={`w-full px-4 py-3 rounded-xl border-2 border-dashed ${theme.border} ${theme.textMuted} hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors`}
              >
                Unterschreiben
              </button>
            )}
            {!hasExistingSignature && showSignatureCanvas && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${theme.textSecondary}`}>Unterschrift:</p>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className={`text-xs ${theme.accentText} hover:underline`}
                  >
                    Löschen
                  </button>
                </div>
                <canvas
                  ref={signatureCanvasRef}
                  width={400}
                  height={150}
                  className={`w-full border ${theme.border} rounded-xl bg-white touch-none cursor-crosshair`}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-4 border-t ${theme.border}`}>
          <button
            type="button"
            onClick={() => {
              onClose()
              setShowSignatureCanvas(false)
            }}
            className={`px-4 py-2.5 rounded-lg ${theme.bgHover} ${theme.text} font-medium`}
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={saveDokumentation}
            disabled={dokumentationLoading || isDisabled}
            className={`px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium disabled:opacity-50`}
          >
            {dokumentationLoading ? 'Speichern...' : hasExistingSignature ? 'Hinzufügen' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ApoDokumentationModal
