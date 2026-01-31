import { Sparkle } from '@phosphor-icons/react'

/**
 * Modal for displaying Biowetter (bio-weather) information
 * Extracted from App.jsx
 */
function BiowetterModal({
  theme,
  Icons,
  showBiowetterModal,
  setShowBiowetterModal,
  getBiowetterForecasts,
  biowetterAiLoading,
  biowetterAiRecommendation,
  biowetterLastUpdate,
}) {
  if (!showBiowetterModal) return null

  const forecasts = getBiowetterForecasts?.()
  const availableSlots = forecasts?.slots?.filter(slot => slot.available) || []
  const allEffectLabels = new Map()
  const slotEffectsMap = availableSlots.map(slot => {
    const effectMap = new Map()
    slot.effects.forEach(e => {
      allEffectLabels.set(e.label, e.label)
      effectMap.set(e.label, e)
    })
    return effectMap
  })
  const effectList = Array.from(allEffectLabels.keys())

  const weekdayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  const today = new Date()
  const getWeekday = (daysFromNow) => weekdayNames[(today.getDay() + daysFromNow) % 7]

  const days = [
    { label: getWeekday(0), slots: availableSlots.filter(s => s.dayLabel === 'Heute') },
    { label: getWeekday(1), slots: availableSlots.filter(s => s.dayLabel === 'Morgen') },
    { label: getWeekday(2), slots: availableSlots.filter(s => s.dayLabel === 'Überm.') },
  ].filter(day => day.slots.length > 0)

  return (
    <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-50 p-4`}>
      <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-lg max-h-[80vh] flex flex-col`}>
        <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
          <h3 className={`text-lg font-semibold ${theme.text}`}>Biowetter</h3>
          <button
            type="button"
            onClick={() => setShowBiowetterModal(false)}
            className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
          >
            <Icons.X />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {/* Biowetter-Tabelle */}
          {!forecasts?.slots ? (
            <p className={theme.textMuted}>Keine Daten verfügbar.</p>
          ) : effectList.length > 0 ? (
            <div className="flex">
              <div className="flex-1 mr-2">
                <div className="h-5" />
                <div className="h-4 mb-1" />
                <div className="space-y-1">
                  {effectList.map((label) => (
                    <div key={label} className="h-4 flex items-center">
                      <span className={`text-xs ${theme.text} truncate`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {days.map((day, dayIdx) => (
                <div key={day.label} className={`${dayIdx > 0 ? 'border-l border-[#E5E7EB] pl-1 ml-1' : ''}`}>
                  <div className="h-5 flex justify-center items-center">
                    <span className="text-[10px] text-[#6B7280]">{day.label}</span>
                  </div>
                  <div className="h-4 mb-1 flex gap-px justify-center items-center">
                    {day.slots.map((slot) => (
                      <div key={slot.key} className="w-[18px] text-center">
                        <span className="text-[8px] text-[#9CA3AF]">{slot.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {effectList.map((label) => (
                      <div key={label} className="h-4 flex gap-px justify-center items-center">
                        {day.slots.map((slot) => {
                          const slotIdx = availableSlots.findIndex(s => s.key === slot.key)
                          const effect = slotEffectsMap[slotIdx]?.get(label)
                          return (
                            <div key={slot.key} className="w-[18px] flex justify-center items-center">
                              <span
                                className={`w-3 h-3 rounded-sm ${effect?.dotColor || 'bg-[#27AE60]'}`}
                                title={effect ? `${effect.value}` : 'kein Einfluss'}
                              />
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-sm ${theme.textMuted}`}>Kein Einfluss erwartet.</p>
          )}

          {/* KI-Empfehlung */}
          <div className={`pt-4 border-t ${theme.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkle size={18} weight="fill" className="text-violet-500" />
              <p className={`text-sm font-medium ${theme.textSecondary}`}>KI-Empfehlung</p>
            </div>
            {biowetterAiLoading ? (
              <p className={`text-sm ${theme.textMuted} italic`}>Empfehlung wird generiert...</p>
            ) : biowetterAiRecommendation ? (
              <p className={`text-sm ${theme.text} leading-relaxed`}>{biowetterAiRecommendation}</p>
            ) : (
              <p className={`text-sm ${theme.textMuted}`}>Keine Empfehlung verfügbar.</p>
            )}
          </div>

          {/* Legende */}
          <div className={`pt-4 border-t ${theme.border}`}>
            <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>Legende</p>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#27AE60]" />
                <span className={theme.textMuted}>kein Einfluss</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#F2C94C]" />
                <span className={theme.textMuted}>gering</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#E5533D]" />
                <span className={theme.textMuted}>hoch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#2EC4B6]" />
                <span className={theme.textMuted}>Kälte</span>
              </div>
            </div>
          </div>

          {biowetterLastUpdate && (
            <p className={`text-xs ${theme.textMuted}`}>Stand: {biowetterLastUpdate}</p>
          )}
        </div>

        <div className={`flex justify-end p-4 border-t ${theme.border}`}>
          <button
            type="button"
            onClick={() => setShowBiowetterModal(false)}
            className={`px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium`}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  )
}

export default BiowetterModal
