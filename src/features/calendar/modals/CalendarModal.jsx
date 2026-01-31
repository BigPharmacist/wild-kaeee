/**
 * Modal for creating/editing calendars (Admin only)
 * Extracted from App.jsx
 */
function CalendarModal({
  theme,
  Icons,
  editingCalendar,
  calendarForm,
  setCalendarForm,
  calendarSaving,
  onClose,
  onCreate,
  onUpdate,
}) {
  if (!editingCalendar) return null

  return (
    <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-50 p-4`}>
      <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow} w-full max-w-md`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-semibold ${theme.text}`}>
            {editingCalendar.id ? 'Kalender bearbeiten' : 'Neuer Kalender'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
          >
            <Icons.X />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Name *</label>
            <input
              type="text"
              value={calendarForm.name}
              onChange={(e) => setCalendarForm((prev) => ({ ...prev, name: e.target.value }))}
              className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} ${theme.inputPlaceholder} ${theme.text}`}
              placeholder="Kalendername"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Beschreibung</label>
            <textarea
              value={calendarForm.description}
              onChange={(e) => setCalendarForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
              className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} ${theme.inputPlaceholder} resize-none ${theme.text}`}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Farbe</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={calendarForm.color}
                onChange={(e) => setCalendarForm((prev) => ({ ...prev, color: e.target.value }))}
                className="w-10 h-10 rounded-lg cursor-pointer border-0"
              />
              <div className="flex gap-2">
                {['#0D9488', '#F59E0B', '#FEF3C7', '#FF6500', '#1E293B', '#64748B'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCalendarForm((prev) => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-lg border-2 ${calendarForm.color === color ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium ${theme.textMuted} ${theme.bgHover}`}
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={() => (editingCalendar.id ? onUpdate(editingCalendar.id) : onCreate())}
              disabled={calendarSaving || !calendarForm.name.trim()}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${theme.accent} text-white disabled:opacity-40`}
            >
              {calendarSaving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarModal
