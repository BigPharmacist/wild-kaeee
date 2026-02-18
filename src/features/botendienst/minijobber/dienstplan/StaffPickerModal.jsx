import { X, Trash, Prohibit } from '@phosphor-icons/react'
import { getStaffColor, getStaffInitials } from '../shared/staffColors'

/**
 * Modal to pick a staff member for a specific shift + date.
 * Shows all active profiles; highlights current assignment.
 * Allows reassignment, removal, or marking absent.
 */
export function StaffPickerModal({ theme, shiftId, date, currentStaffId, existingEntry, shifts, profiles, onAssign, onRemove, onMarkAbsent, onClose }) {
  const shift = shifts.find(s => s.id === shiftId)
  const shiftName = shift?.name || 'Schicht'
  const timeLabel = (shift?.start_time && shift?.end_time)
    ? `${shift.start_time.substring(0, 5)} – ${shift.end_time.substring(0, 5)}`
    : ''

  const formattedDate = new Date(date).toLocaleDateString('de-DE', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
  })

  const activeProfiles = profiles.filter(p => p.active)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl w-full max-w-xs`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h3 className={`font-semibold ${theme.textPrimary}`}>{shiftName}</h3>
            <p className={`text-xs ${theme.textSecondary}`}>
              {formattedDate}
              {timeLabel && <span className="ml-1 text-gray-400">({timeLabel})</span>}
            </p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}>
            <X size={18} />
          </button>
        </div>

        {/* Staff list */}
        <div className="p-2 max-h-[320px] overflow-y-auto">
          {activeProfiles.map(profile => {
            const color = getStaffColor(profile.staff_id)
            const initials = getStaffInitials(profile)
            const name = profile.staff?.first_name || '?'
            const lastName = profile.staff?.last_name || ''
            const isCurrentlyAssigned = profile.staff_id === currentStaffId
            const isAbsent = isCurrentlyAssigned && existingEntry?.absent

            return (
              <div
                key={profile.staff_id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  isCurrentlyAssigned
                    ? `${color.barBg} ring-1 ring-inset ring-gray-200`
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  if (!isCurrentlyAssigned) {
                    onAssign(profile.staff_id)
                  }
                }}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${color.bg} ${color.text}`}>
                  {initials}
                </span>
                <span className={`text-sm font-medium flex-1 truncate ${
                  isAbsent ? 'text-red-500 line-through' : theme.textPrimary
                }`}>
                  {name} {lastName}
                </span>

                {isCurrentlyAssigned && (
                  <div className="flex items-center gap-1">
                    {!isAbsent ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onMarkAbsent(true) }}
                        className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-100"
                        title="Als abwesend markieren"
                      >
                        <Prohibit size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); onMarkAbsent(false) }}
                        className="p-1.5 rounded-lg text-green-500 hover:bg-green-100"
                        title="Abwesenheit aufheben"
                      >
                        <span className="text-xs font-bold">OK</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove() }}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-100"
                      title="Zuweisung entfernen"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {activeProfiles.length === 0 && (
            <p className={`text-sm ${theme.textMuted} text-center py-4`}>Keine aktiven Mitarbeiter</p>
          )}
        </div>
      </div>
    </div>
  )
}
