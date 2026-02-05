import { memo, useState } from 'react'
import { Newspaper, CaretLeft, CaretRight, Warning, Info, Wrench, CalendarBlank, ArrowUp, X } from '@phosphor-icons/react'
import { getKategorieStyle } from './useNews'

// Kategorie-Icons
const kategorieIcons = {
  Info: Info,
  Wichtig: Warning,
  Update: ArrowUp,
  Wartung: Wrench,
  Event: CalendarBlank,
}

const NewsWidget = memo(function NewsWidget({
  theme,
  news,
  newsLoading,
  newsError,
  ReactMarkdown,
  remarkGfm,
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showModal, setShowModal] = useState(false)

  // Keine News vorhanden
  if (!newsLoading && (!news || news.length === 0)) {
    return null // Widget wird nicht angezeigt wenn keine News
  }

  const currentNews = news?.[currentIndex]
  const hasMultiple = news?.length > 1
  const KategorieIcon = currentNews ? kategorieIcons[currentNews.kategorie] || Info : Info

  return (
    <>
      <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow} flex flex-col gap-3 ${currentNews?.prioritaet === 'hoch' ? 'ring-2 ring-red-500/30' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-medium ${theme.text}`}>News</h3>
          {hasMultiple && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentIndex(i => (i - 1 + news.length) % news.length)}
                className={`p-1 rounded ${theme.bgHover} ${theme.text}`}
                title="Vorherige News"
              >
                <CaretLeft size={16} />
              </button>
              <span className={`text-xs ${theme.textMuted} min-w-[2rem] text-center`}>
                {currentIndex + 1}/{news.length}
              </span>
              <button
                type="button"
                onClick={() => setCurrentIndex(i => (i + 1) % news.length)}
                className={`p-1 rounded ${theme.bgHover} ${theme.text}`}
                title="Nächste News"
              >
                <CaretRight size={16} />
              </button>
            </div>
          )}
        </div>

        {newsLoading && (
          <p className={`text-xs ${theme.textMuted}`}>News werden geladen...</p>
        )}

        {!newsLoading && newsError && (
          <p className="text-rose-400 text-sm">{newsError}</p>
        )}

        {!newsLoading && !newsError && currentNews && (
          <div
            className="space-y-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setShowModal(true)}
            title="Klicken für vollständige Ansicht"
          >
            {/* Kategorie-Badge und Titel */}
            <div className="flex items-start gap-2">
              <span className={`flex-shrink-0 p-1.5 rounded-lg ${getKategorieStyle(currentNews.kategorie)}`}>
                <KategorieIcon size={14} weight="bold" />
              </span>
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-semibold ${theme.text} leading-tight`}>{currentNews.titel}</h4>
                <p className={`text-[10px] ${theme.textMuted} mt-0.5`}>
                  {currentNews.autor_name} • {new Date(currentNews.erstellt_am).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                  {currentNews.gueltig_bis && (
                    <span className="text-orange-500">
                      {' '}• bis {new Date(currentNews.gueltig_bis).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Inhalt (Markdown) - gekürzt */}
            <div className={`text-xs ${theme.textSecondary} line-clamp-4`}>
              {ReactMarkdown ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-1">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-1">{children}</ol>,
                    strong: ({ children }) => <strong className={theme.text}>{children}</strong>,
                    a: ({ children, href }) => <a href={href} className={`${theme.accentText} underline`} target="_blank" rel="noopener noreferrer">{children}</a>,
                  }}
                >
                  {currentNews.info}
                </ReactMarkdown>
              ) : (
                <p>{currentNews.info}</p>
              )}
            </div>

            {/* "Mehr lesen" Hinweis wenn Text abgeschnitten */}
            {currentNews.info && currentNews.info.length > 150 && (
              <p className={`text-[10px] ${theme.accentText} font-medium`}>Mehr lesen...</p>
            )}
          </div>
        )}

        {/* Pagination Dots bei mehreren News */}
        {!newsLoading && !newsError && hasMultiple && (
          <div className="flex items-center justify-center gap-1 pt-1">
            {news.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx === currentIndex ? 'bg-[#F59E0B]' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                title={`News ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail-Modal */}
      {showModal && currentNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 ${theme.overlay}`}
            onClick={() => setShowModal(false)}
          />
          <div className={`relative ${theme.panel} rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden ${theme.cardShadow} flex flex-col`}>
            {/* Modal Header */}
            <div className={`flex items-start justify-between p-5 border-b ${theme.border}`}>
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className={`flex-shrink-0 p-2 rounded-lg ${getKategorieStyle(currentNews.kategorie)}`}>
                  <KategorieIcon size={20} weight="bold" />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-semibold ${theme.text} leading-tight`}>{currentNews.titel}</h3>
                  <p className={`text-xs ${theme.textMuted} mt-1`}>
                    {currentNews.autor_name} • {new Date(currentNews.erstellt_am).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                    {currentNews.gueltig_bis && (
                      <span className="text-orange-500">
                        {' '}• Gültig bis {new Date(currentNews.gueltig_bis).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </p>
                  <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${getKategorieStyle(currentNews.kategorie)}`}>
                    {currentNews.kategorie}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted} flex-shrink-0`}
                title="Schließen"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1">
              <div className={`prose prose-sm max-w-none ${theme.text}`}>
                {ReactMarkdown ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className={`mb-3 ${theme.textSecondary}`}>{children}</p>,
                      h1: ({ children }) => <h1 className={`text-xl font-bold mb-2 ${theme.text}`}>{children}</h1>,
                      h2: ({ children }) => <h2 className={`text-lg font-semibold mb-2 ${theme.text}`}>{children}</h2>,
                      h3: ({ children }) => <h3 className={`text-base font-semibold mb-2 ${theme.text}`}>{children}</h3>,
                      ul: ({ children }) => <ul className={`list-disc list-inside mb-3 ${theme.textSecondary}`}>{children}</ul>,
                      ol: ({ children }) => <ol className={`list-decimal list-inside mb-3 ${theme.textSecondary}`}>{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      strong: ({ children }) => <strong className={theme.text}>{children}</strong>,
                      em: ({ children }) => <em>{children}</em>,
                      blockquote: ({ children }) => <blockquote className={`border-l-4 border-[#F59E0B] pl-4 my-3 ${theme.textMuted} italic`}>{children}</blockquote>,
                      a: ({ children, href }) => <a href={href} className={`${theme.accentText} underline hover:opacity-80`} target="_blank" rel="noopener noreferrer">{children}</a>,
                      code: ({ children }) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
                      pre: ({ children }) => <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-3">{children}</pre>,
                    }}
                  >
                    {currentNews.info}
                  </ReactMarkdown>
                ) : (
                  <p className={theme.textSecondary}>{currentNews.info}</p>
                )}
              </div>
            </div>

            {/* Modal Footer mit Navigation */}
            {hasMultiple && (
              <div className={`flex items-center justify-between p-4 border-t ${theme.border}`}>
                <button
                  type="button"
                  onClick={() => setCurrentIndex(i => (i - 1 + news.length) % news.length)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${theme.bgHover} ${theme.text}`}
                >
                  <CaretLeft size={16} />
                  Vorherige
                </button>
                <span className={`text-xs ${theme.textMuted}`}>
                  {currentIndex + 1} von {news.length}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentIndex(i => (i + 1) % news.length)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${theme.bgHover} ${theme.text}`}
                >
                  Nächste
                  <CaretRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
})

export default NewsWidget
