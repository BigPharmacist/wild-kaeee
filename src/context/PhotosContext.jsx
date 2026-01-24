import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { usePhotos } from '../features/photos'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const PhotosContext = createContext(null)

export function PhotosProvider({ children }) {
  const { session } = useAuth()

  // API Keys
  const [mistralApiKey, setMistralApiKey] = useState(null)
  const [googleApiKey, setGoogleApiKey] = useState(null)

  const fetchMistralApiKey = useCallback(async () => {
    const { data, error } = await supabase
      .from('api_keys')
      .select('key')
      .eq('name', 'Mistral')
      .single()
    if (!error && data) {
      setMistralApiKey(data.key)
      return data.key
    }
    return null
  }, [])

  const fetchGoogleApiKey = useCallback(async () => {
    const { data, error } = await supabase
      .from('api_keys')
      .select('key')
      .eq('name', 'Google Nano Banana')
      .single()
    if (!error && data) {
      setGoogleApiKey(data.key)
      return data.key
    }
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('api_keys')
      .select('key')
      .ilike('name', '%google%nano%banana%')
      .limit(1)
      .single()
    if (!fallbackError && fallbackData) {
      setGoogleApiKey(fallbackData.key)
      return fallbackData.key
    }
    return null
  }, [])

  const {
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
    cameraInputRef,
    photoImgRef,
    setCrop,
    setCompletedCrop,
    setBrightness,
    setContrast,
    setPhotoSaving,
    setAllPhotos,
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
  } = usePhotos({ mistralApiKey, fetchMistralApiKey })

  // Daten laden wenn Session vorhanden
  useEffect(() => {
    if (session) {
      fetchLatestPhoto()
      fetchAllPhotos()
      fetchPhotoOcrData()
      fetchMistralApiKey()
      fetchGoogleApiKey()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const value = useMemo(() => ({
    // API Keys
    mistralApiKey,
    googleApiKey,
    fetchMistralApiKey,
    fetchGoogleApiKey,
    // Photos State
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
    // Setters
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
  }), [
    mistralApiKey,
    googleApiKey,
    fetchMistralApiKey,
    fetchGoogleApiKey,
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
    cameraInputRef,
    photoImgRef,
    setCrop,
    setCompletedCrop,
    setBrightness,
    setContrast,
    setPhotoSaving,
    setAllPhotos,
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
  ])

  return (
    <PhotosContext.Provider value={value}>
      {children}
    </PhotosContext.Provider>
  )
}

export function usePhotosContext() {
  const context = useContext(PhotosContext)
  if (!context) {
    throw new Error('usePhotosContext must be used within PhotosProvider')
  }
  return context
}
