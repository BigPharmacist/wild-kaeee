import { useEffect, lazy } from 'react'
import { supabase } from '../../lib/supabase'
import { useTheme, useNavigation, usePhotosContext, useEmail } from '../../context'
import useEnhance from './hooks/useEnhance'
import { Icons } from '../../shared/ui'

const PhotosView = lazy(() => import('./PhotosView'))
const ColorsView = lazy(() => import('../colors/ColorsView'))
const PhotoEditorModal = lazy(() => import('./modals/PhotoEditorModal'))
const ReactCrop = lazy(() => import('react-image-crop').then(m => ({ default: m.default })))
import 'react-image-crop/dist/ReactCrop.css'

export default function MiscPage() {
  const { theme } = useTheme()
  const { secondaryTab, activeView } = useNavigation()
  const { googleApiKey, fetchGoogleApiKey } = useEmail()

  const {
    allPhotos,
    photosLoading,
    businessCards,
    businessCardsLoading,
    selectedPhoto,
    photoEditorOpen,
    crop,
    completedCrop,
    brightness,
    contrast,
    photoSaving,
    photoOcrData,
    ocrProcessing,
    photoImgRef,
    setCrop,
    setCompletedCrop,
    setBrightness,
    setContrast,
    setPhotoSaving,
    fetchAllPhotos,
    fetchLatestPhoto,
    fetchBusinessCards,
    deletePhoto,
    deleteBusinessCard,
    runOcrForPhoto,
    openPhotoEditor,
    closePhotoEditor,
  } = usePhotosContext()

  const {
    enhanceFile,
    enhancePreview,
    enhanceResultPreview,
    enhanceLoading,
    enhanceMessage,
    handleEnhanceFileChange,
    runBusinessCardEnhance,
  } = useEnhance({ googleApiKey, fetchGoogleApiKey })

  // Fetch business cards when visiting visitenkarten tab
  useEffect(() => {
    if (secondaryTab === 'visitenkarten') {
      fetchBusinessCards()
    }
  }, [secondaryTab]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveEditedPhoto = async () => {
    if (!selectedPhoto || !photoImgRef.current) return
    setPhotoSaving(true)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const image = photoImgRef.current

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    if (completedCrop) {
      canvas.width = completedCrop.width * scaleX
      canvas.height = completedCrop.height * scaleY
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0, 0,
        canvas.width,
        canvas.height
      )
    } else {
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
      ctx.drawImage(image, 0, 0)
    }

    canvas.toBlob(async (blob) => {
      const fileName = `edited_${Date.now()}.jpg`
      const filePath = `photos/${fileName}`
      const { error } = await supabase
        .storage
        .from('documents')
        .upload(filePath, blob)
      if (error) {
        console.error('Speichern fehlgeschlagen:', error.message)
      } else {
        await fetchAllPhotos()
        await fetchLatestPhoto()
        closePhotoEditor()
      }
      setPhotoSaving(false)
    }, 'image/jpeg', 0.9)
  }

  return (
    <>
      {['uploads', 'ocr', 'visitenkarten'].includes(secondaryTab) && (
        <PhotosView
          theme={theme}
          Icons={Icons}
          secondaryTab={secondaryTab}
          photosLoading={photosLoading}
          allPhotos={allPhotos}
          deletePhoto={deletePhoto}
          openPhotoEditor={openPhotoEditor}
          ocrProcessing={ocrProcessing}
          photoOcrData={photoOcrData}
          runOcrForPhoto={runOcrForPhoto}
          businessCardsLoading={businessCardsLoading}
          businessCards={businessCards}
          deleteBusinessCard={deleteBusinessCard}
        />
      )}

      {secondaryTab === 'colors' && (
        <ColorsView theme={theme} />
      )}

      {secondaryTab === 'card-enhance' && (
        <>
          <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Karten-Test</h2>
          <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-semibold">Visitenkarten-Enhance</h3>
                <p className={`text-xs ${theme.textMuted}`}>Google Nano Banana Pro: zuschneiden + Lesbarkeit verbessern.</p>
              </div>
              <button
                type="button"
                onClick={fetchGoogleApiKey}
                className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
                title="Google API Key aus DB laden"
              >
                Key laden
              </button>
            </div>

            {enhanceMessage && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-3">
                <p className="text-rose-400 text-sm">{enhanceMessage}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleEnhanceFileChange}
                className={`flex-1 text-sm ${theme.input} ${theme.inputPlaceholder} border rounded-xl px-3 py-2`}
              />
              <button
                type="button"
                onClick={runBusinessCardEnhance}
                disabled={!enhanceFile || enhanceLoading}
                className={`h-10 px-4 rounded-xl text-sm font-medium ${theme.accent} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {enhanceLoading ? 'Verbessere...' : 'Verbessern'}
              </button>
            </div>

            {enhanceLoading && (
              <div className={`mb-4 flex items-center gap-2 text-xs ${theme.textMuted}`}>
                <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                Nano Banana Pro arbeitet im Hintergrund...
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className={`rounded-xl border ${theme.border} p-3`}>
                <p className={`text-xs ${theme.textMuted} mb-2`}>Vorher</p>
                {enhancePreview ? (
                  <img
                    src={enhancePreview}
                    alt="Original"
                    className="w-full max-h-[360px] object-contain rounded-lg bg-white"
                  />
                ) : (
                  <div className={`h-48 rounded-lg ${theme.bgHover} flex items-center justify-center text-xs ${theme.textMuted}`}>
                    Kein Bild ausgewählt
                  </div>
                )}
              </div>
              <div className={`rounded-xl border ${theme.border} p-3`}>
                <p className={`text-xs ${theme.textMuted} mb-2`}>Nachher</p>
                {enhanceResultPreview ? (
                  <img
                    src={enhanceResultPreview}
                    alt="Verbessert"
                    className="w-full max-h-[360px] object-contain rounded-lg bg-white"
                  />
                ) : (
                  <div className={`h-48 rounded-lg ${theme.bgHover} flex items-center justify-center text-xs ${theme.textMuted}`}>
                    Noch kein Ergebnis
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <PhotoEditorModal
        theme={theme}
        Icons={Icons}
        photoEditorOpen={photoEditorOpen}
        selectedPhoto={selectedPhoto}
        photoImgRef={photoImgRef}
        crop={crop}
        setCrop={setCrop}
        setCompletedCrop={setCompletedCrop}
        brightness={brightness}
        setBrightness={setBrightness}
        contrast={contrast}
        setContrast={setContrast}
        photoSaving={photoSaving}
        closePhotoEditor={closePhotoEditor}
        saveEditedPhoto={saveEditedPhoto}
        photoOcrData={photoOcrData}
        ocrProcessing={ocrProcessing}
        runOcrForPhoto={runOcrForPhoto}
      />
    </>
  )
}
