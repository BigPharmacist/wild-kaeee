import { ArrowLeft, ArrowRight, CircleNotch, Sparkle } from '@phosphor-icons/react'

/**
 * Wiederverwendbares KI-Assistent Panel mit optionaler Versionshistorie
 */
export default function AiAssistantPanel({
  prompt,
  onPromptChange,
  onGenerate,
  generating,
  error,
  disabled,
  placeholder = "Beschreibe, was die KI schreiben soll...",
  disabledPlaceholder = "API-Key in Einstellungen hinterlegen...",
  // Optionale History-Navigation
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  historyInfo,
  // Optionale zusätzliche Klassen
  className = "",
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !generating && !disabled && prompt.trim()) {
      e.preventDefault()
      onGenerate()
    }
  }

  return (
    <div className={`px-4 py-3 bg-gradient-to-r from-violet-50 to-purple-50 border border-gray-200 ${className}`} style={{ fontFamily: 'var(--font-space)' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-violet-600">
          <Sparkle size={18} weight="fill" />
          <span className="text-sm font-medium">Kaeee-Assistent</span>
        </div>
        {disabled && (
          <span className="text-xs text-violet-400">(nicht konfiguriert)</span>
        )}
      </div>
      <div className="flex gap-2">
        <textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? disabledPlaceholder : placeholder}
          disabled={disabled}
          rows={2}
          className="flex-1 px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 placeholder-violet-300 disabled:bg-violet-50 disabled:cursor-not-allowed resize-none"
        />
        <div className="flex flex-col items-center gap-1">
          {/* History Navigation - über dem Generieren-Button */}
          {historyInfo && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onGoBack}
                disabled={!canGoBack}
                className="p-1 rounded text-violet-600 hover:bg-violet-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Vorherige Version"
              >
                <ArrowLeft size={16} weight="bold" />
              </button>
              <span className="text-xs text-violet-500 font-medium min-w-[28px] text-center">
                {historyInfo}
              </span>
              <button
                type="button"
                onClick={onGoForward}
                disabled={!canGoForward}
                className="p-1 rounded text-violet-600 hover:bg-violet-100 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Nächste Version"
              >
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating || !prompt.trim() || disabled}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <CircleNotch size={16} className="animate-spin" />
            ) : (
              <Sparkle size={16} weight="fill" />
            )}
            <span>Generieren</span>
          </button>
        </div>
      </div>
      {error && (
        <p className="text-xs text-rose-500 mt-1">{error}</p>
      )}
    </div>
  )
}
