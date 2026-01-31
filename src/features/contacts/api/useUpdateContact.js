import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { contactKeys } from './queries'

/**
 * Delete business cards from storage for a contact
 */
async function deleteBusinessCards(contactId) {
  // List all files in the contact's folder
  const { data: files, error: listError } = await supabase
    .storage
    .from('business-cards')
    .list(contactId)

  if (listError || !files?.length) return

  const filePaths = files.map(file => `${contactId}/${file.name}`)
  await supabase.storage.from('business-cards').remove(filePaths)
}

/**
 * Upload a business card to Supabase storage
 */
async function uploadBusinessCard(contactId, file, suffix, contentType = 'image/jpeg', rotateImage = null, rotation = 0) {
  if (!file) return null

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
 * Hook für Kontakt-Aktualisierung mit Business Card Management
 * Unterstützt optimistische Updates mit Rollback
 */
export function useUpdateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      contactId,
      updates,
      cardFile = null,
      cardEnhancedFile = null,
      deleteOldCards = false,
      rotateImage = null,
      cardRotation = 0,
    }) => {
      // 1. Delete old cards if requested
      if (deleteOldCards) {
        await deleteBusinessCards(contactId)
        updates.business_card_url = null
        updates.business_card_url_enhanced = null
      }

      // 2. Upload new cards if provided
      if (cardFile) {
        updates.business_card_url = await uploadBusinessCard(
          contactId,
          cardFile,
          'original',
          'image/jpeg',
          rotateImage,
          cardRotation
        )
      }

      if (cardEnhancedFile) {
        updates.business_card_url_enhanced = await uploadBusinessCard(
          contactId,
          cardEnhancedFile,
          'enhanced',
          cardEnhancedFile.type || 'image/png'
        )
      }

      // 3. Update contact in database
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', contactId)
        .select()
        .single()

      if (error) throw error
      return data
    },

    // Optimistic update
    onMutate: async ({ contactId, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: contactKeys.lists() })

      // Snapshot previous value for all cached lists
      const previousLists = {}
      queryClient.getQueriesData({ queryKey: contactKeys.lists() }).forEach(([key, data]) => {
        previousLists[JSON.stringify(key)] = data
      })

      // Optimistically update all cached lists
      queryClient.setQueriesData({ queryKey: contactKeys.lists() }, (old) => {
        if (!old) return old
        return old.map(c => c.id === contactId ? { ...c, ...updates } : c)
      })

      return { previousLists }
    },

    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousLists) {
        Object.entries(context.previousLists).forEach(([keyStr, data]) => {
          const key = JSON.parse(keyStr)
          queryClient.setQueryData(key, data)
        })
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
    },
  })
}
