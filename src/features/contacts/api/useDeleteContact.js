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
  const { error: removeError } = await supabase.storage.from('business-cards').remove(filePaths)

  if (removeError) {
    console.error('Failed to remove business cards:', removeError)
  }
}

/**
 * Hook für Kontakt-Löschung mit Storage Cleanup
 * Unterstützt optimistische Updates mit Rollback
 */
export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contactId) => {
      // 1. Delete business cards from storage
      await deleteBusinessCards(contactId)

      // 2. Delete contact from database
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)

      if (error) throw error
      return contactId
    },

    // Optimistic update
    onMutate: async (contactId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: contactKeys.lists() })

      // Snapshot previous value for all cached lists
      const previousLists = {}
      queryClient.getQueriesData({ queryKey: contactKeys.lists() }).forEach(([key, data]) => {
        previousLists[JSON.stringify(key)] = data
      })

      // Optimistically remove from all cached lists
      queryClient.setQueriesData({ queryKey: contactKeys.lists() }, (old) => {
        if (!old) return old
        return old.filter(c => c.id !== contactId)
      })

      return { previousLists }
    },

    // Rollback on error
    onError: (err, contactId, context) => {
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
