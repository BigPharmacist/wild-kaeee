import { useRef, useEffect, useState } from 'react'
import { CheckCircle, CircleNotch, Link, ListBullets, ListNumbers, Paperclip, PaperPlaneTilt, Quotes, Sparkle, TextB, TextItalic, TextUnderline, X } from '@phosphor-icons/react'

export default function EmailComposeModal({
  theme,
  show,
  composeMode,
  composeData,
  originalEmail,
  attachments = [],
  sendError,
  sending,
  sendSuccess,
  onClose,
  onSend,
  setComposeData,
  onAddAttachment,
  onRemoveAttachment,
  aiSettings,
}) {
  const fileInputRef = useRef(null)
  const editorRef = useRef(null)
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiChatHistory, setAiChatHistory] = useState([]) // Kontext für Folgeanfragen

  // States zurücksetzen wenn Modal geschlossen wird
  useEffect(() => {
    if (!show) {
      setShowCcBcc(false)
      setAiPrompt('')
      setAiError('')
      setAiChatHistory([]) // Chat-Verlauf zurücksetzen
    }
  }, [show])

  // Nach erfolgreicher Sendung kurz die Erfolgsmeldung zeigen, dann schließen
  useEffect(() => {
    if (sendSuccess) {
      const timer = setTimeout(() => {
        onClose()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [sendSuccess, onClose])

  // KI-Text generieren via Nebius API mit strukturiertem JSON-Output
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return
    if (!aiSettings?.api_key) {
      setAiError('Kein API-Key konfiguriert. Bitte in den Einstellungen hinterlegen.')
      return
    }

    setAiGenerating(true)
    setAiError('')

    try {
      // Kontext der Original-E-Mail für Antworten/Weiterleitungen
      let originalContext = ''
      if (originalEmail && (composeMode === 'reply' || composeMode === 'forward')) {
        const sender = originalEmail.from?.[0]
        originalContext = `\n\n--- Original-E-Mail (zum Beantworten) ---
Von: ${sender?.name || ''} <${sender?.email || ''}>
Betreff: ${originalEmail.subject || ''}
Inhalt: ${originalEmail.preview || originalEmail.textBody || ''}`
      }

      // Neue User-Nachricht für den Verlauf
      let userMessage
      if (aiChatHistory.length === 0) {
        if (composeMode === 'reply') {
          userMessage = `Schreibe eine Antwort auf diese E-Mail mit folgendem Inhalt/Wunsch: ${aiPrompt}${originalContext}`
        } else if (composeMode === 'forward') {
          userMessage = `Schreibe einen Weiterleitungstext für diese E-Mail mit folgendem Inhalt/Wunsch: ${aiPrompt}${originalContext}`
        } else {
          userMessage = `Schreibe eine E-Mail mit folgendem Inhalt/Wunsch: ${aiPrompt}${composeData.subject ? `\n\nVerwende diesen Betreff: ${composeData.subject}` : ''}`
        }
      } else {
        userMessage = aiPrompt // Folgeanfragen direkt übernehmen
      }

      // System-Prompt mit JSON-Anweisung
      const systemPrompt = (aiSettings.system_prompt || 'Du bist ein professioneller E-Mail-Assistent. Schreibe höfliche, klare und professionelle E-Mails auf Deutsch.') +
        '\n\nAntworte IMMER im JSON-Format mit genau diesen Feldern:\n{"subject": "Der Betreff", "body": "Der E-Mail-Text"}'

      // Messages mit Verlauf aufbauen
      const messages = [
        { role: 'system', content: systemPrompt },
        ...aiChatHistory,
        { role: 'user', content: userMessage },
      ]

      const response = await fetch('https://api.tokenfactory.nebius.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiSettings.api_key}`,
        },
        body: JSON.stringify({
          model: aiSettings.model || 'Qwen/Qwen3-235B-A22B-Instruct-2507',
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'email_response',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  subject: { type: 'string', description: 'Der Betreff der E-Mail' },
                  body: { type: 'string', description: 'Der Text der E-Mail ohne Betreff' },
                },
                required: ['subject', 'body'],
                additionalProperties: false,
              },
            },
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API-Fehler: ${response.status}`)
      }

      const data = await response.json()
      const generatedContent = data.choices?.[0]?.message?.content || ''

      if (generatedContent) {
        // JSON parsen
        const emailData = JSON.parse(generatedContent)
        const { subject, body: emailBody } = emailData

        // Chat-Verlauf aktualisieren (mit dem Original-JSON für Kontext)
        setAiChatHistory(prev => [
          ...prev,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: generatedContent },
        ])

        // Betreff setzen falls noch leer
        if (subject && !composeData.subject) {
          setComposeData(prev => ({ ...prev, subject }))
        }

        // E-Mail-Body einfügen (vor der Signatur)
        const currentBody = composeData.body || ''
        const signatureIndex = currentBody.indexOf('<hr')

        let newBody
        if (signatureIndex > -1) {
          newBody = emailBody + currentBody.substring(signatureIndex)
        } else {
          newBody = emailBody
        }

        setComposeData(prev => ({ ...prev, body: newBody }))
        setAiPrompt('')
      }
    } catch (err) {
      console.error('KI-Generierung fehlgeschlagen:', err)
      setAiError(err.message || 'Generierung fehlgeschlagen')
    } finally {
      setAiGenerating(false)
    }
  }

  // Editor-Inhalt synchronisieren wenn composeData.body sich ändert
  useEffect(() => {
    if (editorRef.current && show) {
      if (editorRef.current.innerHTML !== composeData.body) {
        editorRef.current.innerHTML = composeData.body
      }
    }
  }, [composeData.body, show])

  // Formatierung mit execCommand anwenden
  const applyFormat = (command, value = null) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    if (editorRef.current) {
      setComposeData(prev => ({ ...prev, body: editorRef.current.innerHTML }))
    }
  }

  // Link einfügen
  const insertLink = () => {
    const url = window.prompt('URL eingeben:', 'https://')
    if (url) {
      applyFormat('createLink', url)
    }
  }

  // Datei hinzufügen
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => onAddAttachment(file))
    e.target.value = '' // Reset für erneute Auswahl derselben Datei
  }

  // Dateigröße formatieren
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Inhalt bei Änderungen synchronisieren
  const handleInput = () => {
    if (editorRef.current) {
      setComposeData(prev => ({ ...prev, body: editorRef.current.innerHTML }))
    }
  }

  if (!show) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme.overlay}`}>
      <div className={`${theme.panel} rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col ${theme.cardShadow} relative`}>

        {/* Erfolgs-Overlay nach dem Senden */}
        {sendSuccess && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 rounded-2xl backdrop-blur-sm">
            <div className="relative">
              <CheckCircle size={64} weight="fill" className="text-emerald-500" />
            </div>
            <p className="mt-4 text-lg font-medium text-emerald-600">E-Mail gesendet</p>
          </div>
        )}

        {/* KI-Generierung Overlay */}
        {aiGenerating && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 rounded-2xl backdrop-blur-sm">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
              <Sparkle size={24} weight="fill" className="absolute inset-0 m-auto text-violet-500" />
            </div>
            <p className="mt-4 text-lg font-medium text-violet-600">KI generiert...</p>
            <p className="mt-1 text-sm text-violet-400">Einen Moment bitte</p>
          </div>
        )}

        {/* Header - minimalistisch mit Senden-Button */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${theme.border}`}>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
            title="Schließen"
          >
            <X size={20} />
          </button>

          <span className={`text-sm font-medium ${theme.textSecondary}`}>
            {composeMode === 'reply' ? 'Antworten' : composeMode === 'forward' ? 'Weiterleiten' : 'Neue E-Mail'}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${theme.border} ${theme.text} font-medium text-sm ${theme.bgHover}`}
              title="Anhang hinzufügen"
            >
              <Paperclip size={16} />
              <span className="hidden sm:inline">Anhang</span>
              {attachments.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 text-xs bg-[#4C8BF5] text-white rounded-full">
                  {attachments.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onSend}
              disabled={sending || !composeData.to.trim()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${theme.primaryBg} text-white font-medium text-sm ${theme.primaryHover} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {sending ? (
                <CircleNotch size={16} className="animate-spin" />
              ) : (
                <PaperPlaneTilt size={16} />
              )}
              <span className="hidden sm:inline">Senden</span>
            </button>
          </div>
        </div>

        {/* Felder - Inline-Style */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {sendError && (
            <div className="mx-4 mt-3 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              <p className="text-rose-500 text-sm">{sendError}</p>
            </div>
          )}

          {/* An-Feld */}
          <div className={`flex items-center px-4 py-2 border-b ${theme.border}`}>
            <label className={`text-sm ${theme.textMuted} w-16 flex-shrink-0`}>An:</label>
            <input
              type="text"
              value={composeData.to}
              onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
              placeholder="Empfänger"
              className={`flex-1 bg-transparent outline-none ${theme.text} text-sm`}
            />
            {!showCcBcc && (
              <button
                type="button"
                onClick={() => setShowCcBcc(true)}
                className={`text-xs ${theme.textMuted} hover:text-[#FD8916] ml-2`}
              >
                Cc/Bcc
              </button>
            )}
          </div>

          {/* CC-Feld */}
          {showCcBcc && (
            <div className={`flex items-center px-4 py-2 border-b ${theme.border}`}>
              <label className={`text-sm ${theme.textMuted} w-16 flex-shrink-0`}>Cc:</label>
              <input
                type="text"
                value={composeData.cc}
                onChange={(e) => setComposeData(prev => ({ ...prev, cc: e.target.value }))}
                placeholder="Optional"
                className={`flex-1 bg-transparent outline-none ${theme.text} text-sm`}
              />
            </div>
          )}

          {/* BCC-Feld */}
          {showCcBcc && (
            <div className={`flex items-center px-4 py-2 border-b ${theme.border}`}>
              <label className={`text-sm ${theme.textMuted} w-16 flex-shrink-0`}>Bcc:</label>
              <input
                type="text"
                value={composeData.bcc}
                onChange={(e) => setComposeData(prev => ({ ...prev, bcc: e.target.value }))}
                placeholder="Optional"
                className={`flex-1 bg-transparent outline-none ${theme.text} text-sm`}
              />
            </div>
          )}

          {/* Betreff-Feld */}
          <div className={`flex items-center px-4 py-2 border-b ${theme.border}`}>
            <label className={`text-sm ${theme.textMuted} w-16 flex-shrink-0`}>Betreff:</label>
            <input
              type="text"
              value={composeData.subject}
              onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Betreff eingeben"
              className={`flex-1 bg-transparent outline-none ${theme.text} text-sm`}
            />
          </div>

          {/* Kaeee-Assistent (KI) */}
          <div className={`px-4 py-3 border-b ${theme.border} bg-gradient-to-r from-violet-50 to-purple-50`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-violet-600">
                <Sparkle size={18} weight="fill" />
                <span className="text-sm font-medium">Kaeee-Assistent</span>
              </div>
              {!aiSettings?.api_key && (
                <span className="text-xs text-violet-400">(nicht konfiguriert)</span>
              )}
            </div>
            <div className="flex gap-2">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && !aiGenerating && (e.preventDefault(), handleAiGenerate())}
                placeholder={aiSettings?.api_key ? "Beschreibe, was die KI schreiben soll...\nz.B. 'Terminbestätigung für Freitag 14 Uhr'" : "API-Key in Einstellungen hinterlegen..."}
                disabled={!aiSettings?.api_key}
                rows={2}
                className="flex-1 px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 placeholder-violet-300 disabled:bg-violet-50 disabled:cursor-not-allowed resize-none"
              />
              <button
                type="button"
                onClick={handleAiGenerate}
                disabled={aiGenerating || !aiPrompt.trim() || !aiSettings?.api_key}
                className="flex items-center gap-1.5 px-4 py-2 h-fit text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed self-end"
              >
                {aiGenerating ? (
                  <CircleNotch size={16} className="animate-spin" />
                ) : (
                  <Sparkle size={16} weight="fill" />
                )}
                <span>Generieren</span>
              </button>
            </div>
            {aiError && (
              <p className="text-xs text-rose-500 mt-1">{aiError}</p>
            )}
          </div>

          {/* Formatierungs-Toolbar - über dem Editor */}
          <div className={`flex items-center gap-0.5 px-4 py-1.5 border-b ${theme.border} ${theme.bg}`}>
              <button
                type="button"
                onClick={() => applyFormat('bold')}
                className={`p-1 rounded ${theme.bgHover}`}
                title="Fett"
              >
                <TextB size={14} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('italic')}
                className={`p-1 rounded ${theme.bgHover}`}
                title="Kursiv"
              >
                <TextItalic size={14} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('underline')}
                className={`p-1 rounded ${theme.bgHover}`}
                title="Unterstrichen"
              >
                <TextUnderline size={14} />
              </button>

              <div className={`w-px h-4 mx-1 bg-gray-300`} />

              <button
                type="button"
                onClick={() => applyFormat('insertUnorderedList')}
                className={`p-1 rounded ${theme.bgHover}`}
                title="Aufzählung"
              >
                <ListBullets size={14} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('insertOrderedList')}
                className={`p-1 rounded ${theme.bgHover}`}
                title="Nummerierung"
              >
                <ListNumbers size={14} />
              </button>

              <div className={`w-px h-4 mx-1 bg-gray-300`} />

              <button
                type="button"
                onClick={insertLink}
                className={`p-1 rounded ${theme.bgHover}`}
                title="Link"
              >
                <Link size={14} />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('formatBlock', 'blockquote')}
                className={`p-1 rounded ${theme.bgHover}`}
                title="Zitat"
              >
                <Quotes size={14} />
              </button>

              <div className={`w-px h-4 mx-1 bg-gray-300`} />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-1 rounded ${theme.bgHover}`}
                title="Anhang hinzufügen"
              >
                <Paperclip size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
          </div>

          {/* Editor - ohne Label, direkt der Inhalt */}
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className={`px-4 py-3 min-h-[300px] outline-none ${theme.text} text-sm [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_a]:text-blue-500 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5`}
            data-placeholder="Nachricht schreiben..."
            style={{ whiteSpace: 'pre-wrap' }}
          />

          {/* Anhänge */}
          {attachments.length > 0 && (
            <div className={`px-4 py-3 border-t ${theme.border}`}>
              <div className="flex flex-wrap gap-2">
                {attachments.map(att => (
                  <div
                    key={att.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${theme.border} ${att.error ? 'bg-rose-50 border-rose-200' : theme.bg}`}
                  >
                    {att.uploading ? (
                      <CircleNotch size={14} className="animate-spin text-gray-400" />
                    ) : (
                      <Paperclip size={14} className={att.error ? 'text-rose-500' : theme.textMuted} />
                    )}
                    <span className={`text-sm truncate max-w-[150px] ${att.error ? 'text-rose-600' : theme.text}`}>
                      {att.name}
                    </span>
                    <span className={`text-xs ${theme.textMuted}`}>
                      {formatFileSize(att.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(att.id)}
                      className={`p-0.5 rounded hover:bg-gray-200 ${theme.textMuted}`}
                      title="Entfernen"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end px-4 py-2 border-t ${theme.border}`}>
          <button
            type="button"
            onClick={onClose}
            className={`text-sm ${theme.textMuted} hover:${theme.text}`}
          >
            Verwerfen
          </button>
        </div>
      </div>
    </div>
  )
}
