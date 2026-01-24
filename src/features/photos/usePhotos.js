import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export function usePhotos({ mistralApiKey, fetchMistralApiKey }) {
  const [latestPhoto, setLatestPhoto] = useState(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [allPhotos, setAllPhotos] = useState([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [businessCards, setBusinessCards] = useState([])
  const [businessCardsLoading, setBusinessCardsLoading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false)
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [photoSaving, setPhotoSaving] = useState(false)
  const [photoOcrData, setPhotoOcrData] = useState({})
  const [ocrProcessing, setOcrProcessing] = useState({})

  const cameraInputRef = useRef(null)
  const photoImgRef = useRef(null)

  const fetchLatestPhoto = async () => {
    const { data, error } = await supabase
      .storage
      .from('documents')
      .list('photos', { limit: 1, sortBy: { column: 'created_at', order: 'desc' } })
    if (error || !data || data.length === 0) {
      setLatestPhoto(null)
      return
    }
    const { data: urlData } = supabase
      .storage
      .from('documents')
      .getPublicUrl(`photos/${data[0].name}`)
    setLatestPhoto({ name: data[0].name, url: urlData.publicUrl, createdAt: data[0].created_at })
  }

  const handleCameraCapture = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `photos/${fileName}`
    const { error } = await supabase
      .storage
      .from('documents')
      .upload(filePath, file)
    if (error) {
      console.error('Foto-Upload fehlgeschlagen:', error.message)
      setPhotoUploading(false)
      return
    }
    await fetchLatestPhoto()
    await fetchAllPhotos()
    setPhotoUploading(false)

    // OCR im Hintergrund starten
    const { data: urlData } = supabase
      .storage
      .from('documents')
      .getPublicUrl(filePath)
    if (urlData?.publicUrl) {
      runOcrForPhoto(fileName, urlData.publicUrl)
    }
  }

  const fetchAllPhotos = async () => {
    setPhotosLoading(true)
    const { data, error } = await supabase
      .storage
      .from('documents')
      .list('photos', { sortBy: { column: 'created_at', order: 'desc' } })
    if (error || !data) {
      setAllPhotos([])
      setPhotosLoading(false)
      return
    }
    const photosWithUrls = data.map((file) => {
      const { data: urlData } = supabase
        .storage
        .from('documents')
        .getPublicUrl(`photos/${file.name}`)
      const ext = file.name.split('.').pop()?.toUpperCase() || 'JPG'
      const sizeKB = file.metadata?.size ? Math.round(file.metadata.size / 1024) : null
      return {
        name: file.name,
        url: urlData.publicUrl,
        createdAt: file.created_at,
        format: ext,
        sizeKB,
      }
    })
    setAllPhotos(photosWithUrls)
    setPhotosLoading(false)
  }

  const deletePhoto = async (photoName, event) => {
    event.stopPropagation()
    if (!confirm('Foto unwiderruflich löschen?')) return
    const { data, error } = await supabase
      .storage
      .from('documents')
      .remove([`photos/${photoName}`])
    if (error) {
      alert('Löschen fehlgeschlagen: ' + error.message)
      return
    }
    if (!data || data.length === 0) {
      alert('Foto konnte nicht gelöscht werden. Prüfe die Storage-Berechtigungen.')
      return
    }
    setAllPhotos((prev) => prev.filter((p) => p.name !== photoName))
    await fetchLatestPhoto()
  }

  const fetchBusinessCards = async () => {
    setBusinessCardsLoading(true)
    try {
      const { data: contactsWithCards, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, company, business_card_url, business_card_url_enhanced, created_at')
        .or('business_card_url.not.is.null,business_card_url_enhanced.not.is.null')
        .order('created_at', { ascending: false })

      if (error || !contactsWithCards) {
        console.error('Fehler beim Laden der Visitenkarten:', error)
        setBusinessCards([])
        setBusinessCardsLoading(false)
        return
      }

      const cards = contactsWithCards
        .filter((contact) => contact.business_card_url_enhanced || contact.business_card_url)
        .map((contact) => {
          const url = contact.business_card_url_enhanced || contact.business_card_url
          const ext = url.split('.').pop()?.toUpperCase() || 'JPG'
          return {
            id: contact.id,
            contactName: [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unbekannt',
            company: contact.company || '',
            url: url,
            originalUrl: contact.business_card_url || '',
            enhancedUrl: contact.business_card_url_enhanced || '',
            createdAt: contact.created_at,
            format: ext,
          }
        })
      setBusinessCards(cards)
    } catch (err) {
      console.error('Fehler beim Laden der Visitenkarten:', err)
      setBusinessCards([])
    }
    setBusinessCardsLoading(false)
  }

  const deleteBusinessCard = async (card, event) => {
    event.stopPropagation()
    if (!confirm(`Visitenkarte von "${card.contactName}" unwiderruflich löschen?`)) return

    const { error } = await supabase
      .from('contacts')
      .update({ business_card_url: null, business_card_url_enhanced: null })
      .eq('id', card.id)

    if (error) {
      alert('Löschen fehlgeschlagen: ' + error.message)
      return
    }

    const urlsToDelete = [card.originalUrl, card.enhancedUrl, card.url].filter(Boolean)
    const paths = urlsToDelete
      .map((url) => url.match(/business-cards\/(.+)$/))
      .filter(Boolean)
      .map((match) => match[1])
    if (paths.length > 0) {
      await supabase.storage.from('business-cards').remove(paths)
    }

    setBusinessCards((prev) => prev.filter((c) => c.id !== card.id))
  }

  const fetchPhotoOcrData = async () => {
    const { data, error } = await supabase
      .from('photo_ocr')
      .select('photo_name, ocr_text, ocr_status')
    if (!error && data) {
      const ocrMap = {}
      data.forEach((item) => {
        ocrMap[item.photo_name] = { text: item.ocr_text, status: item.ocr_status }
      })
      setPhotoOcrData(ocrMap)
    }
  }

  const runOcrForPhoto = async (photoName, photoUrl) => {
    let apiKey = mistralApiKey
    if (!apiKey) {
      apiKey = await fetchMistralApiKey()
    }
    if (!apiKey) {
      console.error('Mistral API Key nicht gefunden')
      return
    }

    setOcrProcessing((prev) => ({ ...prev, [photoName]: true }))

    try {
      const response = await fetch('https://api.mistral.ai/v1/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-ocr-latest',
          document: {
            type: 'image_url',
            image_url: photoUrl,
          },
        }),
      })

      const result = await response.json()
      let ocrText = ''

      if (result.pages && result.pages.length > 0) {
        ocrText = result.pages.map((p) => p.markdown || p.text || '').join('\n')
      } else if (result.text) {
        ocrText = result.text
      } else if (result.content) {
        ocrText = result.content
      }

      const { error } = await supabase
        .from('photo_ocr')
        .upsert({
          photo_name: photoName,
          ocr_text: ocrText || '(kein Text erkannt)',
          ocr_status: 'completed',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'photo_name' })

      if (!error) {
        setPhotoOcrData((prev) => ({
          ...prev,
          [photoName]: { text: ocrText || '(kein Text erkannt)', status: 'completed' },
        }))
      }
    } catch (err) {
      console.error('OCR fehlgeschlagen:', err)
      await supabase
        .from('photo_ocr')
        .upsert({
          photo_name: photoName,
          ocr_text: '',
          ocr_status: 'error',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'photo_name' })
      setPhotoOcrData((prev) => ({
        ...prev,
        [photoName]: { text: '', status: 'error' },
      }))
    } finally {
      setOcrProcessing((prev) => ({ ...prev, [photoName]: false }))
    }
  }

  const openPhotoEditor = (photo) => {
    setSelectedPhoto(photo)
    setCrop(undefined)
    setCompletedCrop(undefined)
    setBrightness(100)
    setContrast(100)
    setPhotoEditorOpen(true)
  }

  const closePhotoEditor = () => {
    setPhotoEditorOpen(false)
    setSelectedPhoto(null)
    setCrop(undefined)
    setCompletedCrop(undefined)
  }

  return {
    // State
    latestPhoto,
    photoUploading,
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
    // Refs
    cameraInputRef,
    photoImgRef,
    // Setters (for external components)
    setCrop,
    setCompletedCrop,
    setBrightness,
    setContrast,
    setPhotoSaving,
    setAllPhotos,
    // Actions
    fetchLatestPhoto,
    handleCameraCapture,
    fetchAllPhotos,
    deletePhoto,
    fetchBusinessCards,
    deleteBusinessCard,
    fetchPhotoOcrData,
    runOcrForPhoto,
    openPhotoEditor,
    closePhotoEditor,
  }
}
