const SettingsView = ({
  theme,
  settingsTab,
  pharmacies,
  pharmaciesMessage,
  pharmaciesLoading,
  fetchPharmacies,
  openCreateModal,
  openEditModal,
  staff,
  staffMessage,
  staffLoading,
  fetchStaff,
  openStaffModal,
  pharmacyLookup,
  EmailSettingsSection,
  currentStaff,
  emailAccounts,
  selectedEmailAccount,
  handleSelectEmailAccount,
  openEmailAccountModal,
  handleDeleteEmailAccount,
  emailPermissions,
  toggleEmailPermission,
  Icons,
  enhanceMessage,
  fetchGoogleApiKey,
  handleEnhanceFileChange,
  runBusinessCardEnhance,
  enhanceFile,
  enhanceLoading,
  enhancePreview,
  enhanceResultPreview,
  ContactsSettingsSection,
  contacts,
  filteredContacts,
  contactSearch,
  setContactSearch,
  contactViewMode,
  setContactViewMode,
  contactsLoading,
  contactsMessage,
  contactTypeLabels,
  fetchContacts,
  openContactModal,
  openContactDetail,
}) => (
  <>
    <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Einstellungen</h2>

    <div className="space-y-4">
      {settingsTab === 'pharmacies' && (
        <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold">Apothekendaten</h3>
              <p className={`text-xs ${theme.textMuted}`}>Maximal 4 Einträge.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchPharmacies}
                className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
                title="Liste aktualisieren"
              >
                Aktualisieren
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                disabled={pharmacies.length >= 4}
                className={`h-8 w-8 rounded-full flex items-center justify-center border ${theme.border} ${theme.bgHover} ${theme.text} disabled:opacity-40 disabled:cursor-not-allowed`}
                title="Apotheke hinzufügen"
              >
                +
              </button>
            </div>
          </div>

          {pharmaciesMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-3">
              <p className="text-rose-400 text-sm">{pharmaciesMessage}</p>
            </div>
          )}

          {pharmaciesLoading && (
            <p className={theme.textMuted}>Lade Daten...</p>
          )}

          {!pharmaciesLoading && pharmacies.length === 0 && (
            <p className={theme.textMuted}>
              Noch keine Apotheke gespeichert. Nutze das + oben rechts.
            </p>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pharmacies.map((pharmacy) => (
              <button
                type="button"
                key={pharmacy.id}
                className={`rounded-xl border ${theme.border} p-4 ${theme.bgHover} text-left`}
                title="Apotheke bearbeiten"
                onClick={() => openEditModal(pharmacy)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{pharmacy.name}</p>
                    <p className={`text-xs ${theme.textMuted}`}>
                      {[pharmacy.street, [pharmacy.postal_code, pharmacy.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid gap-1.5 text-xs">
                  <p className={theme.textMuted}>
                    Telefon: <span className={theme.text}>{pharmacy.phone || '-'}</span>
                  </p>
                  <p className={theme.textMuted}>
                    {pharmacy.owner_role === 'manager' ? 'Filialleiter' : 'Inhaber'}:{' '}
                    <span className={theme.text}>{pharmacy.owner || '-'}</span>
                  </p>
                  <p className={theme.textMuted}>
                    Webseite: <span className={theme.text}>{pharmacy.website || '-'}</span>
                  </p>
                  <p className={theme.textMuted}>
                    E-Mail: <span className={theme.text}>{pharmacy.email || '-'}</span>
                  </p>
                  <p className={theme.textMuted}>
                    Fax: <span className={theme.text}>{pharmacy.fax || '-'}</span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {settingsTab === 'staff' && (
        <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold">Kollegium</h3>
              <p className={`text-xs ${theme.textMuted}`}>Global über alle Apotheken.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchStaff}
                className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
                title="Liste aktualisieren"
              >
                Aktualisieren
              </button>
              <button
                type="button"
                onClick={() => openStaffModal()}
                disabled={pharmacies.length === 0}
                className={`h-8 w-8 rounded-full flex items-center justify-center border ${theme.border} ${theme.bgHover} ${theme.text} disabled:opacity-40 disabled:cursor-not-allowed`}
                title="Person hinzufügen"
              >
                +
              </button>
            </div>
          </div>

          {staffMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-3">
              <p className="text-rose-400 text-sm">{staffMessage}</p>
            </div>
          )}

          {staffLoading && (
            <p className={theme.textMuted}>Lade Daten...</p>
          )}

          {!staffLoading && pharmacies.length === 0 && (
            <p className={theme.textMuted}>
              Bitte zuerst eine Apotheke anlegen, um Kollegium zuzuordnen.
            </p>
          )}

          {!staffLoading && pharmacies.length > 0 && staff.length === 0 && (
            <p className={theme.textMuted}>
              Noch keine Personen erfasst. Nutze das + oben rechts.
            </p>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {staff.map((member) => (
              <button
                type="button"
                key={member.id}
                className={`rounded-xl border ${theme.border} p-4 ${theme.bgHover} text-left`}
                title="Person bearbeiten"
                onClick={() => openStaffModal(member)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={`${member.first_name} ${member.last_name}`}
                          className={`h-8 w-8 rounded-full object-cover border ${theme.border}`}
                        />
                      ) : (
                        <div className={`h-8 w-8 rounded-full border ${theme.border} flex items-center justify-center text-[10px] ${theme.textMuted}`}>
                          {(member.first_name?.[0] || '') + (member.last_name?.[0] || '')}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className={`text-xs ${theme.textMuted}`}>
                          {member.role || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {member.is_admin && (
                    <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${theme.border} ${theme.textMuted}`}>
                      Admin
                    </span>
                  )}
                </div>
                <div className="mt-3 grid gap-1.5 text-xs">
                  <p className={theme.textMuted}>
                    Apotheke: <span className={theme.text}>{pharmacyLookup[member.pharmacy_id] || '-'}</span>
                  </p>
                  <p className={theme.textMuted}>
                    Adresse: <span className={theme.text}>
                      {[member.street, [member.postal_code, member.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '-'}
                    </span>
                  </p>
                  <p className={theme.textMuted}>
                    Mobil: <span className={theme.text}>{member.mobile || '-'}</span>
                  </p>
                  <p className={theme.textMuted}>
                    E-Mail: <span className={theme.text}>{member.email || '-'}</span>
                  </p>
                  {member.auth_user_id && (
                    <p className={theme.textMuted}>
                      Login verknüpft
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {settingsTab === 'email' && (
        <EmailSettingsSection
          theme={theme}
          currentStaff={currentStaff}
          emailAccounts={emailAccounts}
          selectedEmailAccount={selectedEmailAccount}
          onSelectEmailAccount={handleSelectEmailAccount}
          onOpenEmailAccountModal={openEmailAccountModal}
          onDeleteEmailAccount={handleDeleteEmailAccount}
          staff={staff}
          emailPermissions={emailPermissions}
          onToggleEmailPermission={toggleEmailPermission}
          CloseIcon={Icons.X}
        />
      )}

      {settingsTab === 'card-enhance' && (
        <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-base font-semibold">Visitenkarten-Enhance (Test)</h3>
              <p className={`text-xs ${theme.textMuted}`}>Google Nano Banana Pro: zuschneiden + Lesbarkeit verbessern.</p>
            </div>
            <button
              type="button"
              onClick={fetchGoogleApiKey}
              className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
              title="Google API Key aus DB laden"
            >
              Key laden
            </button>
          </div>

          {enhanceMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-3">
              <p className="text-rose-400 text-sm">{enhanceMessage}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleEnhanceFileChange}
              className={`flex-1 text-sm ${theme.input} ${theme.inputPlaceholder} border rounded-xl px-3 py-2`}
            />
            <button
              type="button"
              onClick={runBusinessCardEnhance}
              disabled={!enhanceFile || enhanceLoading}
              className={`h-10 px-4 rounded-xl text-sm font-medium ${theme.accent} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {enhanceLoading ? 'Verbessere...' : 'Verbessern'}
            </button>
          </div>

          {enhanceLoading && (
            <div className={`mb-4 flex items-center gap-2 text-xs ${theme.textMuted}`}>
              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
              Nano Banana Pro arbeitet im Hintergrund...
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className={`rounded-xl border ${theme.border} p-3`}>
              <p className={`text-xs ${theme.textMuted} mb-2`}>Vorher</p>
              {enhancePreview ? (
                <img
                  src={enhancePreview}
                  alt="Original"
                  className="w-full max-h-[360px] object-contain rounded-lg bg-white"
                />
              ) : (
                <div className={`h-48 rounded-lg ${theme.bgHover} flex items-center justify-center text-xs ${theme.textMuted}`}>
                  Kein Bild ausgewahlt
                </div>
              )}
            </div>
            <div className={`rounded-xl border ${theme.border} p-3`}>
              <p className={`text-xs ${theme.textMuted} mb-2`}>Nachher</p>
              {enhanceResultPreview ? (
                <img
                  src={enhanceResultPreview}
                  alt="Verbessert"
                  className="w-full max-h-[360px] object-contain rounded-lg bg-white"
                />
              ) : (
                <div className={`h-48 rounded-lg ${theme.bgHover} flex items-center justify-center text-xs ${theme.textMuted}`}>
                  Noch kein Ergebnis
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {settingsTab === 'contacts' && (
        <ContactsSettingsSection
          theme={theme}
          contacts={contacts}
          filteredContacts={filteredContacts}
          contactSearch={contactSearch}
          onContactSearchChange={(event) => setContactSearch(event.target.value)}
          onClearContactSearch={() => setContactSearch('')}
          contactViewMode={contactViewMode}
          onChangeViewMode={setContactViewMode}
          contactsLoading={contactsLoading}
          contactsMessage={contactsMessage}
          currentStaff={currentStaff}
          contactTypeLabels={contactTypeLabels}
          onRefresh={fetchContacts}
          onAddContact={() => openContactModal()}
          onOpenContactDetail={openContactDetail}
        />
      )}
    </div>
  </>
)

export default SettingsView
