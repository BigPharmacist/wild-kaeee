import { useState } from 'react'
import { X, Check } from '@phosphor-icons/react'

export function WorkRecordEditModal({ theme, isOpen, mode, label, defaultStart, defaultEnd, onSave, onClose }) {
  const [startTime, setStartTime] = useState(defaultStart || '')
  const [endTime, setEndTime] = useState(defaultEnd || '')

  if (!isOpen) return null

  const hours = calculateHours(startTime, endTime)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (startTime && endTime) {
      onSave(startTime, endTime)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl w-full max-w-sm`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className={`font-semibold ${theme.textPrimary}`}>
              {mode === 'create' ? 'Zeit erfassen' : 'Zeit bearbeiten'}
            </h3>
            <p className={`text-sm ${theme.textSecondary}`}>{label}</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Von</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Bis</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
              />
            </div>
          </div>

          {hours > 0 && (
            <p className={`text-sm ${theme.textPrimary} font-medium`}>
              = {hours.toFixed(2).replace('.', ',')} Stunden
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}>
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!startTime || !endTime}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${theme.accent} text-white disabled:opacity-50`}
            >
              <Check size={18} />
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function calculateHours(startTime, endTime) {
  if (!startTime || !endTime) return 0
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  return Math.max(0, ((eh * 60 + em) - (sh * 60 + sm)) / 60)
}
