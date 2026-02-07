import { useEffect, lazy } from 'react'
import { supabase } from '../../lib/supabase'
import { useTheme, useNavigation, usePhotosContext } from '../../context'
import { Icons } from '../../shared/ui'

const PhotosView = lazy(() => import('./PhotosView'))
const ColorsView = lazy(() => import('../colors/ColorsView'))
const PhotoEditorModal = lazy(() => import('./modals/PhotoEditorModal'))
const ReactCrop = lazy(() => import('react-image-crop').then(m => ({ default: m.default })))
import 'react-image-crop/dist/ReactCrop.css'

export default function MiscPage() {
  const { theme } = useTheme()
  const { secondaryTab, activeView } = useNavigation()
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
      {['ocr', 'visitenkarten'].includes(secondaryTab) && (
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
