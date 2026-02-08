import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { chatKeys } from './queries'

const PAGE_SIZE = 50

/**
 * Fetch chat messages from Supabase
 * @param {Object} options
 * @param {string} options.userId - Current user ID
 * @param {string|null} options.directChatUserId - User ID for direct chat, null for group chat
 * @param {string|null} options.cursor - Cursor for pagination (created_at of oldest message)
 */
async function fetchChatMessages({ userId, directChatUserId, cursor = null }) {
  let query = supabase
    .from('chat_messages')
    .select('id, user_id, recipient_id, message, created_at, deleted_at, edited_at, file_url, file_name, file_type')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)

  // Apply cursor for pagination
  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  if (directChatUserId) {
    // Direct chat: messages between me and the other user
    query = query.or(
      `and(user_id.eq.${userId},recipient_id.eq.${directChatUserId}),and(user_id.eq.${directChatUserId},recipient_id.eq.${userId})`
    )
  } else {
    // Group chat: recipient_id is NULL
    query = query.is('recipient_id', null)
  }

  const { data, error } = await query

  if (error) throw error

  // Check if there are more messages
  const hasMore = data && data.length > PAGE_SIZE
  const messages = (hasMore ? data.slice(0, PAGE_SIZE) : data || []).reverse()

  return {
    messages,
    hasMore,
    nextCursor: messages.length > 0 ? messages[0].created_at : null,
  }
}

/**
 * Fetch read status for messages
 */
async function fetchMessageReads(messageIds) {
  if (!messageIds?.length) return {}

  const { data } = await supabase
    .from('chat_message_reads')
    .select('message_id, user_id')
    .in('message_id', messageIds)

  const readsMap = {}
  data?.forEach((r) => {
    if (!readsMap[r.message_id]) readsMap[r.message_id] = []
    readsMap[r.message_id].push(r.user_id)
  })

  return readsMap
}

/**
 * Fetch reactions for messages
 */
async function fetchMessageReactions(messageIds) {
  if (!messageIds?.length) return {}

  const { data } = await supabase
    .from('chat_message_reactions')
    .select('message_id, user_id, emoji')
    .in('message_id', messageIds)

  const reactionsMap = {}
  data?.forEach((r) => {
    if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = []
    reactionsMap[r.message_id].push({ user_id: r.user_id, emoji: r.emoji })
  })

  return reactionsMap
}

/**
 * Hook für Chat-Nachrichten mit TanStack Query (Infinite Query für Pagination)
 * Inkludiert Realtime-Subscription für Live-Updates
 *
 * @param {Object} options
 * @param {string} options.userId - Current user ID
 * @param {string|null} options.directChatUserId - User ID for direct chat, null for group chat
 * @param {boolean} options.enabled - Whether to fetch (default: true)
 */
export function useChatMessagesQuery({ userId, directChatUserId = null, enabled = true }) {
  const queryClient = useQueryClient()
  const chatType = directChatUserId ? 'direct' : 'group'
  const chatId = directChatUserId || 'group'

  const query = useInfiniteQuery({
    queryKey: chatKeys.messageList(chatType, chatId),
    queryFn: ({ pageParam }) => fetchChatMessages({
      userId,
      directChatUserId,
      cursor: pageParam,
    }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: enabled && !!userId,
    staleTime: 30_000, // 30 seconds
    refetchInterval: enabled ? 5000 : false, // Fallback polling if realtime fails (e.g., mobile/websocket issues)
    select: (data) => ({
      // Flatten all pages into a single array, maintaining chronological order
      messages: data.pages.flatMap((page) => page.messages),
      hasMore: data.pages[data.pages.length - 1]?.hasMore ?? false,
    }),
  })

  // Realtime Subscription for live updates
  useEffect(() => {
    if (!userId || !enabled) return

    const channel = supabase
      .channel(`chat_messages_${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const newMsg = payload.new

        // Check if message belongs to this chat
        const isGroupChat = !directChatUserId
        const isForGroupChat = newMsg.recipient_id === null
        const isForThisDirectChat = directChatUserId && (
          (newMsg.user_id === userId && newMsg.recipient_id === directChatUserId) ||
          (newMsg.user_id === directChatUserId && newMsg.recipient_id === userId)
        )

        if ((isGroupChat && isForGroupChat) || isForThisDirectChat) {
          // Optimistically add new message to cache
          queryClient.setQueryData(chatKeys.messageList(chatType, chatId), (old) => {
            if (!old) return old

            // Check if message already exists
            const allMessages = old.pages.flatMap((p) => p.messages)
            if (allMessages.some((m) => m.id === newMsg.id)) return old

            // Add to last page
            const newPages = [...old.pages]
            const lastPageIndex = newPages.length - 1
            newPages[lastPageIndex] = {
              ...newPages[lastPageIndex],
              messages: [...newPages[lastPageIndex].messages, newMsg],
            }

            return { ...old, pages: newPages }
          })
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, (payload) => {
        const updatedMsg = payload.new

        // Update message in cache
        queryClient.setQueryData(chatKeys.messageList(chatType, chatId), (old) => {
          if (!old) return old

          const newPages = old.pages.map((page) => ({
            ...page,
            messages: page.messages.map((m) =>
              m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m
            ),
          }))

          return { ...old, pages: newPages }
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, directChatUserId, enabled, queryClient, chatType, chatId])

  return query
}

/**
 * Hook für Lese-Status von Nachrichten
 */
export function useChatReadsQuery({ messageIds, enabled = true }) {
  return useQuery({
    queryKey: [...chatKeys.reads(), messageIds],
    queryFn: () => fetchMessageReads(messageIds),
    enabled: enabled && messageIds?.length > 0,
    staleTime: 60_000, // 1 minute
  })
}

/**
 * Hook für Reaktionen auf Nachrichten
 */
export function useChatReactionsQuery({ messageIds, enabled = true }) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [...chatKeys.reactions(), messageIds],
    queryFn: () => fetchMessageReactions(messageIds),
    enabled: enabled && messageIds?.length > 0,
    staleTime: 60_000, // 1 minute
  })

  // Realtime subscription for reactions
  useEffect(() => {
    if (!messageIds?.length || !enabled) return

    const channel = supabase
      .channel('chat_reactions_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_message_reactions' }, (payload) => {
        const reaction = payload.new
        if (messageIds.includes(reaction.message_id)) {
          queryClient.setQueryData([...chatKeys.reactions(), messageIds], (old) => {
            if (!old) return old
            const existing = old[reaction.message_id] || []
            if (existing.some((r) => r.user_id === reaction.user_id && r.emoji === reaction.emoji)) {
              return old
            }
            return {
              ...old,
              [reaction.message_id]: [...existing, { user_id: reaction.user_id, emoji: reaction.emoji }],
            }
          })
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_message_reactions' }, (payload) => {
        const reaction = payload.old
        if (messageIds.includes(reaction.message_id)) {
          queryClient.setQueryData([...chatKeys.reactions(), messageIds], (old) => {
            if (!old) return old
            return {
              ...old,
              [reaction.message_id]: (old[reaction.message_id] || []).filter(
                (r) => !(r.user_id === reaction.user_id && r.emoji === reaction.emoji)
              ),
            }
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [messageIds, enabled, queryClient])

  return query
}
