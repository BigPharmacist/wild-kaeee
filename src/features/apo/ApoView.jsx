const ApoView = ({
  theme,
  Icons,
  apoYear,
  changeApoYear,
  apoSearch,
  setApoSearch,
  apoTab,
  amkLoading,
  amkMessages,
  recallLoading,
  recallMessages,
  lavLoading,
  lavAusgaben,
  filterApoItems,
  groupByMonth,
  monthNames,
  currentStaff,
  readMessageIds,
  setSelectedApoMessage,
  markAsRead,
  loadDokumentationen,
  ReactMarkdown,
  remarkGfm,
}) => (
  <>
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Apo</h2>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => changeApoYear(-1)}
          className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
          title="Vorheriges Jahr"
        >
          <Icons.ChevronLeft />
        </button>
        <span className={`text-sm font-medium ${theme.text} min-w-[80px] text-center`}>
          {apoYear}
        </span>
        <button
          type="button"
          onClick={() => changeApoYear(1)}
          className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
          title="Nächstes Jahr"
        >
          <Icons.ChevronRight />
        </button>
      </div>
    </div>

    <div className="mb-6">
      <div className="relative">
        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={apoSearch}
          onChange={(e) => setApoSearch(e.target.value)}
          placeholder="Suchen..."
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${theme.border} ${theme.input} text-sm`}
        />
        {apoSearch && (
          <button
            type="button"
            onClick={() => setApoSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            title="Suche löschen"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>

    {apoTab === 'amk' && (
      <div>
        {amkLoading ? (
          <p className={theme.textMuted}>AMK-Meldungen werden geladen...</p>
        ) : amkMessages.length === 0 ? (
          <p className={theme.textMuted}>Keine AMK-Meldungen in diesem Jahr.</p>
        ) : filterApoItems(amkMessages, apoSearch, 'amk').length === 0 ? (
          <p className={theme.textMuted}>Keine Treffer für „{apoSearch}".</p>
        ) : (
          <div className="space-y-8">
            {groupByMonth(filterApoItems(amkMessages, apoSearch, 'amk'), 'date').map((group) => (
              <div key={group.month}>
                <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>{monthNames[group.month]}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.items.map((msg) => {
                    const userCreatedAt = currentStaff?.created_at ? new Date(currentStaff.created_at) : new Date(0)
                    const msgDate = msg.date ? new Date(msg.date) : new Date(0)
                    const isUnread = !readMessageIds.amk.has(String(msg.id)) && msgDate >= userCreatedAt
                    return (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => {
                          setSelectedApoMessage({ ...msg, type: 'amk' })
                          markAsRead('amk', msg.id)
                          loadDokumentationen(msg.id, 'amk')
                        }}
                        className={`text-left ${theme.panel} rounded-2xl border ${theme.border} p-5 ${theme.cardShadow} ${theme.cardHoverShadow} hover:border-[#FD8916] transition-all flex flex-col h-full ${isUnread ? 'ring-2 ring-blue-400' : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className={`text-xs ${theme.textMuted}`}>
                            {msg.date ? new Date(msg.date).toLocaleDateString('de-DE') : ''}
                          </span>
                          {isUnread && <span className="text-xs text-blue-500 font-medium ml-auto">Neu</span>}
                        </div>
                        <h3 className={`font-semibold ${theme.text} line-clamp-2 mb-2`}>{msg.title}</h3>
                        <p className={`text-sm ${theme.textMuted} line-clamp-3 flex-grow`}>
                          {msg.description || msg.full_text?.substring(0, 150) || ''}
                        </p>
                        {msg.category && (
                          <span className={`inline-block mt-3 text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-medium`}>
                            {msg.category}
                          </span>
                        )}
                        {msg.dokumentationen && msg.dokumentationen.length > 0 && (() => {
                          const firstDok = msg.dokumentationen[msg.dokumentationen.length - 1]
                          const hasSignature = msg.dokumentationen.some(d => d.unterschrift_data)
                          return (
                            <div className={`mt-3 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl ${hasSignature ? 'bg-green-50' : 'bg-amber-50'}`}>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${hasSignature ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                <span className={`text-xs ${hasSignature ? 'text-green-700' : 'text-amber-700'}`}>
                                  {firstDok.erstellt_von_name || 'Bearbeitet'}
                                  {firstDok.erstellt_am && ` · ${new Date(firstDok.erstellt_am).toLocaleDateString('de-DE')}`}
                                </span>
                              </div>
                            </div>
                          )
                        })()}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {apoTab === 'recall' && (
      <div>
        {recallLoading ? (
          <p className={theme.textMuted}>Rückrufe werden geladen...</p>
        ) : recallMessages.length === 0 ? (
          <p className={theme.textMuted}>Keine Rückrufe in diesem Jahr.</p>
        ) : filterApoItems(recallMessages, apoSearch, 'recall').length === 0 ? (
          <p className={theme.textMuted}>Keine Treffer für „{apoSearch}".</p>
        ) : (
          <div className="space-y-8">
            {groupByMonth(filterApoItems(recallMessages, apoSearch, 'recall'), 'date').map((group) => (
              <div key={group.month}>
                <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>{monthNames[group.month]}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.items.map((msg) => {
                    const userCreatedAt = currentStaff?.created_at ? new Date(currentStaff.created_at) : new Date(0)
                    const msgDate = msg.date ? new Date(msg.date) : new Date(0)
                    const isUnread = !readMessageIds.recall.has(String(msg.id)) && msgDate >= userCreatedAt
                    return (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => {
                          setSelectedApoMessage({ ...msg, type: 'recall' })
                          markAsRead('recall', msg.id)
                          loadDokumentationen(msg.id, 'recall')
                        }}
                        className={`text-left ${theme.panel} rounded-2xl border ${theme.border} p-5 ${theme.cardShadow} ${theme.cardHoverShadow} hover:border-[#FD8916] transition-all flex flex-col h-full ${isUnread ? 'ring-2 ring-blue-400' : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span className={`text-xs ${theme.textMuted}`}>
                            {msg.date ? new Date(msg.date).toLocaleDateString('de-DE') : ''}
                          </span>
                          {isUnread && <span className="text-xs text-blue-500 font-medium ml-auto">Neu</span>}
                        </div>
                        <h3 className={`font-semibold ${theme.text} line-clamp-2 mb-2`}>{msg.title}</h3>
                        {msg.ai_zusammenfassung ? (
                          <div className={`text-sm ${theme.text} line-clamp-4 flex-grow`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.ai_zusammenfassung}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className={`text-sm ${theme.textMuted} line-clamp-3 flex-grow`}>
                            {msg.description || msg.full_text?.substring(0, 150) || ''}
                          </p>
                        )}
                        {msg.product_name && (
                          <span className={`inline-block mt-3 text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-700 font-medium`}>
                            {msg.product_name}
                          </span>
                        )}
                        {msg.dokumentationen && msg.dokumentationen.length > 0 && (() => {
                          const firstDok = msg.dokumentationen[msg.dokumentationen.length - 1]
                          const hasSignature = msg.dokumentationen.some(d => d.unterschrift_data)
                          return (
                            <div className={`mt-3 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl ${hasSignature ? 'bg-green-50' : 'bg-amber-50'}`}>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${hasSignature ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                <span className={`text-xs ${hasSignature ? 'text-green-700' : 'text-amber-700'}`}>
                                  {firstDok.erstellt_von_name || 'Bearbeitet'}
                                  {firstDok.erstellt_am && ` · ${new Date(firstDok.erstellt_am).toLocaleDateString('de-DE')}`}
                                </span>
                              </div>
                            </div>
                          )
                        })()}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {apoTab === 'lav' && (
      <div>
        {lavLoading ? (
          <p className={theme.textMuted}>LAK-Infos werden geladen...</p>
        ) : lavAusgaben.length === 0 ? (
          <p className={theme.textMuted}>Keine LAK-Infos in diesem Jahr.</p>
        ) : filterApoItems(lavAusgaben, apoSearch, 'lav').length === 0 ? (
          <p className={theme.textMuted}>Keine Treffer für „{apoSearch}".</p>
        ) : (
          <div className="space-y-8">
            {groupByMonth(filterApoItems(lavAusgaben, apoSearch, 'lav'), 'datum').map((group) => (
              <div key={group.month}>
                <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>{monthNames[group.month]}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {group.items.map((ausgabe) => {
                    const userCreatedAt = currentStaff?.created_at ? new Date(currentStaff.created_at) : new Date(0)
                    const msgDate = ausgabe.datum ? new Date(ausgabe.datum) : new Date(0)
                    const isUnread = !readMessageIds.lav.has(String(ausgabe.id)) && msgDate >= userCreatedAt
                    return (
                      <button
                        key={ausgabe.id}
                        type="button"
                        onClick={() => {
                          setSelectedApoMessage({ ...ausgabe, type: 'lav' })
                          markAsRead('lav', ausgabe.id)
                        }}
                        className={`text-left ${theme.panel} rounded-2xl border ${theme.border} p-5 ${theme.cardShadow} ${theme.cardHoverShadow} hover:border-[#FD8916] transition-all flex flex-col h-full ${isUnread ? 'ring-2 ring-blue-400' : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className={`text-xs ${theme.textMuted}`}>
                            {ausgabe.datum ? new Date(ausgabe.datum).toLocaleDateString('de-DE') : ''}
                          </span>
                          {isUnread && <span className="text-xs text-blue-500 font-medium ml-auto">Neu</span>}
                        </div>
                        <h3 className={`font-semibold ${theme.text} line-clamp-2 mb-2`}>{ausgabe.subject || `LAV-Info ${ausgabe.ausgabe}`}</h3>
                        <p className={`text-sm ${theme.textMuted} mb-3`}>
                          Ausgabe {ausgabe.ausgabe} - {ausgabe.lav_themes?.length || 0} Themen
                        </p>
                        {ausgabe.lav_themes && ausgabe.lav_themes.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-auto">
                            {ausgabe.lav_themes.slice(0, 2).map((t) => (
                              <span key={t.id} className={`text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium`}>
                                {t.titel?.substring(0, 25) || 'Thema'}{t.titel?.length > 25 ? '...' : ''}
                              </span>
                            ))}
                            {ausgabe.lav_themes.length > 2 && (
                              <span className={`text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 font-medium`}>
                                +{ausgabe.lav_themes.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </>
)

export default ApoView
