import { useState, useEffect } from 'react'
import { CircleNotch, FloppyDisk, ArrowCounterClockwise } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'

const DEFAULT_SYSTEM_PROMPT = `Du bist ein hilfreicher KI-Assistent für eine deutsche Apotheken-Management-App namens "Kaeee".
Du antwortest auf Deutsch, freundlich und prägnant.
Du kannst bei allgemeinen Fragen helfen, Texte formulieren, Ideen geben und Probleme analysieren.
Halte deine Antworten kurz und praktisch, außer der Nutzer bittet um ausführlichere Erklärungen.`

export default function ChatSettingsSection({ theme }) {
  const [systemPrompt, setSystemPrompt] = useState('')
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // System-Prompt aus Datenbank laden
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_settings')
          .select('chat_system_prompt')
          .single()

        if (error) throw error

        const prompt = data?.chat_system_prompt || DEFAULT_SYSTEM_PROMPT
        setSystemPrompt(prompt)
        setOriginalPrompt(prompt)
      } catch (err) {
        console.error('Fehler beim Laden der Chat-Einstellungen:', err)
        setSystemPrompt(DEFAULT_SYSTEM_PROMPT)
        setOriginalPrompt(DEFAULT_SYSTEM_PROMPT)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase
        .from('ai_settings')
        .update({ chat_system_prompt: systemPrompt })
        .not('id', 'is', null) // Update die einzige Zeile

      if (error) throw error

      setOriginalPrompt(systemPrompt)
      setMessage({ type: 'success', text: 'Einstellungen gespeichert!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      console.error('Fehler beim Speichern:', err)
      setMessage({ type: 'error', text: 'Fehler beim Speichern: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT)
  }

  const hasChanges = systemPrompt !== originalPrompt

  if (loading) {
    return (
      <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
        <div className="flex items-center justify-center py-8">
          <CircleNotch size={24} className="animate-spin text-violet-500" />
        </div>
      </div>
    )
  }

  return (
    <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
      <div className="mb-4">
        <h3 className="text-base font-semibold">KI-Chat Einstellungen</h3>
        <p className={`text-xs ${theme.textMuted}`}>
          Konfiguriere den schwebenden KI-Assistenten (Mistral)
        </p>
      </div>

      {/* System-Prompt */}
      <div className="space-y-3">
        <div>
          <label className={`block text-sm font-medium ${theme.text} mb-1.5`}>
            System-Prompt
          </label>
          <p className={`text-xs ${theme.textMuted} mb-2`}>
            Definiert das Verhalten und den Kontext des KI-Assistenten
          </p>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={8}
            className={`w-full px-3 py-2.5 text-sm rounded-xl border ${theme.input} ${theme.inputPlaceholder} resize-y`}
            placeholder="System-Prompt eingeben..."
          />
        </div>

        {/* Aktionen */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border ${theme.border} ${theme.bgHover} ${theme.textSecondary}`}
            title="Auf Standard zurücksetzen"
          >
            <ArrowCounterClockwise size={16} />
            Standard
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {saving ? (
              <CircleNotch size={16} className="animate-spin" />
            ) : (
              <FloppyDisk size={16} />
            )}
            Speichern
          </button>
        </div>

        {/* Nachricht */}
        {message.text && (
          <div
            className={`mt-3 px-4 py-2.5 rounded-xl text-sm ${
              message.type === 'success'
                ? 'bg-teal-500/10 border border-teal-500/20 text-teal-600'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Info-Box */}
      <div className={`mt-6 p-4 rounded-xl bg-violet-50 border border-violet-200`}>
        <p className="text-sm text-violet-800 font-medium mb-1">Tipp</p>
        <p className="text-xs text-violet-600">
          Der System-Prompt definiert, wie der KI-Assistent antwortet. Du kannst hier
          spezifische Anweisungen geben, z.B. Fachbegriffe, Tonalität oder besondere
          Verhaltensweisen für den Apotheken-Kontext.
        </p>
      </div>
    </div>
  )
}
