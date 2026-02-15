import { useState, useEffect } from 'react'
import { X, Check } from '@phosphor-icons/react'

export function InfoEntryModal({ theme, isOpen, entry, onSave, onClose }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setText(entry?.text || '')
  }, [entry, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    await onSave(text.trim())
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl w-full max-w-lg`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className={`font-semibold ${theme.textPrimary}`}>
            {entry ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
          </h3>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              required
              placeholder="Info, Hinweis, Neuigkeit..."
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.input} resize-none`}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}>
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving || !text.trim()}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${theme.accent} text-white disabled:opacity-50`}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Check size={18} />
              )}
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
