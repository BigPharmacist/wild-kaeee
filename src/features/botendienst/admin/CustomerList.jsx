import { useState, useEffect } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Trash, User, MapPin, Phone, Note, Key } from '@phosphor-icons/react'
import { CustomerDetailModal } from './CustomerDetailModal'

export function CustomerList({
  theme,
  customers,
  customersLoading,
  onFetchCustomers,
  onCreateCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    onFetchCustomers()
  }, [onFetchCustomers])

  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      customer.name?.toLowerCase().includes(query) ||
      customer.street?.toLowerCase().includes(query) ||
      customer.city?.toLowerCase().includes(query) ||
      customer.postal_code?.includes(query)
    )
  })

  const handleSaveCustomer = async (customerData) => {
    if (selectedCustomer) {
      await onUpdateCustomer(selectedCustomer.id, customerData)
    } else {
      await onCreateCustomer(customerData)
    }
    setSelectedCustomer(null)
    setShowCreateModal(false)
  }

  const handleDeleteCustomer = async (customerId) => {
    if (confirm('Kunde wirklich löschen? Alle zugehörigen Lieferungen bleiben erhalten.')) {
      await onDeleteCustomer(customerId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-semibold ${theme.textPrimary}`}>Kundenstamm</h1>
          <p className={`text-sm ${theme.textMuted}`}>
            {customers.length} Kunden
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium ${theme.accent} text-white`}
        >
          <Plus size={18} weight="bold" />
          Neuer Kunde
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlass
          size={18}
          className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Kunden suchen..."
          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${theme.input}`}
        />
      </div>

      {/* Customer List */}
      {customersLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]" />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className={`text-center py-12 ${theme.surface} ${theme.border} border rounded-xl`}>
          <User size={48} className={`mx-auto ${theme.textMuted} mb-3`} />
          <p className={theme.textMuted}>
            {searchQuery ? 'Keine Kunden gefunden' : 'Noch keine Kunden'}
          </p>
        </div>
      ) : (
        <div className={`${theme.surface} ${theme.border} border rounded-xl overflow-hidden`}>
          <table className="w-full text-sm">
            <thead className={theme.bg}>
              <tr>
                <th className={`px-3 py-2 text-left text-xs font-medium ${theme.textMuted}`}>Name</th>
                <th className={`px-3 py-2 text-left text-xs font-medium ${theme.textMuted}`}>Adresse</th>
                <th className={`px-3 py-2 text-left text-xs font-medium ${theme.textMuted}`}>Telefon</th>
                <th className={`px-3 py-2 text-left text-xs font-medium ${theme.textMuted}`}>Hinweise</th>
                <th className={`px-2 py-2 text-center text-xs font-medium ${theme.textMuted}`}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className={`px-3 py-1.5 ${theme.textPrimary} font-medium`}>
                    {customer.name}
                  </td>
                  <td className={`px-3 py-1.5 text-xs ${theme.textSecondary}`}>
                    {customer.street}{customer.city && `, ${customer.postal_code} ${customer.city}`}
                  </td>
                  <td className={`px-3 py-1.5 text-xs`}>
                    {customer.phone && (
                      <a
                        href={`tel:${customer.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {customer.phone}
                      </a>
                    )}
                  </td>
                  <td className={`px-3 py-1.5 text-xs max-w-[200px]`}>
                    {(customer.delivery_notes || customer.access_info) ? (
                      <div className="flex items-center gap-2">
                        {customer.delivery_notes && (
                          <span className="text-amber-600 truncate" title={customer.delivery_notes}>
                            {customer.delivery_notes}
                          </span>
                        )}
                        {customer.access_info && (
                          <span className="text-blue-600 flex items-center gap-0.5" title={customer.access_info}>
                            <Key size={10} />
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className={theme.textMuted}>-</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className={`p-1 rounded ${theme.textSecondary} hover:bg-gray-100`}
                        title="Bearbeiten"
                      >
                        <PencilSimple size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="p-1 rounded text-red-500 hover:bg-red-50"
                        title="Löschen"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        theme={theme}
        isOpen={!!selectedCustomer || showCreateModal}
        customer={selectedCustomer}
        onClose={() => {
          setSelectedCustomer(null)
          setShowCreateModal(false)
        }}
        onSave={handleSaveCustomer}
      />
    </div>
  )
}
