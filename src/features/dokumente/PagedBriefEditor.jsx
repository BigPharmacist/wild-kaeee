import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { jsPDF } from 'jspdf'
import { PaperPlaneTilt } from '@phosphor-icons/react'
import LetterXpressModal from './LetterXpressModal'
import useBriefAi from './useBriefAi'
import { AiAssistantPanel } from '../../shared/ui'

// A4 in mm
const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

// Ränder in mm
const MARGIN_LEFT_MM = 25
const MARGIN_RIGHT_MM = 25
const MARGIN_TOP_MM = 20
const MARGIN_BOTTOM_MM = 20

// Feste Bereiche in mm (Seite 1)
const HEADER_END_MM = 55 // Ende des Absenderblocks
const ADDRESS_END_MM = 95 // Ende Adressfeld + Datum
const BETREFF_END_MM = 120 // Ende Betreff
const ANREDE_END_MM = 130 // Ende Anrede - hier beginnt der Content
const GRUSS_TOTAL_MM = 40 // 15mm Abstand + Grußformel (~5mm) + 15mm Abstand + Unterschrift (~5mm)
const FOOTER_HEIGHT_MM = 12 // Footer-Bereich (2 Zeilen à ~3mm + Abstand)

// Content-Bereiche
const CONTENT_START_PAGE1_MM = ANREDE_END_MM // 130mm
// Content endet vor Footer (bei ~275mm) minus Platz für Grußformel
const CONTENT_END_PAGE1_MM = A4_HEIGHT_MM - MARGIN_BOTTOM_MM - FOOTER_HEIGHT_MM - GRUSS_TOTAL_MM // 297-20-12-40 = 225mm
const CONTENT_HEIGHT_PAGE1_MM = CONTENT_END_PAGE1_MM - CONTENT_START_PAGE1_MM // 225-130 = 95mm

// Folgeseiten: Content startet oben, Grußformel nur auf letzter Seite
const CONTENT_START_PAGEX_MM = MARGIN_TOP_MM + 5 // 25mm
const CONTENT_END_PAGEX_MM = A4_HEIGHT_MM - MARGIN_BOTTOM_MM - FOOTER_HEIGHT_MM // 297-20-12 = 265mm (ohne Grußformel)
const CONTENT_HEIGHT_PAGEX_MM = CONTENT_END_PAGEX_MM - CONTENT_START_PAGEX_MM // 265-25 = 240mm

// Gap zwischen Seiten
const PAGE_GAP_PX = 24

// Schriftgrößen in pt (identisch zum PDF)
const FONT_SIZES_PT = {
  pharmacyName: 15,    // Apothekenname
  address: 9,          // Adressdaten
  returnAddress: 7,    // Rücksendeadresse
  recipient: 10,       // Empfänger
  date: 10,            // Datum
  subject: 12.5,       // Betreff
  salutation: 11,      // Anrede
  body: 11,            // Brieftext
  closing: 11,         // Grußformel
  footer: 7,           // Footer
}

// pt zu mm: 1pt = 0.352778mm
const ptToMm = (pt) => pt * 0.352778

const PagedBriefEditor = ({ theme, pharmacies, aiSettings }) => {
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

  const [zoom, setZoom] = useState(80)
  const [showLetterXpress, setShowLetterXpress] = useState(false)
  const [pdfBase64, setPdfBase64] = useState(null)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const editorContainerRef = useRef(null)

  // Scale Faktor (px pro mm)
  const scale = useMemo(() => (zoom / 100) * 3, [zoom])

  // Pixel-Werte berechnen
  const pageWidthPx = A4_WIDTH_MM * scale
  const pageHeightPx = A4_HEIGHT_MM * scale
  const contentWidthPx = (A4_WIDTH_MM - MARGIN_LEFT_MM - MARGIN_RIGHT_MM) * scale

  // Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'outline-none',
      },
    },
    onUpdate: () => {
      requestAnimationFrame(measureContent)
    },
  })

  // Content-Höhe messen
  const measureContent = useCallback(() => {
    if (!editorContainerRef.current) return
    const height = editorContainerRef.current.scrollHeight
    setContentHeight(height)
  }, [])

  useEffect(() => {
    measureContent()
    window.addEventListener('resize', measureContent)
    return () => window.removeEventListener('resize', measureContent)
  }, [measureContent])

  useEffect(() => {
    if (!editorContainerRef.current) return
    const observer = new ResizeObserver(measureContent)
    observer.observe(editorContainerRef.current)
    return () => observer.disconnect()
  }, [measureContent])

  // Seitenanzahl berechnen
  const pageCount = useMemo(() => {
    const contentHeightMm = contentHeight / scale
    // Seite 1 hat weniger Platz (wegen Header + Grußformel-Reservierung)
    if (contentHeightMm <= CONTENT_HEIGHT_PAGE1_MM) return 1
    // Overflow geht auf Folgeseiten (die haben mehr Platz)
    const overflow = contentHeightMm - CONTENT_HEIGHT_PAGE1_MM
    // Letzte Seite braucht Platz für Grußformel
    const effectivePageXHeight = CONTENT_HEIGHT_PAGEX_MM - GRUSS_TOTAL_MM
    return 1 + Math.ceil(overflow / effectivePageXHeight)
  }, [contentHeight, scale])

  // KI-Assistent
  const brieftextRef = useRef({ innerHTML: '' })
  useEffect(() => {
    if (editor) {
      brieftextRef.current = {
        get innerHTML() { return editor.getHTML() },
        set innerHTML(html) { editor.commands.setContent(html) },
      }
    }
  }, [editor])

  const {
    aiPrompt, setAiPrompt, aiGenerating, aiError, handleAiGenerate,
    canGoBack, canGoForward, goBack, goForward, historyInfo,
  } = useBriefAi({ aiSettings, briefData, setBriefData, brieftextRef })

  const handleChange = (field, value) => {
    setBriefData(prev => ({ ...prev, [field]: value }))
  }

  const ruecksendeAdresse = `${pharmacy.name}, ${pharmacy.street}, ${pharmacy.postal_code} ${pharmacy.city}`

  // Gesamthöhe des Dokuments (alle Seiten + Gaps)
  const totalDocHeight = useMemo(() => {
    return pageCount * pageHeightPx + (pageCount - 1) * PAGE_GAP_PX
  }, [pageCount, pageHeightPx])

  // Position für Content-Start auf jeder Seite berechnen
  const getContentTopForPage = (pageNum) => {
    if (pageNum === 1) return CONTENT_START_PAGE1_MM * scale
    // Folgeseiten: Position = (vorherige Seiten * Höhe) + Gaps + Content-Start
    const prevPagesHeight = (pageNum - 1) * pageHeightPx + (pageNum - 1) * PAGE_GAP_PX
    return prevPagesHeight + CONTENT_START_PAGEX_MM * scale
  }

  // PDF erstellen - Konstanten für konsistente Ränder
  const PDF_LEFT = MARGIN_LEFT_MM // 25mm
  const PDF_RIGHT = A4_WIDTH_MM - MARGIN_RIGHT_MM // 185mm
  const PDF_TEXT_WIDTH = A4_WIDTH_MM - MARGIN_LEFT_MM - MARGIN_RIGHT_MM // 160mm

  const createPDF = useCallback((returnBase64 = false) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    // WICHTIG: Schriftgröße MUSS vor splitTextToSize gesetzt werden!
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(FONT_SIZES_PT.body)

    const plainText = editor ? editor.getText() : ''
    const textLines = plainText ? doc.splitTextToSize(plainText, PDF_TEXT_WIDTH) : []

    const renderPage = (pageNum, startLine) => {
      if (pageNum > 1) doc.addPage()

      // Header nur auf Seite 1
      if (pageNum === 1) {
        // Absenderblock
        doc.setFontSize(FONT_SIZES_PT.pharmacyName)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(35, 87, 80)
        doc.text(pharmacy.name, PDF_RIGHT, 25, { align: 'right' })
        doc.setFontSize(FONT_SIZES_PT.address)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(pharmacy.street, PDF_RIGHT, 32, { align: 'right' })
        doc.text(`${pharmacy.postal_code} ${pharmacy.city}`, PDF_RIGHT, 37, { align: 'right' })
        doc.text(`Tel: ${pharmacy.phone}`, PDF_RIGHT, 44, { align: 'right' })
        doc.text(pharmacy.email, PDF_RIGHT, 49, { align: 'right' })

        // Rücksendeadresse
        doc.setFontSize(FONT_SIZES_PT.returnAddress)
        doc.setTextColor(100, 100, 100)
        doc.text(ruecksendeAdresse, PDF_LEFT, 47)
        doc.line(PDF_LEFT, 48, 110, 48)

        // Vermerk
        let adresseY = 55
        if (briefData.einschreiben) {
          doc.setFontSize(FONT_SIZES_PT.recipient)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(0, 0, 0)
          doc.text(briefData.vermerk, PDF_LEFT, 55)
          adresseY = 62
        }

        // Empfänger
        doc.setFontSize(FONT_SIZES_PT.recipient)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        briefData.empfaenger.split('\n').filter(l => l.trim()).forEach((line, i) => {
          doc.text(line, PDF_LEFT, adresseY + i * 5)
        })

        // Datum
        doc.setFontSize(FONT_SIZES_PT.date)
        doc.text(`${pharmacy.city}, ${briefData.datum}`, PDF_RIGHT, 100, { align: 'right' })

        // Betreff
        if (briefData.betreff) {
          doc.setFontSize(FONT_SIZES_PT.subject)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(35, 87, 80)
          doc.text(briefData.betreff, PDF_LEFT, 115)
          doc.line(PDF_LEFT, 118, PDF_RIGHT, 118)
        }

        // Anrede
        doc.setFontSize(FONT_SIZES_PT.salutation)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(briefData.anrede, PDF_LEFT, 130)
      }

      // Content
      doc.setFontSize(FONT_SIZES_PT.body)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)

      const startY = pageNum === 1 ? 142 : 30
      const maxY = A4_HEIGHT_MM - MARGIN_BOTTOM_MM - FOOTER_HEIGHT_MM - 5
      const lineHeight = 5
      let y = startY
      let lineIdx = startLine

      while (lineIdx < textLines.length && y < maxY) {
        doc.text(textLines[lineIdx], PDF_LEFT, y)
        y += lineHeight
        lineIdx++
      }

      // Grußformel auf letzter Seite
      if (lineIdx >= textLines.length) {
        const grussY = Math.min(y + 15, maxY - 25)
        doc.setFontSize(FONT_SIZES_PT.closing)
        doc.text(briefData.grussformel, PDF_LEFT, grussY)
        doc.text(briefData.unterschrift, PDF_LEFT, grussY + 20)
      }

      // Footer (alle Seiten)
      const footerY = A4_HEIGHT_MM - MARGIN_BOTTOM_MM
      doc.setFontSize(FONT_SIZES_PT.footer)
      doc.setTextColor(100, 100, 100)
      doc.setDrawColor(200, 200, 200)
      doc.line(PDF_LEFT, footerY - 7, PDF_RIGHT, footerY - 7)
      doc.text(`${pharmacy.name} | Inh. ${pharmacy.owner}, e.K. | ${pharmacy.street} | ${pharmacy.postal_code} ${pharmacy.city}`, A4_WIDTH_MM / 2, footerY - 2, { align: 'center' })
      doc.text(`Handelsregister: ${pharmacy.trade_register}, Registergericht: ${pharmacy.registry_court} | USt-IdNr. ${pharmacy.vat_id}`, A4_WIDTH_MM / 2, footerY + 2, { align: 'center' })

      if (pageCount > 1) {
        doc.setFontSize(8)
        doc.text(`Seite ${pageNum} von ${pageCount}`, PDF_RIGHT, footerY + 6, { align: 'right' })
      }

      return lineIdx
    }

    let lineIdx = 0
    for (let p = 1; p <= pageCount; p++) {
      lineIdx = renderPage(p, lineIdx)
    }

    if (returnBase64) return doc.output('datauristring').split(',')[1]

    const fileName = briefData.betreff
      ? `Brief_${briefData.betreff.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}.pdf`
      : `Brief_${briefData.datum.replace(/\./g, '-')}.pdf`
    doc.save(fileName)
  }, [briefData, pharmacy, ruecksendeAdresse, editor, pageCount])

  const generatePDF = useCallback(async () => {
    setPdfGenerating(true)
    try { createPDF(false) }
    finally { setPdfGenerating(false) }
  }, [createPDF])

  const openLetterXpress = useCallback(() => {
    const base64 = createPDF(true)
    setPdfBase64(base64)
    setShowLetterXpress(true)
  }, [createPDF])

  // Seiten-Hintergründe rendern
  const renderPageBackgrounds = () => {
    return Array.from({ length: pageCount }, (_, i) => {
      const pageNum = i + 1
      const topOffset = i * (pageHeightPx + PAGE_GAP_PX)

      return (
        <div
          key={pageNum}
          className="absolute bg-white"
          style={{
            top: topOffset,
            left: 0,
            width: pageWidthPx,
            height: pageHeightPx,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {/* Footer auf jeder Seite */}
          <div
            className="absolute left-0 right-0 text-center select-none"
            style={{
              bottom: MARGIN_BOTTOM_MM * scale,
              left: MARGIN_LEFT_MM * scale,
              right: MARGIN_RIGHT_MM * scale,
              fontSize: ptToMm(FONT_SIZES_PT.footer) * scale,
              color: '#666',
              borderTop: '1px solid #ccc',
              paddingTop: 2 * scale,
            }}
          >
            <p>{pharmacy.name} | Inh. {pharmacy.owner}, e.K. | {pharmacy.street} | {pharmacy.postal_code} {pharmacy.city}</p>
            <p>Handelsregister: {pharmacy.trade_register}, Registergericht: {pharmacy.registry_court} | USt-IdNr. {pharmacy.vat_id}</p>
            {pageCount > 1 && <p style={{ marginTop: scale }}>Seite {pageNum} von {pageCount}</p>}
          </div>

          {/* Seitenumbruch-Markierung (nicht auf letzter Seite) */}
          {pageNum < pageCount && (
            <div
              className="absolute left-0 right-0 flex items-center justify-center"
              style={{
                bottom: -PAGE_GAP_PX,
                height: PAGE_GAP_PX,
                background: '#e5e7eb',
              }}
            >
              <div className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded">
                Seitenumbruch
              </div>
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="brief-editor h-full flex flex-col">
      {/* KI-Assistent */}
      <AiAssistantPanel
        prompt={aiPrompt}
        onPromptChange={setAiPrompt}
        onGenerate={handleAiGenerate}
        generating={aiGenerating}
        error={aiError}
        disabled={!aiSettings?.api_key}
        placeholder="Beschreibe den Brief, z.B. 'Mahnung für offene Rechnung'"
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onGoBack={goBack}
        onGoForward={goForward}
        historyInfo={historyInfo}
        className="rounded-t-xl"
      />

      {/* Toolbar */}
      <div className={`flex items-center justify-between gap-4 p-3 ${theme.surface} border ${theme.border} border-t-0`}>
        <div className="flex items-center gap-3">
          {/* Formatierung */}
          <div className="flex items-center gap-0.5 p-1 rounded bg-gray-100">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`w-8 h-8 flex items-center justify-center rounded hover:bg-white font-bold text-sm ${editor?.isActive('bold') ? 'bg-white shadow-sm' : ''}`}
              title="Fett"
            >
              B
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`w-8 h-8 flex items-center justify-center rounded hover:bg-white italic text-sm ${editor?.isActive('italic') ? 'bg-white shadow-sm' : ''}`}
              title="Kursiv"
            >
              I
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={`w-8 h-8 flex items-center justify-center rounded hover:bg-white underline text-sm ${editor?.isActive('underline') ? 'bg-white shadow-sm' : ''}`}
              title="Unterstrichen"
            >
              U
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300" />

          {/* Ausrichtung */}
          <div className="flex items-center gap-0.5 p-1 rounded bg-gray-100">
            <button
              type="button"
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              className={`w-8 h-8 flex items-center justify-center rounded hover:bg-white ${editor?.isActive({ textAlign: 'left' }) ? 'bg-white shadow-sm' : ''}`}
              title="Linksbündig"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 6h18M3 12h12M3 18h18" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
              className={`w-8 h-8 flex items-center justify-center rounded hover:bg-white ${editor?.isActive({ textAlign: 'center' }) ? 'bg-white shadow-sm' : ''}`}
              title="Zentriert"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 6h18M6 12h12M3 18h18" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().setTextAlign('right').run()}
              className={`w-8 h-8 flex items-center justify-center rounded hover:bg-white ${editor?.isActive({ textAlign: 'right' }) ? 'bg-white shadow-sm' : ''}`}
              title="Rechtsbündig"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 6h18M9 12h12M3 18h18" />
              </svg>
            </button>
          </div>

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
          {pageCount > 1 && (
            <span className="text-xs text-gray-500">{pageCount} Seiten</span>
          )}

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
              onClick={() => setZoom(z => Math.min(120, z + 10))}
              disabled={zoom >= 120}
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

      {/* Dokument-Bereich */}
      <div className="flex-1 overflow-auto bg-gray-200 rounded-b-xl">
        <div className="flex justify-center py-8">
          {/* Dokument-Container */}
          <div
            className="relative"
            style={{
              width: pageWidthPx,
              minHeight: totalDocHeight,
            }}
          >
            {/* Seiten-Hintergründe */}
            {renderPageBackgrounds()}

            {/* === SEITE 1: Header-Bereich (absolut positioniert) === */}
            <div
              className="absolute select-none pointer-events-none"
              style={{
                top: MARGIN_TOP_MM * scale,
                right: MARGIN_RIGHT_MM * scale,
                textAlign: 'right',
                fontSize: ptToMm(FONT_SIZES_PT.address) * scale,
                lineHeight: 1.5,
              }}
            >
              <p style={{ fontSize: ptToMm(FONT_SIZES_PT.pharmacyName) * scale, fontWeight: 700, color: '#235750' }}>
                {pharmacy.name}
              </p>
              <p>{pharmacy.street}</p>
              <p>{pharmacy.postal_code} {pharmacy.city}</p>
              <p style={{ marginTop: 2 * scale }}>Tel: {pharmacy.phone}</p>
              <p>{pharmacy.email}</p>
            </div>

            {/* Rücksendeadresse */}
            <p
              className="absolute select-none pointer-events-none"
              style={{
                top: 45 * scale,
                left: MARGIN_LEFT_MM * scale,
                width: 85 * scale,
                fontSize: ptToMm(FONT_SIZES_PT.returnAddress) * scale,
                color: '#666',
                borderBottom: '1px solid #999',
                paddingBottom: scale,
              }}
            >
              {ruecksendeAdresse}
            </p>

            {/* Vermerk */}
            {briefData.einschreiben && (
              <p
                className="absolute"
                style={{
                  top: 53 * scale,
                  left: MARGIN_LEFT_MM * scale,
                  fontSize: ptToMm(FONT_SIZES_PT.recipient) * scale,
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
              className="absolute bg-transparent border-none outline-none resize-none placeholder:text-gray-400"
              style={{
                top: (briefData.einschreiben ? 62 : 52) * scale,
                left: MARGIN_LEFT_MM * scale,
                width: 85 * scale,
                height: 28 * scale,
                fontSize: ptToMm(FONT_SIZES_PT.recipient) * scale,
                lineHeight: 1.4,
                fontFamily: 'Helvetica, Arial, sans-serif',
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
              className="absolute bg-transparent border-none outline-none text-right"
              style={{
                top: 95 * scale,
                right: MARGIN_RIGHT_MM * scale,
                width: 60 * scale,
                fontSize: ptToMm(FONT_SIZES_PT.date) * scale,
                fontFamily: 'Helvetica, Arial, sans-serif',
              }}
            />

            {/* Betreff */}
            <input
              type="text"
              value={briefData.betreff}
              onChange={(e) => handleChange('betreff', e.target.value)}
              placeholder="Betreff"
              className="absolute bg-transparent border-none outline-none placeholder:text-gray-400 font-bold"
              style={{
                top: 105 * scale,
                left: MARGIN_LEFT_MM * scale,
                width: contentWidthPx,
                fontSize: ptToMm(FONT_SIZES_PT.subject) * scale,
                color: '#235750',
                borderBottom: briefData.betreff ? '1px solid #235750' : '1px dashed #ccc',
                paddingBottom: 1.5 * scale,
                fontFamily: 'Helvetica, Arial, sans-serif',
              }}
            />

            {/* Anrede */}
            <input
              type="text"
              value={briefData.anrede}
              onChange={(e) => handleChange('anrede', e.target.value)}
              placeholder="Sehr geehrte Damen und Herren,"
              className="absolute bg-transparent border-none outline-none placeholder:text-gray-400"
              style={{
                top: 120 * scale,
                left: MARGIN_LEFT_MM * scale,
                width: contentWidthPx,
                fontSize: ptToMm(FONT_SIZES_PT.salutation) * scale,
                fontFamily: 'Helvetica, Arial, sans-serif',
              }}
            />

            {/* === BRIEFTEXT (Tiptap Editor) - Seite 1 === */}
            <div
              className="absolute"
              style={{
                top: CONTENT_START_PAGE1_MM * scale,
                left: MARGIN_LEFT_MM * scale,
                width: contentWidthPx,
                height: CONTENT_HEIGHT_PAGE1_MM * scale,
                overflow: 'hidden',
              }}
            >
              <div
                ref={editorContainerRef}
                style={{
                  fontSize: ptToMm(FONT_SIZES_PT.body) * scale,
                  lineHeight: 1.6,
                  fontFamily: 'Helvetica, Arial, sans-serif',
                }}
              >
                <EditorContent editor={editor} />
              </div>
            </div>

            {/* === BRIEFTEXT Fortsetzung - Seite 2+ === */}
            {pageCount > 1 && Array.from({ length: pageCount - 1 }, (_, i) => {
              const pageNum = i + 2
              const pageTopOffset = (pageNum - 1) * (pageHeightPx + PAGE_GAP_PX)
              // Wie viel Content wurde auf vorherigen Seiten gezeigt
              const contentOffsetMm = CONTENT_HEIGHT_PAGE1_MM + i * CONTENT_HEIGHT_PAGEX_MM
              const contentOffsetPx = contentOffsetMm * scale

              return (
                <div
                  key={pageNum}
                  className="absolute pointer-events-none"
                  style={{
                    top: pageTopOffset + CONTENT_START_PAGEX_MM * scale,
                    left: MARGIN_LEFT_MM * scale,
                    width: contentWidthPx,
                    height: CONTENT_HEIGHT_PAGEX_MM * scale,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      marginTop: -contentOffsetPx,
                      fontSize: ptToMm(FONT_SIZES_PT.body) * scale,
                      lineHeight: 1.6,
                      fontFamily: 'Helvetica, Arial, sans-serif',
                    }}
                    dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }}
                  />
                </div>
              )
            })}

            {/* === GRUSSFORMEL (auf der letzten Seite, nach dem Content) === */}
            {(() => {
              // Berechne Position der Grußformel
              const contentHeightMm = contentHeight / scale
              const totalContentMm = contentHeightMm + 15 // +15mm Abstand

              let grussPageNum = 1
              let grussTopOnPage = totalContentMm

              if (totalContentMm > CONTENT_HEIGHT_PAGE1_MM) {
                // Content überläuft auf weitere Seiten
                const overflow = totalContentMm - CONTENT_HEIGHT_PAGE1_MM
                grussPageNum = 1 + Math.ceil(overflow / CONTENT_HEIGHT_PAGEX_MM)
                const overflowOnLastPage = overflow - (grussPageNum - 2) * CONTENT_HEIGHT_PAGEX_MM
                grussTopOnPage = CONTENT_START_PAGEX_MM + overflowOnLastPage
              } else {
                grussTopOnPage = CONTENT_START_PAGE1_MM + totalContentMm
              }

              const pageTopOffset = (grussPageNum - 1) * (pageHeightPx + PAGE_GAP_PX)

              return (
                <div
                  className="absolute"
                  style={{
                    top: pageTopOffset + grussTopOnPage * scale,
                    left: MARGIN_LEFT_MM * scale,
                  }}
                >
                  <input
                    type="text"
                    value={briefData.grussformel}
                    onChange={(e) => handleChange('grussformel', e.target.value)}
                    className="bg-transparent border-none outline-none block"
                    style={{
                      width: 80 * scale,
                      fontSize: ptToMm(FONT_SIZES_PT.closing) * scale,
                      fontFamily: 'Helvetica, Arial, sans-serif',
                    }}
                  />
                  <input
                    type="text"
                    value={briefData.unterschrift}
                    onChange={(e) => handleChange('unterschrift', e.target.value)}
                    className="bg-transparent border-none outline-none block"
                    style={{
                      width: 80 * scale,
                      fontSize: ptToMm(FONT_SIZES_PT.closing) * scale,
                      fontFamily: 'Helvetica, Arial, sans-serif',
                      marginTop: 15 * scale,
                    }}
                  />
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* LetterXpress Modal */}
      <LetterXpressModal
        theme={theme}
        show={showLetterXpress}
        onClose={() => setShowLetterXpress(false)}
        pdfBase64={pdfBase64}
        pageCount={pageCount}
        einschreiben={briefData.einschreiben}
      />
    </div>
  )
}

export default PagedBriefEditor
