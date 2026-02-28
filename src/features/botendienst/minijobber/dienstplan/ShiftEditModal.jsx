import { useState } from 'react'
import { X, Plus, Trash, Prohibit } from '@phosphor-icons/react'
import { MjShiftBadge } from '../shared/MjShiftBadge'

export function ShiftEditModal({ theme, isOpen, staffId, date, existingSchedules, shifts, profiles, onSave, onDelete, onMarkAbsent, onClose }) {
  const [absentReason, setAbsentReason] = useState('')

  if (!isOpen) return null

  const profile = profiles.find(p => p.staff_id === staffId)
  const name = profile?.staff
    ? `${profile.staff.first_name} ${profile.staff.last_name}`
    : 'Unbekannt'

  const formattedDate = new Date(date).toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
  })

  // Shifts not yet assigned (only active shifts)
  const assignedShiftIds = existingSchedules.map(s => s.shift_id)
  const availableShifts = shifts.filter(s => s.active !== false && !assignedShiftIds.includes(s.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl w-full max-w-sm`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className={`font-semibold ${theme.textPrimary}`}>{name}</h3>
            <p className={`text-sm ${theme.textSecondary}`}>{formattedDate}</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}>
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Existing Schedules */}
          {existingSchedules.length > 0 && (
            <div>
              <p className={`text-xs font-medium ${theme.textMuted} mb-2`}>Zugewiesene Schichten</p>
              <div className="space-y-2">
                {existingSchedules.map((sched) => (
                  <div key={sched.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MjShiftBadge shiftName={sched.shift?.name} />
                      {sched.absent && (
                        <span className="text-xs text-red-500">({sched.absent_reason || 'Abwesend'})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!sched.absent ? (
                        <button
                          onClick={() => onMarkAbsent(sched.id, true, absentReason || 'Abwesend')}
                          className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50"
                          title="Als abwesend markieren"
                        >
                          <Prohibit size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => onMarkAbsent(sched.id, false, null)}
                          className="p-1.5 rounded-lg text-green-500 hover:bg-green-50"
                          title="Abwesenheit aufheben"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(sched.id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                        title="Schicht entfernen"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Absent Reason */}
          {existingSchedules.some(s => !s.absent) && (
            <div>
              <label className={`block text-xs ${theme.textMuted} mb-1`}>Abwesenheitsgrund (optional)</label>
              <input
                type="text"
                value={absentReason}
                onChange={(e) => setAbsentReason(e.target.value)}
                placeholder="z.B. Krank, Urlaub..."
                className={`w-full px-3 py-2 rounded-lg border text-sm ${theme.input}`}
              />
            </div>
          )}

          {/* Add Shift */}
          {availableShifts.length > 0 && (
            <div>
              <p className={`text-xs font-medium ${theme.textMuted} mb-2`}>Schicht hinzufügen</p>
              <div className="flex flex-wrap gap-2">
                {availableShifts.map((shift) => (
                  <button
                    key={shift.id}
                    onClick={() => onSave(staffId, date, shift.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border ${theme.border} ${theme.textSecondary} hover:bg-[#FEE2E2]/30`}
                  >
                    <Plus size={14} />
                    {shift.name}
                    <span className={`text-xs ${theme.textMuted}`}>
                      ({shift.start_time?.substring(0, 5)} – {shift.end_time?.substring(0, 5)})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
