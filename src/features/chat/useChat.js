import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase, supabaseUrl } from '../../lib/supabase'

const PAGE_SIZE = 50
const EDIT_TIME_LIMIT_MS = 5 * 60 * 1000 // 5 Minuten
const EMOJI_SET = ['👍', '❤️', '😂', '😮', '😢']
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf']
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
      : `${senderName}: ${message.message?.substring(0, 100) || ''}`

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

export function useChat({ session, activeView, directChatUserId }) {
  const [chatMessages, setChatMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatLoadingMore, setChatLoadingMore] = useState(false)
  const [chatError, setChatError] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [messageReads, setMessageReads] = useState({}) // { messageId: [userId, ...] }
  const [messageReactions, setMessageReactions] = useState({}) // { messageId: [{ user_id, emoji }, ...] }
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [pendingFile, setPendingFile] = useState(null) // Ausgewählte Datei zum Senden
  const chatEndRef = useRef(null)

  const fetchChatMessages = useCallback(async () => {
    if (!session?.user?.id) return
    setChatLoading(true)

    // Neueste Nachrichten zuerst laden (descending), dann umdrehen
    let query = supabase
      .from('chat_messages')
      .select('id, user_id, recipient_id, message, created_at, deleted_at, edited_at, file_url, file_name, file_type')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1) // +1 um zu prüfen ob es mehr gibt

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
      setHasMoreMessages(false)
    } else {
      setChatError('')
      // Prüfen ob es mehr Nachrichten gibt
      const hasMore = data && data.length > PAGE_SIZE
      setHasMoreMessages(hasMore)
      // Nur PAGE_SIZE Nachrichten behalten und chronologisch sortieren
      const messages = (hasMore ? data.slice(0, PAGE_SIZE) : data || []).reverse()
      setChatMessages(messages)

      // Lese-Status und Reaktionen für diese Nachrichten abrufen
      if (messages.length > 0) {
        const messageIds = messages.map((m) => m.id)

        // Lese-Status laden
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

        // Reaktionen laden
        const { data: reactions } = await supabase
          .from('chat_message_reactions')
          .select('message_id, user_id, emoji')
          .in('message_id', messageIds)

        if (reactions) {
          const reactionsMap = {}
          reactions.forEach((r) => {
            if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = []
            reactionsMap[r.message_id].push({ user_id: r.user_id, emoji: r.emoji })
          })
          setMessageReactions(reactionsMap)
        }
      }
    }
    setChatLoading(false)
  }, [session, directChatUserId])

  const loadMoreMessages = async () => {
    if (!session?.user?.id || !hasMoreMessages || chatLoadingMore) return
    if (chatMessages.length === 0) return

    setChatLoadingMore(true)

    // Älteste aktuell geladene Nachricht als Cursor
    const oldestMessage = chatMessages[0]

    let query = supabase
      .from('chat_messages')
      .select('id, user_id, recipient_id, message, created_at, deleted_at, edited_at, file_url, file_name, file_type')
      .lt('created_at', oldestMessage.created_at)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1)

    if (directChatUserId) {
      query = query.or(
        `and(user_id.eq.${session.user.id},recipient_id.eq.${directChatUserId}),and(user_id.eq.${directChatUserId},recipient_id.eq.${session.user.id})`
      )
    } else {
      query = query.is('recipient_id', null)
    }

    const { data, error } = await query

    if (error) {
      setChatError(error.message)
    } else if (data) {
      const hasMore = data.length > PAGE_SIZE
      setHasMoreMessages(hasMore)
      const olderMessages = (hasMore ? data.slice(0, PAGE_SIZE) : data).reverse()

      // Ältere Nachrichten vorne anhängen
      setChatMessages((prev) => [...olderMessages, ...prev])

      // Lese-Status und Reaktionen für die neuen Nachrichten abrufen
      if (olderMessages.length > 0) {
        const messageIds = olderMessages.map((m) => m.id)

        // Lese-Status laden
        const { data: reads } = await supabase
          .from('chat_message_reads')
          .select('message_id, user_id')
          .in('message_id', messageIds)

        if (reads) {
          setMessageReads((prev) => {
            const updated = { ...prev }
            reads.forEach((r) => {
              if (!updated[r.message_id]) updated[r.message_id] = []
              updated[r.message_id].push(r.user_id)
            })
            return updated
          })
        }

        // Reaktionen laden
        const { data: reactions } = await supabase
          .from('chat_message_reactions')
          .select('message_id, user_id, emoji')
          .in('message_id', messageIds)

        if (reactions) {
          setMessageReactions((prev) => {
            const updated = { ...prev }
            reactions.forEach((r) => {
              if (!updated[r.message_id]) updated[r.message_id] = []
              updated[r.message_id].push({ user_id: r.user_id, emoji: r.emoji })
            })
            return updated
          })
        }
      }
    }
    setChatLoadingMore(false)
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
  }, [session, messageReads])

  // Reaktionen für Nachrichten laden
  const fetchReactionsForMessages = useCallback(async (messageIds) => {
    if (!messageIds?.length) return

    const { data: reactions } = await supabase
      .from('chat_message_reactions')
      .select('message_id, user_id, emoji')
      .in('message_id', messageIds)

    if (reactions) {
      const reactionsMap = {}
      reactions.forEach((r) => {
        if (!reactionsMap[r.message_id]) reactionsMap[r.message_id] = []
        reactionsMap[r.message_id].push({ user_id: r.user_id, emoji: r.emoji })
      })
      setMessageReactions((prev) => ({ ...prev, ...reactionsMap }))
    }
  }, [])

  // Reaktion hinzufügen oder entfernen (Toggle)
  const toggleReaction = async (messageId, emoji) => {
    if (!session?.user?.id || !messageId || !emoji) return

    const existingReactions = messageReactions[messageId] || []
    const hasReacted = existingReactions.some(
      (r) => r.user_id === session.user.id && r.emoji === emoji
    )

    if (hasReacted) {
      // Reaktion entfernen
      const { error } = await supabase
        .from('chat_message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', session.user.id)
        .eq('emoji', emoji)

      if (!error) {
        setMessageReactions((prev) => ({
          ...prev,
          [messageId]: (prev[messageId] || []).filter(
            (r) => !(r.user_id === session.user.id && r.emoji === emoji)
          ),
        }))
      }
    } else {
      // Reaktion hinzufügen
      const { error } = await supabase
        .from('chat_message_reactions')
        .insert({ message_id: messageId, user_id: session.user.id, emoji })

      if (!error) {
        setMessageReactions((prev) => ({
          ...prev,
          [messageId]: [...(prev[messageId] || []), { user_id: session.user.id, emoji }],
        }))
      }
    }
  }

  // Bildkomprimierung für Chat-Uploads
  const compressChatImage = (file, maxWidth = 1200, quality = 0.8) => {
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

  // Datei für Chat-Anhang auswählen
  const selectChatFile = async (file) => {
    if (!file) {
      setPendingFile(null)
      return
    }

    // Dateityp prüfen
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setChatError('Nur Bilder (JPG, PNG, GIF, WebP) und PDFs sind erlaubt.')
      return
    }

    // Dateigröße prüfen
    if (file.size > MAX_FILE_SIZE) {
      setChatError('Die Datei ist zu groß. Maximale Größe: 25MB.')
      return
    }

    setChatError('')
    setPendingFile(file)
  }

  // Datei zu Supabase Storage hochladen
  const uploadChatAttachment = async (file) => {
    if (!file || !session?.user?.id) return null

    let fileToUpload = file

    // Bilder komprimieren
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      fileToUpload = await compressChatImage(file)
    }

    const chatType = directChatUserId ? 'direct' : 'group'
    const fileExt = file.name.split('.').pop()
    const filePath = `${chatType}/${Date.now()}-${session.user.id}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, fileToUpload, { upsert: false })

    if (uploadError) {
      setChatError(`Upload fehlgeschlagen: ${uploadError.message}`)
      return null
    }

    // Public URL generieren
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/chat-attachments/${filePath}`
    return {
      file_url: publicUrl,
      file_name: file.name,
      file_type: file.type,
    }
  }

  const sendChatMessage = async (event) => {
    event.preventDefault()
    // Nachricht oder Datei erforderlich
    if (!chatInput.trim() && !pendingFile) return
    if (!session?.user?.id) return

    setChatSending(true)
    setChatError('')

    const messageData = {
      user_id: session.user.id,
      message: chatInput.trim() || '',
    }

    // Bei Direktchat: recipient_id setzen
    if (directChatUserId) {
      messageData.recipient_id = directChatUserId
    }

    // Datei hochladen falls vorhanden
    if (pendingFile) {
      const fileData = await uploadChatAttachment(pendingFile)
      if (!fileData) {
        setChatSending(false)
        return
      }
      messageData.file_url = fileData.file_url
      messageData.file_name = fileData.file_name
      messageData.file_type = fileData.file_type
    }

    const { error } = await supabase.from('chat_messages').insert(messageData)

    if (error) {
      setChatError(error.message)
    } else {
      setChatInput('')
      setPendingFile(null)
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

  // Nachricht bearbeiten (nur innerhalb von 5 Minuten)
  const editChatMessage = async (messageId, newText) => {
    if (!session?.user?.id || !newText.trim()) return false

    const message = chatMessages.find((m) => m.id === messageId)
    if (!message || message.user_id !== session.user.id) return false

    // Zeitprüfung: max 5 Minuten nach Erstellung
    const createdAt = new Date(message.created_at).getTime()
    const now = Date.now()
    if (now - createdAt > EDIT_TIME_LIMIT_MS) {
      setChatError('Nachrichten können nur innerhalb von 5 Minuten bearbeitet werden.')
      return false
    }

    const { error } = await supabase
      .from('chat_messages')
      .update({ message: newText.trim(), edited_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('user_id', session.user.id)

    if (error) {
      setChatError(error.message)
      return false
    }

    // Lokal aktualisieren
    setChatMessages((prev) => prev.map((m) =>
      m.id === messageId ? { ...m, message: newText.trim(), edited_at: new Date().toISOString() } : m
    ))
    setEditingMessageId(null)
    return true
  }

  // Prüfen ob Nachricht noch bearbeitbar ist
  const canEditMessage = (message) => {
    if (!message || message.user_id !== session?.user?.id || message.deleted_at) return false
    const createdAt = new Date(message.created_at).getTime()
    return Date.now() - createdAt <= EDIT_TIME_LIMIT_MS
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_message_reactions' }, (payload) => {
        // Neue Reaktion hinzugefügt
        const reaction = payload.new
        setMessageReactions((prev) => {
          const existing = prev[reaction.message_id] || []
          // Duplikate vermeiden
          if (existing.some((r) => r.user_id === reaction.user_id && r.emoji === reaction.emoji)) {
            return prev
          }
          return {
            ...prev,
            [reaction.message_id]: [...existing, { user_id: reaction.user_id, emoji: reaction.emoji }],
          }
        })
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_message_reactions' }, (payload) => {
        // Reaktion entfernt
        const reaction = payload.old
        setMessageReactions((prev) => ({
          ...prev,
          [reaction.message_id]: (prev[reaction.message_id] || []).filter(
            (r) => !(r.user_id === reaction.user_id && r.emoji === reaction.emoji)
          ),
        }))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeView, session, directChatUserId, fetchChatMessages])

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
  }
}

// Separater Hook für Ungelesen-Counts (für Sidebar Badges)
export function useChatUnreadCounts({ session, staff }) {
  const [unreadCounts, setUnreadCounts] = useState({ group: 0 })

  // Staff nach auth_user_id indexieren für schnellen Zugriff
  const staffByAuthId = staff?.reduce((acc, s) => {
    if (s.auth_user_id) acc[s.auth_user_id] = s
    return acc
  }, {}) || {}

  const fetchUnreadCounts = useCallback(async () => {
    if (!session?.user?.id) return

    // RPC-Funktion aufrufen - zählt effizient in der Datenbank
    const { data, error } = await supabase
      .rpc('get_chat_unread_counts', { p_user_id: session.user.id })

    if (error) {
      console.error('Fehler beim Laden der Unread-Counts:', error)
      return
    }

    // Ergebnis in das erwartete Format umwandeln
    const counts = { group: 0 }

    data?.forEach((row) => {
      if (row.chat_type === 'group') {
        counts.group = Number(row.unread_count)
      } else if (row.chat_type === 'direct' && row.chat_id) {
        counts[row.chat_id] = Number(row.unread_count)
      }
    })

    setUnreadCounts(counts)
  }, [session])

  useEffect(() => {
    if (!session?.user?.id) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUnreadCounts()

    // Real-time subscription für neue Nachrichten und Lese-Status
    const channel = supabase
      .channel('chat_unread_counts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const newMsg = payload.new

        // Nur Benachrichtigung anzeigen wenn Nachricht von jemand anderem
        if (newMsg.user_id !== session.user.id) {
          const senderName = staffByAuthId[newMsg.user_id]?.first_name || 'Unbekannt'
          const chatType = newMsg.recipient_id ? 'direct' : 'group'
          const chatId = chatType === 'group' ? null : newMsg.user_id

          // Browser-Benachrichtigung und Sound
          showChatNotification(newMsg, senderName, chatType, chatId)
          playChatNotificationSound()
        }

        fetchUnreadCounts()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_message_reads' }, () => {
        fetchUnreadCounts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user?.id, fetchUnreadCounts, staffByAuthId])

  return { unreadCounts, fetchUnreadCounts }
}
