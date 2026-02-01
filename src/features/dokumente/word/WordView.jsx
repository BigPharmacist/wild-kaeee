import { useState, useCallback } from 'react'
import { useWordDocuments } from './useWordDocuments'
import { Plus, File, Trash, PencilSimple, X, Check } from '@phosphor-icons/react'
import UmoEditorWrapper from './UmoEditorWrapper'

const WordView = ({ theme, pharmacies, currentPharmacyId }) => {
  const {
    documents,
    currentDoc,
    isLoading,
    saveDocument,
    loadDocument,
    createDocument,
    deleteDocument,
  } = useWordDocuments(currentPharmacyId)

  const [editingTitle, setEditingTitle] = useState(null)
  const [titleInput, setTitleInput] = useState('')

  // Handle save from editor (called when user clicks save in editor toolbar)
  const handleEditorSave = useCallback(async (jsonContent) => {
    if (!currentDoc) return
    await saveDocument(currentDoc.id, jsonContent)
  }, [currentDoc, saveDocument])

  const handleDelete = async (e, docId) => {
    e.stopPropagation()
    if (confirm('Dokument wirklich löschen?')) {
      await deleteDocument(docId)
    }
  }

  const startEditTitle = (e, doc) => {
    e.stopPropagation()
    setEditingTitle(doc.id)
    setTitleInput(doc.title)
  }

  const saveTitle = async (e, docId) => {
    e.stopPropagation()
    if (titleInput.trim()) {
      await saveDocument(docId, undefined, titleInput.trim())
    }
    setEditingTitle(null)
  }

  const cancelEditTitle = (e) => {
    e.stopPropagation()
    setEditingTitle(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-2xl font-semibold ${theme.text}`}>
          Word-Dokumente
        </h2>
        <button
          onClick={createDocument}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme.primaryBg} text-white hover:opacity-90 transition-opacity`}
        >
          <Plus size={18} />
          Neu
        </button>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Dokumentenliste (links) */}
        <div className={`w-64 shrink-0 ${theme.panel} rounded-xl border ${theme.border} p-3 overflow-y-auto`}>
          <h3 className={`text-sm font-medium ${theme.textMuted} mb-2`}>
            Dokumente
          </h3>
          {isLoading ? (
            <p className={theme.textMuted}>Lädt...</p>
          ) : documents.length === 0 ? (
            <p className={`text-sm ${theme.textMuted}`}>Keine Dokumente vorhanden</p>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => loadDocument(doc.id)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg text-left cursor-pointer group ${
                  currentDoc?.id === doc.id ? theme.navActive : theme.bgHover
                }`}
              >
                <File size={16} className="shrink-0" />
                {editingTitle === doc.id ? (
                  <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      className={`flex-1 px-1 py-0.5 text-sm rounded border ${theme.border} ${theme.input}`}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTitle(e, doc.id)
                        if (e.key === 'Escape') cancelEditTitle(e)
                      }}
                    />
                    <button onClick={(e) => saveTitle(e, doc.id)} className="text-green-600 hover:text-green-700">
                      <Check size={14} />
                    </button>
                    <button onClick={cancelEditTitle} className="text-gray-500 hover:text-gray-700">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="truncate flex-1">{doc.title}</span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => startEditTitle(e, doc)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <PencilSimple size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, doc.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Editor (rechts) */}
        <div className={`flex-1 ${theme.panel} rounded-xl border ${theme.border} overflow-hidden`}>
          {currentDoc && (
            <UmoEditorWrapper
              documentId={currentDoc.id}
              content={currentDoc.content}
              onSave={handleEditorSave}
              isDarkMode={theme.isDark}
            />
          )}
          {!currentDoc && (
            <div className="flex items-center justify-center h-full text-gray-400">
              Wähle ein Dokument oder erstelle ein neues
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WordView
