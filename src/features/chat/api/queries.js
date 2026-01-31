// Query Key Factory für Chat
// Ermöglicht konsistente Cache-Keys und einfache Invalidierung

export const chatKeys = {
  all: ['chat'],
  messages: () => [...chatKeys.all, 'messages'],
  messageList: (chatType, chatId) => [...chatKeys.messages(), chatType, chatId],
  reads: () => [...chatKeys.all, 'reads'],
  reactions: () => [...chatKeys.all, 'reactions'],
  unreadCounts: () => [...chatKeys.all, 'unread'],
}
