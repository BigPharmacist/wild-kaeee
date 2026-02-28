import { useState, useEffect } from 'react'
import { Plus, PencilSimple, Trash, Note } from '@phosphor-icons/react'
import { useMjInfoEntries } from '../hooks/useMjInfoEntries'
import { MjMonthSelector } from '../shared/MjMonthSelector'
import { InfoEntryModal } from './InfoEntryModal'

export function InfoView({ theme, pharmacyId }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [showModal, setShowModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)

  const { entries, loading, fetchEntries, createEntry, updateEntry, deleteEntry } = useMjInfoEntries({ pharmacyId })

  useEffect(() => {
    if (pharmacyId) fetchEntries(year, month)
  }, [pharmacyId, year, month, fetchEntries])

  const handleCreate = () => {
    setEditingEntry(null)
    setShowModal(true)
  }

  const handleEdit = (entry) => {
    setEditingEntry(entry)
    setShowModal(true)
  }

  const handleSave = async (text) => {
    if (editingEntry) {
      await updateEntry(editingEntry.id, text)
    } else {
      await createEntry(year, month, text)
    }
    setShowModal(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Eintrag löschen?')) return
    await deleteEntry(id)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`${theme.surface} border ${theme.border} rounded-xl p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MjMonthSelector theme={theme} year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m) }} />
          <button
            onClick={handleCreate}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium text-sm`}
          >
            <Plus size={18} weight="bold" />
            Neuer Eintrag
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className={`${theme.surface} border ${theme.border} rounded-xl p-12 flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DC2626]" />
        </div>
      )}

      {/* Entries */}
      {!loading && entries.length === 0 && (
        <div className={`${theme.surface} border ${theme.border} rounded-xl p-12 text-center`}>
          <Note size={48} className={theme.textMuted} />
          <p className={`mt-3 ${theme.textMuted}`}>Keine Einträge für diesen Monat</p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="space-y-3">
          {entries.map(entry => (
            <div key={entry.id} className={`${theme.surface} border ${theme.border} rounded-xl p-4 ${theme.cardShadow}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className={`text-sm ${theme.textPrimary} whitespace-pre-wrap`}>{entry.text}</p>
                  <p className={`mt-2 text-xs ${theme.textMuted}`}>
                    {entry.staff ? `${entry.staff.first_name} ${entry.staff.last_name}` : ''}
                    {entry.staff ? ' · ' : ''}
                    {new Date(entry.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <PencilSimple size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <InfoEntryModal
          theme={theme}
          isOpen={showModal}
          entry={editingEntry}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
