import { createContext, useContext, useMemo } from 'react'
import { useChat, useChatUnreadCounts } from '../features/chat'
import { useAuth } from './AuthContext'
import { useStaff } from './StaffContext'
import { useNavigation } from './NavigationContext'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const { session } = useAuth()
  const { staff } = useStaff()
  const { activeView, chatTab } = useNavigation()

  const directChatUserId = chatTab === 'group' ? null : chatTab

  const {
    chatMessages,
    chatLoading,
    chatLoadingMore,
    chatError,
    chatInput,
    chatSending,
    chatEndRef,
    messageReads,
    messageReactions,
    hasMoreMessages,
    editingMessageId,
    pendingFile,
    setChatInput,
    setEditingMessageId,
    fetchChatMessages,
    loadMoreMessages,
    sendChatMessage,
    deleteChatMessage,
    editChatMessage,
    canEditMessage,
    markMessagesAsRead,
    toggleReaction,
    selectChatFile,
    setPendingFile,
    EMOJI_SET,
    ALLOWED_FILE_TYPES,
  } = useChat({ session, activeView, directChatUserId })

  const { unreadCounts: chatUnreadCounts } = useChatUnreadCounts({ session, staff })

  const value = useMemo(() => ({
    chatMessages,
    chatLoading,
    chatLoadingMore,
    chatError,
    chatInput,
    chatSending,
    chatEndRef,
    messageReads,
    messageReactions,
    hasMoreMessages,
    editingMessageId,
    pendingFile,
    chatUnreadCounts,
    setChatInput,
    setEditingMessageId,
    fetchChatMessages,
    loadMoreMessages,
    sendChatMessage,
    deleteChatMessage,
    editChatMessage,
    canEditMessage,
    markMessagesAsRead,
    toggleReaction,
    selectChatFile,
    setPendingFile,
    EMOJI_SET,
    ALLOWED_FILE_TYPES,
  }), [
    chatMessages,
    chatLoading,
    chatLoadingMore,
    chatError,
    chatInput,
    chatSending,
    chatEndRef,
    messageReads,
    messageReactions,
    hasMoreMessages,
    editingMessageId,
    pendingFile,
    chatUnreadCounts,
    setChatInput,
    setEditingMessageId,
    fetchChatMessages,
    loadMoreMessages,
    sendChatMessage,
    deleteChatMessage,
    editChatMessage,
    canEditMessage,
    markMessagesAsRead,
    toggleReaction,
    selectChatFile,
    setPendingFile,
    EMOJI_SET,
    ALLOWED_FILE_TYPES,
  ])

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider')
  }
  return context
}
