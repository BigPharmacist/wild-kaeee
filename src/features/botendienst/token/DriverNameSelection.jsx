import { User, Moped, CircleNotch } from '@phosphor-icons/react'

export function DriverNameSelection({
  tourName,
  savedNames,
  onSave,
  showNameInput,
  setShowNameInput,
  customName,
  setCustomName,
  savingName,
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Moped size={32} className="text-red-700" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Botendienst</h1>
          <p className="text-gray-500 mt-1">{tourName || 'Tour'}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Wer fährt heute?
          </label>

          {/* Vorgeschlagene Namen */}
          <div className="space-y-2">
            {savedNames.map((name) => (
              <button
                key={name}
                onClick={() => onSave(name)}
                disabled={savingName}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  savingName
                    ? 'border-gray-200 bg-gray-50 cursor-wait'
                    : 'border-gray-200 hover:border-red-400 hover:bg-red-50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={20} className="text-gray-500" />
                </div>
                <span className="font-medium text-gray-900">{name}</span>
              </button>
            ))}
          </div>

          {/* Anderen Namen eingeben */}
          {!showNameInput ? (
            <button
              onClick={() => setShowNameInput(true)}
              disabled={savingName}
              className="w-full mt-3 p-3 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-700 transition-all disabled:opacity-50"
            >
              + Anderen Namen eingeben
            </button>
          ) : (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Name eingeben..."
                autoFocus
                disabled={savingName}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:bg-gray-100"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customName.trim() && !savingName) {
                    onSave(customName)
                  }
                }}
              />
              <button
                onClick={() => {
                  if (customName.trim()) {
                    onSave(customName)
                  }
                }}
                disabled={!customName.trim() || savingName}
                className="px-4 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {savingName ? <CircleNotch size={20} className="animate-spin" /> : 'OK'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
