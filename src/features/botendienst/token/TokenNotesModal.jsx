import { useState } from 'react'
import { CircleNotch } from '@phosphor-icons/react'

export function TokenNotesModal({ stop, onClose, onSave, loading }) {
  const [notes, setNotes] = useState(stop.stop_notes || '')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notiz hinzufügen</h3>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notiz eingeben..."
          rows={4}
          autoFocus
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onSave(notes)}
            disabled={loading}
            className={`flex-1 px-4 py-3 rounded-lg font-medium text-white ${
              loading ? 'bg-green-400 cursor-wait' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {loading ? <CircleNotch size={20} className="animate-spin mx-auto" /> : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
