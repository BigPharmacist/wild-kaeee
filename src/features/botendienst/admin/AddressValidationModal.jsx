import { useState, useEffect } from 'react'
import { X, MapPin, MagnifyingGlass, Check, Warning } from '@phosphor-icons/react'

export function AddressValidationModal({
  theme,
  isOpen,
  stop,
  existingCustomer,
  onSave,
  onSkip,
  onCancel,
  geocodeAddress,
  totalStops,
  currentIndex,
}) {
  const [form, setForm] = useState({
    customer_name: '',
    street: '',
    postal_code: '',
    city: '',
    phone: '',
    delivery_notes: '',
  })
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeResult, setGeocodeResult] = useState(null)

  // Initialisiere Form wenn Modal öffnet
  useEffect(() => {
    if (isOpen && stop) {
      setForm({
        customer_name: stop.customer_name || '',
        street: existingCustomer?.street || stop.street || '',
        postal_code: existingCustomer?.postal_code || stop.postal_code || '',
        city: existingCustomer?.city || stop.city || '',
        phone: existingCustomer?.phone || stop.phone || '',
        delivery_notes: stop.delivery_notes || '',
      })
      setGeocodeResult(null)
    }
  }, [isOpen, stop, existingCustomer])

  const handleGeocode = async () => {
    if (!form.street || (!form.postal_code && !form.city)) return

    setGeocoding(true)
    setGeocodeResult(null)

    try {
      const result = await geocodeAddress(form.street, form.postal_code, form.city)
      if (result) {
        setGeocodeResult({ success: true, ...result })
      } else {
        setGeocodeResult({ success: false, message: 'Adresse nicht gefunden' })
      }
    } catch (err) {
      setGeocodeResult({ success: false, message: err.message })
    } finally {
      setGeocoding(false)
    }
  }

  const handleSave = () => {
    onSave({
      ...form,
      latitude: geocodeResult?.latitude || null,
      longitude: geocodeResult?.longitude || null,
    })
  }

  const isValid = form.customer_name && form.street && form.postal_code && form.city

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Modal */}
      <div className={`relative w-full max-w-lg ${theme.surface} rounded-2xl shadow-2xl`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Warning size={20} className="text-amber-600" weight="fill" />
            </div>
            <div>
              <h2 className={`font-semibold ${theme.textPrimary}`}>Adresse vervollständigen</h2>
              <p className={`text-sm ${theme.textMuted}`}>
                Stop {currentIndex + 1} von {totalStops}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className={`p-2 rounded-lg ${theme.bgHover}`}
          >
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Warnung */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>{form.customer_name}</strong> hat keine vollständige Adresse.
              Bitte ergänze die fehlenden Daten.
            </p>
            {stop?.street && (
              <p className="text-xs text-amber-600 mt-1">
                Aus PDF: {stop.street} {stop.postal_code} {stop.city}
              </p>
            )}
          </div>

          {/* Existierender Kunde Info */}
          {existingCustomer && existingCustomer.street && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
              <p className="text-sm text-teal-800">
                <strong>Im Kundenstamm gefunden:</strong>
              </p>
              <p className="text-sm text-teal-700">
                {existingCustomer.street}, {existingCustomer.postal_code} {existingCustomer.city}
              </p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                Name
              </label>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                Straße + Hausnummer *
              </label>
              <input
                type="text"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                placeholder="z.B. Robert-Koch-Str. 34"
                className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                  PLZ *
                </label>
                <input
                  type="text"
                  value={form.postal_code}
                  onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                  placeholder="55232"
                  maxLength={5}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
                />
              </div>
              <div className="col-span-2">
                <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                  Ort *
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Alzey"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                Telefon
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                Lieferhinweis (nur für diese Tour)
              </label>
              <input
                type="text"
                value={form.delivery_notes}
                onChange={(e) => setForm({ ...form, delivery_notes: e.target.value })}
                placeholder="z.B. Hinter Blumenkasten ablegen"
                className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
              />
            </div>
          </div>

          {/* Geocode Button & Result */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleGeocode}
              disabled={geocoding || !form.street || (!form.postal_code && !form.city)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                ${geocoding ? 'bg-gray-100 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              <MagnifyingGlass size={16} className={geocoding ? 'animate-pulse' : ''} />
              {geocoding ? 'Suche...' : 'Adresse prüfen'}
            </button>

            {geocodeResult && (
              <div className={`flex items-center gap-2 text-sm ${
                geocodeResult.success ? 'text-teal-600' : 'text-red-600'
              }`}>
                {geocodeResult.success ? (
                  <>
                    <Check size={16} weight="bold" />
                    <span>Koordinaten gefunden</span>
                  </>
                ) : (
                  <>
                    <Warning size={16} />
                    <span>{geocodeResult.message}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <button
            onClick={onSkip}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${theme.textMuted} hover:bg-gray-100`}
          >
            Überspringen
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${theme.border} ${theme.bgHover}`}
            >
              Import abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white
                ${isValid ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-300 cursor-not-allowed'}`}
            >
              <Check size={16} weight="bold" />
              Speichern & Weiter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
