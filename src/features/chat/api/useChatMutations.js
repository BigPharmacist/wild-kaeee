import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseUrl } from '../../../lib/supabase'
import { chatKeys } from './queries'

const EDIT_TIME_LIMIT_MS = 5 * 60 * 1000 // 5 Minuten
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf']

/**
 * Bildkomprimierung für Chat-Uploads
 */
function compressChatImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
          'image/jpeg',
          quality
        )
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Datei zu Supabase Storage hochladen
 */
async function uploadChatAttachment(file, userId, directChatUserId) {
  if (!file || !userId) return null

  let fileToUpload = file

  // Bilder komprimieren
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
    fileToUpload = await compressChatImage(file)
  }

  const chatType = directChatUserId ? 'direct' : 'group'
  const fileExt = file.name.split('.').pop()
  const filePath = `${chatType}/${Date.now()}-${userId}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('chat-attachments')
    .upload(filePath, fileToUpload, { upsert: false })

  if (uploadError) {
    throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`)
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/chat-attachments/${filePath}`
  return {
    file_url: publicUrl,
    file_name: file.name,
    file_type: file.type,
  }
}

/**
 * Send a chat message
 */
async function sendMessage({ userId, message, directChatUserId, file }) {
  const messageData = {
    user_id: userId,
    message: message?.trim() || '',
  }

  if (directChatUserId) {
    messageData.recipient_id = directChatUserId
  }

  // Upload file if present
  if (file) {
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('Nur Bilder (JPG, PNG, GIF, WebP) und PDFs sind erlaubt.')
    }
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Die Datei ist zu groß. Maximale Größe: 25MB.')
    }

    const fileData = await uploadChatAttachment(file, userId, directChatUserId)
    if (fileData) {
      messageData.file_url = fileData.file_url
      messageData.file_name = fileData.file_name
      messageData.file_type = fileData.file_type
    }
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert(messageData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Edit a chat message
 */
async function editMessage({ messageId, userId, newText, createdAt }) {
  // Time check: max 5 minutes after creation
  const createdTime = new Date(createdAt).getTime()
  if (Date.now() - createdTime > EDIT_TIME_LIMIT_MS) {
    throw new Error('Nachrichten können nur innerhalb von 5 Minuten bearbeitet werden.')
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .update({ message: newText.trim(), edited_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a chat message (soft delete)
 */
async function deleteMessage({ messageId, userId }) {
  const { data, error } = await supabase
    .from('chat_messages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Mark messages as read
 */
async function markAsRead({ messageIds, userId }) {
  const inserts = messageIds.map((id) => ({
    message_id: id,
    user_id: userId,
  }))

  const { error } = await supabase
    .from('chat_message_reads')
    .upsert(inserts, { onConflict: 'message_id,user_id' })

  if (error) throw error
  return { messageIds, userId }
}

/**
 * Toggle reaction on a message
 */
async function toggleReaction({ messageId, userId, emoji, hasReacted }) {
  if (hasReacted) {
    // Remove reaction
    const { error } = await supabase
      .from('chat_message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('emoji', emoji)

    if (error) throw error
    return { messageId, userId, emoji, action: 'removed' }
  } else {
    // Add reaction
    const { error } = await supabase
      .from('chat_message_reactions')
      .insert({ message_id: messageId, user_id: userId, emoji })

    if (error) throw error
    return { messageId, userId, emoji, action: 'added' }
  }
}

/**
 * Hook für Nachricht senden
 */
export function useSendMessage({ directChatUserId = null }) {
  const queryClient = useQueryClient()
  const chatType = directChatUserId ? 'direct' : 'group'
  const chatId = directChatUserId || 'group'

  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (newMessage) => {
      // Add message to cache (realtime will also do this, but this is faster)
      queryClient.setQueryData(chatKeys.messageList(chatType, chatId), (old) => {
        if (!old) return old

        // Check if message already exists
        const allMessages = old.pages.flatMap((p) => p.messages)
        if (allMessages.some((m) => m.id === newMessage.id)) return old

        // Add to last page
        const newPages = [...old.pages]
        const lastPageIndex = newPages.length - 1
        newPages[lastPageIndex] = {
          ...newPages[lastPageIndex],
          messages: [...newPages[lastPageIndex].messages, newMessage],
        }

        return { ...old, pages: newPages }
      })
    },
  })
}

/**
 * Hook für Nachricht bearbeiten
 */
export function useEditMessage({ directChatUserId = null }) {
  const queryClient = useQueryClient()
  const chatType = directChatUserId ? 'direct' : 'group'
  const chatId = directChatUserId || 'group'

  return useMutation({
    mutationFn: editMessage,
    onSuccess: (updatedMessage) => {
      // Update message in cache
      queryClient.setQueryData(chatKeys.messageList(chatType, chatId), (old) => {
        if (!old) return old

        const newPages = old.pages.map((page) => ({
          ...page,
          messages: page.messages.map((m) =>
            m.id === updatedMessage.id ? updatedMessage : m
          ),
        }))

        return { ...old, pages: newPages }
      })
    },
  })
}

/**
 * Hook für Nachricht löschen
 */
export function useDeleteMessage({ directChatUserId = null }) {
  const queryClient = useQueryClient()
  const chatType = directChatUserId ? 'direct' : 'group'
  const chatId = directChatUserId || 'group'

  return useMutation({
    mutationFn: deleteMessage,
    onSuccess: (deletedMessage) => {
      // Update message in cache (soft delete)
      queryClient.setQueryData(chatKeys.messageList(chatType, chatId), (old) => {
        if (!old) return old

        const newPages = old.pages.map((page) => ({
          ...page,
          messages: page.messages.map((m) =>
            m.id === deletedMessage.id ? deletedMessage : m
          ),
        }))

        return { ...old, pages: newPages }
      })
    },
  })
}

/**
 * Hook für Nachrichten als gelesen markieren
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      // Invalidate unread counts
      queryClient.invalidateQueries({ queryKey: chatKeys.unreadCounts() })
    },
  })
}

/**
 * Hook für Reaktion togglen
 */
export function useToggleReaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleReaction,
    onMutate: async ({ messageId, userId, emoji, hasReacted }) => {
      // Optimistic update
      const queryKey = chatKeys.reactions()

      await queryClient.cancelQueries({ queryKey })

      const previousReactions = queryClient.getQueryData(queryKey)

      queryClient.setQueriesData({ queryKey }, (old) => {
        if (!old) return old

        if (hasReacted) {
          // Remove reaction
          return {
            ...old,
            [messageId]: (old[messageId] || []).filter(
              (r) => !(r.user_id === userId && r.emoji === emoji)
            ),
          }
        } else {
          // Add reaction
          return {
            ...old,
            [messageId]: [...(old[messageId] || []), { user_id: userId, emoji }],
          }
        }
      })

      return { previousReactions }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousReactions) {
        queryClient.setQueriesData({ queryKey: chatKeys.reactions() }, context.previousReactions)
      }
    },
  })
}

// Export constants for use in components
export const CHAT_CONSTANTS = {
  EDIT_TIME_LIMIT_MS,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_FILE_TYPES,
  EMOJI_SET: ['👍', '❤️', '😂', '😮', '😢'],
}
