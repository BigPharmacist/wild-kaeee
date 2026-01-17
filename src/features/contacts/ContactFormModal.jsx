import { useRef } from 'react'

export default function ContactFormModal({
  theme,
  editingContact,
  contactForm,
  contactSaveLoading,
  contactSaveMessage,
  contactCardPreview,
  contactCardEnhancedPreview,
  contactCardRotation,
  contactCardEnhancing,
  contactScanStatus,
  contactFormCardView,
  onClose,
  onDelete,
  onSubmit,
  onContactInput,
  onResetCard,
  onRotateLeft,
  onRotateRight,
  onCardFileChange,
  onSelectFormCardView,
  onConfirmEnhanced,
  PhotoIcon,
  CloseIcon,
  deleteIcon,
}) {
  const contactCardInputRef = useRef(null)

  if (!editingContact) return null

  return (
    <div
      className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div
        className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border}`}>
          <div>
            <h3 className="text-base font-semibold">
              {editingContact.id ? 'Kontakt bearbeiten' : 'Kontakt hinzufügen'}
            </h3>
            <p className={`text-xs ${theme.textMuted}`}>
              {editingContact.id ? 'Änderungen werden sofort gespeichert.' : 'Neuen Kontakt anlegen.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editingContact.id && (
              <button
                type="button"
                onClick={onDelete}
                className={`p-2 rounded-lg ${theme.danger}`}
                title="Kontakt löschen"
              >
                {deleteIcon}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
              title="Popup schließen"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-medium ${theme.textSecondary}`}>
                Visitenkarte
              </label>
              {contactCardPreview && contactCardEnhancedPreview && (
                <div className={`flex items-center rounded-lg border ${theme.border} overflow-hidden`}>
                  <button
                    type="button"
                    onClick={() => onSelectFormCardView('enhanced')}
                    className={`px-2.5 py-1 text-[11px] ${contactFormCardView === 'enhanced' ? theme.accent + ' text-white' : theme.bgHover + ' ' + theme.textMuted}`}
                    title="KI-optimiert anzeigen"
                  >
                    KI
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectFormCardView('original')}
                    className={`px-2.5 py-1 text-[11px] ${contactFormCardView === 'original' ? theme.accent + ' text-white' : theme.bgHover + ' ' + theme.textMuted}`}
                    title="Original anzeigen"
                  >
                    Original
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {(contactCardPreview || contactCardEnhancedPreview) ? (
                <div className="relative">
                  {/* Warnung über unbestätigtem KI-Bild */}
                  {contactCardEnhancedPreview && !contactForm.businessCardEnhancedConfirmed && (
                    <div className="absolute -top-5 left-0 right-0 text-[10px] text-red-500 font-normal text-center whitespace-nowrap">
                      Achtung, bitte bestätigen
                    </div>
                  )}
                  <img
                    src={contactFormCardView === 'enhanced' && contactCardEnhancedPreview ? contactCardEnhancedPreview : contactCardPreview}
                    alt="Visitenkarte Vorschau"
                    className={`h-20 w-32 rounded-lg object-cover border ${theme.border}`}
                    style={{ transform: `rotate(${contactFormCardView === 'original' ? contactCardRotation : 0}deg)` }}
                  />
                  {!contactCardEnhancedPreview && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                      <button
                        type="button"
                        onClick={onRotateLeft}
                        className={`p-1 rounded ${theme.surface} border ${theme.border} ${theme.bgHover}`}
                        title="90° nach links drehen"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={onRotateRight}
                        className={`p-1 rounded ${theme.surface} border ${theme.border} ${theme.bgHover}`}
                        title="90° nach rechts drehen"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`h-20 w-32 rounded-lg border-2 border-dashed ${theme.border} flex items-center justify-center ${theme.textMuted}`}>
                  <PhotoIcon />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={contactCardInputRef}
                  onChange={onCardFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    contactCardInputRef.current?.click()
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${theme.border} ${theme.bgHover}`}
                >
                  {(contactCardPreview || contactCardEnhancedPreview) ? 'Ändern' : 'Hochladen'}
                </button>
                {contactCardPreview && contactCardEnhancedPreview && contactFormCardView === 'enhanced' && (
                  <>
                    <button
                      type="button"
                      onClick={onResetCard}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${theme.danger}`}
                    >
                      KI entfernen
                    </button>
                    {!contactForm.businessCardEnhancedConfirmed && (
                      <button
                        type="button"
                        onClick={onConfirmEnhanced}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        KI bestätigen
                      </button>
                    )}
                  </>
                )}
                {contactCardPreview && contactCardEnhancedPreview && contactFormCardView === 'original' && (
                  <button
                    type="button"
                    onClick={onResetCard}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${theme.danger}`}
                  >
                    Original entfernen
                  </button>
                )}
                {!(contactCardPreview && contactCardEnhancedPreview) && (contactCardPreview || contactCardEnhancedPreview) && (
                  <button
                    type="button"
                    onClick={onResetCard}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${theme.danger}`}
                  >
                    Entfernen
                  </button>
                )}
              </div>
            </div>
            {contactCardEnhancing && (
              <div className={`mt-3 flex items-center gap-2 text-xs ${theme.textMuted}`}>
                <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                KI-Optimierung läuft...
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Vorname
              </label>
              <input
                value={contactForm.firstName}
                onChange={(e) => onContactInput('firstName', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Nachname
              </label>
              <input
                value={contactForm.lastName}
                onChange={(e) => onContactInput('lastName', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Firma
              </label>
              <input
                value={contactForm.company}
                onChange={(e) => onContactInput('company', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Position
              </label>
              <input
                value={contactForm.position}
                onChange={(e) => onContactInput('position', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                E-Mail
              </label>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => onContactInput('email', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Webseite
              </label>
              <input
                value={contactForm.website}
                onChange={(e) => onContactInput('website', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Telefon
              </label>
              <input
                value={contactForm.phone}
                onChange={(e) => onContactInput('phone', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Mobil
              </label>
              <input
                value={contactForm.mobile}
                onChange={(e) => onContactInput('mobile', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Fax
              </label>
              <input
                value={contactForm.fax}
                onChange={(e) => onContactInput('fax', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Straße
              </label>
              <input
                value={contactForm.street}
                onChange={(e) => onContactInput('street', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                PLZ
              </label>
              <input
                value={contactForm.postalCode}
                onChange={(e) => onContactInput('postalCode', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Ort
              </label>
              <input
                value={contactForm.city}
                onChange={(e) => onContactInput('city', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Land
              </label>
              <input
                value={contactForm.country}
                onChange={(e) => onContactInput('country', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Kategorie
              </label>
              <select
                value={contactForm.contactType}
                onChange={(e) => onContactInput('contactType', e.target.value)}
                className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
              >
                <option value="business">Geschäftlich</option>
                <option value="supplier">Lieferant</option>
                <option value="customer">Kunde</option>
                <option value="other">Sonstige</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                Notizen
              </label>
              <textarea
                value={contactForm.notes}
                onChange={(e) => onContactInput('notes', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm resize-none`}
              />
            </div>
          </div>

          <label className={`flex items-center gap-2 text-xs ${theme.textMuted}`}>
            <input
              type="checkbox"
              checked={contactForm.shared}
              onChange={(e) => onContactInput('shared', e.target.checked)}
              className="accent-[#FD8916]"
            />
            Für alle Mitarbeiter sichtbar
          </label>

          {contactSaveMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <p className="text-rose-400 text-sm">{contactSaveMessage}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-sm font-medium border ${theme.border} ${theme.bgHover}`}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={contactSaveLoading}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.accent} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {contactSaveLoading ? 'Speichert...' : 'Speichern'}
            </button>
          </div>
          {contactScanStatus}
        </form>
      </div>
    </div>
  )
}
