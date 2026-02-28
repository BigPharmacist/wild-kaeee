import { useState, useEffect, useCallback } from 'react'
import { X, PaperPlaneTilt, CircleNotch, Warning, CheckCircle, Envelope } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'

export default function LetterXpressModal({
  theme,
  show,
  onClose,
  pdfBase64,
  pageCount = 1,
  einschreiben = false,
}) {
  const [options, setOptions] = useState({
    live: false,       // false = Test, true = Live
    color: '1',        // '1' = S/W, '4' = Farbe
    mode: 'simplex',   // 'simplex' oder 'duplex'
    shipping: 'national',
    registered: einschreiben ? 'r1' : '',
  })

  const [balance, setBalance] = useState(null)
  const [price, setPrice] = useState(null)
  const [loading, setLoading] = useState({ balance: false, price: false, send: false })
  const [error, setError] = useState('')
  const [jobId, setJobId] = useState(null)

  // Einschreiben-Status aus BriefEditor übernehmen
  useEffect(() => {
    if (einschreiben) {
      setOptions(prev => ({ ...prev, registered: prev.registered || 'r1' }))
    }
  }, [einschreiben])

  // API-Call helper
  const callLetterXpress = useCallback(async (action, params = {}) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Nicht angemeldet')

    const response = await supabase.functions.invoke('letterxpress', {
      body: { action, ...params }
    })

    if (response.error) throw response.error
    return response.data
  }, [])

  // Guthaben laden
  const loadBalance = useCallback(async () => {
    setLoading(l => ({ ...l, balance: true }))
    try {
      const result = await callLetterXpress('balance')
      if (result.balance?.value !== undefined) {
        setBalance(parseFloat(result.balance.value))
      } else if (result.balance !== undefined) {
        setBalance(result.balance)
      }
    } catch (err) {
      console.error('Balance error:', err)
    } finally {
      setLoading(l => ({ ...l, balance: false }))
    }
  }, [callLetterXpress])

  // Preis berechnen
  const loadPrice = useCallback(async () => {
    setLoading(l => ({ ...l, price: true }))
    try {
      const result = await callLetterXpress('price', {
        pages: pageCount,
        color: options.color,
        mode: options.mode,
        shipping: options.shipping,
        registered: options.registered,
      })
      if (result.letter?.price !== undefined) {
        setPrice(parseFloat(result.letter.price))
      } else if (result.price !== undefined) {
        setPrice(result.price)
      }
    } catch (err) {
      console.error('Price error:', err)
    } finally {
      setLoading(l => ({ ...l, price: false }))
    }
  }, [callLetterXpress, pageCount, options])

  // Initial laden
  useEffect(() => {
    if (show && pdfBase64) {
      loadBalance()
      loadPrice()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, pdfBase64])

  // Preis bei Optionsänderungen neu laden
  useEffect(() => {
    if (show && pdfBase64) {
      loadPrice()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.color, options.mode, options.shipping, options.registered])

  // Reset bei Schließen
  useEffect(() => {
    if (!show) {
      setJobId(null)
      setError('')
    }
  }, [show])

  // Option ändern
  const handleOptionChange = (key, value) => {
    setOptions(prev => ({ ...prev, [key]: value }))
    setError('')
    setJobId(null)
  }

  // Brief senden
  const handleSend = async () => {
    if (!pdfBase64) {
      setError('Kein PDF vorhanden')
      return
    }

    setLoading(l => ({ ...l, send: true }))
    setError('')
    setJobId(null)

    try {
      const result = await callLetterXpress('send', {
        pdfBase64,
        live: options.live,
        color: options.color,
        mode: options.mode,
        shipping: options.shipping,
        registered: options.registered,
      })

      // Suche Job-ID in verschiedenen möglichen Feldern
      const id = result.letter?.id || result.letter?.jobid || result.id || result.jobid
      if (id) {
        setJobId(id)
        loadBalance()
      } else if (result.status === 200 || result.message === 'OK') {
        setJobId('OK')
        loadBalance()
      } else {
        setError(result.message || 'Unerwartete Antwort vom Server')
      }
    } catch (err) {
      setError(err.message || 'Fehler beim Senden')
    } finally {
      setLoading(l => ({ ...l, send: false }))
    }
  }

  if (!show) return null

  const OptionButton = ({ selected, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        selected
          ? `${theme.primaryBg} text-white`
          : `border ${theme.border} ${theme.bgHover}`
      }`}
    >
      {children}
    </button>
  )

  return (
    <div
      className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div
        className={`${theme.panel} rounded-xl border ${theme.border} ${theme.cardShadow} w-full max-w-lg`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${theme.border}`}>
          <div className="flex items-center gap-2">
            <Envelope className="w-5 h-5 text-[#0D9488]" weight="bold" />
            <h3 className="text-sm font-semibold">Brief versenden</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Test/Live Toggle */}
          <div className="flex gap-1.5">
            <OptionButton selected={!options.live} onClick={() => handleOptionChange('live', false)}>Test</OptionButton>
            <OptionButton selected={options.live} onClick={() => handleOptionChange('live', true)}>Live</OptionButton>
          </div>

          {/* Optionen in kompakten Zeilen */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={`text-xs ${theme.textMuted} mb-1.5`}>Druckfarbe</p>
              <div className="flex gap-1.5">
                <OptionButton selected={options.color === '1'} onClick={() => handleOptionChange('color', '1')}>S/W</OptionButton>
                <OptionButton selected={options.color === '4'} onClick={() => handleOptionChange('color', '4')}>Farbe</OptionButton>
              </div>
            </div>
            <div>
              <p className={`text-xs ${theme.textMuted} mb-1.5`}>Druck</p>
              <div className="flex gap-1.5">
                <OptionButton selected={options.mode === 'simplex'} onClick={() => handleOptionChange('mode', 'simplex')}>1-seitig</OptionButton>
                <OptionButton selected={options.mode === 'duplex'} onClick={() => handleOptionChange('mode', 'duplex')}>2-seitig</OptionButton>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={`text-xs ${theme.textMuted} mb-1.5`}>Versand</p>
              <div className="flex gap-1.5">
                <OptionButton selected={options.shipping === 'national'} onClick={() => handleOptionChange('shipping', 'national')}>National</OptionButton>
                <OptionButton selected={options.shipping === 'international'} onClick={() => handleOptionChange('shipping', 'international')}>Int.</OptionButton>
              </div>
            </div>
            <div>
              <p className={`text-xs ${theme.textMuted} mb-1.5`}>Einschreiben</p>
              <div className="flex gap-1">
                <OptionButton selected={options.registered === ''} onClick={() => handleOptionChange('registered', '')}>–</OptionButton>
                <OptionButton selected={options.registered === 'r1'} onClick={() => handleOptionChange('registered', 'r1')}>Einwurf</OptionButton>
                <OptionButton selected={options.registered === 'r2'} onClick={() => handleOptionChange('registered', 'r2')}>Rücksch.</OptionButton>
              </div>
            </div>
          </div>

          {/* Info-Zeile */}
          <div className={`flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 border ${theme.border} text-sm`}>
            <span className={theme.textMuted}>{pageCount} Seite{pageCount > 1 ? 'n' : ''}</span>
            <span className="font-medium">
              {loading.price ? <CircleNotch className="w-4 h-4 animate-spin inline" /> : price !== null ? `${price.toFixed(2)} €` : '—'}
            </span>
            <span className={theme.textMuted}>
              Guthaben: {loading.balance ? <CircleNotch className="w-4 h-4 animate-spin inline" /> : balance !== null ? `${balance.toFixed(2)} €` : '—'}
            </span>
          </div>

          {/* Live-Warnung */}
          {options.live && !jobId && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
              <Warning className="w-4 h-4 text-red-700 flex-shrink-0" weight="fill" />
              <p className="text-xs text-red-800">Live-Modus: Brief wird gedruckt und versendet!</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FFF5EB] border border-[#FFD4B3]">
              <Warning className="w-4 h-4 text-[#FF6500] flex-shrink-0" weight="fill" />
              <p className="text-xs text-[#CC5200]">{error}</p>
            </div>
          )}

          {/* Success */}
          {jobId && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" weight="fill" />
              <p className="text-xs text-green-800">
                Auftrag übermittelt! <span className="font-mono font-medium">#{jobId}</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-2 px-4 py-3 border-t ${theme.border}`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-1.5 rounded-lg text-sm ${theme.bgHover} ${theme.textSecondary}`}
          >
            {jobId ? 'Schließen' : 'Abbrechen'}
          </button>
          {!jobId && (
            <button
              type="button"
              onClick={handleSend}
              disabled={loading.send || !pdfBase64}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white ${theme.primaryBg} ${theme.primaryHover} disabled:opacity-50`}
            >
              {loading.send ? (
                <>
                  <CircleNotch className="w-4 h-4 animate-spin" />
                  Senden...
                </>
              ) : (
                <>
                  <PaperPlaneTilt className="w-4 h-4" weight="bold" />
                  {options.live ? 'Versenden' : 'Test senden'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
