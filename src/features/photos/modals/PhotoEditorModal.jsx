import { Suspense } from 'react'
import { lazyWithRetry } from '../../../lib/lazyWithRetry'

const ReactCrop = lazyWithRetry(() => import('react-image-crop').then(m => ({ default: m.default })))

/**
 * Modal for editing photos (crop, brightness, contrast)
 * Extracted from App.jsx
 */
function PhotoEditorModal({
  theme,
  Icons,
  photoEditorOpen,
  selectedPhoto,
  photoImgRef,
  crop,
  setCrop,
  setCompletedCrop,
  brightness,
  setBrightness,
  contrast,
  setContrast,
  photoSaving,
  closePhotoEditor,
  saveEditedPhoto,
  photoOcrData,
  ocrProcessing,
  runOcrForPhoto,
}) {
  if (!photoEditorOpen || !selectedPhoto) return null

  return (
    <div className={`fixed inset-0 ${theme.overlay} z-50 flex items-center justify-center p-4`}>
      <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-3xl max-h-[90vh] overflow-auto`}>
        <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
          <h3 className={`text-lg font-semibold ${theme.text}`}>Foto bearbeiten</h3>
          <button
            type="button"
            onClick={closePhotoEditor}
            className={`${theme.textMuted} ${theme.bgHover} p-2 rounded-lg`}
          >
            <Icons.X />
          </button>
        </div>

        <div className="p-4">
          <div className="flex justify-center">
            <Suspense fallback={<div className={theme.textMuted}>Lädt...</div>}>
              <ReactCrop crop={crop} onChange={setCrop} onComplete={setCompletedCrop}>
                <img
                  ref={photoImgRef}
                  src={selectedPhoto.url}
                  alt="Bearbeiten"
                  className="max-w-full max-h-[50vh]"
                  style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </Suspense>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                Helligkeit: {brightness}%
              </label>
              <input
                type="range"
                min="50"
                max="150"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-[#F59E0B]"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                Kontrast: {contrast}%
              </label>
              <input
                type="range"
                min="50"
                max="150"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-[#F59E0B]"
              />
            </div>

            <div className={`border-t ${theme.border} pt-4`}>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-medium ${theme.textSecondary}`}>
                  OCR-Text
                </label>
                {!photoOcrData[selectedPhoto.name] && !ocrProcessing[selectedPhoto.name] && (
                  <button
                    type="button"
                    onClick={() => runOcrForPhoto(selectedPhoto.name, selectedPhoto.url)}
                    className={`text-xs px-3 py-1 rounded-lg ${theme.accent} text-white`}
                  >
                    OCR starten
                  </button>
                )}
              </div>
              {ocrProcessing[selectedPhoto.name] && (
                <p className={`text-sm ${theme.accentText}`}>OCR wird ausgeführt...</p>
              )}
              {photoOcrData[selectedPhoto.name]?.status === 'completed' && (
                <div className={`${theme.input} border rounded-lg p-3 max-h-40 overflow-auto`}>
                  <pre className={`text-sm ${theme.text} whitespace-pre-wrap font-sans`}>
                    {photoOcrData[selectedPhoto.name].text}
                  </pre>
                </div>
              )}
              {photoOcrData[selectedPhoto.name]?.status === 'error' && (
                <p className="text-sm text-rose-400">OCR fehlgeschlagen</p>
              )}
              {!photoOcrData[selectedPhoto.name] && !ocrProcessing[selectedPhoto.name] && (
                <p className={`text-sm ${theme.textMuted}`}>Noch kein OCR durchgeführt</p>
              )}
            </div>
          </div>
        </div>

        <div className={`flex justify-end gap-3 p-4 border-t ${theme.border}`}>
          <button
            type="button"
            onClick={closePhotoEditor}
            className={`px-4 py-2.5 rounded-lg ${theme.bgHover} ${theme.textSecondary} border ${theme.border}`}
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={saveEditedPhoto}
            disabled={photoSaving}
            className={`px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium disabled:opacity-50`}
          >
            {photoSaving ? 'Speichere...' : 'Als Kopie speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PhotoEditorModal
