export default function ContactsSettingsSection({
  theme,
  contacts,
  filteredContacts,
  contactSearch,
  onContactSearchChange,
  onClearContactSearch,
  contactViewMode,
  onChangeViewMode,
  contactsLoading,
  contactsMessage,
  currentStaff,
  contactTypeLabels,
  onRefresh,
  onAddContact,
  onOpenContactDetail,
}) {
  return (
    <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold">Kontakte</h3>
          <p className={`text-xs ${theme.textMuted}`}>Business-Kontakte und Visitenkarten.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
            title="Liste aktualisieren"
          >
            Aktualisieren
          </button>
          <button
            type="button"
            onClick={onAddContact}
            disabled={!currentStaff}
            className={`h-8 w-8 rounded-full flex items-center justify-center border ${theme.border} ${theme.bgHover} ${theme.text} disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Kontakt hinzufügen"
          >
            +
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={contactSearch}
            onChange={onContactSearchChange}
            placeholder="Suchen nach Name, Firma, Adresse, E-Mail..."
            className={`w-full pl-10 pr-10 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
          />
          {contactSearch && (
            <button
              type="button"
              onClick={onClearContactSearch}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:${theme.text}`}
              title="Suche löschen"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className={`flex rounded-xl border ${theme.border} overflow-hidden`}>
          <button
            type="button"
            onClick={() => onChangeViewMode('cards')}
            className={`px-3 py-2 ${contactViewMode === 'cards' ? theme.accent + ' text-white' : theme.bgHover + ' ' + theme.textMuted}`}
            title="Kartenansicht"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode('list')}
            className={`px-3 py-2 ${contactViewMode === 'list' ? theme.accent + ' text-white' : theme.bgHover + ' ' + theme.textMuted}`}
            title="Listenansicht"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {contactSearch && (
        <p className={`text-xs ${theme.textMuted} mb-3`}>
          {filteredContacts.length} von {contacts.length} Kontakten
        </p>
      )}

      {contactsMessage && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-3">
          <p className="text-rose-400 text-sm">{contactsMessage}</p>
        </div>
      )}

      {contactsLoading && (
        <p className={theme.textMuted}>Lade Daten...</p>
      )}

      {!contactsLoading && !currentStaff && (
        <p className={theme.textMuted}>
          Bitte zuerst ein Mitarbeiter-Profil anlegen.
        </p>
      )}

      {!contactsLoading && currentStaff && contacts.length === 0 && (
        <p className={theme.textMuted}>
          Noch keine Kontakte erfasst. Nutze das + oben rechts.
        </p>
      )}

      {!contactsLoading && currentStaff && contacts.length > 0 && filteredContacts.length === 0 && (
        <p className={theme.textMuted}>
          Keine Kontakte gefunden für "{contactSearch}".
        </p>
      )}

      {contactViewMode === 'cards' && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredContacts.map((contact) => (
            <button
              type="button"
              key={contact.id}
              className={`rounded-xl border ${theme.border} p-4 ${theme.bgHover} text-left ${contact.staff_id ? 'border-l-4 border-l-[#DC2626]' : ''}`}
              title={contact.staff_id ? 'Mitarbeiter - wird über Kollegium gepflegt' : 'Kontakt anzeigen'}
              onClick={() => onOpenContactDetail(contact)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {(contact.business_card_url_enhanced || contact.business_card_url) ? (
                    <img
                      src={contact.business_card_url_enhanced || contact.business_card_url}
                      alt="Visitenkarte"
                      className={`h-10 w-14 rounded object-cover border ${theme.border}`}
                    />
                  ) : (
                    <div className={`h-10 w-14 rounded border ${theme.border} flex items-center justify-center text-[10px] ${theme.textMuted}`}>
                      {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || contact.company?.[0] || '')}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.company || '-'}
                    </p>
                    {contact.company && (contact.first_name || contact.last_name) && (
                      <p className={`text-xs ${theme.textMuted}`}>{contact.company}</p>
                    )}
                    {contact.position && (
                      <p className={`text-xs ${theme.textMuted}`}>{contact.position}</p>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${theme.border} ${theme.textMuted}`}>
                  {contactTypeLabels[contact.contact_type] || contact.contact_type}
                </span>
              </div>
              <div className="mt-3 grid gap-1.5 text-xs">
                <p className={theme.textMuted}>
                  Adresse: <span className={theme.text}>
                    {[contact.street, [contact.postal_code, contact.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '-'}
                  </span>
                </p>
                {contact.phone && (
                  <p className={theme.textMuted}>
                    Tel: <span className={theme.text}>{contact.phone}</span>
                  </p>
                )}
                {contact.mobile && (
                  <p className={theme.textMuted}>
                    Mobil: <span className={theme.text}>{contact.mobile}</span>
                  </p>
                )}
                {contact.fax && (
                  <p className={theme.textMuted}>
                    Fax: <span className={theme.text}>{contact.fax}</span>
                  </p>
                )}
                {contact.email && (
                  <p className={theme.textMuted}>
                    E-Mail: <span className={theme.text}>{contact.email}</span>
                  </p>
                )}
                {!contact.shared && (
                  <p className={`${theme.textMuted} italic`}>Privat</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {contactViewMode === 'list' && (
        <div className={`rounded-xl border ${theme.border} overflow-hidden`}>
          <table className="w-full text-sm">
            <thead className={`${theme.bg} border-b ${theme.border}`}>
              <tr>
                <th className={`text-left px-4 py-3 font-medium ${theme.textSecondary}`}>Name</th>
                <th className={`text-left px-4 py-3 font-medium ${theme.textSecondary} hidden sm:table-cell`}>Firma</th>
                <th className={`text-left px-4 py-3 font-medium ${theme.textSecondary} hidden md:table-cell`}>Adresse</th>
                <th className={`text-left px-4 py-3 font-medium ${theme.textSecondary} hidden lg:table-cell`}>Kontakt</th>
                <th className={`text-left px-4 py-3 font-medium ${theme.textSecondary} w-24`}>Typ</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr
                  key={contact.id}
                  className={`border-b ${theme.border} ${theme.bgHover} cursor-pointer ${contact.staff_id ? 'border-l-4 border-l-[#DC2626]' : ''}`}
                  title={contact.staff_id ? 'Mitarbeiter - wird über Kollegium gepflegt' : 'Kontakt anzeigen'}
                  onClick={() => onOpenContactDetail(contact)}
                >
                  <td className={`px-4 py-3 ${theme.text}`}>
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full border ${theme.border} flex items-center justify-center text-[10px] ${theme.textMuted} flex-shrink-0`}>
                        {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || contact.company?.[0] || '')}
                      </div>
                      <div>
                        <p className="font-medium">
                          {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '-'}
                        </p>
                        {contact.position && (
                          <p className={`text-xs ${theme.textMuted}`}>{contact.position}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`px-4 py-3 ${theme.textMuted} hidden sm:table-cell`}>
                    {contact.company || '-'}
                  </td>
                  <td className={`px-4 py-3 ${theme.textMuted} hidden md:table-cell`}>
                    {[contact.street, [contact.postal_code, contact.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '-'}
                  </td>
                  <td className={`px-4 py-3 hidden lg:table-cell`}>
                    <div className={`text-xs ${theme.textMuted}`}>
                      {contact.email && <p>{contact.email}</p>}
                      {contact.phone && <p>{contact.phone}</p>}
                      {contact.mobile && <p>{contact.mobile}</p>}
                      {!contact.email && !contact.phone && !contact.mobile && '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${theme.border} ${theme.textMuted}`}>
                      {contactTypeLabels[contact.contact_type] || contact.contact_type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
