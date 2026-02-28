import { useState } from 'react'
import { X, Play, Trash, Download, Clock } from '@phosphor-icons/react'

const ScanSessionModal = ({
  isOpen,
  onClose,
  sessions,
  sessionsLoading,
  currentSession,
  onStartNew,
  onLoadSession,
  onDeleteSession,
  onExport,
  theme,
}) => {
  const [newSessionName, setNewSessionName] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)

  if (!isOpen) return null

  const handleStartNew = () => {
    const name = newSessionName.trim() || `Inventur ${new Date().toLocaleDateString('de-DE')}`
    onStartNew(name)
    setNewSessionName('')
    setShowNewForm(false)
    onClose()
  }

  const handleLoad = (sessionId) => {
    onLoadSession(sessionId)
    onClose()
  }

  return (
    <div
      className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div
        className={`${theme.panel} rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 border-b ${theme.border} flex items-center justify-between`}>
          <h2 className={`${theme.text} text-lg font-semibold`}>Session-Verwaltung</h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.textSecondary} hover:bg-slate-100`}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* New Session */}
          {showNewForm ? (
            <div className={`mb-4 p-4 border ${theme.border} rounded-xl`}>
              <label className={`block ${theme.textSecondary} text-sm mb-2`}>
                Session-Name
              </label>
              <input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder={`Inventur ${new Date().toLocaleDateString('de-DE')}`}
                className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.input} ${theme.text}`}
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleStartNew}
                  className={`flex-1 ${theme.accent} text-white px-4 py-2 rounded-lg font-medium`}
                >
                  Starten
                </button>
                <button
                  onClick={() => setShowNewForm(false)}
                  className={`px-4 py-2 rounded-lg border ${theme.border} ${theme.textSecondary}`}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewForm(true)}
              className={`w-full mb-4 ${theme.accent} text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2`}
            >
              <Play size={20} weight="fill" />
              Neue Session starten
            </button>
          )}

          {/* Current Session Info */}
          {currentSession.id && (
            <div className={`mb-4 p-4 bg-red-50 border border-red-200 rounded-xl`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`${theme.text} font-medium`}>{currentSession.name}</div>
                  <div className={`${theme.textMuted} text-sm`}>Aktuelle Session</div>
                </div>
                <button
                  onClick={onExport}
                  className="p-2 rounded-lg text-red-700 hover:bg-red-100"
                  title="Als CSV exportieren"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Session List */}
          <div>
            <h3 className={`${theme.textSecondary} text-sm font-medium mb-2`}>
              Frühere Sessions
            </h3>

            {sessionsLoading ? (
              <div className={`${theme.textMuted} text-center py-4`}>Laden...</div>
            ) : sessions.length === 0 ? (
              <div className={`${theme.textMuted} text-center py-4 text-sm`}>
                Keine früheren Sessions vorhanden.
              </div>
            ) : (
              <div className="space-y-2">
                {sessions
                  .filter((s) => s.id !== currentSession.id)
                  .map((session) => (
                    <div
                      key={session.id}
                      className={`${theme.surface} border ${theme.border} rounded-xl p-3 flex items-center gap-3`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className={`${theme.text} font-medium truncate`}>
                          {session.name}
                        </div>
                        <div className={`${theme.textMuted} text-xs flex items-center gap-1`}>
                          <Clock size={12} />
                          {new Date(session.lastScan).toLocaleDateString('de-DE')}
                        </div>
                      </div>

                      <button
                        onClick={() => handleLoad(session.id)}
                        className={`px-3 py-1.5 rounded-lg ${theme.secondaryAccent} text-white text-sm font-medium`}
                      >
                        Laden
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Session "${session.name}" unwiderruflich löschen?`)) {
                            onDeleteSession(session.id)
                          }
                        }}
                        className={`p-2 rounded-lg ${theme.danger}`}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScanSessionModal
