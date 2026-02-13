import { useState, useEffect } from 'react'
import { X, Money, Check, Warning, Note } from '@phosphor-icons/react'

export function CashCollectionModal({
  theme,
  isOpen,
  stopId,
  amount,
  onClose,
  onConfirm,
}) {
  const [collectedAmount, setCollectedAmount] = useState('')
  const [note, setNote] = useState('')
  const [isPartial, setIsPartial] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCollectedAmount(amount?.toString() || '')
      setNote('')
      setIsPartial(false)
    }
  }, [isOpen, amount])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0)
  }

  const parsedAmount = parseFloat(collectedAmount.replace(',', '.')) || 0
  const isFullAmount = parsedAmount >= amount
  const remainingAmount = amount - parsedAmount

  const handleConfirm = async () => {
    await onConfirm(stopId, parsedAmount, note.trim() || null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className={`relative ${theme.surface} w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Money size={20} className="text-green-600" />
            </div>
            <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>
              Betrag kassieren
            </h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}>
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Total Amount Display */}
          <div className="text-center">
            <p className={`text-sm ${theme.textMuted} mb-1`}>Offener Betrag</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(amount)}
            </p>
          </div>

          {/* Partial Payment Toggle */}
          <label className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={isPartial}
              onChange={(e) => {
                setIsPartial(e.target.checked)
                if (!e.target.checked) {
                  setCollectedAmount(amount?.toString() || '')
                }
              }}
              className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />
            <span className={`text-sm ${theme.textPrimary}`}>Nur Anzahlung / Teilbetrag</span>
          </label>

          {/* Amount Input (shown for partial payments) */}
          {isPartial && (
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>
                Kassierter Betrag
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={collectedAmount}
                  onChange={(e) => setCollectedAmount(e.target.value)}
                  placeholder="0,00"
                  className={`w-full px-4 py-3 pr-12 rounded-lg border text-lg font-medium ${theme.input}`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
              </div>
              {remainingAmount > 0 && (
                <p className="mt-1 text-sm text-amber-600">
                  Restbetrag: {formatCurrency(remainingAmount)}
                </p>
              )}
            </div>
          )}

          {/* Note Input */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1`}>
              <Note size={14} className="inline mr-1" />
              Notiz (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="z.B. Restbetrag wird überwiesen..."
              rows={2}
              className={`w-full px-4 py-2 rounded-lg border text-sm ${theme.input} resize-none`}
            />
          </div>

          {/* Confirmation Info */}
          <div className={`p-4 rounded-lg ${isFullAmount ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <p className={`font-medium ${isFullAmount ? 'text-green-800' : 'text-amber-800'}`}>
              {isFullAmount ? 'Vollständig kassiert' : 'Anzahlung'}
            </p>
            <p className={`text-sm mt-1 ${isFullAmount ? 'text-green-700' : 'text-amber-700'}`}>
              Kassierter Betrag: {formatCurrency(parsedAmount)}
              {!isFullAmount && ` (Rest: ${formatCurrency(remainingAmount)})`}
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <Warning size={14} className="mt-0.5 flex-shrink-0" />
            <p>
              Bitte stelle sicher, dass der Betrag korrekt ist.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-3 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
          >
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            disabled={parsedAmount <= 0}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={20} weight="bold" />
            {isFullAmount ? 'Kassiert' : 'Anzahlung'}
          </button>
        </div>
      </div>
    </div>
  )
}
