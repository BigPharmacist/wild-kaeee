import { lazy, Suspense } from 'react'

const ReactMarkdown = lazy(() => import('react-markdown'))
import remarkGfm from 'remark-gfm'

// Wrapper component for lazy-loaded ReactMarkdown
function MarkdownContent({ children }) {
  return (
    <Suspense fallback={<span className="text-gray-400">Lädt...</span>}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </Suspense>
  )
}

/**
 * Modal for displaying AMK, Recall, LAV, and RHB message details
 * Extracted from App.jsx
 */
function ApoDetailModal({
  theme,
  Icons,
  selectedApoMessage,
  setSelectedApoMessage,
  existingDokumentationen,
  onOpenDokumentationModal,
  onDownloadAmkPdf,
  onDownloadRecallPdf,
  handlePznClick,
  pznFotoUploading,
  activePzn,
  savedPznFotos,
  supabaseUrl,
}) {
  if (!selectedApoMessage) return null

  const hasSignature = existingDokumentationen.some(dok => dok.unterschrift_data)
  const isComplete = existingDokumentationen.length > 0 && hasSignature

  return (
    <div
      className={`fixed inset-0 ${theme.overlay} z-50 flex items-center justify-center p-4`}
      onClick={() => setSelectedApoMessage(null)}
    >
      <div
        className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-start justify-between p-4 border-b ${theme.border}`}>
          <div className="flex-1 pr-4">
            <h3 className={`text-lg font-semibold ${theme.text}`}>
              {selectedApoMessage.type === 'lav'
                ? (selectedApoMessage.subject || `LAV-Info ${selectedApoMessage.ausgabe}`)
                : selectedApoMessage.title}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-sm ${theme.textMuted}`}>
                {selectedApoMessage.type === 'lav'
                  ? (selectedApoMessage.datum ? new Date(selectedApoMessage.datum).toLocaleDateString('de-DE') : '')
                  : (selectedApoMessage.date ? new Date(selectedApoMessage.date).toLocaleDateString('de-DE') : '')}
              </span>
              {selectedApoMessage.type === 'lav' && selectedApoMessage.ausgabe && (
                <span className={`text-xs px-2 py-0.5 rounded ${theme.surface} ${theme.textMuted}`}>
                  Ausgabe {selectedApoMessage.ausgabe}
                </span>
              )}
              {selectedApoMessage.category && (
                <span className={`text-xs px-2 py-0.5 rounded ${theme.surface} ${theme.textMuted}`}>
                  {selectedApoMessage.category}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {selectedApoMessage.type === 'amk' && (
              <>
                <button
                  type="button"
                  onClick={onOpenDokumentationModal}
                  className={`${isComplete ? theme.primaryBg : 'bg-[#FF6500] hover:bg-[#E65A00]'} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                >
                  Bearbeiten
                </button>
                <button
                  type="button"
                  onClick={() => onDownloadAmkPdf(selectedApoMessage)}
                  className={`${theme.accentText} ${theme.bgHover} p-2 rounded-lg`}
                  title="Als PDF herunterladen"
                >
                  <Icons.Download />
                </button>
              </>
            )}
            {selectedApoMessage.type === 'recall' && (
              <>
                <button
                  type="button"
                  onClick={onOpenDokumentationModal}
                  className={`${isComplete ? theme.primaryBg : 'bg-[#FF6500] hover:bg-[#E65A00]'} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                >
                  Bearbeiten
                </button>
                <button
                  type="button"
                  onClick={() => onDownloadRecallPdf(selectedApoMessage)}
                  className={`${theme.accentText} ${theme.bgHover} p-2 rounded-lg`}
                  title="Als PDF herunterladen"
                >
                  <Icons.Download />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setSelectedApoMessage(null)}
              className={`${theme.textMuted} ${theme.bgHover} p-2 rounded-lg`}
            >
              <Icons.X />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <Suspense fallback={<div className={theme.textMuted}>Lädt...</div>}>
            {selectedApoMessage.type === 'amk' && selectedApoMessage.institution && (
              <p className={`text-sm ${theme.textSecondary} mb-3`}>
                <strong>Institution:</strong> {selectedApoMessage.institution}
              </p>
            )}

            {selectedApoMessage.type === 'recall' && selectedApoMessage.product_name && (
              <p className={`text-sm ${theme.textSecondary} mb-3`}>
                <strong>Produkt:</strong> {selectedApoMessage.product_name}
              </p>
            )}
            {selectedApoMessage.type === 'recall' && selectedApoMessage.recall_number && (
              <p className={`text-sm ${theme.textSecondary} mb-3`}>
                <strong>Rückrufnummer:</strong> {selectedApoMessage.recall_number}
              </p>
            )}

            {/* Volltext für Rückrufe - oben anzeigen */}
            {selectedApoMessage.type === 'recall' && selectedApoMessage.full_text && (
              <div className="mb-4">
                <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Vollständiger Text:</p>
                <div className={`text-sm ${theme.text} markdown-content`}>
                  <MarkdownContent>{selectedApoMessage.full_text}</MarkdownContent>
                </div>
              </div>
            )}

            {/* AI-Analyse Felder für Rückrufe */}
            {selectedApoMessage.type === 'recall' && selectedApoMessage.ai_chargen_alle !== null && (
              <p className={`text-sm ${theme.textSecondary} mb-3`}>
                <strong>Alle Chargen betroffen:</strong> {selectedApoMessage.ai_chargen_alle ? 'Ja' : 'Nein'}
              </p>
            )}
            {selectedApoMessage.type === 'recall' && selectedApoMessage.ai_chargen_liste && selectedApoMessage.ai_chargen_liste.length > 0 && (
              <div className="mb-4">
                <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Betroffene Chargen:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedApoMessage.ai_chargen_liste.map((charge, i) => (
                    <span key={i} className={`text-xs px-2 py-1 rounded ${theme.surface} ${theme.text} border ${theme.border}`}>
                      {charge}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {selectedApoMessage.type === 'recall' && selectedApoMessage.ai_pzn_betroffen && selectedApoMessage.ai_pzn_betroffen.length > 0 && (
              <div className="mb-4">
                <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Betroffene PZN (antippen für Foto):</p>
                <div className="flex flex-wrap gap-1">
                  {selectedApoMessage.ai_pzn_betroffen.map((pzn, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handlePznClick(pzn)}
                      disabled={pznFotoUploading}
                      className={`text-xs px-2 py-1 rounded ${theme.accent} text-white font-mono hover:opacity-80 transition-opacity relative ${pznFotoUploading ? 'opacity-50' : ''}`}
                      title={savedPznFotos[pzn] ? `Foto für PZN ${pzn} ersetzen` : `Foto für PZN ${pzn} aufnehmen`}
                    >
                      {pzn}
                      {pznFotoUploading && activePzn === pzn && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-white animate-pulse" />
                      )}
                      {savedPznFotos[pzn] && !(pznFotoUploading && activePzn === pzn) && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedApoMessage.type === 'recall' && selectedApoMessage.ai_packungsgrößen && selectedApoMessage.ai_packungsgrößen.length > 0 && (
              <div className="mb-4">
                <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Packungsgrößen:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedApoMessage.ai_packungsgrößen.map((größe, i) => (
                    <span key={i} className={`text-xs px-2 py-1 rounded ${theme.surface} ${theme.text} border ${theme.border}`}>
                      {größe}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* LAV-Info Themen */}
            {selectedApoMessage.type === 'lav' && selectedApoMessage.lav_themes && selectedApoMessage.lav_themes.length > 0 && (
              <div className="mb-4">
                <p className={`text-sm font-medium ${theme.textSecondary} mb-2`}>Themen dieser Ausgabe:</p>
                <div className="space-y-2">
                  {selectedApoMessage.lav_themes
                    .sort((a, b) => (a.punkt_nr || 0) - (b.punkt_nr || 0))
                    .map((thema) => (
                      thema.volltext ? (
                        <details
                          key={thema.id}
                          className={`${theme.surface} border ${theme.border} rounded-lg overflow-hidden`}
                        >
                          <summary className={`px-3 py-2 cursor-pointer ${theme.bgHover} flex items-center gap-2`}>
                            {thema.punkt_nr && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${theme.accent} text-white font-medium`}>
                                {thema.punkt_nr}
                              </span>
                            )}
                            <span className={`text-sm font-medium ${theme.text}`}>{thema.titel || 'Kein Titel'}</span>
                            {thema.ist_arbeitsrecht && (
                              <span className={`text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400`}>
                                Arbeitsrecht
                              </span>
                            )}
                          </summary>
                          <div className={`px-3 py-2 border-t ${theme.border}`}>
                            <div className={`text-sm ${theme.text} markdown-content`}>
                              <MarkdownContent>{thema.volltext}</MarkdownContent>
                            </div>
                          </div>
                        </details>
                      ) : (
                        <div
                          key={thema.id}
                          className={`${theme.surface} border ${theme.border} rounded-lg px-3 py-2 flex items-center gap-2`}
                        >
                          {thema.punkt_nr && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${theme.accent} text-white font-medium`}>
                              {thema.punkt_nr}
                            </span>
                          )}
                          <span className={`text-sm font-medium ${theme.text}`}>{thema.titel || 'Kein Titel'}</span>
                          {thema.ist_arbeitsrecht && (
                            <span className={`text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400`}>
                              Arbeitsrecht
                            </span>
                          )}
                        </div>
                      )
                    ))}
                </div>
              </div>
            )}

            {/* LAV-Info PDF Links */}
            {selectedApoMessage.type === 'lav' && selectedApoMessage.main_pdf_url && (
              <div className="mb-4">
                <a
                  href={`${supabaseUrl}${selectedApoMessage.main_pdf_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 text-sm ${theme.accentText} hover:underline`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF herunterladen
                </a>
              </div>
            )}

            {selectedApoMessage.type === 'lav' && selectedApoMessage.attachment_urls && selectedApoMessage.attachment_urls.length > 0 && (
              <div className="mb-4">
                <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Anhänge:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedApoMessage.attachment_urls.map((url, i) => (
                    <a
                      key={i}
                      href={`${supabaseUrl}${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${theme.surface} ${theme.accentText} hover:underline border ${theme.border}`}
                    >
                      Anhang {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Beschreibung, Produkte, wichtige Infos nur für Nicht-AMK (bei AMK ist alles im full_text) */}
            {selectedApoMessage.type !== 'amk' && selectedApoMessage.description && (
              <div className="mb-4">
                <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Beschreibung:</p>
                <div className={`text-sm ${theme.text} markdown-content`}>
                  <MarkdownContent>{selectedApoMessage.description}</MarkdownContent>
                </div>
              </div>
            )}
            {selectedApoMessage.type !== 'amk' && selectedApoMessage.affected_products && selectedApoMessage.affected_products.length > 0 && (
              <div className="mb-4">
                <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Betroffene Produkte:</p>
                <ul className={`text-sm ${theme.text} list-disc list-inside space-y-1`}>
                  {selectedApoMessage.affected_products.map((p, i) => (
                    <li key={i} className="markdown-content"><MarkdownContent>{p}</MarkdownContent></li>
                  ))}
                </ul>
              </div>
            )}
            {selectedApoMessage.type !== 'amk' && selectedApoMessage.important_info && selectedApoMessage.important_info.length > 0 && (
              <div className="mb-4">
                <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Wichtige Informationen:</p>
                <ul className={`text-sm ${theme.text} list-disc list-inside space-y-1`}>
                  {selectedApoMessage.important_info.map((info, i) => (
                    <li key={i} className="markdown-content"><MarkdownContent>{info}</MarkdownContent></li>
                  ))}
                </ul>
              </div>
            )}
            {selectedApoMessage.type !== 'recall' && selectedApoMessage.full_text && (
              <div>
                {selectedApoMessage.type !== 'amk' && (
                  <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Vollständiger Text:</p>
                )}
                <div className={`text-sm ${theme.text} markdown-content`}>
                  <MarkdownContent>
                    {selectedApoMessage.type === 'amk'
                      ? selectedApoMessage.full_text.replace(/^#[^\n]*\n+/, '')
                      : selectedApoMessage.full_text}
                  </MarkdownContent>
                </div>
              </div>
            )}
            {selectedApoMessage.message_url && (
              <a
                href={selectedApoMessage.message_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-block mt-4 text-sm ${theme.accentText} hover:underline`}
              >
                Zur Originalquelle →
              </a>
            )}
            {selectedApoMessage.recall_url && (
              <a
                href={selectedApoMessage.recall_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-block mt-4 text-sm ${theme.accentText} hover:underline`}
              >
                Zur Originalquelle →
              </a>
            )}

            {/* Gespeicherte Dokumentationen für AMK und Rückrufe - ganz unten */}
            {(selectedApoMessage.type === 'amk' || selectedApoMessage.type === 'recall') && existingDokumentationen.length > 0 && (
              <div className={`mt-6 p-3 rounded-xl ${theme.surface} border ${theme.border}`}>
                <p className={`text-sm font-medium ${theme.accentText} mb-2`}>Dokumentation:</p>
                <div className="space-y-2">
                  {existingDokumentationen.map((dok) => (
                    <div key={dok.id} className={`p-2 rounded-lg bg-white border ${theme.border}`}>
                      {dok.bemerkung && (
                        <p className={`text-sm ${theme.text}`}>{dok.bemerkung}</p>
                      )}
                      {dok.unterschrift_data && (
                        <img src={dok.unterschrift_data} alt="Unterschrift" className="h-12 mt-2 border rounded" />
                      )}
                      <p className={`text-xs ${theme.textMuted} mt-1`}>
                        {dok.erstellt_von_name && <span className="font-medium">{dok.erstellt_von_name}</span>}
                        {dok.erstellt_von_name && dok.erstellt_am && ' · '}
                        {dok.erstellt_am ? new Date(dok.erstellt_am).toLocaleString('de-DE') : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Suspense>
        </div>

        {/* Footer */}
        <div className={`flex justify-end p-4 border-t ${theme.border}`}>
          <button
            type="button"
            onClick={() => setSelectedApoMessage(null)}
            className={`px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium`}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  )
}

export default ApoDetailModal
