import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { contactKeys } from './queries'

/**
 * Upload a business card to Supabase storage
 * @param {string} contactId - The contact ID
 * @param {File} file - The file to upload
 * @param {string} suffix - 'original' or 'enhanced'
 * @param {string} contentType - MIME type
 * @param {Function} rotateImage - Optional image rotation function
 * @param {number} rotation - Rotation angle (0, 90, 180, 270)
 */
async function uploadBusinessCard(contactId, file, suffix, contentType = 'image/jpeg', rotateImage = null, rotation = 0) {
  if (!file) return null

  // Apply rotation if needed (only for original images)
  const fileToUpload = suffix === 'original' && rotation !== 0 && rotateImage
    ? await rotateImage(file, rotation)
    : file

  const extension = contentType === 'image/png' ? 'png' : 'jpg'
  const filePath = `${contactId}/${Date.now()}-${suffix}.${extension}`

  const { error: uploadError } = await supabase
    .storage
    .from('business-cards')
    .upload(filePath, fileToUpload, { upsert: true, contentType })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data } = supabase
    .storage
    .from('business-cards')
    .getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * Hook für Kontakt-Erstellung mit Business Card Upload
 */
export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      contactData,
      cardFile = null,
      cardEnhancedFile = null,
      rotateImage = null,
      cardRotation = 0,
    }) => {
      // 1. Create contact
      const { data: contact, error } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single()

      if (error) throw error

      // 2. Upload business cards if provided
      if (cardFile && contact.id) {
        try {
          const originalUrl = await uploadBusinessCard(
            contact.id,
            cardFile,
            'original',
            'image/jpeg',
            rotateImage,
            cardRotation
          )

          const enhancedUrl = cardEnhancedFile
            ? await uploadBusinessCard(
                contact.id,
                cardEnhancedFile,
                'enhanced',
                cardEnhancedFile.type || 'image/png'
              )
            : null

          // Update contact with card URLs
          const updatePayload = {
            business_card_url: originalUrl,
            ...(enhancedUrl && { business_card_url_enhanced: enhancedUrl }),
          }

          const { data: updatedContact, error: updateError } = await supabase
            .from('contacts')
            .update(updatePayload)
            .eq('id', contact.id)
            .select()
            .single()

          if (updateError) throw updateError
          return updatedContact
        } catch (uploadErr) {
          // Contact created but card upload failed - still return contact
          console.error('Business card upload failed:', uploadErr)
          throw new Error(`Kontakt erstellt, aber Visitenkarte konnte nicht hochgeladen werden: ${uploadErr.message}`)
        }
      }

      return contact
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
    },
  })
}
