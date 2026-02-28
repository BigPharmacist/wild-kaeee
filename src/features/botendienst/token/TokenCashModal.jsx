import { useState } from 'react'
import { CircleNotch } from '@phosphor-icons/react'

export function TokenCashModal({ stop, onClose, onCollect, loading }) {
  const [amount, setAmount] = useState(stop.cash_amount || 0)
  const [notes, setNotes] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Betrag kassieren
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Betrag
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-lg font-medium focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notizen (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z.B. Bar bezahlt, Wechselgeld..."
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onCollect(amount, notes)}
            disabled={loading}
            className={`flex-1 px-4 py-3 rounded-lg font-medium text-white ${
              loading
                ? 'bg-green-400 cursor-wait'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {loading ? (
              <CircleNotch size={20} className="animate-spin mx-auto" />
            ) : (
              'Kassiert'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
