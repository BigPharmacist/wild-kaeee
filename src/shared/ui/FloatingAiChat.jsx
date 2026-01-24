import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { X, PaperPlaneTilt, CircleNotch, Robot, User, Globe } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import remarkGfm from 'remark-gfm'

const ReactMarkdown = lazy(() => import('react-markdown'))

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

// Mistral Agents API Endpoints
const MISTRAL_AGENTS_URL = 'https://api.mistral.ai/v1/agents'
const MISTRAL_CONVERSATIONS_URL = 'https://api.mistral.ai/v1/conversations'

const DEFAULT_SYSTEM_PROMPT = `Du bist ein hilfreicher KI-Assistent für eine deutsche Apotheken-Management-App namens "Kaeee".
Du antwortest auf Deutsch, freundlich und prägnant.
Du kannst bei allgemeinen Fragen helfen, Texte formulieren, Ideen geben und Probleme analysieren.
Du hast Zugang zum Internet und kannst aktuelle Informationen suchen.
Halte deine Antworten kurz und praktisch, außer der Nutzer bittet um ausführlichere Erklärungen.`

// Größen-Limits
const MIN_WIDTH = 320
const MAX_WIDTH = 700
const MIN_HEIGHT = 400
const MAX_HEIGHT = 800
const DEFAULT_WIDTH = 380
const DEFAULT_HEIGHT = 520

export default function FloatingAiChat({ theme }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiKey, setApiKey] = useState(null)
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
  const [apiKeyLoading, setApiKeyLoading] = useState(true)

  // Agent State
  const [agentId, setAgentId] = useState(null)
  const [agentCreating, setAgentCreating] = useState(false)

  // Resize State
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Agent in DB speichern
  const saveAgentId = async (id) => {
    try {
      await supabase
        .from('ai_settings')
        .update({ mistral_agent_id: id })
        .not('id', 'is', null)
      console.log('Agent-ID in DB gespeichert:', id)
    } catch (err) {
      console.error('Fehler beim Speichern der Agent-ID:', err)
    }
  }

  // Neuen Agent erstellen
  const createNewAgent = async (key, prompt) => {
    const response = await fetch(MISTRAL_AGENTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        name: 'Kaeee-Assistent',
        description: 'KI-Assistent für die Kaeee Apotheken-App mit Web-Suche',
        instructions: prompt,
        tools: [{ type: 'web_search' }],
        completion_args: {
          temperature: 0.7,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || errorData.error?.message || `Agent-Erstellung fehlgeschlagen: ${response.status}`)
    }

    const data = await response.json()
    return data.id
  }

  // Prüfen ob Agent noch existiert
  const validateAgent = async (key, id) => {
    try {
      const response = await fetch(`${MISTRAL_AGENTS_URL}/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`,
        },
      })
      return response.ok
    } catch {
      return false
    }
  }

  // Einstellungen und Agent laden/erstellen
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // API Key laden
        const { data: keyData, error: keyError } = await supabase
          .from('api_keys')
          .select('key')
          .eq('name', 'Mistral')
          .single()

        if (keyError) throw keyError
        const key = keyData?.key
        if (!key) {
          setApiKey(null)
          setApiKeyLoading(false)
          return
        }
        setApiKey(key)

        // Settings laden (inkl. Agent ID)
        const { data: settingsData } = await supabase
          .from('ai_settings')
          .select('chat_system_prompt, mistral_agent_id')
          .single()

        const prompt = settingsData?.chat_system_prompt || DEFAULT_SYSTEM_PROMPT
        setSystemPrompt(prompt)

        const savedAgentId = settingsData?.mistral_agent_id

        // Wenn Agent ID vorhanden, validieren
        if (savedAgentId) {
          setAgentCreating(true)
          const isValid = await validateAgent(key, savedAgentId)
          if (isValid) {
            setAgentId(savedAgentId)
            console.log('Existierenden Agent geladen:', savedAgentId)
            setAgentCreating(false)
            setApiKeyLoading(false)
            return
          }
          console.log('Gespeicherter Agent ungültig, erstelle neuen...')
        }

        // Neuen Agent erstellen
        setAgentCreating(true)
        const newAgentId = await createNewAgent(key, prompt)
        setAgentId(newAgentId)
        await saveAgentId(newAgentId)
        console.log('Neuer Agent erstellt und gespeichert:', newAgentId)

      } catch (err) {
        console.error('Fehler beim Initialisieren des Chats:', err)
        setError('Chat konnte nicht initialisiert werden: ' + err.message)
        setApiKey(null)
      } finally {
        setAgentCreating(false)
        setApiKeyLoading(false)
      }
    }

    initializeChat()
  }, [])

  // Auto-scroll zu neuen Nachrichten
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  // Antwort aus Conversations API parsen
  const parseConversationResponse = (data) => {
    let textContent = ''
    let sources = []

    // Durch alle Outputs iterieren
    const outputs = data.outputs || []
    for (const output of outputs) {
      if (output.type === 'message.output' && output.content) {
        // Content kann ein Array von Teilen sein
        for (const part of output.content) {
          if (part.type === 'text') {
            textContent += part.text || ''
          } else if (part.type === 'tool_reference') {
            // Web-Search Quellen
            if (part.url) {
              sources.push({
                title: part.title || part.url,
                url: part.url,
              })
            }
          }
        }
      }
    }

    return { text: textContent.trim(), sources }
  }

  const sendMessage = async (e) => {
    e?.preventDefault()
    if (!input.trim() || isLoading || !apiKey || !agentId) return

    const userMessage = input.trim()
    setInput('')
    setError('')

    // User-Nachricht hinzufügen
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // Conversations API aufrufen
      const response = await fetch(MISTRAL_CONVERSATIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          agent_id: agentId,
          inputs: [
            {
              role: 'user',
              content: userMessage,
            },
          ],
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error?.message || `API-Fehler: ${response.status}`)
      }

      const data = await response.json()
      const { text, sources } = parseConversationResponse(data)

      if (text) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: text,
          sources: sources.length > 0 ? sources : null,
        }])
      }
    } catch (err) {
      console.error('Mistral API Fehler:', err)
      setError(err.message || 'Fehler bei der Anfrage')
      // User-Nachricht bei Fehler wieder entfernen
      setMessages(prev => prev.slice(0, -1))
      setInput(userMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setError('')
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

  const isReady = apiKey && agentId && !agentCreating

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
            <Globe size={14} className="text-white/70" title="Web-Suche aktiv" />
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
        {apiKeyLoading || agentCreating ? (
          <div className="flex flex-col items-center justify-center h-full">
            <CircleNotch size={24} className="animate-spin text-violet-500" />
            <p className="text-[#64748B] text-xs mt-2">
              {agentCreating ? 'Agent wird erstellt...' : 'Lädt...'}
            </p>
          </div>
        ) : !apiKey ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Robot size={48} className="text-[#94A3B8] mb-3" />
            <p className="text-[#64748B] text-sm">
              Kein Mistral API-Key konfiguriert.
            </p>
            <p className="text-[#94A3B8] text-xs mt-1">
              Bitte in der Datenbank hinterlegen.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <KaeeeIcon size={48} className="mb-3" />
            <p className="text-[#1E293B] font-medium">Hallo!</p>
            <p className="text-[#64748B] text-sm mt-1">
              Wie kann ich dir helfen?
            </p>
            <div className="flex items-center gap-1 mt-2 text-xs text-violet-500">
              <Globe size={12} />
              <span>Mit Web-Suche</span>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
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
                      ? 'bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#1E293B]'
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
                {/* Quellen anzeigen */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {msg.sources.slice(0, 3).map((source, sIdx) => (
                      <a
                        key={sIdx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-0.5 text-xs bg-violet-50 text-violet-600 rounded-full hover:bg-violet-100 transition-colors"
                        title={source.url}
                      >
                        <Globe size={10} />
                        <span className="truncate max-w-[100px]">{source.title}</span>
                      </a>
                    ))}
                    {msg.sources.length > 3 && (
                      <span className="px-2 py-0.5 text-xs text-violet-400">
                        +{msg.sources.length - 3} weitere
                      </span>
                    )}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-[#F59E0B] flex items-center justify-center flex-shrink-0">
                  <User size={14} weight="bold" className="text-white" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-bl from-violet-400 via-purple-600 to-purple-900 flex items-center justify-center flex-shrink-0">
              <KaeeeIcon size={16} white />
            </div>
            <div className="bg-white border border-[#CBD5E1] px-3 py-2 rounded-2xl flex items-center gap-2">
              <CircleNotch size={18} className="animate-spin text-violet-500" />
              <span className="text-xs text-[#64748B]">Sucht im Web...</span>
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
            placeholder={isReady ? "Nachricht eingeben..." : "Wird initialisiert..."}
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
