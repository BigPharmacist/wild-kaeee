import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { chatKeys } from './queries'

const CHAT_NOTIFICATION_SOUND = 'https://proxy.notificationsounds.com/message-tones/relax-message-tone/download/file-sounds-1217-relax.mp3'

// Notification-Sound abspielen
const playChatNotificationSound = () => {
  const audio = new Audio(CHAT_NOTIFICATION_SOUND)
  audio.play().catch(() => {}) // Ignoriere Fehler wenn Audio blockiert
}

// Browser-Benachrichtigung anzeigen
const showChatNotification = (message, senderName, chatType, chatId) => {
  if (!('Notification' in window)) return

  if (Notification.permission === 'granted') {
    const title = chatType === 'group' ? 'Neue Gruppenchat-Nachricht' : `Nachricht von ${senderName}`
    const body = message.file_url
      ? `${senderName}: 📎 ${message.file_name || 'Datei'}`
      : `${senderName}: Neue Nachricht`

    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: `chat-${chatType}-${chatId || 'group'}`,
    })

    // Klick auf Notification -> Chat öffnen
    notification.onclick = () => {
      window.focus()
      window.dispatchEvent(new CustomEvent('navigate-to-chat', { detail: { chatType, chatId } }))
      notification.close()
    }
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission()
  }
}

/**
 * Fetch unread counts from Supabase RPC
 */
async function fetchUnreadCounts(userId) {
  const { data, error } = await supabase
    .rpc('get_chat_unread_counts', { p_user_id: userId })

  if (error) throw error

  // Convert to expected format
  const counts = { group: 0 }

  data?.forEach((row) => {
    if (row.chat_type === 'group') {
      counts.group = Number(row.unread_count)
    } else if (row.chat_type === 'direct' && row.chat_id) {
      counts[row.chat_id] = Number(row.unread_count)
    }
  })

  return counts
}

/**
 * Hook für Ungelesen-Zähler mit TanStack Query
 * Inkludiert Realtime-Subscription und Benachrichtigungen
 *
 * @param {Object} options
 * @param {string} options.userId - Current user ID
 * @param {Object} options.staffByAuthId - Staff lookup by auth_user_id
 * @param {boolean} options.enabled - Whether to fetch (default: true)
 */
export function useUnreadCountsQuery({ userId, staffByAuthId = {}, enabled = true }) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: chatKeys.unreadCounts(),
    queryFn: () => fetchUnreadCounts(userId),
    enabled: enabled && !!userId,
    staleTime: 30_000, // 30 seconds
    refetchInterval: 60_000, // Refetch every minute as backup
  })

  // Refetch function for external use
  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: chatKeys.unreadCounts() })
  }, [queryClient])

  // Realtime subscription for new messages and read status
  useEffect(() => {
    if (!userId || !enabled) return

    const channel = supabase
      .channel('chat_unread_counts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const newMsg = payload.new

        // Only show notification if message is from someone else
        if (newMsg.user_id !== userId) {
          const senderName = staffByAuthId[newMsg.user_id]?.first_name || 'Unbekannt'
          const chatType = newMsg.recipient_id ? 'direct' : 'group'
          const chatId = chatType === 'group' ? null : newMsg.user_id

          // Browser notification and sound
          showChatNotification(newMsg, senderName, chatType, chatId)
          playChatNotificationSound()
        }

        // Refetch unread counts + chat order
        refetch()
        queryClient.invalidateQueries({ queryKey: ['chat', 'lastMessages'] })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_message_reads' }, () => {
        refetch()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, enabled, staffByAuthId, refetch])

  return {
    ...query,
    unreadCounts: query.data || { group: 0 },
    refetch,
  }
}
