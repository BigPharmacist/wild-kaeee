import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTheme, useAuth, useStaff, useNavigation } from '../../context'
import {
  useChatMessagesQuery,
  useChatReadsQuery,
  useChatReactionsQuery,
  useSendMessage,
  useEditMessage,
  useDeleteMessage,
  useMarkAsRead,
  useToggleReaction,
  CHAT_CONSTANTS,
} from './api'
import { useChatInput } from './hooks'
import ChatView from './ChatView'

const { EMOJI_SET, ALLOWED_FILE_TYPES, EDIT_TIME_LIMIT_MS } = CHAT_CONSTANTS

/**
 * ChatPage - Wrapper-Komponente die TanStack Query Hooks verwendet
 * Wird für die /chat Route und als eigenständige Komponente verwendet
 */
export default function ChatPage({ directChatUserId: propDirectChatUserId }) {
  const { theme } = useTheme()
  const { session } = useAuth()
  const { staff } = useStaff()
  const { activeView, chatTab } = useNavigation()

  // Determine direct chat user ID from props or navigation context
  // Verhindere Chat mit sich selbst (kann durch stale localStorage passieren)
  const rawDirectChatUserId = propDirectChatUserId ?? (chatTab === 'group' ? null : chatTab)
  const directChatUserId = rawDirectChatUserId === session?.user?.id ? null : rawDirectChatUserId

  // Staff lookup by auth_user_id
  const staffByAuthId = useMemo(() => {
    return staff?.reduce((acc, s) => {
      if (s.auth_user_id) acc[s.auth_user_id] = s
      return acc
    }, {}) || {}
  }, [staff])

  // Find direct chat user
  const directChatUser = directChatUserId ? staffByAuthId[directChatUserId] : null

  // Only fetch when chat is active
  const isEnabled = activeView === 'chat' && !!session?.user?.id

  // TanStack Query Hooks
  const {
    data: messagesData,
    isLoading: chatLoading,
    isFetchingNextPage: chatLoadingMore,
    error: queryError,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useChatMessagesQuery({
    userId: session?.user?.id,
    directChatUserId,
    enabled: isEnabled,
  })

  const chatMessages = messagesData?.messages || []
  const hasMoreMessages = hasNextPage ?? false

  // Get message IDs for reads and reactions queries
  const messageIds = useMemo(() => chatMessages.map((m) => m.id), [chatMessages])

  const { data: messageReads = {} } = useChatReadsQuery({
    messageIds,
    enabled: isEnabled && messageIds.length > 0,
  })

  const { data: messageReactions = {} } = useChatReactionsQuery({
    messageIds,
    enabled: isEnabled && messageIds.length > 0,
  })

  // Mutations
  const sendMutation = useSendMessage({ directChatUserId })
  const editMutation = useEditMessage({ directChatUserId })
  const deleteMutation = useDeleteMessage({ directChatUserId })
  const markAsReadMutation = useMarkAsRead()
  const toggleReactionMutation = useToggleReaction()

  // Local input state
  const {
    chatInput,
    pendingFile,
    editingMessageId,
    fileError,
    chatEndRef,
    setChatInput,
    setPendingFile,
    setEditingMessageId,
    selectFile,
    resetInput,
  } = useChatInput()

  // Combined error message (filter out transient AbortError from background refetches)
  const isAbortError = (msg) => msg && msg.includes('AbortError')
  const sendError = sendMutation.error?.message && !isAbortError(sendMutation.error.message)
    ? sendMutation.error.message : ''
  const chatError = (queryError?.message && !isAbortError(queryError.message) ? queryError.message : '')
    || fileError
    || sendError
    || ''
  const isSendError = !!sendError && chatError === sendError

  // Send message handler
  const sendChatMessage = useCallback(async (event) => {
    event?.preventDefault()

    if (!chatInput.trim() && !pendingFile) return
    if (!session?.user?.id) return

    // Reset previous send error before retrying
    sendMutation.reset()

    try {
      await sendMutation.mutateAsync({
        userId: session.user.id,
        message: chatInput,
        directChatUserId,
        file: pendingFile,
      })
      resetInput()
    } catch {
      // Error is handled by mutation state, input preserved for retry
    }
  }, [chatInput, pendingFile, session?.user?.id, directChatUserId, sendMutation, resetInput])

  // Edit message handler
  const editChatMessage = useCallback(async (messageId, newText) => {
    if (!session?.user?.id || !newText.trim()) return false

    const message = chatMessages.find((m) => m.id === messageId)
    if (!message || message.user_id !== session.user.id) return false

    try {
      await editMutation.mutateAsync({
        messageId,
        userId: session.user.id,
        newText,
        createdAt: message.created_at,
      })
      setEditingMessageId(null)
      return true
    } catch {
      return false
    }
  }, [session?.user?.id, chatMessages, editMutation, setEditingMessageId])

  // Delete message handler
  const deleteChatMessage = useCallback(async (messageId) => {
    if (!session?.user?.id) return false

    try {
      await deleteMutation.mutateAsync({
        messageId,
        userId: session.user.id,
      })
      return true
    } catch {
      return false
    }
  }, [session?.user?.id, deleteMutation])

  // Check if message can be edited
  const canEditMessage = useCallback((message) => {
    if (!message || message.user_id !== session?.user?.id || message.deleted_at) return false
    const createdAt = new Date(message.created_at).getTime()
    return Date.now() - createdAt <= EDIT_TIME_LIMIT_MS
  }, [session?.user?.id])

  // Toggle reaction handler
  const toggleReaction = useCallback(async (messageId, emoji) => {
    if (!session?.user?.id || !messageId || !emoji) return

    const existingReactions = messageReactions[messageId] || []
    const hasReacted = existingReactions.some(
      (r) => r.user_id === session.user.id && r.emoji === emoji
    )

    try {
      await toggleReactionMutation.mutateAsync({
        messageId,
        userId: session.user.id,
        emoji,
        hasReacted,
      })
    } catch {
      // Error handled by mutation
    }
  }, [session?.user?.id, messageReactions, toggleReactionMutation])

  // Load more messages handler
  const loadMoreMessages = useCallback(() => {
    if (hasMoreMessages && !chatLoadingMore) {
      fetchNextPage()
    }
  }, [hasMoreMessages, chatLoadingMore, fetchNextPage])

  // Track which messages were already marked as read this session (prevents upsert loop)
  const markedAsReadRef = useRef(new Set())

  // Reset tracked reads when switching chats
  useEffect(() => {
    markedAsReadRef.current = new Set()
  }, [directChatUserId])

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (activeView !== 'chat' || chatLoading || chatMessages.length === 0) return
    if (!session?.user?.id) return

    // Filter unread messages from others (skip already-marked ones)
    const unreadFromOthers = chatMessages.filter(
      (m) => m.user_id !== session.user.id
        && !markedAsReadRef.current.has(m.id)
        && !messageReads[m.id]?.includes(session.user.id)
    )

    if (unreadFromOthers.length > 0) {
      const ids = unreadFromOthers.map((m) => m.id)
      ids.forEach((id) => markedAsReadRef.current.add(id))
      markAsReadMutation.mutate({
        messageIds: ids,
        userId: session.user.id,
      })
    }
  }, [activeView, chatLoading, chatMessages, session?.user?.id, messageReads, directChatUserId, markAsReadMutation])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeView === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeView, chatMessages, chatEndRef])

  return (
    <ChatView
      theme={theme}
      chatLoading={chatLoading}
      chatLoadingMore={chatLoadingMore}
      chatMessages={chatMessages}
      staffByAuthId={staffByAuthId}
      session={session}
      chatEndRef={chatEndRef}
      chatError={chatError}
      isSendError={isSendError}
      sendChatMessage={sendChatMessage}
      chatInput={chatInput}
      setChatInput={setChatInput}
      chatSending={sendMutation.isPending}
      directChatUserId={directChatUserId}
      directChatUser={directChatUser}
      messageReads={messageReads}
      messageReactions={messageReactions}
      deleteChatMessage={deleteChatMessage}
      hasMoreMessages={hasMoreMessages}
      loadMoreMessages={loadMoreMessages}
      fetchChatMessages={refetch}
      editingMessageId={editingMessageId}
      setEditingMessageId={setEditingMessageId}
      editChatMessage={editChatMessage}
      canEditMessage={canEditMessage}
      toggleReaction={toggleReaction}
      selectChatFile={selectFile}
      pendingFile={pendingFile}
      setPendingFile={setPendingFile}
      EMOJI_SET={EMOJI_SET}
      ALLOWED_FILE_TYPES={ALLOWED_FILE_TYPES}
    />
  )
}
