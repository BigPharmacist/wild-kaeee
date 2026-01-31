import { Printer } from '@phosphor-icons/react'

/**
 * Modal for creating/editing calendar events
 * Extracted from App.jsx
 */
function EventModal({
  theme,
  Icons,
  editingEvent,
  eventForm,
  setEventForm,
  eventSaving,
  eventError,
  canWriteCurrentCalendar,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onOpenFaxPdfPopup,
}) {
  if (!editingEvent) return null

  return (
    <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-50 p-4`}>
      <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow} w-full max-w-md`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-semibold ${theme.text}`}>
            {editingEvent.id ? 'Termin bearbeiten' : 'Neuer Termin'}
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
            <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Titel *</label>
            <input
              type="text"
              value={eventForm.title}
              onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
              className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} ${theme.inputPlaceholder} ${theme.text}`}
              placeholder="Terminname"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={eventForm.allDay}
              onChange={(e) => setEventForm((prev) => ({ ...prev, allDay: e.target.checked }))}
              className={`rounded ${theme.border}`}
            />
            <span className={`text-sm ${theme.textSecondary}`}>Ganztägig</span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Start</label>
              <input
                type="date"
                value={eventForm.startDate}
                onChange={(e) =>
                  setEventForm((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                    endDate: prev.endDate || e.target.value,
                  }))
                }
                className={`w-full px-3 py-2 rounded-xl border ${theme.input} text-sm ${theme.text}`}
              />
              {!eventForm.allDay && (
                <input
                  type="time"
                  value={eventForm.startTime}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border ${theme.input} text-sm mt-2 ${theme.text}`}
                />
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Ende</label>
              <input
                type="date"
                value={eventForm.endDate}
                onChange={(e) => setEventForm((prev) => ({ ...prev, endDate: e.target.value }))}
                className={`w-full px-3 py-2 rounded-xl border ${theme.input} text-sm ${theme.text}`}
              />
              {!eventForm.allDay && (
                <input
                  type="time"
                  value={eventForm.endTime}
                  onChange={(e) => setEventForm((prev) => ({ ...prev, endTime: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border ${theme.input} text-sm mt-2 ${theme.text}`}
                />
              )}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Ort</label>
            <input
              type="text"
              value={eventForm.location}
              onChange={(e) => setEventForm((prev) => ({ ...prev, location: e.target.value }))}
              className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} ${theme.inputPlaceholder} ${theme.text}`}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Beschreibung</label>
            {/* Prüfen ob Fax-Link vorhanden */}
            {eventForm.description && eventForm.description.includes('[fax:') ? (
              <div className={`w-full px-4 py-2.5 rounded-xl border ${theme.border} ${theme.surface} ${theme.text} text-sm`}>
                {/* Text vor dem Link */}
                {eventForm.description.split('[fax:')[0].trim() && (
                  <p className="mb-2 whitespace-pre-wrap">{eventForm.description.split('[fax:')[0].trim()}</p>
                )}
                {/* Fax-Link als Button */}
                <button
                  type="button"
                  onClick={() => {
                    const match = eventForm.description.match(/\[fax:([a-f0-9-]+)\]/)
                    if (match && onOpenFaxPdfPopup) {
                      onOpenFaxPdfPopup(match[1])
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <Printer size={18} />
                  <span className="font-medium">Fax-Ankündigung anzeigen</span>
                </button>
              </div>
            ) : (
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
                className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} ${theme.inputPlaceholder} resize-none ${theme.text}`}
                placeholder="Optional"
              />
            )}
          </div>

          {eventError && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <p className="text-rose-400 text-sm">{eventError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {editingEvent.id && canWriteCurrentCalendar() && (
              <button
                type="button"
                onClick={() => onDelete(editingEvent.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium ${theme.danger} border ${theme.border}`}
              >
                Löschen
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium ${theme.textMuted} ${theme.bgHover}`}
            >
              Abbrechen
            </button>
            {canWriteCurrentCalendar() && (
              <button
                type="button"
                onClick={() => (editingEvent.id ? onUpdate(editingEvent.id) : onCreate())}
                disabled={eventSaving || !eventForm.title.trim()}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${theme.accent} text-white disabled:opacity-40`}
              >
                {eventSaving ? 'Speichern...' : 'Speichern'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventModal
