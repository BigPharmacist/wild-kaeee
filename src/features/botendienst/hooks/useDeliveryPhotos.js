import { useState, useCallback } from 'react'
import { supabase, supabaseUrl } from '../../../lib/supabase'

export function useDeliveryPhotos({ session, currentStaff }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  // ============================================
  // UPLOAD DELIVERY PHOTO
  // ============================================

  const uploadPhoto = useCallback(async (stopId, file, caption = null) => {
    if (!session || !currentStaff?.id) return null

    setUploading(true)
    setUploadError(null)

    try {
      // Generate unique filename
      const timestamp = Date.now()
      const ext = file.name?.split('.').pop() || 'jpg'
      const filePath = `${stopId}/${timestamp}.${ext}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('delivery-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('delivery-photos')
        .getPublicUrl(filePath)

      const photoUrl = urlData.publicUrl

      // Create database record
      const { data, error: dbError } = await supabase
        .from('delivery_stop_photos')
        .insert({
          stop_id: stopId,
          photo_url: photoUrl,
          caption: caption,
          created_by: currentStaff.id,
        })
        .select()
        .single()

      if (dbError) throw dbError

      return data
    } catch (err) {
      console.error('Fehler beim Upload des Fotos:', err)
      setUploadError(err.message)
      return null
    } finally {
      setUploading(false)
    }
  }, [session, currentStaff?.id])

  // ============================================
  // UPLOAD PHOTO FROM CAMERA (Blob/DataURL)
  // ============================================

  const uploadPhotoFromCamera = useCallback(async (stopId, imageData, caption = null) => {
    if (!session || !currentStaff?.id) return null

    setUploading(true)
    setUploadError(null)

    try {
      // Convert DataURL to Blob if needed
      let blob = imageData
      if (typeof imageData === 'string' && imageData.startsWith('data:')) {
        const response = await fetch(imageData)
        blob = await response.blob()
      }

      // Generate unique filename
      const timestamp = Date.now()
      const filePath = `${stopId}/${timestamp}.jpg`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('delivery-photos')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('delivery-photos')
        .getPublicUrl(filePath)

      const photoUrl = urlData.publicUrl

      // Create database record
      const { data, error: dbError } = await supabase
        .from('delivery_stop_photos')
        .insert({
          stop_id: stopId,
          photo_url: photoUrl,
          caption: caption,
          created_by: currentStaff.id,
        })
        .select()
        .single()

      if (dbError) throw dbError

      return data
    } catch (err) {
      console.error('Fehler beim Upload des Kamera-Fotos:', err)
      setUploadError(err.message)
      return null
    } finally {
      setUploading(false)
    }
  }, [session, currentStaff?.id])

  // ============================================
  // DELETE PHOTO
  // ============================================

  const deletePhoto = useCallback(async (photoId, photoUrl) => {
    if (!session) return false

    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/delivery-photos/')
      const filePath = urlParts[1]

      // Delete from storage
      if (filePath) {
        await supabase.storage
          .from('delivery-photos')
          .remove([filePath])
      }

      // Delete database record
      const { error } = await supabase
        .from('delivery_stop_photos')
        .delete()
        .eq('id', photoId)

      if (error) throw error

      return true
    } catch (err) {
      console.error('Fehler beim Löschen des Fotos:', err)
      setUploadError(err.message)
      return false
    }
  }, [session])

  // ============================================
  // UPLOAD SIGNATURE
  // ============================================

  const uploadSignature = useCallback(async (stopId, canvasDataUrl, signerName = null, position = null) => {
    if (!session) return null

    setUploading(true)
    setUploadError(null)

    try {
      // Convert DataURL to Blob
      const response = await fetch(canvasDataUrl)
      const blob = await response.blob()

      // Generate filename
      const timestamp = Date.now()
      const filePath = `${stopId}/signature_${timestamp}.png`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('delivery-signatures')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/png',
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('delivery-signatures')
        .getPublicUrl(filePath)

      const signatureUrl = urlData.publicUrl

      // Create database record
      const insertData = {
        stop_id: stopId,
        signature_url: signatureUrl,
        signer_name: signerName,
      }

      if (position) {
        insertData.latitude = position.latitude
        insertData.longitude = position.longitude
      }

      const { data, error: dbError } = await supabase
        .from('delivery_signatures')
        .insert(insertData)
        .select()
        .single()

      if (dbError) throw dbError

      return data
    } catch (err) {
      console.error('Fehler beim Upload der Unterschrift:', err)
      setUploadError(err.message)
      return null
    } finally {
      setUploading(false)
    }
  }, [session])

  // ============================================
  // UPLOAD TOUR PDF
  // ============================================

  const uploadTourPdf = useCallback(async (tourId, file) => {
    if (!session) return null

    setUploading(true)
    setUploadError(null)

    try {
      // Generate filename
      const timestamp = Date.now()
      const filePath = `${tourId}/${timestamp}.pdf`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('delivery-pdfs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf',
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('delivery-pdfs')
        .getPublicUrl(filePath)

      // Update tour with PDF URL
      await supabase
        .from('delivery_tours')
        .update({ source_pdf_url: urlData.publicUrl })
        .eq('id', tourId)

      return urlData.publicUrl
    } catch (err) {
      console.error('Fehler beim Upload des PDFs:', err)
      setUploadError(err.message)
      return null
    } finally {
      setUploading(false)
    }
  }, [session])

  // ============================================
  // GET PHOTOS FOR STOP
  // ============================================

  const getPhotosForStop = useCallback(async (stopId) => {
    if (!session) return []

    try {
      const { data, error } = await supabase
        .from('delivery_stop_photos')
        .select('*')
        .eq('stop_id', stopId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Fehler beim Laden der Fotos:', err)
      return []
    }
  }, [session])

  // ============================================
  // GET SIGNATURE FOR STOP
  // ============================================

  const getSignatureForStop = useCallback(async (stopId) => {
    if (!session) return null

    try {
      const { data, error } = await supabase
        .from('delivery_signatures')
        .select('*')
        .eq('stop_id', stopId)
        .order('signed_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data || null
    } catch (err) {
      console.error('Fehler beim Laden der Unterschrift:', err)
      return null
    }
  }, [session])

  return {
    // State
    uploading,
    uploadError,

    // Photo actions
    uploadPhoto,
    uploadPhotoFromCamera,
    deletePhoto,
    getPhotosForStop,

    // Signature actions
    uploadSignature,
    getSignatureForStop,

    // PDF actions
    uploadTourPdf,
  }
}
