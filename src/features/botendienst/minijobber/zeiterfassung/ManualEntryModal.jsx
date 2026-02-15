import { useState } from 'react'
import { X, Check } from '@phosphor-icons/react'

export function ManualEntryModal({ theme, isOpen, profiles, year, month, onSave, onClose }) {
  const [staffId, setStaffId] = useState('')
  const [date, setDate] = useState(`${year}-${String(month).padStart(2, '0')}-01`)
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!staffId || !hours) return
    setSaving(true)
    await onSave(staffId, date, parseFloat(hours), description)
    setSaving(false)
  }

  const activeProfiles = profiles.filter(p => p.active)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl w-full max-w-sm`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className={`font-semibold ${theme.textPrimary}`}>Manuelle Stundenkorrektur</h3>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Mitarbeiter *</label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              required
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
            >
              <option value="">-- Wählen --</option>
              {activeProfiles.map(p => (
                <option key={p.staff_id} value={p.staff_id}>
                  {p.staff?.first_name} {p.staff?.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Datum</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Stunden *</label>
            <input
              type="number"
              step="0.25"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="z.B. 2,5 oder -1"
              required
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
            />
            <p className={`mt-1 text-xs ${theme.textMuted}`}>Negative Werte möglich (z.B. -2 für Abzug)</p>
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Beschreibung</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="z.B. Krankheit, Sondereinsatz..."
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}>
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving || !staffId || !hours}
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
