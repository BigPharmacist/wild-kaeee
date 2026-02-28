import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { X, PaperPlaneTilt, CircleNotch, Robot, User } from '@phosphor-icons/react'
import { openclaw } from '../../lib/openclaw'
import remarkGfm from 'remark-gfm'
import { lazyWithRetry } from '../../lib/lazyWithRetry'

const ReactMarkdown = lazyWithRetry(() => import('react-markdown'))

// Kaeee-Icon Komponente (weiß oder farbig)
const KaeeeIcon = ({ size = 20, white = false, className = '' }) => (
  <img
    src="/favicon.png"
    alt="Kaeee"
    className={className}
    style={{
      width: size,
      height: size,
      filter: white ? 'brightness(0) invert(1)' : 'none',
    }}
  />
)

// Größen-Limits
const MIN_WIDTH = 320
const MAX_WIDTH = 700
const MIN_HEIGHT = 400
const MAX_HEIGHT = 800
const DEFAULT_WIDTH = 380
const DEFAULT_HEIGHT = 520

export default function FloatingAiChat({ theme, currentStaff, staff = [] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(true)
  const [streamingText, setStreamingText] = useState(null)
  const [streamRunId, setStreamRunId] = useState(null)

  // Resize State
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const clientStartedRef = useRef(false)
  const contextSentRef = useRef(false)

  // OpenClaw-Client starten und Callbacks binden
  useEffect(() => {
    if (!currentStaff) {
      console.warn('[openclaw] waiting for currentStaff...')
      return
    }

    console.warn('[openclaw] configure for staff:', currentStaff.id, currentStaff.first_name, currentStaff.last_name)

    // Bei User-Wechsel: alten Client stoppen
    if (clientStartedRef.current) {
      openclaw.stop()
      clientStartedRef.current = false
    }

    openclaw.configure({
      staffId: currentStaff.id,
      displayName: `${currentStaff.first_name} ${currentStaff.last_name}`.trim(),
    })

    console.warn('[openclaw] sessionKey:', openclaw.sessionKey)

    openclaw.onConnected = () => {
      setConnected(true)
      setConnecting(false)
      setError('')
      // History laden
      openclaw.getHistory(100).then((hist) => {
        if (hist.length > 0) {
          const mapped = hist.map(m => ({
            role: m.role || 'assistant',
            content: extractTextFromContent(m.content),
          })).filter(m => m.content)
          setMessages(mapped)
          contextSentRef.current = true
        } else {
          contextSentRef.current = false
        }
      }).catch(() => {})
    }

    openclaw.onDisconnected = () => {
      setConnected(false)
      setConnecting(true)
    }

    openclaw.onChatDelta = (text) => {
      setStreamingText(text)
    }

    openclaw.onChatFinal = (message) => {
      setStreamingText(null)
      setStreamRunId(null)
      setIsLoading(false)
      if (message?.content) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: message.content,
        }])
      }
    }

    openclaw.onChatError = (errMsg) => {
      setStreamingText(null)
      setStreamRunId(null)
      setIsLoading(false)
      setError(errMsg)
    }

    clientStartedRef.current = true
    openclaw.start()

    return () => {
      openclaw.stop()
      clientStartedRef.current = false
    }
  }, [currentStaff?.id])

  // Auto-scroll zu neuen Nachrichten
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Focus auf Input wenn geöffnet
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Resize-Handler
  const handleResizeStart = (e) => {
    e.preventDefault()
    setIsResizing(true)
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    }
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e) => {
      const deltaX = resizeStartRef.current.x - e.clientX
      const deltaY = resizeStartRef.current.y - e.clientY

      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeStartRef.current.width + deltaX))
      const newHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, resizeStartRef.current.height + deltaY))

      setSize({ width: newWidth, height: newHeight })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const sendMessage = useCallback(async (e) => {
    e?.preventDefault()
    if (!input.trim() || isLoading || !connected) return

    const userMessage = input.trim()
    setInput('')
    setError('')

    // User-Nachricht hinzufügen
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)
    setStreamingText(null)

    try {
      let messageToSend = userMessage
      if (!contextSentRef.current && currentStaff) {
        const prefix = `[${currentStaff.first_name} ${currentStaff.last_name}, Rolle: ${currentStaff.role || 'Mitarbeiter'}, Admin: ${currentStaff.is_admin ? 'ja' : 'nein'}, Staff-ID: ${currentStaff.id}]`
        messageToSend = `${prefix}\n\n${userMessage}`
        contextSentRef.current = true
      }
      await openclaw.sendMessage(messageToSend)
    } catch (err) {
      console.error('[openclaw] send error:', err)
      setError(err.message || 'Fehler beim Senden')
      setIsLoading(false)
      // User-Nachricht bei Fehler wieder entfernen
      setMessages(prev => prev.slice(0, -1))
      setInput(userMessage)
    }
  }, [input, isLoading, connected, currentStaff])

  const clearChat = () => {
    setMessages([])
    setError('')
    setStreamingText(null)
  }

  // Geschlossener Zustand: Nur Button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-bl from-violet-400 via-purple-600 to-purple-900 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
        title="KI-Assistent öffnen"
      >
        <img
          src="/favicon.png"
          alt="Kaeee"
          className="w-8 h-8"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </button>
    )
  }

  const isReady = connected && !connecting

  // Offener Zustand: Chat-Fenster
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl border border-[#CBD5E1] bg-white overflow-hidden"
      style={{ width: size.width, height: size.height }}
    >
      {/* Resize Handle (oben-links) */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize z-10 group"
        title="Größe ändern"
      >
        <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-purple-400 group-hover:border-purple-600 transition-colors" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-violet-400 via-purple-600 to-purple-900 text-white">
        <div className="flex items-center gap-2">
          <KaeeeIcon size={22} white />
          <span className="font-semibold">Kaeee-Assistent</span>
          {isReady && (
            <span className="text-[10px] text-white/60 font-normal">OpenClaw</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-xs"
              title="Chat leeren"
            >
              Leeren
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            title="Schließen"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
        {connecting ? (
          <div className="flex flex-col items-center justify-center h-full">
            <CircleNotch size={24} className="animate-spin text-violet-500" />
            <p className="text-[#64748B] text-xs mt-2">
              Verbinde mit OpenClaw...
            </p>
          </div>
        ) : !connected ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Robot size={48} className="text-[#94A3B8] mb-3" />
            <p className="text-[#64748B] text-sm">
              OpenClaw nicht erreichbar.
            </p>
            <p className="text-[#94A3B8] text-xs mt-1">
              Verbindung wird automatisch wiederhergestellt.
            </p>
          </div>
        ) : messages.length === 0 && !streamingText ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <KaeeeIcon size={48} className="mb-3" />
            <p className="text-[#1E293B] font-medium">Hallo!</p>
            <p className="text-[#64748B] text-sm mt-1">
              Wie kann ich dir helfen?
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-bl from-violet-400 via-purple-600 to-purple-900 flex items-center justify-center flex-shrink-0">
                    <KaeeeIcon size={16} white />
                  </div>
                )}
                <div className="max-w-[80%] flex flex-col">
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#DC2626]/15 border border-[#DC2626]/30 text-[#1E293B]'
                        : 'bg-white border border-[#CBD5E1] text-[#1E293B]'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <Suspense fallback={<p className="whitespace-pre-wrap">{msg.content}</p>}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-sm font-bold mb-1.5">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
                            li: ({ children }) => <li className="text-sm">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            code: ({ children }) => <code className="bg-violet-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                            pre: ({ children }) => <pre className="bg-violet-50 p-2 rounded-lg overflow-x-auto text-xs my-2">{children}</pre>,
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </Suspense>
                    )}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-[#DC2626] flex items-center justify-center flex-shrink-0">
                    <User size={14} weight="bold" className="text-white" />
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Streaming-Anzeige */}
        {streamingText && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-bl from-violet-400 via-purple-600 to-purple-900 flex items-center justify-center flex-shrink-0">
              <KaeeeIcon size={16} white />
            </div>
            <div className="max-w-[80%]">
              <div className="px-3 py-2 rounded-2xl text-sm leading-relaxed bg-white border border-[#CBD5E1] text-[#1E293B]">
                <Suspense fallback={<p className="whitespace-pre-wrap">{streamingText}</p>}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-bold mb-1.5">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>,
                      li: ({ children }) => <li className="text-sm">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      code: ({ children }) => <code className="bg-violet-100 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                      pre: ({ children }) => <pre className="bg-violet-50 p-2 rounded-lg overflow-x-auto text-xs my-2">{children}</pre>,
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {streamingText}
                  </ReactMarkdown>
                </Suspense>
                <span className="inline-block w-1.5 h-4 bg-violet-400 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
              </div>
            </div>
          </div>
        )}

        {/* Loading ohne Streaming-Text */}
        {isLoading && !streamingText && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-bl from-violet-400 via-purple-600 to-purple-900 flex items-center justify-center flex-shrink-0">
              <KaeeeIcon size={16} white />
            </div>
            <div className="bg-white border border-[#CBD5E1] px-3 py-2 rounded-2xl flex items-center gap-2">
              <CircleNotch size={18} className="animate-spin text-violet-500" />
              <span className="text-xs text-[#64748B]">Denkt nach...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-rose-50 border-t border-rose-200">
          <p className="text-rose-600 text-xs">{error}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-[#CBD5E1] bg-white">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isReady ? "Nachricht eingeben..." : "Verbinde..."}
            disabled={!isReady || isLoading}
            className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-[#CBD5E1] bg-white focus:border-violet-400 focus:ring-1 focus:ring-violet-400 outline-none disabled:bg-[#F8FAFC] disabled:cursor-not-allowed placeholder-[#94A3B8]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || !isReady}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-l from-violet-400 via-purple-600 to-purple-900 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            <PaperPlaneTilt size={18} weight="fill" />
          </button>
        </div>
      </form>
    </div>
  )
}

// Hilfsfunktion: Text aus OpenClaw content-Array extrahieren
function extractTextFromContent(content) {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .filter(p => p.type === 'text')
      .map(p => p.text || '')
      .join('')
  }
  return ''
}
