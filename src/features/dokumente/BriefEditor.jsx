import { useState, useCallback, useRef } from 'react'
import { jsPDF } from 'jspdf'
import { PaperPlaneTilt } from '@phosphor-icons/react'
import LetterXpressModal from './LetterXpressModal'
import useBriefAi from './useBriefAi'
import { AiAssistantPanel } from '../../shared/ui'

const BriefEditor = ({ theme, pharmacies, aiSettings }) => {
  const pharmacy = pharmacies?.[0] || {
    name: 'Apotheke am Damm',
    street: 'Am Damm 17',
    postal_code: '55232',
    city: 'Alzey',
    phone: '06731-548846',
    email: 'info@apothekeamdamm.de',
    owner: 'Matthias Blüm',
    vat_id: 'DE814983365',
    trade_register: 'HRA 31710',
    registry_court: 'Amtsgericht Mainz',
  }

  const [briefData, setBriefData] = useState({
    empfaenger: '',
    einschreiben: false,
    vermerk: 'Einschreiben',
    datum: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    betreff: '',
    anrede: 'Sehr geehrte Damen und Herren,',
    grussformel: 'Mit freundlichen Grüßen',
    unterschrift: pharmacy.owner || 'Matthias Blüm',
  })

  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [showLetterXpress, setShowLetterXpress] = useState(false)
  const [pdfBase64, setPdfBase64] = useState(null)
  const brieftextRef = useRef(null)

  // KI-Assistent Hook
  const {
    aiPrompt,
    setAiPrompt,
    aiGenerating,
    aiError,
    handleAiGenerate,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    historyInfo,
  } = useBriefAi({ aiSettings, briefData, setBriefData, brieftextRef })

  const handleChange = (field, value) => {
    setBriefData(prev => ({ ...prev, [field]: value }))
  }

  // Formatierungsbefehle
  const execFormat = (command, value = null) => {
    document.execCommand(command, false, value)
    brieftextRef.current?.focus()
  }

  const ruecksendeAdresse = `${pharmacy.name}, ${pharmacy.street}, ${pharmacy.postal_code} ${pharmacy.city}`

  const htmlToPlainText = (html) => {
    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
  }

  // PDF erstellen (returnBase64: true = Base64 zurückgeben, false = Download)
  const createPDF = useCallback((returnBase64 = false) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    // Absenderblock
    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(35, 87, 80)
    doc.text(pharmacy.name, 185, 25, { align: 'right' })
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(pharmacy.street, 185, 32, { align: 'right' })
    doc.text(`${pharmacy.postal_code} ${pharmacy.city}`, 185, 37, { align: 'right' })
    doc.text(`Tel: ${pharmacy.phone}`, 185, 44, { align: 'right' })
    doc.text(pharmacy.email, 185, 49, { align: 'right' })

    // Anschriftfeld
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.text(ruecksendeAdresse, 25, 47)
    doc.setDrawColor(100, 100, 100)
    doc.line(25, 48, 110, 48)

    let adresseStartY = 55
    if (briefData.einschreiben) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(briefData.vermerk || 'Einschreiben', 25, 55)
      adresseStartY = 62
    }

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    const empfaengerLines = briefData.empfaenger.split('\n').filter(l => l.trim())
    empfaengerLines.forEach((line, idx) => {
      doc.text(line, 25, adresseStartY + idx * 5)
    })

    // Inhaltsbereich
    doc.setFontSize(10)
    doc.text(`${pharmacy.city}, ${briefData.datum}`, 185, 100, { align: 'right' })

    if (briefData.betreff) {
      doc.setFontSize(12.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(35, 87, 80)
      doc.text(briefData.betreff, 25, 115)
      doc.setDrawColor(35, 87, 80)
      doc.line(25, 118, 185, 118)
    }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(briefData.anrede, 25, 130)

    const plainText = brieftextRef.current ? htmlToPlainText(brieftextRef.current.innerHTML) : ''
    if (plainText) {
      const textLines = doc.splitTextToSize(plainText, 160)
      doc.text(textLines, 25, 142)
    }

    const textHeight = plainText ? doc.splitTextToSize(plainText, 160).length * 5 : 0
    const grussY = 142 + textHeight + 15
    doc.text(briefData.grussformel, 25, grussY)
    doc.text(briefData.unterschrift, 25, grussY + 20)

    // Fußzeile
    doc.setFontSize(7)
    doc.setTextColor(100, 100, 100)
    doc.setDrawColor(200, 200, 200)
    doc.line(25, 275, 185, 275)
    doc.text(`${pharmacy.name} | Inh. ${pharmacy.owner}, e.K. | ${pharmacy.street} | ${pharmacy.postal_code} ${pharmacy.city}`, 105, 280, { align: 'center' })
    doc.text(`Handelsregister: ${pharmacy.trade_register}, Registergericht: ${pharmacy.registry_court} | USt-IdNr. ${pharmacy.vat_id}`, 105, 284, { align: 'center' })

    if (returnBase64) {
      // Base64 ohne data:application/pdf;base64, Prefix zurückgeben
      return doc.output('datauristring').split(',')[1]
    }

    const fileName = briefData.betreff
      ? `Brief_${briefData.betreff.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}.pdf`
      : `Brief_${briefData.datum.replace(/\./g, '-')}.pdf`
    doc.save(fileName)
    return null
  }, [briefData, pharmacy, ruecksendeAdresse])

  // PDF herunterladen
  const generatePDF = useCallback(async () => {
    setPdfGenerating(true)
    try {
      createPDF(false)
    } catch (error) {
      console.error('PDF-Generierung fehlgeschlagen:', error)
    } finally {
      setPdfGenerating(false)
    }
  }, [createPDF])

  // LetterXpress Modal öffnen
  const openLetterXpress = useCallback(() => {
    try {
      const base64 = createPDF(true)
      setPdfBase64(base64)
      setShowLetterXpress(true)
    } catch (error) {
      console.error('PDF-Generierung fehlgeschlagen:', error)
    }
  }, [createPDF])

  const SCALE = 2.5 * (zoom / 100)

  return (
    <div className="brief-editor h-full flex flex-col">
      {/* KI-Assistent Panel - oben */}
      <AiAssistantPanel
        prompt={aiPrompt}
        onPromptChange={setAiPrompt}
        onGenerate={handleAiGenerate}
        generating={aiGenerating}
        error={aiError}
        disabled={!aiSettings?.api_key}
        placeholder="Beschreibe den Brief, z.B. 'Mahnung für offene Rechnung' oder 'Kündigung Liefervertrag'"
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onGoBack={goBack}
        onGoForward={goForward}
        historyInfo={historyInfo}
        className="rounded-t-xl"
      />

      {/* Toolbar - Funktionstasten */}
      <div className={`flex items-center justify-between gap-4 p-3 ${theme.surface} border ${theme.border} border-t-0`}>
        <div className="flex items-center gap-3">
          {/* Formatierung */}
          <div className="flex items-center gap-0.5 p-1 rounded bg-gray-100">
            <button
              type="button"
              onClick={() => execFormat('bold')}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-white font-bold text-sm"
              title="Fett (Ctrl+B)"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => execFormat('italic')}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-white italic text-sm"
              title="Kursiv (Ctrl+I)"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => execFormat('underline')}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-white underline text-sm"
              title="Unterstrichen (Ctrl+U)"
            >
              U
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Ausrichtung */}
          <div className="flex items-center gap-0.5 p-1 rounded bg-gray-100">
            <button
              type="button"
              onClick={() => execFormat('justifyLeft')}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-white"
              title="Linksbündig"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 6h18M3 12h12M3 18h18" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => execFormat('justifyCenter')}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-white"
              title="Zentriert"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 6h18M6 12h12M3 18h18" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => execFormat('justifyRight')}
              className="w-8 h-8 flex items-center justify-center rounded hover:bg-white"
              title="Rechtsbündig"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 6h18M9 12h12M3 18h18" />
              </svg>
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Schriftgröße */}
          <select
            onChange={(e) => execFormat('fontSize', e.target.value)}
            className="px-2 py-1.5 text-sm rounded border border-gray-300 bg-white"
            defaultValue="3"
          >
            <option value="1">9pt</option>
            <option value="2">10pt</option>
            <option value="3">11pt</option>
            <option value="4">12pt</option>
            <option value="5">14pt</option>
          </select>

          <div className="w-px h-6 bg-gray-300" />

          {/* Einschreiben */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={briefData.einschreiben}
              onChange={(e) => handleChange('einschreiben', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#4C8BF5]"
            />
            <span className="text-sm">Einschreiben</span>
          </label>
          {briefData.einschreiben && (
            <input
              type="text"
              value={briefData.vermerk}
              onChange={(e) => handleChange('vermerk', e.target.value)}
              className="px-2 py-1 rounded border border-gray-300 text-sm w-40"
              placeholder="Vermerk"
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(50, z - 10))}
              disabled={zoom <= 50}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30"
            >
              −
            </button>
            <span className="text-xs w-10 text-center text-gray-500">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom(z => Math.min(150, z + 10))}
              disabled={zoom >= 150}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={generatePDF}
            disabled={pdfGenerating}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${theme.primaryBg} ${theme.primaryHover} disabled:opacity-50`}
          >
            {pdfGenerating ? 'Erstellen...' : 'PDF'}
          </button>

          <button
            type="button"
            onClick={openLetterXpress}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white ${theme.secondaryAccent}`}
            title="Brief per Post versenden"
          >
            <PaperPlaneTilt className="w-4 h-4" weight="bold" />
            Versenden
          </button>
        </div>
      </div>

      {/* Brief-Dokument */}
      <div className="flex-1 overflow-auto bg-gray-200 p-8 rounded-b-xl">
        <div className="flex justify-center">
          <div
            className="bg-white relative"
            style={{
              width: `${210 * SCALE}px`,
              height: `${297 * SCALE}px`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              fontFamily: 'var(--font-space)',
            }}
          >
            {/* === FESTE ELEMENTE (nicht editierbar) === */}

            {/* Absenderblock (rechts oben) */}
            <div
              className="select-none"
              style={{
                position: 'absolute',
                top: `${20 * SCALE}px`,
                right: `${25 * SCALE}px`,
                textAlign: 'right',
                fontSize: `${3.5 * SCALE}px`,
                lineHeight: 1.5,
              }}
            >
              <p style={{ fontSize: `${5 * SCALE}px`, fontWeight: 700, color: '#235750' }}>
                {pharmacy.name}
              </p>
              <p>{pharmacy.street}</p>
              <p>{pharmacy.postal_code} {pharmacy.city}</p>
              <p style={{ marginTop: `${2 * SCALE}px` }}>Tel: {pharmacy.phone}</p>
              <p>{pharmacy.email}</p>
            </div>

            {/* Rücksendeadresse */}
            <p
              className="select-none"
              style={{
                position: 'absolute',
                top: `${45 * SCALE}px`,
                left: `${25 * SCALE}px`,
                width: `${85 * SCALE}px`,
                fontSize: `${2.5 * SCALE}px`,
                color: '#666',
                borderBottom: '1px solid #999',
                paddingBottom: `${1 * SCALE}px`,
              }}
            >
              {ruecksendeAdresse}
            </p>

            {/* Fußzeile */}
            <div
              className="select-none"
              style={{
                position: 'absolute',
                bottom: `${15 * SCALE}px`,
                left: `${25 * SCALE}px`,
                right: `${25 * SCALE}px`,
                textAlign: 'center',
                fontSize: `${2.5 * SCALE}px`,
                color: '#666',
                borderTop: '1px solid #ccc',
                paddingTop: `${2 * SCALE}px`,
              }}
            >
              <p>{pharmacy.name} | Inh. {pharmacy.owner}, e.K. | {pharmacy.street} | {pharmacy.postal_code} {pharmacy.city}</p>
              <p>Handelsregister: {pharmacy.trade_register}, Registergericht: {pharmacy.registry_court} | USt-IdNr. {pharmacy.vat_id}</p>
            </div>

            {/* === EDITIERBARE ELEMENTE === */}

            {/* Vermerkzone (wenn Einschreiben) */}
            {briefData.einschreiben && (
              <p
                style={{
                  position: 'absolute',
                  top: `${53 * SCALE}px`,
                  left: `${25 * SCALE}px`,
                  fontSize: `${3.5 * SCALE}px`,
                  fontWeight: 700,
                }}
              >
                {briefData.vermerk}
              </p>
            )}

            {/* Empfängeradresse */}
            <textarea
              value={briefData.empfaenger}
              onChange={(e) => handleChange('empfaenger', e.target.value)}
              placeholder={`Firma\nName\nStraße Nr.\nPLZ Ort`}
              className="bg-transparent border-none outline-none resize-none placeholder:text-gray-400"
              style={{
                position: 'absolute',
                top: `${(briefData.einschreiben ? 62 : 52) * SCALE}px`,
                left: `${25 * SCALE}px`,
                width: `${85 * SCALE}px`,
                height: `${28 * SCALE}px`,
                fontSize: `${3.5 * SCALE}px`,
                lineHeight: 1.4,
                fontFamily: 'var(--font-space)',
              }}
            />

            {/* Datum */}
            <input
              type="text"
              value={`${pharmacy.city}, ${briefData.datum}`}
              onChange={(e) => {
                const parts = e.target.value.split(', ')
                if (parts.length > 1) handleChange('datum', parts.slice(1).join(', '))
              }}
              className="bg-transparent border-none outline-none text-right"
              style={{
                position: 'absolute',
                top: `${95 * SCALE}px`,
                right: `${25 * SCALE}px`,
                width: `${60 * SCALE}px`,
                fontSize: `${3.5 * SCALE}px`,
                fontFamily: 'var(--font-space)',
              }}
            />

            {/* Betreff */}
            <input
              type="text"
              value={briefData.betreff}
              onChange={(e) => handleChange('betreff', e.target.value)}
              placeholder="Betreff"
              className="bg-transparent border-none outline-none placeholder:text-gray-400 font-bold"
              style={{
                position: 'absolute',
                top: `${105 * SCALE}px`,
                left: `${25 * SCALE}px`,
                right: `${25 * SCALE}px`,
                fontSize: `${4.5 * SCALE}px`,
                color: '#235750',
                borderBottom: briefData.betreff ? '1px solid #235750' : '1px dashed #ccc',
                paddingBottom: `${1.5 * SCALE}px`,
                fontFamily: 'var(--font-space)',
              }}
            />

            {/* Anrede */}
            <input
              type="text"
              value={briefData.anrede}
              onChange={(e) => handleChange('anrede', e.target.value)}
              placeholder="Sehr geehrte Damen und Herren,"
              className="bg-transparent border-none outline-none placeholder:text-gray-400"
              style={{
                position: 'absolute',
                top: `${120 * SCALE}px`,
                left: `${25 * SCALE}px`,
                right: `${25 * SCALE}px`,
                fontSize: `${4 * SCALE}px`,
                fontFamily: 'var(--font-space)',
              }}
            />

            {/* Brieftext (Rich Text) */}
            <div
              ref={brieftextRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Ihr Brieftext..."
              className="outline-none overflow-auto"
              style={{
                position: 'absolute',
                top: `${132 * SCALE}px`,
                left: `${25 * SCALE}px`,
                right: `${25 * SCALE}px`,
                bottom: `${70 * SCALE}px`,
                fontSize: `${4 * SCALE}px`,
                lineHeight: 1.6,
                fontFamily: 'var(--font-space)',
              }}
            />

            {/* Grußformel */}
            <input
              type="text"
              value={briefData.grussformel}
              onChange={(e) => handleChange('grussformel', e.target.value)}
              className="bg-transparent border-none outline-none"
              style={{
                position: 'absolute',
                bottom: `${55 * SCALE}px`,
                left: `${25 * SCALE}px`,
                width: `${80 * SCALE}px`,
                fontSize: `${4 * SCALE}px`,
                fontFamily: 'var(--font-space)',
              }}
            />

            {/* Unterschrift */}
            <input
              type="text"
              value={briefData.unterschrift}
              onChange={(e) => handleChange('unterschrift', e.target.value)}
              className="bg-transparent border-none outline-none"
              style={{
                position: 'absolute',
                bottom: `${42 * SCALE}px`,
                left: `${25 * SCALE}px`,
                width: `${80 * SCALE}px`,
                fontSize: `${4 * SCALE}px`,
                fontFamily: 'var(--font-space)',
              }}
            />
          </div>
        </div>
      </div>

      {/* LetterXpress Modal */}
      <LetterXpressModal
        theme={theme}
        show={showLetterXpress}
        onClose={() => setShowLetterXpress(false)}
        pdfBase64={pdfBase64}
        pageCount={1}
        einschreiben={briefData.einschreiben}
      />
    </div>
  )
}

export default BriefEditor
