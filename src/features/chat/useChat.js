import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export function useChat({ session, activeView }) {
  const [chatMessages, setChatMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const chatEndRef = useRef(null)

  const fetchChatMessages = async () => {
    setChatLoading(true)
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, user_id, message, created_at')
      .order('created_at', { ascending: true })
      .limit(200)

    if (error) {
      setChatError(error.message)
      setChatMessages([])
    } else {
      setChatError('')
      setChatMessages(data || [])
    }
    setChatLoading(false)
  }

  const sendChatMessage = async (event) => {
    event.preventDefault()
    if (!chatInput.trim() || !session?.user?.id) return
    setChatSending(true)
    setChatError('')
    const { error } = await supabase
      .from('chat_messages')
      .insert({ user_id: session.user.id, message: chatInput.trim() })

    if (error) {
      setChatError(error.message)
    } else {
      setChatInput('')
    }
    setChatSending(false)
  }

  // Real-time subscription for chat messages
  useEffect(() => {
    if (!session || activeView !== 'chat') return
    fetchChatMessages()
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setChatMessages((prev) => {
          if (prev.some((message) => message.id === payload.new.id)) {
            return prev
          }
          return [...prev, payload.new]
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeView, session])

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
    setChatInput,
    fetchChatMessages,
    sendChatMessage,
  }
}
