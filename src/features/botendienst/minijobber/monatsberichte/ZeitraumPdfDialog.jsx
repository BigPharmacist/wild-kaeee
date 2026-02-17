import { useState } from 'react'
import { X, FilePdf } from '@phosphor-icons/react'
import { generateZeitraumPdf } from './MonatsberichtPdf'

export function ZeitraumPdfDialog({ theme, isOpen, pharmacyId, pharmacy, profiles, calculateRangeReport, onClose }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [staffId, setStaffId] = useState('')
  const [generating, setGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!startDate || !endDate || !staffId) return

    setGenerating(true)

    const reportData = await calculateRangeReport(staffId, startDate, endDate)
    if (!reportData) {
      alert('Keine Daten für den gewählten Zeitraum vorhanden')
      setGenerating(false)
      return
    }

    const profile = profiles.find(p => p.staff_id === staffId)
    const name = profile?.staff
      ? `${profile.staff.first_name} ${profile.staff.last_name}`
      : 'Unbekannt'

    generateZeitraumPdf({
      pharmacy,
      employeeName: name,
      startDate,
      endDate,
      reportData,
    })

    setGenerating(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl w-full max-w-md`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>Zeitraum-PDF erstellen</h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Employee select */}
          <div>
            <label className={`block text-sm font-medium ${theme.textPrimary} mb-1`}>Mitarbeiter</label>
            <select
              value={staffId}
              onChange={e => setStaffId(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm ${theme.input}`}
            >
              <option value="">Bitte wählen...</option>
              {profiles.map(p => (
                <option key={p.staff_id} value={p.staff_id}>
                  {p.staff ? `${p.staff.first_name} ${p.staff.last_name}` : 'Unbekannt'}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={`block text-sm font-medium ${theme.textPrimary} mb-1`}>Von</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm ${theme.input}`}
              />
            </div>
            <div className="flex-1">
              <label className={`block text-sm font-medium ${theme.textPrimary} mb-1`}>Bis</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm ${theme.input}`}
              />
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!startDate || !endDate || !staffId || generating}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium text-sm disabled:opacity-50`}
          >
            {generating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <FilePdf size={18} />
            )}
            {generating ? 'Erstelle PDF...' : 'PDF erstellen'}
          </button>
        </div>
      </div>
    </div>
  )
}
