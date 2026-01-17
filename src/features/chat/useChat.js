import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export function useChat({ session, activeView, directChatUserId }) {
  const [chatMessages, setChatMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [messageReads, setMessageReads] = useState({}) // { messageId: [userId, ...] }
  const chatEndRef = useRef(null)

  const fetchChatMessages = async () => {
    if (!session?.user?.id) return
    setChatLoading(true)

    let query = supabase
      .from('chat_messages')
      .select('id, user_id, recipient_id, message, created_at, deleted_at')
      .order('created_at', { ascending: true })
      .limit(200)

    if (directChatUserId) {
      // Direktchat: Nachrichten zwischen mir und dem anderen User
      query = query.or(
        `and(user_id.eq.${session.user.id},recipient_id.eq.${directChatUserId}),and(user_id.eq.${directChatUserId},recipient_id.eq.${session.user.id})`
      )
    } else {
      // Gruppenchat: recipient_id ist NULL
      query = query.is('recipient_id', null)
    }

    const { data, error } = await query

    if (error) {
      setChatError(error.message)
      setChatMessages([])
    } else {
      setChatError('')
      setChatMessages(data || [])

      // Lese-Status für diese Nachrichten abrufen
      if (data && data.length > 0) {
        const messageIds = data.map((m) => m.id)
        const { data: reads } = await supabase
          .from('chat_message_reads')
          .select('message_id, user_id')
          .in('message_id', messageIds)

        if (reads) {
          const readsMap = {}
          reads.forEach((r) => {
            if (!readsMap[r.message_id]) readsMap[r.message_id] = []
            readsMap[r.message_id].push(r.user_id)
          })
          setMessageReads(readsMap)
        }
      }
    }
    setChatLoading(false)
  }

  // Nachrichten als gelesen markieren
  const markMessagesAsRead = useCallback(async (messages) => {
    if (!session?.user?.id || !messages?.length) return

    // Nur Nachrichten von anderen markieren, die noch nicht gelesen sind
    const unreadFromOthers = messages.filter(
      (m) => m.user_id !== session.user.id && !messageReads[m.id]?.includes(session.user.id)
    )

    if (unreadFromOthers.length === 0) return

    const inserts = unreadFromOthers.map((m) => ({
      message_id: m.id,
      user_id: session.user.id,
    }))

    const { error } = await supabase
      .from('chat_message_reads')
      .upsert(inserts, { onConflict: 'message_id,user_id' })

    if (!error) {
      // Lokalen State aktualisieren
      setMessageReads((prev) => {
        const updated = { ...prev }
        unreadFromOthers.forEach((m) => {
          if (!updated[m.id]) updated[m.id] = []
          if (!updated[m.id].includes(session.user.id)) {
            updated[m.id] = [...updated[m.id], session.user.id]
          }
        })
        return updated
      })
    }
  }, [session?.user?.id, messageReads])

  const sendChatMessage = async (event) => {
    event.preventDefault()
    if (!chatInput.trim() || !session?.user?.id) return
    setChatSending(true)
    setChatError('')

    const messageData = {
      user_id: session.user.id,
      message: chatInput.trim(),
    }

    // Bei Direktchat: recipient_id setzen
    if (directChatUserId) {
      messageData.recipient_id = directChatUserId
    }

    const { error } = await supabase.from('chat_messages').insert(messageData)

    if (error) {
      setChatError(error.message)
    } else {
      setChatInput('')
    }
    setChatSending(false)
  }

  // Nachricht löschen (soft delete)
  const deleteChatMessage = async (messageId) => {
    if (!session?.user?.id) return false

    const { error } = await supabase
      .from('chat_messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('user_id', session.user.id) // Nur eigene Nachrichten

    if (error) {
      setChatError(error.message)
      return false
    }

    // Lokal als gelöscht markieren
    setChatMessages((prev) => prev.map((m) =>
      m.id === messageId ? { ...m, deleted_at: new Date().toISOString() } : m
    ))
    return true
  }

  // Real-time subscription for chat messages
  useEffect(() => {
    if (!session || activeView !== 'chat') return
    fetchChatMessages()

    const channel = supabase
      .channel(`chat_messages_${directChatUserId || 'group'}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const newMsg = payload.new

        // Prüfen ob die Nachricht zum aktuellen Chat gehört
        const isGroupChat = !directChatUserId
        const isForGroupChat = newMsg.recipient_id === null
        const isForThisDirectChat = directChatUserId && (
          (newMsg.user_id === session.user.id && newMsg.recipient_id === directChatUserId) ||
          (newMsg.user_id === directChatUserId && newMsg.recipient_id === session.user.id)
        )

        if ((isGroupChat && isForGroupChat) || isForThisDirectChat) {
          setChatMessages((prev) => {
            if (prev.some((message) => message.id === newMsg.id)) {
              return prev
            }
            return [...prev, newMsg]
          })
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_message_reads' }, (payload) => {
        // Lese-Status Update
        const read = payload.new
        setMessageReads((prev) => {
          const updated = { ...prev }
          if (!updated[read.message_id]) updated[read.message_id] = []
          if (!updated[read.message_id].includes(read.user_id)) {
            updated[read.message_id] = [...updated[read.message_id], read.user_id]
          }
          return updated
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, (payload) => {
        // Nachricht wurde aktualisiert (z.B. soft delete)
        const updatedMsg = payload.new
        setChatMessages((prev) => prev.map((m) =>
          m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m
        ))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeView, session, directChatUserId])

  // Nachrichten als gelesen markieren wenn Chat geöffnet wird
  useEffect(() => {
    if (activeView === 'chat' && chatMessages.length > 0 && !chatLoading) {
      markMessagesAsRead(chatMessages)
    }
  }, [activeView, chatMessages, chatLoading, markMessagesAsRead])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeView === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeView, chatMessages])

  return {
    chatMessages,
    chatLoading,
    chatError,
    chatInput,
    chatSending,
    chatEndRef,
    messageReads,
    setChatInput,
    fetchChatMessages,
    sendChatMessage,
    deleteChatMessage,
    markMessagesAsRead,
  }
}

// Separater Hook für Ungelesen-Counts (für Sidebar Badges)
export function useChatUnreadCounts({ session, staff }) {
  const [unreadCounts, setUnreadCounts] = useState({ group: 0 })

  const fetchUnreadCounts = useCallback(async () => {
    if (!session?.user?.id) return

    // Alle Nachrichten holen die nicht von mir sind
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('id, user_id, recipient_id')
      .neq('user_id', session.user.id)

    if (error || !messages) return

    // Alle meine Lese-Einträge holen
    const { data: myReads } = await supabase
      .from('chat_message_reads')
      .select('message_id')
      .eq('user_id', session.user.id)

    const readMessageIds = new Set((myReads || []).map((r) => r.message_id))

    // Ungelesene Nachrichten zählen
    const counts = { group: 0 }

    messages.forEach((m) => {
      if (readMessageIds.has(m.id)) return // Bereits gelesen

      if (m.recipient_id === null) {
        // Gruppenchat
        counts.group++
      } else if (m.recipient_id === session.user.id) {
        // Direktchat an mich
        if (!counts[m.user_id]) counts[m.user_id] = 0
        counts[m.user_id]++
      }
    })

    setUnreadCounts(counts)
  }, [session?.user?.id])

  useEffect(() => {
    if (!session?.user?.id) return
    fetchUnreadCounts()

    // Real-time subscription für neue Nachrichten und Lese-Status
    const channel = supabase
      .channel('chat_unread_counts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
        fetchUnreadCounts()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_message_reads' }, () => {
        fetchUnreadCounts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user?.id, fetchUnreadCounts])

  return { unreadCounts, fetchUnreadCounts }
}
