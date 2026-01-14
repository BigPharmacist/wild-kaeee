export default function ContactDetailModal({
  theme,
  selectedContact,
  selectedCardUrl,
  selectedCardHasEnhanced,
  selectedCardHasOriginal,
  selectedContactCardView,
  contactTypeLabels,
  onClose,
  onEdit,
  onEditInStaff,
  onSelectCardView,
  CloseIcon,
}) {
  if (!selectedContact) return null

  return (
    <div
      className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div
        className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-4xl max-h-[90vh] overflow-y-auto`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border}`}>
          <div>
            <h3 className="text-base font-semibold">
              {[selectedContact.first_name, selectedContact.last_name].filter(Boolean).join(' ') || selectedContact.company || 'Kontakt'}
            </h3>
            <p className={`text-xs ${theme.textMuted}`}>
              {selectedContact.company && (selectedContact.first_name || selectedContact.last_name) ? selectedContact.company : ''}
              {selectedContact.position ? (selectedContact.company ? ' · ' : '') + selectedContact.position : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!selectedContact.staff_id && (
              <button
                type="button"
                onClick={onEdit}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${theme.border} ${theme.bgHover}`}
                title="Kontakt bearbeiten"
              >
                Bearbeiten
              </button>
            )}
            {selectedContact.staff_id && (
              <button
                type="button"
                onClick={onEditInStaff}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${theme.border} ${theme.bgHover}`}
                title="Im Kollegium bearbeiten"
              >
                Im Kollegium bearbeiten
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
              title="Schließen"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className={`text-xs font-medium ${theme.textSecondary}`}>Visitenkarte</h4>
                {selectedCardHasEnhanced && selectedCardHasOriginal && (
                  <div className={`flex items-center rounded-lg border ${theme.border} overflow-hidden`}>
                    <button
                      type="button"
                      onClick={() => onSelectCardView('enhanced')}
                      className={`px-2.5 py-1 text-[11px] ${selectedContactCardView === 'enhanced' ? theme.accent + ' text-white' : theme.bgHover + ' ' + theme.textMuted}`}
                      title="KI-optimiert anzeigen"
                    >
                      KI
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectCardView('original')}
                      className={`px-2.5 py-1 text-[11px] ${selectedContactCardView === 'original' ? theme.accent + ' text-white' : theme.bgHover + ' ' + theme.textMuted}`}
                      title="Original anzeigen"
                    >
                      Original
                    </button>
                  </div>
                )}
              </div>
              {selectedCardUrl ? (
                <a
                  href={selectedCardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {selectedCardUrl.toLowerCase().endsWith('.pdf') ? (
                    <div className={`rounded-xl border ${theme.border} overflow-hidden`}>
                      <iframe
                        src={selectedCardUrl}
                        className="w-full h-80"
                        title="Visitenkarte PDF"
                      />
                      <p className={`text-xs ${theme.textMuted} text-center py-2 border-t ${theme.border}`}>
                        Klicken zum Öffnen in neuem Tab
                      </p>
                    </div>
                  ) : (
                    <img
                      src={selectedCardUrl}
                      alt="Visitenkarte"
                      className={`w-full rounded-xl border ${theme.border} object-contain max-h-80`}
                    />
                  )}
                </a>
              ) : (
                <div className={`h-40 rounded-xl border-2 border-dashed ${theme.border} flex items-center justify-center ${theme.textMuted}`}>
                  Keine Visitenkarte hinterlegt
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Kontaktdaten</h4>
                <div className={`rounded-xl border ${theme.border} divide-y ${theme.border}`}>
                  {selectedContact.email && (
                    <a href={`mailto:${selectedContact.email}`} className={`flex items-center gap-3 px-4 py-3 ${theme.bgHover}`}>
                      <svg className={`w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className={`text-sm ${theme.text}`}>{selectedContact.email}</span>
                    </a>
                  )}
                  {selectedContact.phone && (
                    <a href={`tel:${selectedContact.phone}`} className={`flex items-center gap-3 px-4 py-3 ${theme.bgHover}`}>
                      <svg className={`w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className={`text-sm ${theme.text}`}>{selectedContact.phone}</span>
                    </a>
                  )}
                  {selectedContact.mobile && (
                    <a href={`tel:${selectedContact.mobile}`} className={`flex items-center gap-3 px-4 py-3 ${theme.bgHover}`}>
                      <svg className={`w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className={`text-sm ${theme.text}`}>{selectedContact.mobile}</span>
                    </a>
                  )}
                  {selectedContact.fax && (
                    <div className={`flex items-center gap-3 px-4 py-3`}>
                      <svg className={`w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span className={`text-sm ${theme.text}`}>{selectedContact.fax}</span>
                    </div>
                  )}
                  {selectedContact.website && (
                    <a href={selectedContact.website.startsWith('http') ? selectedContact.website : `https://${selectedContact.website}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 px-4 py-3 ${theme.bgHover}`}>
                      <svg className={`w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <span className={`text-sm ${theme.text}`}>{selectedContact.website}</span>
                    </a>
                  )}
                  {!selectedContact.email && !selectedContact.phone && !selectedContact.mobile && !selectedContact.fax && !selectedContact.website && (
                    <p className={`px-4 py-3 text-sm ${theme.textMuted}`}>Keine Kontaktdaten</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Adresse</h4>
                <div className={`rounded-xl border ${theme.border} px-4 py-3`}>
                  {selectedContact.street || selectedContact.postal_code || selectedContact.city ? (
                    <div className={`text-sm ${theme.text}`}>
                      {selectedContact.street && <p>{selectedContact.street}</p>}
                      {(selectedContact.postal_code || selectedContact.city) && (
                        <p>{[selectedContact.postal_code, selectedContact.city].filter(Boolean).join(' ')}</p>
                      )}
                      {selectedContact.country && selectedContact.country !== 'DE' && (
                        <p>{selectedContact.country}</p>
                      )}
                    </div>
                  ) : (
                    <p className={`text-sm ${theme.textMuted}`}>Keine Adresse</p>
                  )}
                </div>
              </div>

              {selectedContact.notes && (
                <div>
                  <h4 className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Notizen</h4>
                  <div className={`rounded-xl border ${theme.border} px-4 py-3`}>
                    <p className={`text-sm ${theme.text} whitespace-pre-wrap`}>{selectedContact.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${theme.border} ${theme.textMuted}`}>
                  {contactTypeLabels[selectedContact.contact_type] || selectedContact.contact_type}
                </span>
                {!selectedContact.shared && (
                  <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${theme.border} ${theme.textMuted}`}>
                    Privat
                  </span>
                )}
                {selectedContact.staff_id && (
                  <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-[#FD8916]/10 text-[#FD8916] border border-[#FD8916]/20`}>
                    Mitarbeiter
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
