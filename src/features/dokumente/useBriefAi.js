import { useState, useCallback } from 'react'

/**
 * Hook für KI-Brief-Generierung mit Versionshistorie
 */
export default function useBriefAi({ aiSettings, briefData, setBriefData, brieftextRef }) {
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiChatHistory, setAiChatHistory] = useState([])

  // Versionshistorie für Undo/Redo
  const [versionHistory, setVersionHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const resetAiState = useCallback(() => {
    setAiPrompt('')
    setAiError('')
    setAiChatHistory([])
    setVersionHistory([])
    setHistoryIndex(-1)
  }, [])

  const handleAiGenerate = useCallback(async () => {
    if (!aiPrompt.trim()) return
    if (!aiSettings?.api_key) {
      setAiError('Kein API-Key konfiguriert. Bitte in den Einstellungen hinterlegen.')
      return
    }

    setAiGenerating(true)
    setAiError('')

    try {
      // Kontext des aktuellen Briefs
      let briefContext = ''
      if (briefData.empfaenger) {
        briefContext += `\nEmpfänger: ${briefData.empfaenger}`
      }
      if (briefData.betreff) {
        briefContext += `\nAktueller Betreff: ${briefData.betreff}`
      }

      // User-Nachricht aufbauen
      let userMessage
      if (aiChatHistory.length === 0) {
        userMessage = `Schreibe einen formellen Geschäftsbrief mit folgendem Inhalt/Wunsch: ${aiPrompt}${briefContext}`
      } else {
        userMessage = aiPrompt // Folgeanfragen direkt
      }

      // Brief-spezifischer System-Prompt
      const briefSystemPrompt = `Du bist ein professioneller Assistent für Geschäftsbriefe einer deutschen Apotheke.
Schreibe formelle, höfliche und klare Briefe auf Deutsch.
Verwende eine angemessene Anrede (z.B. "Sehr geehrte Damen und Herren," oder personalisiert).
Der Brieftext soll sachlich und professionell sein.
Verwende "Mit freundlichen Grüßen" als Standard-Grußformel, es sei denn, eine andere ist angemessener.

${aiSettings.system_prompt || ''}

Antworte IMMER im JSON-Format mit genau diesen Feldern:
{
  "betreff": "Der Betreff des Briefs",
  "anrede": "Die Anrede (z.B. Sehr geehrte Damen und Herren,)",
  "brieftext": "Der Haupttext des Briefs (ohne Anrede und Grußformel)",
  "grussformel": "Die Grußformel (z.B. Mit freundlichen Grüßen)"
}`

      // Messages mit Verlauf
      const messages = [
        { role: 'system', content: briefSystemPrompt },
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
              name: 'brief_response',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  betreff: { type: 'string', description: 'Der Betreff des Briefs' },
                  anrede: { type: 'string', description: 'Die Anrede (z.B. Sehr geehrte Damen und Herren,)' },
                  brieftext: { type: 'string', description: 'Der Haupttext des Briefs ohne Anrede und Grußformel' },
                  grussformel: { type: 'string', description: 'Die Grußformel (z.B. Mit freundlichen Grüßen)' },
                },
                required: ['betreff', 'anrede', 'brieftext', 'grussformel'],
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
        const briefResult = JSON.parse(generatedContent)
        const { betreff, anrede, brieftext, grussformel } = briefResult

        // Chat-Verlauf aktualisieren
        setAiChatHistory(prev => [
          ...prev,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: generatedContent },
        ])

        // Version in History speichern
        const newVersion = { betreff, anrede, brieftext, grussformel }
        setVersionHistory(prev => {
          // Wenn wir in der History zurückgegangen sind, schneide alles nach dem aktuellen Index ab
          const newHistory = prev.slice(0, historyIndex + 1)
          return [...newHistory, newVersion]
        })
        setHistoryIndex(prev => prev + 1)

        // Brief-Felder aktualisieren
        setBriefData(prev => ({
          ...prev,
          betreff: betreff || prev.betreff,
          anrede: anrede || prev.anrede,
          grussformel: grussformel || prev.grussformel,
        }))

        // Brieftext in contentEditable einfügen
        if (brieftextRef.current && brieftext) {
          brieftextRef.current.innerHTML = brieftext.replace(/\n/g, '<br>')
        }

        setAiPrompt('')
      }
    } catch (err) {
      console.error('KI-Generierung fehlgeschlagen:', err)
      setAiError(err.message || 'Generierung fehlgeschlagen')
    } finally {
      setAiGenerating(false)
    }
  }, [aiPrompt, aiSettings, aiChatHistory, briefData, setBriefData, brieftextRef, historyIndex])

  // Zur vorherigen Version zurück
  const goBack = useCallback(() => {
    if (historyIndex <= 0) return
    const newIndex = historyIndex - 1
    const version = versionHistory[newIndex]

    setHistoryIndex(newIndex)
    setBriefData(prev => ({
      ...prev,
      betreff: version.betreff,
      anrede: version.anrede,
      grussformel: version.grussformel,
    }))
    if (brieftextRef.current) {
      brieftextRef.current.innerHTML = version.brieftext.replace(/\n/g, '<br>')
    }
  }, [historyIndex, versionHistory, setBriefData, brieftextRef])

  // Zur nächsten Version vor
  const goForward = useCallback(() => {
    if (historyIndex >= versionHistory.length - 1) return
    const newIndex = historyIndex + 1
    const version = versionHistory[newIndex]

    setHistoryIndex(newIndex)
    setBriefData(prev => ({
      ...prev,
      betreff: version.betreff,
      anrede: version.anrede,
      grussformel: version.grussformel,
    }))
    if (brieftextRef.current) {
      brieftextRef.current.innerHTML = version.brieftext.replace(/\n/g, '<br>')
    }
  }, [historyIndex, versionHistory, setBriefData, brieftextRef])

  const canGoBack = historyIndex > 0
  const canGoForward = historyIndex < versionHistory.length - 1
  const historyInfo = versionHistory.length > 0
    ? `${historyIndex + 1}/${versionHistory.length}`
    : null

  return {
    aiPrompt,
    setAiPrompt,
    aiGenerating,
    aiError,
    handleAiGenerate,
    resetAiState,
    // History Navigation
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    historyInfo,
  }
}
