import { useState, useEffect } from 'react'
import { Newspaper, Plus, Trash, PencilSimple, X, FloppyDisk, Warning } from '@phosphor-icons/react'
import { NEWS_KATEGORIEN, NEWS_PRIORITAETEN, getKategorieStyle } from '../dashboard/useNews'

/**
 * NewsSettingsSection - Admin-Bereich für News-Verwaltung
 * Nur für Admins sichtbar (wird durch Navigation gesteuert)
 */
export default function NewsSettingsSection({
  theme,
  allNews,
  fetchAllNews,
  newsLoading,
  createNews,
  updateNews,
  deleteNews,
  newsSaving,
  newsSaveError,
  currentStaff,
}) {
  const [editingNews, setEditingNews] = useState(null) // null = Neu, object = Bearbeiten
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Formular-State
  const [formData, setFormData] = useState({
    titel: '',
    info: '',
    autor_name: '',
    kategorie: 'Info',
    prioritaet: 'normal',
    gueltig_bis: '',
  })

  // Beim Öffnen alle News laden
  useEffect(() => {
    fetchAllNews()
  }, [fetchAllNews])

  // Formular öffnen für neue News
  const handleNewNews = () => {
    setEditingNews(null)
    setFormData({
      titel: '',
      info: '',
      autor_name: currentStaff ? `${currentStaff.first_name} ${currentStaff.last_name}`.trim() : '',
      kategorie: 'Info',
      prioritaet: 'normal',
      gueltig_bis: '',
    })
    setShowForm(true)
  }

  // Formular öffnen für Bearbeitung
  const handleEditNews = (newsItem) => {
    setEditingNews(newsItem)
    setFormData({
      titel: newsItem.titel,
      info: newsItem.info,
      autor_name: newsItem.autor_name,
      kategorie: newsItem.kategorie,
      prioritaet: newsItem.prioritaet,
      gueltig_bis: newsItem.gueltig_bis
        ? new Date(newsItem.gueltig_bis).toISOString().slice(0, 16)
        : '',
    })
    setShowForm(true)
  }

  // Formular schließen
  const handleCloseForm = () => {
    setShowForm(false)
    setEditingNews(null)
    setFormData({
      titel: '',
      info: '',
      autor_name: '',
      kategorie: 'Info',
      prioritaet: 'normal',
      gueltig_bis: '',
    })
  }

  // Speichern
  const handleSave = async (e) => {
    e.preventDefault()

    const newsData = {
      ...formData,
      gueltig_bis: formData.gueltig_bis ? new Date(formData.gueltig_bis).toISOString() : null,
    }

    let result
    if (editingNews) {
      result = await updateNews(editingNews.id, newsData)
    } else {
      result = await createNews(newsData)
    }

    if (result) {
      handleCloseForm()
    }
  }

  // Löschen
  const handleDelete = async (id) => {
    const success = await deleteNews(id)
    if (success) {
      setConfirmDelete(null)
    }
  }

  // Prüfen ob News abgelaufen ist
  const isExpired = (newsItem) => {
    if (!newsItem.gueltig_bis) return false
    return new Date(newsItem.gueltig_bis) < new Date()
  }

  return (
    <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Newspaper size={20} weight="duotone" className={theme.accentText} />
          <div>
            <h3 className="text-base font-semibold">News verwalten</h3>
            <p className={`text-xs ${theme.textMuted}`}>
              News werden allen Benutzern im Dashboard angezeigt.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleNewNews}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${theme.accent} text-white`}
        >
          <Plus size={16} weight="bold" />
          Neue News
        </button>
      </div>

      {/* Fehlermeldung */}
      {newsSaveError && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-4">
          <p className="text-rose-500 text-sm">{newsSaveError}</p>
        </div>
      )}

      {/* Formular Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className={`absolute inset-0 ${theme.overlay}`} onClick={handleCloseForm} />
          <div className={`relative ${theme.panel} rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto ${theme.cardShadow}`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-lg font-semibold ${theme.text}`}>
                {editingNews ? 'News bearbeiten' : 'Neue News erstellen'}
              </h4>
              <button
                type="button"
                onClick={handleCloseForm}
                className={`p-1 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Titel */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme.text}`}>
                  Titel *
                </label>
                <input
                  type="text"
                  value={formData.titel}
                  onChange={(e) => setFormData(f => ({ ...f, titel: e.target.value }))}
                  required
                  className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.input} text-sm`}
                  placeholder="Überschrift der News"
                />
              </div>

              {/* Kategorie & Priorität */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme.text}`}>
                    Kategorie
                  </label>
                  <select
                    value={formData.kategorie}
                    onChange={(e) => setFormData(f => ({ ...f, kategorie: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.input} text-sm`}
                  >
                    {NEWS_KATEGORIEN.map(k => (
                      <option key={k.value} value={k.value}>{k.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme.text}`}>
                    Priorität
                  </label>
                  <select
                    value={formData.prioritaet}
                    onChange={(e) => setFormData(f => ({ ...f, prioritaet: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.input} text-sm`}
                  >
                    {NEWS_PRIORITAETEN.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Autor */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme.text}`}>
                  Autor *
                </label>
                <input
                  type="text"
                  value={formData.autor_name}
                  onChange={(e) => setFormData(f => ({ ...f, autor_name: e.target.value }))}
                  required
                  className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.input} text-sm`}
                  placeholder="Name des Autors"
                />
              </div>

              {/* Gültig bis */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme.text}`}>
                  Gültig bis (optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.gueltig_bis}
                  onChange={(e) => setFormData(f => ({ ...f, gueltig_bis: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.input} text-sm`}
                />
                <p className={`text-xs ${theme.textMuted} mt-1`}>
                  Leer lassen für unbegrenzte Gültigkeit
                </p>
              </div>

              {/* Inhalt */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme.text}`}>
                  Inhalt (Markdown) *
                </label>
                <textarea
                  value={formData.info}
                  onChange={(e) => setFormData(f => ({ ...f, info: e.target.value }))}
                  required
                  rows={6}
                  className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.input} text-sm font-mono`}
                  placeholder="**Fett**, *Kursiv*, [Link](url), - Liste..."
                />
                <p className={`text-xs ${theme.textMuted} mt-1`}>
                  Unterstützt Markdown-Formatierung
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${theme.bgHover} ${theme.text}`}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={newsSaving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${theme.accent} text-white disabled:opacity-50`}
                >
                  <FloppyDisk size={16} />
                  {newsSaving ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* News-Liste */}
      {newsLoading && (
        <p className={`text-sm ${theme.textMuted}`}>News werden geladen...</p>
      )}

      {!newsLoading && (!allNews || allNews.length === 0) && (
        <div className={`text-center py-8 ${theme.textMuted}`}>
          <Newspaper size={40} weight="light" className="mx-auto mb-2 opacity-50" />
          <p>Noch keine News vorhanden.</p>
          <p className="text-sm">Klicke auf "Neue News" um eine Mitteilung zu erstellen.</p>
        </div>
      )}

      {!newsLoading && allNews && allNews.length > 0 && (
        <div className="space-y-3">
          {allNews.map((newsItem) => (
            <div
              key={newsItem.id}
              className={`flex items-start gap-3 p-4 rounded-xl border ${theme.border} ${
                isExpired(newsItem) ? 'opacity-50' : ''
              }`}
            >
              {/* Kategorie-Badge */}
              <span className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-medium ${getKategorieStyle(newsItem.kategorie)}`}>
                {newsItem.kategorie}
              </span>

              {/* Inhalt */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h5 className={`font-medium ${theme.text} truncate`}>{newsItem.titel}</h5>
                  {isExpired(newsItem) && (
                    <span className="text-xs text-orange-500 flex items-center gap-1">
                      <Warning size={12} />
                      Abgelaufen
                    </span>
                  )}
                </div>
                <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                  {newsItem.autor_name} • {new Date(newsItem.erstellt_am).toLocaleDateString('de-DE')}
                  {newsItem.gueltig_bis && (
                    <> • Gültig bis {new Date(newsItem.gueltig_bis).toLocaleDateString('de-DE')}</>
                  )}
                </p>
                <p className={`text-sm ${theme.textSecondary} mt-1 line-clamp-2`}>
                  {newsItem.info}
                </p>
              </div>

              {/* Aktionen */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleEditNews(newsItem)}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textSecondary}`}
                  title="Bearbeiten"
                >
                  <PencilSimple size={16} />
                </button>
                {confirmDelete === newsItem.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(newsItem.id)}
                      disabled={newsSaving}
                      className="px-2 py-1 rounded-lg text-xs font-medium bg-rose-500 text-white"
                    >
                      Ja
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium ${theme.bgHover}`}
                    >
                      Nein
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(newsItem.id)}
                    className={`p-2 rounded-lg ${theme.danger}`}
                    title="Löschen"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
