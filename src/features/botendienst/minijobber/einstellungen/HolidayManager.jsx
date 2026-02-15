import { useState, useEffect } from 'react'
import { Plus, Trash, DownloadSimple } from '@phosphor-icons/react'
import { useMjSettings } from '../hooks/useMjSettings'

export function HolidayManager({ theme, pharmacyId }) {
  const { holidays, fetchHolidays, addHoliday, deleteHoliday, importRlpHolidays } = useMjSettings({ pharmacyId })
  const [year, setYear] = useState(new Date().getFullYear())
  const [newDate, setNewDate] = useState('')
  const [newName, setNewName] = useState('')
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    if (pharmacyId) fetchHolidays(year)
  }, [pharmacyId, year, fetchHolidays])

  const handleAdd = async () => {
    if (!newDate || !newName) return
    await addHoliday(newDate, newName)
    setNewDate('')
    setNewName('')
  }

  const handleImport = async () => {
    setImporting(true)
    await importRlpHolidays(year)
    setImporting(false)
  }

  return (
    <div className={`${theme.surface} border ${theme.border} rounded-xl p-4 ${theme.cardShadow}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold ${theme.textPrimary}`}>Feiertage</h3>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className={`px-3 py-1.5 rounded-lg border text-sm ${theme.input}`}
          >
            {[year - 1, year, year + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={handleImport}
            disabled={importing}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${theme.border} ${theme.textSecondary} hover:bg-gray-100`}
          >
            <DownloadSimple size={14} />
            {importing ? 'Importiere...' : 'RLP importieren'}
          </button>
        </div>
      </div>

      {/* Holiday List */}
      <div className="space-y-1.5 mb-4">
        {holidays.length === 0 ? (
          <p className={`text-sm ${theme.textMuted} py-4 text-center`}>Keine Feiertage für {year}</p>
        ) : (
          holidays.map(h => (
            <div key={h.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm">
              <div className="flex items-center gap-3">
                <span className={theme.textSecondary}>
                  {new Date(h.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </span>
                <span className={theme.textPrimary}>{h.name}</span>
              </div>
              <button
                onClick={() => deleteHoliday(h.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
              >
                <Trash size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Holiday */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className={`block text-xs ${theme.textMuted} mb-1`}>Datum</label>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
          />
        </div>
        <div className="flex-1">
          <label className={`block text-xs ${theme.textMuted} mb-1`}>Bezeichnung</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="z.B. Karfreitag"
            className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!newDate || !newName}
          className={`p-2 rounded-lg ${theme.accent} text-white disabled:opacity-50`}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  )
}
