import { useState, useEffect } from 'react'
import { X, User, MapPin, Phone, Note, Key, Check } from '@phosphor-icons/react'

export function CustomerDetailModal({
  theme,
  isOpen,
  customer,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: '',
    street: '',
    postal_code: '',
    city: '',
    phone: '',
    delivery_notes: '',
    access_info: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || '',
        street: customer.street || '',
        postal_code: customer.postal_code || '',
        city: customer.city || '',
        phone: customer.phone || '',
        delivery_notes: customer.delivery_notes || '',
        access_info: customer.access_info || '',
      })
    } else {
      setForm({
        name: '',
        street: '',
        postal_code: '',
        city: '',
        phone: '',
        delivery_notes: '',
        access_info: '',
      })
    }
  }, [customer, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl w-full max-w-lg`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
              <User size={20} className="text-[#F59E0B]" />
            </div>
            <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>
              {customer ? 'Kunde bearbeiten' : 'Neuer Kunde'}
            </h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.bgHover}`}>
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Vor- und Nachname"
              required
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
            />
          </div>

          {/* Address */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
              <MapPin size={14} className="inline mr-1" />
              Straße *
            </label>
            <input
              type="text"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              placeholder="Straße und Hausnummer"
              required
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
                PLZ
              </label>
              <input
                type="text"
                value={form.postal_code}
                onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                placeholder="PLZ"
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
              />
            </div>
            <div className="col-span-2">
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
                Ort
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Ort"
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
              <Phone size={14} className="inline mr-1" />
              Telefon
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Telefonnummer"
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
            />
          </div>

          {/* Delivery Notes */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
              <Note size={14} className="inline mr-1 text-amber-600" />
              Lieferhinweise
            </label>
            <textarea
              value={form.delivery_notes}
              onChange={(e) => setForm({ ...form, delivery_notes: e.target.value })}
              rows={2}
              placeholder="z.B. 'Hinter Blumenkasten ablegen erlaubt'"
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.input} resize-none`}
            />
            <p className={`mt-1 text-xs ${theme.textMuted}`}>
              Diese Hinweise werden bei jeder Lieferung angezeigt
            </p>
          </div>

          {/* Access Info */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
              <Key size={14} className="inline mr-1 text-blue-600" />
              Zugangsinfo
            </label>
            <textarea
              value={form.access_info}
              onChange={(e) => setForm({ ...form, access_info: e.target.value })}
              rows={2}
              placeholder="z.B. 'Klingel defekt, bitte klopfen'"
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.input} resize-none`}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving || !form.name || !form.street}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${theme.accent} text-white disabled:opacity-50`}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Check size={18} />
              )}
              {customer ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
