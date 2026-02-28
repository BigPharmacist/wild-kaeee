import { useRef, useEffect, useState } from 'react'
import { FilePdf, Download, Eye, Upload, X, File, Spinner, MagnifyingGlass, Tag, User, FileText, FunnelSimple, Star, FloppyDisk, SquaresFour, List } from '@phosphor-icons/react'

const ArchivView = ({
  theme,
  documents,
  tags,
  correspondents,
  documentTypes,
  loading,
  uploading,
  error,
  selectedDocument,
  previewUrl,
  previewLoading,
  searchQuery,
  selectedTag,
  selectedCorrespondent,
  selectedType,
  fetchDocuments,
  fetchMetadata,
  uploadDocument,
  downloadDocument,
  loadPreview,
  closePreview,
  loadThumbnail,
  fetchPaperlessConfig,
  search,
  filterByTag,
  filterByCorrespondent,
  filterByType,
  filterBySavedView: _filterBySavedView, // eslint-disable-line no-unused-vars
  clearFilters,
  getTagsForDocument,
  getCorrespondentForDocument,
  getTypeForDocument,
  savedViews: _savedViews, // eslint-disable-line no-unused-vars
  activeSavedView,
  activeTab,
  createSavedView,
  deleteSavedView: _deleteSavedView, // eslint-disable-line no-unused-vars
}) => {
  const fileInputRef = useRef(null)
  const [localSearch, setLocalSearch] = useState('')
  const [thumbnails, setThumbnails] = useState({})
  const [showFilters, setShowFilters] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showSaveViewModal, setShowSaveViewModal] = useState(false)
  const [newViewName, setNewViewName] = useState('')
  const [savingView, setSavingView] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' oder 'list'

  // Initial laden
  useEffect(() => {
    fetchPaperlessConfig().then(() => {
      fetchDocuments()
      fetchMetadata()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Thumbnails laden wenn Dokumente sich ändern
  useEffect(() => {
    documents.forEach(async (doc) => {
      if (!thumbnails[doc.id]) {
        const url = await loadThumbnail(doc)
        if (url) {
          setThumbnails(prev => ({ ...prev, [doc.id]: url }))
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, loadThumbnail])

  // Cleanup Thumbnails
  useEffect(() => {
    return () => {
      Object.values(thumbnails).forEach(url => {
        if (url) window.URL.revokeObjectURL(url)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      await uploadDocument(file)
      e.target.value = ''
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    search(localSearch)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      await uploadDocument(file)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const hasActiveFilters = searchQuery || selectedTag || selectedCorrespondent || selectedType || activeSavedView
  const hasFiltersThatCanBeSaved = selectedTag || selectedCorrespondent || selectedType

  // Saved View erstellen
  const handleSaveView = async () => {
    if (!newViewName.trim()) return
    setSavingView(true)
    const success = await createSavedView(newViewName)
    setSavingView(false)
    if (success) {
      setShowSaveViewModal(false)
      setNewViewName('')
    }
  }

  // Dynamischer Titel basierend auf aktivem Tab
  const getTitle = () => {
    if (activeSavedView) {
      return activeSavedView.name
    }
    if (activeTab?.startsWith('type-')) {
      const typeId = parseInt(activeTab.replace('type-', ''))
      const docType = documentTypes.find(t => t.id === typeId)
      return docType?.name || 'Archiv'
    }
    return 'Alle Dokumente'
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`min-h-full ${dragOver ? 'ring-2 ring-[#4C8BF5] ring-inset bg-blue-50/50' : ''}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">
          {getTitle()}
        </h2>

        <div className="flex items-center gap-2">
          {/* Suche */}
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Volltextsuche..."
              className={`w-48 sm:w-64 pl-9 pr-3 py-2 rounded-lg ${theme.input} text-sm`}
            />
            <MagnifyingGlass
              size={18}
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`}
            />
          </form>

          {/* Ansicht-Toggle */}
          <div className={`flex rounded-lg border ${theme.border} overflow-hidden`}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2.5 ${viewMode === 'grid' ? 'bg-[#4C8BF5] text-white' : theme.bgHover} transition-colors`}
              title="Kachelansicht"
            >
              <SquaresFour size={20} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2.5 ${viewMode === 'list' ? 'bg-[#4C8BF5] text-white' : theme.bgHover} transition-colors border-l ${theme.border}`}
              title="Listenansicht"
            >
              <List size={20} />
            </button>
          </div>

          {/* Filter-Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-lg border ${theme.border} ${showFilters || hasActiveFilters ? 'bg-[#4C8BF5] text-white' : theme.bgHover} transition-colors`}
            title="Filter"
          >
            <FunnelSimple size={20} />
          </button>

          {/* Ansicht speichern - nur wenn Filter aktiv */}
          {hasFiltersThatCanBeSaved && !activeSavedView && (
            <button
              type="button"
              onClick={() => setShowSaveViewModal(true)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${theme.border} ${theme.bgHover} transition-colors`}
              title="Als Ansicht speichern"
            >
              <Star size={20} className="text-red-500" />
              <span className="hidden sm:inline text-sm">Speichern</span>
            </button>
          )}

          {/* Upload-Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium transition-colors disabled:opacity-50`}
          >
            {uploading ? (
              <Spinner size={20} className="animate-spin" />
            ) : (
              <Upload size={20} />
            )}
            <span className="hidden sm:inline">
              {uploading ? 'Lädt...' : 'Hochladen'}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.tiff,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Filter-Leiste */}
      {showFilters && (
        <div className={`mb-6 p-4 rounded-xl ${theme.surface} border ${theme.border} flex flex-wrap gap-4 items-center`}>
          {/* Tag-Filter */}
          <div className="flex items-center gap-2">
            <Tag size={18} className={theme.textMuted} />
            <select
              value={selectedTag || ''}
              onChange={(e) => filterByTag(e.target.value || null)}
              className={`px-3 py-1.5 rounded-lg ${theme.input} text-sm min-w-[140px]`}
            >
              <option value="">Alle Tags</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>
          </div>

          {/* Korrespondent-Filter */}
          <div className="flex items-center gap-2">
            <User size={18} className={theme.textMuted} />
            <select
              value={selectedCorrespondent || ''}
              onChange={(e) => filterByCorrespondent(e.target.value || null)}
              className={`px-3 py-1.5 rounded-lg ${theme.input} text-sm min-w-[140px]`}
            >
              <option value="">Alle Korrespondenten</option>
              {correspondents.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Dokumenttyp-Filter */}
          <div className="flex items-center gap-2">
            <FileText size={18} className={theme.textMuted} />
            <select
              value={selectedType || ''}
              onChange={(e) => filterByType(e.target.value || null)}
              className={`px-3 py-1.5 rounded-lg ${theme.input} text-sm min-w-[140px]`}
            >
              <option value="">Alle Typen</option>
              {documentTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Filter zurücksetzen */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                clearFilters()
                setLocalSearch('')
              }}
              className={`px-3 py-1.5 rounded-lg text-sm ${theme.danger} border ${theme.border}`}
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* Aktive Filter anzeigen */}
      {hasActiveFilters && !showFilters && (
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <span className={`text-sm ${theme.textMuted}`}>Filter:</span>
          {searchQuery && (
            <span className={`px-2 py-1 rounded-full text-xs ${theme.surface} border ${theme.border}`}>
              Suche: "{searchQuery}"
            </span>
          )}
          {selectedTag && (
            <span className={`px-2 py-1 rounded-full text-xs bg-[#4C8BF5]/10 text-[#4C8BF5] border border-[#4C8BF5]/20`}>
              {tags.find(t => t.id === parseInt(selectedTag))?.name}
            </span>
          )}
          {selectedCorrespondent && (
            <span className={`px-2 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20`}>
              {correspondents.find(c => c.id === parseInt(selectedCorrespondent))?.name}
            </span>
          )}
          {selectedType && (
            <span className={`px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-700 border border-red-500/20`}>
              {documentTypes.find(t => t.id === parseInt(selectedType))?.name}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              clearFilters()
              setLocalSearch('')
            }}
            className={`text-xs ${theme.textMuted} hover:text-[#FF6500]`}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Fehler */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-[#FFF5EB] border border-[#FFD4B3] text-[#FF6500] text-sm">
          {error}
        </div>
      )}

      {/* Drag & Drop Overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-40 bg-[#4C8BF5]/10 flex items-center justify-center pointer-events-none">
          <div className={`${theme.surface} rounded-2xl p-8 shadow-2xl text-center`}>
            <Upload size={48} className="mx-auto mb-4 text-[#4C8BF5]" />
            <p className={`text-lg font-medium ${theme.textPrimary}`}>Dokument hier ablegen</p>
          </div>
        </div>
      )}

      {/* Dokumente */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size={32} className={`animate-spin ${theme.textMuted}`} />
        </div>
      ) : documents.length === 0 ? (
        <div className={`text-center py-12 ${theme.textMuted}`}>
          <FilePdf size={48} className="mx-auto mb-4 opacity-50" />
          <p>{hasActiveFilters ? 'Keine Dokumente gefunden.' : 'Keine Dokumente vorhanden.'}</p>
          <p className="text-sm mt-1">
            {hasActiveFilters ? 'Versuche andere Filterkriterien.' : 'Lade ein Dokument hoch oder ziehe es hierher.'}
          </p>
        </div>
      ) : (
        <>
          <p className={`text-sm ${theme.textMuted} mb-4`}>{documents.length} Dokument{documents.length !== 1 ? 'e' : ''}</p>

          {viewMode === 'grid' ? (
            // Kachelansicht
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {documents.map((doc) => {
                const docTags = getTagsForDocument(doc)
                const correspondent = getCorrespondentForDocument(doc)
                const docType = getTypeForDocument(doc)

                return (
                  <div
                    key={doc.id}
                    className={`${theme.panel} rounded-xl border ${theme.border} ${theme.cardShadow} overflow-hidden hover:ring-2 hover:ring-[#4C8BF5] transition-all group`}
                  >
                    {/* Thumbnail */}
                    <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative overflow-hidden">
                      {thumbnails[doc.id] ? (
                        <img
                          src={thumbnails[doc.id]}
                          alt={doc.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FilePdf size={48} className="text-[#FF6500] opacity-70" />
                      )}

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => loadPreview(doc)}
                          className="p-2 rounded-lg bg-white/90 hover:bg-white text-slate-700 transition-colors"
                          title="Vorschau"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadDocument(doc)}
                          className="p-2 rounded-lg bg-white/90 hover:bg-white text-slate-700 transition-colors"
                          title="Herunterladen"
                        >
                          <Download size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3 space-y-2">
                      <p className={`text-sm font-medium ${theme.textPrimary} truncate`} title={doc.title}>
                        {doc.title || 'Unbenannt'}
                      </p>

                      <div className={`text-xs ${theme.textMuted} flex items-center gap-2`}>
                        <span>{formatDate(doc.created)}</span>
                        <span>-</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                      </div>

                      {/* Korrespondent */}
                      {correspondent && (
                        <p className={`text-xs ${theme.textMuted} truncate flex items-center gap-1`}>
                          <User size={12} />
                          {correspondent.name}
                        </p>
                      )}

                      {/* Dokumenttyp */}
                      {docType && (
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-700">
                          {docType.name}
                        </span>
                      )}

                      {/* Tags */}
                      {docTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {docTags.slice(0, 3).map(tag => (
                            <span
                              key={tag.id}
                              className="px-1.5 py-0.5 rounded text-xs"
                              style={{
                                backgroundColor: tag.color ? `${tag.color}20` : '#4C8BF510',
                                color: tag.color || '#4C8BF5',
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {docTags.length > 3 && (
                            <span className={`text-xs ${theme.textMuted}`}>+{docTags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            // Listenansicht
            <div className={`${theme.panel} rounded-xl border ${theme.border} ${theme.cardShadow} overflow-hidden`}>
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${theme.border} ${theme.bg}`}>
                    <th className={`text-left px-3 py-2 text-xs font-medium ${theme.textMuted} uppercase tracking-wider`}>Dokument</th>
                    <th className={`text-left px-3 py-2 text-xs font-medium ${theme.textMuted} uppercase tracking-wider hidden sm:table-cell`}>Korrespondent</th>
                    <th className={`text-left px-3 py-2 text-xs font-medium ${theme.textMuted} uppercase tracking-wider hidden md:table-cell`}>Typ</th>
                    <th className={`text-left px-3 py-2 text-xs font-medium ${theme.textMuted} uppercase tracking-wider hidden lg:table-cell`}>Tags</th>
                    <th className={`text-right px-3 py-2 text-xs font-medium ${theme.textMuted} uppercase tracking-wider`}>Datum</th>
                    <th className={`text-right px-3 py-2 text-xs font-medium ${theme.textMuted} uppercase tracking-wider w-20`}>Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc) => {
                    const docTags = getTagsForDocument(doc)
                    const correspondent = getCorrespondentForDocument(doc)
                    const docType = getTypeForDocument(doc)

                    return (
                      <tr key={doc.id} className={`${theme.bgHover} transition-colors`}>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {thumbnails[doc.id] ? (
                                <img
                                  src={thumbnails[doc.id]}
                                  alt={doc.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FilePdf size={14} className="text-[#FF6500] opacity-70" />
                              )}
                            </div>
                            <p className={`text-sm ${theme.textPrimary} truncate`} title={doc.title}>
                              {doc.title || 'Unbenannt'}
                            </p>
                          </div>
                        </td>
                        <td className={`px-3 py-1.5 hidden sm:table-cell`}>
                          {correspondent ? (
                            <span className={`text-sm ${theme.textSecondary}`}>{correspondent.name}</span>
                          ) : (
                            <span className={`text-sm ${theme.textMuted}`}>-</span>
                          )}
                        </td>
                        <td className={`px-3 py-1.5 hidden md:table-cell`}>
                          {docType ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-red-500/10 text-red-700">
                              {docType.name}
                            </span>
                          ) : (
                            <span className={`text-sm ${theme.textMuted}`}>-</span>
                          )}
                        </td>
                        <td className={`px-3 py-1.5 hidden lg:table-cell`}>
                          {docTags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {docTags.slice(0, 2).map(tag => (
                                <span
                                  key={tag.id}
                                  className="px-1.5 py-0.5 rounded text-xs"
                                  style={{
                                    backgroundColor: tag.color ? `${tag.color}20` : '#4C8BF510',
                                    color: tag.color || '#4C8BF5',
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                              {docTags.length > 2 && (
                                <span className={`text-xs ${theme.textMuted}`}>+{docTags.length - 2}</span>
                              )}
                            </div>
                          ) : (
                            <span className={`text-sm ${theme.textMuted}`}>-</span>
                          )}
                        </td>
                        <td className={`px-3 py-1.5 text-right text-sm ${theme.textSecondary}`}>
                          {formatDate(doc.created)}
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              onClick={() => loadPreview(doc)}
                              className={`p-1 rounded ${theme.bgHover} ${theme.textSecondary} hover:text-[#4C8BF5] transition-colors`}
                              title="Vorschau"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadDocument(doc)}
                              className={`p-1 rounded ${theme.bgHover} ${theme.textSecondary} hover:text-[#0D9488] transition-colors`}
                              title="Herunterladen"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Vorschau Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 ${theme.overlay}`}
            onClick={closePreview}
          />

          <div className={`relative ${theme.panel} rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}>
            <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-semibold ${theme.textPrimary} truncate`}>
                  {selectedDocument.title || 'Dokument'}
                </h3>
                <p className={`text-sm ${theme.textMuted}`}>
                  {formatDate(selectedDocument.created)}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  type="button"
                  onClick={() => downloadDocument(selectedDocument)}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textSecondary} transition-colors`}
                  title="Herunterladen"
                >
                  <Download size={20} />
                </button>
                <button
                  type="button"
                  onClick={closePreview}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textSecondary} transition-colors`}
                  title="Schließen"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-100">
              {previewLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Spinner size={32} className="animate-spin text-slate-400" />
                </div>
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[70vh] rounded-lg bg-white"
                  title="Dokumentvorschau"
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-400">
                  <File size={48} />
                  <span className="ml-2">Vorschau nicht verfügbar</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saved View erstellen Modal */}
      {showSaveViewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 ${theme.overlay}`}
            onClick={() => setShowSaveViewModal(false)}
          />

          <div className={`relative ${theme.panel} rounded-2xl shadow-2xl w-full max-w-md p-6`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-100">
                <Star size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
                  Ansicht speichern
                </h3>
                <p className={`text-sm ${theme.textMuted}`}>
                  Aktuelle Filter als Schnellzugriff speichern
                </p>
              </div>
            </div>

            {/* Aktive Filter anzeigen */}
            <div className={`mb-4 p-3 rounded-lg ${theme.bg} border ${theme.border}`}>
              <p className={`text-xs ${theme.textMuted} mb-2`}>Aktive Filter:</p>
              <div className="flex flex-wrap gap-2">
                {selectedTag && (
                  <span className="px-2 py-1 rounded-full text-xs bg-[#4C8BF5]/10 text-[#4C8BF5] border border-[#4C8BF5]/20">
                    Tag: {tags.find(t => t.id === parseInt(selectedTag))?.name}
                  </span>
                )}
                {selectedCorrespondent && (
                  <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {correspondents.find(c => c.id === parseInt(selectedCorrespondent))?.name}
                  </span>
                )}
                {selectedType && (
                  <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-700 border border-red-500/20">
                    {documentTypes.find(t => t.id === parseInt(selectedType))?.name}
                  </span>
                )}
              </div>
            </div>

            {/* Name eingeben */}
            <div className="mb-6">
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                Name der Ansicht
              </label>
              <input
                type="text"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="z.B. Unbezahlte Rechnungen"
                className={`w-full px-4 py-2.5 rounded-lg ${theme.input} text-sm`}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveView()}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSaveViewModal(false)
                  setNewViewName('')
                }}
                className={`flex-1 px-4 py-2.5 rounded-lg border ${theme.border} ${theme.textSecondary} ${theme.bgHover} transition-colors`}
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveView}
                disabled={!newViewName.trim() || savingView}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium transition-colors disabled:opacity-50`}
              >
                {savingView ? (
                  <Spinner size={20} className="animate-spin" />
                ) : (
                  <FloppyDisk size={20} />
                )}
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArchivView
