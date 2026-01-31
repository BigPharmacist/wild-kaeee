/**
 * Modal for setting weather location
 * Extracted from App.jsx
 */
function WeatherModal({
  theme,
  Icons,
  weatherModalOpen,
  closeWeatherModal,
  weatherInput,
  setWeatherInput,
  setWeatherLocation,
}) {
  if (!weatherModalOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
      onClick={closeWeatherModal}
    >
      <div
        className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-md`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border}`}>
          <div>
            <h3 className="text-base font-semibold">Wetter-Ort</h3>
            <p className={`text-xs ${theme.textMuted}`}>Standard ist der Apothekenort.</p>
          </div>
          <button
            type="button"
            onClick={closeWeatherModal}
            className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
            title="Popup schließen"
          >
            <Icons.X />
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            setWeatherLocation(weatherInput.trim())
            closeWeatherModal()
          }}
          className="p-5 space-y-4"
        >
          <div>
            <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
              Ort
            </label>
            <input
              value={weatherInput}
              onChange={(event) => setWeatherInput(event.target.value)}
              className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              placeholder="z.B. Berlin"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeWeatherModal}
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${theme.border} ${theme.bgHover}`}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.accent} text-white`}
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WeatherModal
