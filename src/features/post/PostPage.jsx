import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { supabase, supabaseUrl } from '../../lib/supabase'
import { useTheme, useNavigation, useEmail } from '../../context'
import { Icons } from '../../shared/ui'
import { lazyWithRetry } from '../../lib/lazyWithRetry'

const EmailView = lazyWithRetry(() => import('../email/EmailView'))
const FaxView = lazyWithRetry(() => import('../fax/FaxView'))
const FaxPdfPopup = lazyWithRetry(() => import('../fax/modals/FaxPdfPopup'))
const GesundBestellungenView = lazyWithRetry(() => import('../gesund-bestellungen/GesundBestellungenView'))

export default function PostPage() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { secondaryTab, setActiveView, setSettingsTab } = useNavigation()
  const {
    emailAccounts,
    selectedEmailAccount,
    handleSelectEmailAccount,
    currentUserEmailAccess,
    aiSettings,
  } = useEmail()

  const [pendingFaxId, setPendingFaxId] = useState(null)
  const [faxPdfPopup, setFaxPdfPopup] = useState(null)

  return (
    <>
      {secondaryTab === 'email' && (
        <>
          <div className="mb-2">
            <label className={`text-xs ${theme.textMuted}`}>Kontoauswahl</label>
            <select
              value={selectedEmailAccount || ''}
              onChange={(e) => handleSelectEmailAccount(e.target.value)}
              className={`ml-2 text-sm font-medium bg-transparent border ${theme.border} rounded px-2 py-0.5 cursor-pointer ${theme.text} focus:outline-none focus:ring-1 focus:ring-[#0D9488]`}
            >
              {emailAccounts.length === 0 && (
                <option value="">Kein Konto</option>
              )}
              {emailAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name || acc.email}
                </option>
              ))}
            </select>
          </div>
          <EmailView
            theme={theme}
            account={emailAccounts.find(a => a.id === selectedEmailAccount)}
            hasAccess={currentUserEmailAccess}
            onConfigureClick={() => {
              setActiveView('settings')
              setSettingsTab('email')
              navigate({ to: '/' })
            }}
            aiSettings={aiSettings}
          />
        </>
      )}

      {secondaryTab === 'fax' && (
        <FaxView
          theme={theme}
          pendingFaxId={pendingFaxId}
          onClearPendingFax={() => setPendingFaxId(null)}
        />
      )}

      {secondaryTab === 'gesund' && (
        <GesundBestellungenView theme={theme} />
      )}

      <FaxPdfPopup
        theme={theme}
        Icons={Icons}
        faxPdfPopup={faxPdfPopup}
        setFaxPdfPopup={setFaxPdfPopup}
      />
    </>
  )
}
