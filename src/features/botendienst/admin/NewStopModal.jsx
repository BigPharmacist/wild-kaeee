import { useState, useEffect } from 'react'
import { X, MagnifyingGlass, Plus, MapPin, User, Package, Money, Note } from '@phosphor-icons/react'

export function NewStopModal({
  theme,
  isOpen,
  onClose,
  onAddStop,
  searchCustomers,
  searchResults,
  searchLoading,
  geocodeAddress,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)

  const [form, setForm] = useState({
    customer_name: '',
    street: '',
    postal_code: '',
    city: '',
    phone: '',
    package_count: 1,
    cash_amount: 0,
    priority: 'normal',
    stop_notes: '',
    delivery_notes: '',
  })

  // Search customers when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchCustomers(searchQuery)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchCustomers])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSelectedCustomer(null)
      setShowNewForm(false)
      setForm({
        customer_name: '',
        street: '',
        postal_code: '',
        city: '',
        phone: '',
        package_count: 1,
        cash_amount: 0,
        priority: 'normal',
        stop_notes: '',
        delivery_notes: '',
      })
    }
  }, [isOpen])

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer)
    setForm({
      ...form,
      customer_name: customer.name,
      street: customer.street,
      postal_code: customer.postal_code || '',
      city: customer.city || '',
      phone: customer.phone || '',
      delivery_notes: customer.delivery_notes || '',
    })
    setSearchQuery('')
  }

  const handleSubmit = async () => {
    // Try to geocode if no coordinates
    let coords = null
    if (!selectedCustomer?.latitude && form.street && (form.postal_code || form.city)) {
      setIsGeocoding(true)
      coords = await geocodeAddress(form.street, form.postal_code, form.city)
      setIsGeocoding(false)
    }

    const stopData = {
      customer_id: selectedCustomer?.id || null,
      customer_name: form.customer_name,
      street: form.street,
      postal_code: form.postal_code,
      city: form.city,
      latitude: coords?.latitude || selectedCustomer?.latitude || null,
      longitude: coords?.longitude || selectedCustomer?.longitude || null,
      package_count: form.package_count,
      cash_amount: form.cash_amount,
      priority: form.priority,
      stop_notes: form.stop_notes || null,
    }

    await onAddStop(stopData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>
            Neuen Stop hinzufügen
          </h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}>
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Customer Search */}
          {!showNewForm && !selectedCustomer && (
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
                Kunde suchen
              </label>
              <div className="relative">
                <MagnifyingGlass
                  size={18}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Name oder Adresse..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${theme.input}`}
                />
              </div>

              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <div className={`mt-2 border rounded-lg ${theme.border} max-h-48 overflow-auto`}>
                  {searchLoading ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#F59E0B] mx-auto" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(customer => (
                      <button
                        key={customer.id}
                        onClick={() => handleSelectCustomer(customer)}
                        className={`w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 ${theme.border}`}
                      >
                        <p className={`font-medium ${theme.textPrimary}`}>{customer.name}</p>
                        <p className={`text-sm ${theme.textMuted}`}>
                          {customer.street}
                          {customer.postal_code && `, ${customer.postal_code}`}
                          {customer.city && ` ${customer.city}`}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <p className={`text-sm ${theme.textMuted}`}>Keine Kunden gefunden</p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowNewForm(true)}
                className={`mt-3 inline-flex items-center gap-1.5 text-sm text-[#F59E0B] hover:underline`}
              >
                <Plus size={16} />
                Neuen Kunden anlegen
              </button>
            </div>
          )}

          {/* Selected Customer or New Form */}
          {(selectedCustomer || showNewForm) && (
            <div className="space-y-4">
              {selectedCustomer && (
                <div className={`p-3 rounded-lg ${theme.bg} flex items-start gap-3`}>
                  <User size={20} className="text-[#F59E0B]" />
                  <div className="flex-1">
                    <p className={`font-medium ${theme.textPrimary}`}>{selectedCustomer.name}</p>
                    <p className={`text-sm ${theme.textMuted}`}>
                      {selectedCustomer.street}, {selectedCustomer.postal_code} {selectedCustomer.city}
                    </p>
                    {selectedCustomer.delivery_notes && (
                      <p className="text-sm text-amber-600 mt-1">
                        {selectedCustomer.delivery_notes}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCustomer(null)
                      setForm({
                        ...form,
                        customer_name: '',
                        street: '',
                        postal_code: '',
                        city: '',
                        phone: '',
                      })
                    }}
                    className={`p-1 rounded ${theme.bgHover}`}
                  >
                    <X size={16} className={theme.textMuted} />
                  </button>
                </div>
              )}

              {/* Name & Address (for new customers) */}
              {showNewForm && !selectedCustomer && (
                <>
                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
                      Name *
                    </label>
                    <input
                      type="text"
                      value={form.customer_name}
                      onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                      placeholder="Vor- und Nachname"
                      className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
                      Straße *
                    </label>
                    <input
                      type="text"
                      value={form.street}
                      onChange={(e) => setForm({ ...form, street: e.target.value })}
                      placeholder="Straße und Hausnummer"
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

                  <div>
                    <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
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
                </>
              )}

              {/* Delivery Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
                    <Package size={14} className="inline mr-1" />
                    Pakete
                  </label>
                  <input
                    type="number"
                    value={form.package_count}
                    onChange={(e) => setForm({ ...form, package_count: parseInt(e.target.value) || 1 })}
                    min="1"
                    className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
                    <Money size={14} className="inline mr-1" />
                    Betrag (€)
                  </label>
                  <input
                    type="number"
                    value={form.cash_amount}
                    onChange={(e) => setForm({ ...form, cash_amount: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    min="0"
                    className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
                  Priorität
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
                >
                  <option value="low">Niedrig</option>
                  <option value="normal">Normal</option>
                  <option value="high">Hoch</option>
                  <option value="urgent">Dringend</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
                  <Note size={14} className="inline mr-1" />
                  Notiz für diese Lieferung
                </label>
                <textarea
                  value={form.stop_notes}
                  onChange={(e) => setForm({ ...form, stop_notes: e.target.value })}
                  rows={2}
                  placeholder="Optionale Notiz..."
                  className={`w-full px-4 py-2.5 rounded-lg border ${theme.input} resize-none`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(selectedCustomer || showNewForm) && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
            >
              Abbrechen
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.street || (!selectedCustomer && !form.customer_name) || isGeocoding}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${theme.accent} text-white disabled:opacity-50`}
            >
              {isGeocoding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Geokodiere...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Stop hinzufügen
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
