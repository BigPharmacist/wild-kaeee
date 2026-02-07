import { useState, useCallback } from 'react'
import { getEnhancedImage } from '../../../lib/imageProcessing'

/**
 * Hook für Visitenkarten-Enhance (Google Nano Banana Pro)
 * Kapselt den enhance-State und die Handler
 * Extrahiert aus DashboardLayout
 */
export default function useEnhance({ googleApiKey, fetchGoogleApiKey }) {
  const [enhanceFile, setEnhanceFile] = useState(null)
  const [enhancePreview, setEnhancePreview] = useState('')
  const [enhanceResultPreview, setEnhanceResultPreview] = useState('')
  const [enhanceLoading, setEnhanceLoading] = useState(false)
  const [enhanceMessage, setEnhanceMessage] = useState('')

  const handleEnhanceFileChange = useCallback((event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setEnhanceFile(file)
    setEnhancePreview(URL.createObjectURL(file))
    setEnhanceResultPreview('')
    setEnhanceMessage('')
  }, [])

  const runBusinessCardEnhance = useCallback(async () => {
    if (!enhanceFile) {
      setEnhanceMessage('Bitte zuerst ein Foto auswählen.')
      return
    }

    let apiKey = googleApiKey
    if (!apiKey) {
      apiKey = await fetchGoogleApiKey()
    }
    if (!apiKey) {
      setEnhanceMessage('Google API Key nicht gefunden (erwartet: name = "Google Nano Banana").')
      return
    }

    setEnhanceLoading(true)
    setEnhanceMessage('')
    setEnhanceResultPreview('')

    try {
      const { previewUrl } = await getEnhancedImage(enhanceFile, apiKey)
      setEnhanceResultPreview(previewUrl)
    } catch (error) {
      setEnhanceMessage(error.message || 'Verbesserung fehlgeschlagen.')
    } finally {
      setEnhanceLoading(false)
    }
  }, [enhanceFile, googleApiKey, fetchGoogleApiKey])

  return {
    enhanceFile,
    enhancePreview,
    enhanceResultPreview,
    enhanceLoading,
    enhanceMessage,
    handleEnhanceFileChange,
    runBusinessCardEnhance,
  }
}
