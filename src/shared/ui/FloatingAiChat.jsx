import { useState, useRef, useEffect, Suspense } from 'react'
import { X, PaperPlaneTilt, CircleNotch, Robot, User, Globe } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
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

// Mistral Agents API Endpoints
const MISTRAL_AGENTS_URL = 'https://api.mistral.ai/v1/agents'
const MISTRAL_CONVERSATIONS_URL = 'https://api.mistral.ai/v1/conversations'

const DEFAULT_SYSTEM_PROMPT = `Du bist ein hilfreicher KI-Assistent für eine deutsche Apotheken-Management-App namens "Kaeee".
Du antwortest auf Deutsch, freundlich und prägnant.
Du kannst bei allgemeinen Fragen helfen, Texte formulieren, Ideen geben und Probleme analysieren.
Du hast Zugang zum Internet und kannst aktuelle Informationen suchen.

Du kannst auch Aufgaben verwalten:
- "list_tasks" zeigt offene Aufgaben an (optional mit Filter)
- "create_task" erstellt neue Aufgaben
- "update_task" bearbeitet bestehende Aufgaben

Wenn der Nutzer nach Aufgaben fragt oder welche erstellen möchte, nutze die entsprechenden Tools.

**Wichtig für die Darstellung von Aufgaben:**
- Gruppiere Aufgaben nach Projekten, wenn sie einem Projekt zugeordnet sind
- Präsentiere projektbezogene Aufgaben so: "Für das Projekt **[Projektname]** sind folgende Aufgaben offen: ..."
- Aufgaben ohne Projekt liste separat unter "Allgemeine Aufgaben" oder "Sonstige Aufgaben" auf
- Erwähne bei jeder Aufgabe die Priorität (falls vorhanden) und das Fälligkeitsdatum
- Sortiere nach Priorität (A = höchste) und dann nach Fälligkeit

Halte deine Antworten kurz und praktisch, außer der Nutzer bittet um ausführlichere Erklärungen.`

// Tool-Definitionen für den Mistral Agent
const TASK_TOOLS = [
  { type: 'web_search' },
  {
    type: 'function',
    function: {
      name: 'list_projects',
      description: 'Listet alle verfügbaren Projekte auf. Projekte sind Kategorien für Aufgaben mit eigenem Namen, Beschreibung und Farbe.',
      parameters: {
        type: 'object',
        properties: {
          include_archived: {
            type: 'boolean',
            description: 'Auch archivierte Projekte anzeigen'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_tasks',
      description: 'Listet alle offenen Aufgaben auf. Kann nach Priorität, Projekt oder Fälligkeit gefiltert werden.',
      parameters: {
        type: 'object',
        properties: {
          priority: {
            type: 'string',
            enum: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
            description: 'Filter nach Priorität (A-Z)'
          },
          project_id: {
            type: 'string',
            description: 'Filter nach Projekt-ID (UUID)'
          },
          due_filter: {
            type: 'string',
            enum: ['today', 'week', 'overdue'],
            description: 'Filter nach Fälligkeit'
          },
          include_completed: {
            type: 'boolean',
            description: 'Auch erledigte Tasks anzeigen'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Erstellt eine neue Aufgabe. Kann einem Projekt, Mitarbeitern oder Gruppen zugewiesen werden.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'Aufgabenbeschreibung (Pflicht)' },
          priority: {
            type: 'string',
            enum: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
            description: 'Priorität A-Z (A=höchste)'
          },
          due_date: { type: 'string', description: 'Fälligkeitsdatum im Format YYYY-MM-DD' },
          recurrence: { type: 'string', description: 'Wiederholung: 1d, 2w, 1m (Tage/Wochen/Monate)' },
          project_id: { type: 'string', description: 'Projekt-ID (UUID) - nutze list_projects um verfügbare Projekte zu sehen' },
          project_name: { type: 'string', description: 'Projektname für neues Projekt, falls project_id nicht angegeben' },
          assigned_user_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array von Mitarbeiter-IDs für die Zuweisung (aus dem Kontext)'
          },
          assigned_groups: {
            type: 'array',
            items: { type: 'string', enum: ['APO', 'PTA', 'PKA'] },
            description: 'Array von Gruppen: APO, PTA, PKA'
          }
        },
        required: ['text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description: 'Bearbeitet eine bestehende Aufgabe.',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string', description: 'ID der Aufgabe (Pflicht)' },
          text: { type: 'string', description: 'Neuer Aufgabentext' },
          priority: { type: 'string', description: 'Neue Priorität A-Z' },
          due_date: { type: 'string', description: 'Neues Fälligkeitsdatum YYYY-MM-DD' },
          recurrence: { type: 'string', description: 'Neue Wiederholung' },
          project: { type: 'string', description: 'Neuer Projektname' }
        },
        required: ['task_id']
      }
    }
  }
]

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
        description: 'KI-Assistent für die Kaeee Apotheken-App mit Web-Suche und Aufgabenverwaltung',
        instructions: prompt,
        tools: TASK_TOOLS,
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

  // Tool-Call Handler für Task-Funktionen
  const handleToolCall = async (toolName, args) => {
    switch (toolName) {
      case 'list_projects': {
        // Projekte aus Supabase laden
        let query = supabase.from('projects').select('*')

        if (!args?.include_archived) {
          query = query.eq('status', 'active')
        }

        const { data, error } = await query.order('name')

        if (error) return { error: error.message }

        const formattedProjects = data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || null,
          color: p.color,
          status: p.status,
          deadline: p.deadline || null
        }))

        return { projects: formattedProjects, count: data.length }
      }

      case 'list_tasks': {
        // Tasks mit Projektinfos aus Supabase laden
        let query = supabase.from('tasks').select('*, projects(id, name, color)')

        if (!args?.include_completed) {
          query = query.eq('completed', false)
        }
        if (args?.priority) {
          query = query.eq('priority', args.priority)
        }
        if (args?.project_id) {
          query = query.eq('project_id', args.project_id)
        }

        // Filter nach Fälligkeit
        if (args?.due_filter) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const todayStr = today.toISOString().substring(0, 10)

          if (args.due_filter === 'today') {
            query = query.eq('due_date', todayStr)
          } else if (args.due_filter === 'overdue') {
            query = query.lt('due_date', todayStr)
          } else if (args.due_filter === 'week') {
            const weekEnd = new Date(today)
            weekEnd.setDate(weekEnd.getDate() + 7)
            query = query.gte('due_date', todayStr).lte('due_date', weekEnd.toISOString().substring(0, 10))
          }
        }

        const { data, error } = await query.order('priority').order('due_date')

        if (error) return { error: error.message }

        // Benutzergruppe aus Rolle ableiten (ApothekerIn → APO, PTA → PTA, PKA → PKA)
        const roleToGroup = {
          'ApothekerIn': 'APO',
          'Apotheker': 'APO',
          'Apothekerin': 'APO',
          'PTA': 'PTA',
          'PKA': 'PKA'
        }
        const userGroup = currentStaff?.role ? roleToGroup[currentStaff.role] : null
        const staffId = currentStaff?.id || null
        const authUserId = currentStaff?.auth_user_id || null

        // Client-seitig filtern: nur Tasks, die dem Benutzer zugewiesen sind
        const filteredTasks = currentStaff?.id ? data.filter(task => {
          // Direkt zugewiesen (Staff-ID oder Auth-User-ID)
          if (staffId && task.assigned_to === staffId) return true
          if (authUserId && task.assigned_to === authUserId) return true
          // Im assigned_users Array (JSONB)
          if (staffId && Array.isArray(task.assigned_users) && task.assigned_users.includes(staffId)) return true
          if (authUserId && Array.isArray(task.assigned_users) && task.assigned_users.includes(authUserId)) return true
          // Gruppe zugewiesen (assigned_to_group Textfeld)
          if (userGroup && task.assigned_to_group === userGroup) return true
          // Im assigned_groups Array (JSONB)
          if (userGroup && Array.isArray(task.assigned_groups) && task.assigned_groups.includes(userGroup)) return true
          return false
        }) : data

        // Tasks formatieren für LLM - mit Projektname aus der Relation
        const formattedTasks = filteredTasks.map(t => ({
          id: t.id,
          text: t.text,
          priority: t.priority || 'keine',
          due_date: t.due_date || 'keine',
          recurrence: t.recurrence || null,
          project_id: t.project_id || null,
          project_name: t.projects?.name || null
        }))

        return { tasks: formattedTasks, count: filteredTasks.length }
      }

      case 'create_task': {
        if (!args?.text) {
          return { error: 'Aufgabentext ist erforderlich' }
        }

        if (!currentStaff?.id) {
          return { error: 'Kein Benutzer angemeldet' }
        }

        // Projekt-ID ermitteln: entweder übergeben oder neues Projekt erstellen
        let projectId = args.project_id || null
        let projectName = null

        if (!projectId && args.project_name) {
          // Prüfen ob Projekt mit diesem Namen existiert
          const { data: existingProject } = await supabase
            .from('projects')
            .select('id, name')
            .ilike('name', args.project_name)
            .single()

          if (existingProject) {
            projectId = existingProject.id
            projectName = existingProject.name
          } else {
            // Neues Projekt erstellen
            const { data: newProject, error: projectError } = await supabase
              .from('projects')
              .insert({
                name: args.project_name,
                created_by: currentStaff.id
              })
              .select('id, name')
              .single()

            if (projectError) return { error: `Projekt konnte nicht erstellt werden: ${projectError.message}` }
            projectId = newProject.id
            projectName = newProject.name
          }
        }

        // Zuweisungen verarbeiten
        const assignedUsers = args.assigned_user_ids && args.assigned_user_ids.length > 0
          ? args.assigned_user_ids
          : [currentStaff.id]  // Standardmäßig dem Ersteller zuweisen

        const assignedGroups = args.assigned_groups || []

        const { error } = await supabase.from('tasks').insert({
          text: args.text,
          priority: args.priority || null,
          due_date: args.due_date || null,
          recurrence: args.recurrence || null,
          project_id: projectId,
          created_by: currentStaff.id,
          assigned_to: assignedUsers[0] || currentStaff.id,
          assigned_users: assignedUsers,
          assigned_groups: assignedGroups
        })

        if (error) return { error: error.message }

        // Rückmeldung mit Zuweisungsinfo
        let resultInfo = `Aufgabe "${args.text}" wurde erstellt`
        if (projectName) {
          resultInfo += ` im Projekt "${projectName}"`
        }
        if (args.assigned_user_ids?.length > 0 || args.assigned_groups?.length > 0) {
          const userNames = args.assigned_user_ids?.map(id => {
            const s = staff.find(m => m.id === id)
            return s ? `${s.first_name} ${s.last_name}` : id
          }) || []
          const parts = [...userNames, ...(args.assigned_groups || [])]
          resultInfo += ` und zugewiesen an: ${parts.join(', ')}`
        } else {
          resultInfo += ' und dir zugewiesen'
        }

        return { success: true, message: resultInfo }
      }

      case 'update_task': {
        if (!args?.task_id) {
          return { error: 'Task-ID ist erforderlich' }
        }

        const updates = {}
        if (args.text) updates.text = args.text
        if (args.priority) updates.priority = args.priority
        if (args.due_date) updates.due_date = args.due_date
        if (args.recurrence) updates.recurrence = args.recurrence
        if (args.project_id) updates.project_id = args.project_id
        updates.updated_at = new Date().toISOString()

        const { error } = await supabase
          .from('tasks')
          .update(updates)
          .eq('id', args.task_id)

        if (error) return { error: error.message }
        return { success: true, message: 'Aufgabe wurde aktualisiert' }
      }

      default:
        return { error: `Unbekanntes Tool: ${toolName}` }
    }
  }

  // Antwort aus Conversations API parsen
  const parseConversationResponse = (data) => {
    let textContent = ''
    let sources = []
    let toolCalls = []

    // Durch alle Outputs iterieren
    const outputs = data.outputs || []
    for (const output of outputs) {
      // Function Call Output (Mistral Agents API Format)
      if (output.type === 'function.call') {
        const args = typeof output.arguments === 'string'
          ? JSON.parse(output.arguments || '{}')
          : (output.arguments || {})
        toolCalls.push({
          id: output.tool_call_id || output.id,
          name: output.name,
          arguments: args
        })
      }
      // Message Output mit Text und Quellen
      else if (output.type === 'message.output' && output.content) {
        // Content kann ein String oder ein Array von Teilen sein
        if (typeof output.content === 'string') {
          textContent += output.content
        } else if (Array.isArray(output.content)) {
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
    }

    return { text: textContent.trim(), sources, toolCalls }
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
      let conversationId = null
      let finalText = ''
      let finalSources = []

      // Benutzerkontext für Mistral erstellen
      const staffList = staff.length > 0
        ? staff.map(s => `- ${s.first_name || ''} ${s.last_name || ''} (ID: ${s.id}, Rolle: ${s.role || 'unbekannt'})`).join('\n')
        : 'Keine Mitarbeiter verfügbar'

      const userContext = `[KONTEXT]
Aktueller Benutzer: ${currentStaff ? `${currentStaff.first_name || ''} ${currentStaff.last_name || ''} (ID: ${currentStaff.id})` : 'Unbekannt'}

Verfügbare Mitarbeiter:
${staffList}

Verfügbare Gruppen für Zuweisungen:
- APO (Apotheker/innen)
- PTA (Pharmazeutisch-technische Assistenten)
- PKA (Pharmazeutisch-kaufmännische Angestellte)
[/KONTEXT]

`

      // Erste Anfrage mit User-Nachricht (inkl. Benutzerkontext)
      let currentInputs = [{ role: 'user', content: userContext + userMessage }]

      // Loop für Tool-Calls (max 5 Iterationen)
      for (let i = 0; i < 5; i++) {
        // Für Folge-Anfragen den append-Endpoint verwenden
        const isFollowUp = conversationId !== null
        const url = isFollowUp
          ? `${MISTRAL_CONVERSATIONS_URL}/${conversationId}`
          : MISTRAL_CONVERSATIONS_URL

        const requestBody = isFollowUp
          ? {
              inputs: currentInputs,
              stream: false
            }
          : {
              agent_id: agentId,
              inputs: currentInputs,
              stream: false
            }

        console.log(`Request ${i + 1} to ${url}:`, JSON.stringify(requestBody, null, 2))

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('API Error:', errorData)
          throw new Error(errorData.message || errorData.error?.message || `API-Fehler: ${response.status}`)
        }

        const data = await response.json()
        console.log('Mistral API Response:', JSON.stringify(data, null, 2))

        // Conversation ID für Folge-Anfragen speichern
        if (data.conversation_id) {
          conversationId = data.conversation_id
        }

        const { text, sources, toolCalls } = parseConversationResponse(data)
        console.log('Parsed response - text:', text, 'toolCalls:', toolCalls)

        // Keine Tool-Calls mehr → fertig
        if (!toolCalls || toolCalls.length === 0) {
          finalText = text
          finalSources = sources
          break
        }

        console.log('Tool-Calls erhalten:', toolCalls)

        // Tool-Calls ausführen und Ergebnisse sammeln
        currentInputs = []
        for (const tc of toolCalls) {
          console.log(`Führe Tool aus: ${tc.name}`, tc.arguments)
          const result = await handleToolCall(tc.name, tc.arguments)
          console.log(`Tool-Ergebnis für ${tc.name}:`, result)

          // Mistral Conversations API Format: function.result
          currentInputs.push({
            object: 'entry',
            type: 'function.result',
            tool_call_id: tc.id,
            result: JSON.stringify(result)
          })
        }
      }

      console.log('Final result - text:', finalText, 'sources:', finalSources)
      if (finalText) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: finalText,
          sources: finalSources.length > 0 ? finalSources : null,
        }])
      } else {
        console.warn('Keine Text-Antwort vom Assistenten erhalten')
        setError('Keine Antwort vom Assistenten erhalten')
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
