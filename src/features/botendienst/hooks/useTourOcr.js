import { useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// PDF.js Worker für Vite konfigurieren
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export function useTourOcr() {
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [ocrError, setOcrError] = useState(null)
  const [rawText, setRawText] = useState('')
  const [parsedStops, setParsedStops] = useState([])
  const [parsedTourDate, setParsedTourDate] = useState(null)
  const [parsedTourName, setParsedTourName] = useState('')
  const [hasArticles, setHasArticles] = useState(false) // Erkennt ob Liste Artikel enthält

  // ============================================
  // PROCESS PDF FILE
  // ============================================

  const processPdf = useCallback(async (file) => {
    setProcessing(true)
    setProgress(0)
    setOcrError(null)
    setRawText('')
    setParsedStops([])

    try {
      // Dynamically import Tesseract (pdfjs already imported at top)
      setProgress(10)
      const Tesseract = await import('tesseract.js')

      // Load PDF
      setProgress(15)
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      setProgress(20)
      const numPages = pdf.numPages
      let fullText = ''

      // Process each page - Versuche zuerst direkte Text-Extraktion
      let useOcr = false

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        setProgress(20 + Math.floor((pageNum / numPages) * 60))

        const page = await pdf.getPage(pageNum)

        // Versuche direkte Text-Extraktion (besser für digitale PDFs mit Textboxen)
        const textContent = await page.getTextContent()
        let pageText = ''

        if (textContent.items.length > 0) {
          // Sortiere Text-Items nach Y-Position (oben nach unten), dann X (links nach rechts)
          const sortedItems = textContent.items
            .filter(item => item.str && item.str.trim())
            .sort((a, b) => {
              const yDiff = b.transform[5] - a.transform[5] // Y absteigend (oben zuerst)
              if (Math.abs(yDiff) > 5) return yDiff
              return a.transform[4] - b.transform[4] // X aufsteigend
            })

          // Gruppiere nach Zeilen (ähnliche Y-Position)
          let currentY = null
          let currentLine = []
          const lines = []

          sortedItems.forEach(item => {
            const y = Math.round(item.transform[5])
            if (currentY === null || Math.abs(y - currentY) > 8) {
              if (currentLine.length > 0) {
                lines.push(currentLine.join(' '))
              }
              currentLine = [item.str]
              currentY = y
            } else {
              currentLine.push(item.str)
            }
          })
          if (currentLine.length > 0) {
            lines.push(currentLine.join(' '))
          }

          pageText = lines.join('\n')
        }

        // Fallback zu OCR wenn kein Text extrahiert wurde
        if (!pageText.trim()) {
          useOcr = true
          const viewport = page.getViewport({ scale: 2.0 })
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          canvas.height = viewport.height
          canvas.width = viewport.width

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise

          const imageData = canvas.toDataURL('image/png')
          const { data } = await Tesseract.default.recognize(imageData, 'deu', {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                const pageProgress = 20 + Math.floor(((pageNum - 1) / numPages) * 60) +
                  Math.floor((m.progress * 60) / numPages)
                setProgress(Math.min(pageProgress, 80))
              }
            },
          })
          pageText = data.text
        }

        fullText += pageText + '\n\n--- Seite ' + pageNum + ' ---\n\n'
      }

      console.log('PDF-Extraktion:', useOcr ? 'OCR verwendet' : 'Direkte Text-Extraktion')

      setProgress(85)
      setRawText(fullText)

      // Parse the OCR text
      const { stops, tourDate, tourName, hasArticles: articlesFound } = parseOcrText(fullText)
      setParsedStops(stops)
      setParsedTourDate(tourDate)
      setParsedTourName(tourName)
      setHasArticles(articlesFound)

      setProgress(100)
      return { text: fullText, stops, tourDate, tourName, hasArticles: articlesFound }
    } catch (err) {
      console.error('OCR Fehler:', err)
      setOcrError(err.message)
      return null
    } finally {
      setProcessing(false)
    }
  }, [])

  // ============================================
  // PARSE OCR TEXT (XtraReport Format)
  // ============================================

  // Hilfsfunktion: Prüft ob eine Zeile ein Artikel ist
  const isArticleLine = (line) => {
    // Artikel-Zeilen beginnen mit einer Zahl und enthalten pharmazeutische Begriffe
    // Format: "1 MIRCERA 75 Mikrogramm/0,3 ml Inj.-Lsg.i.e.F.- 1 St 101CA"
    const articlePattern = /^\d+\s+[A-ZÄÖÜ][A-ZÄÖÜa-zäöüß0-9\s,.\-/()]+\s+\d+(\s*[Xx]\s*)?\d*\s*(St|ml|mg|g|Stück|Amp|Tbl|Kps|Btl|Fl|Dsfl)\b/i
    const pharmaKeywords = /(mg|ml|Mikrogramm|Ampullen?|Injektions|Infusions|Zäpfchen|Tabletten|Kapseln|Lösung|Salbe|Creme|Gel|Spray|Tropfen|Pulver|Plv|Inj|Inf)/i

    // Muss mit Zahl beginnen, aber NICHT wie eine Adresse aussehen (keine PLZ-Pattern)
    if (!/^\d+\s+/.test(line)) return false
    // Keine Adress-Zeilen (mit PLZ oder Straßen-Keywords)
    if (/\d{5}\s+[A-Za-z]/.test(line)) return false
    if (/Straße|Weg|Platz|Gasse|Ring|Allee/i.test(line)) return false
    // Keine Zeilen mit € (das sind Stop-Header oder Summen)
    if (/€/.test(line)) return false

    return articlePattern.test(line) || pharmaKeywords.test(line)
  }

  // Hilfsfunktion: Parst eine Artikel-Zeile
  const parseArticleLine = (line, sortOrder) => {
    // Format: "1 ARTIKELNAME Packungsgröße HERSTELLER"
    // oder mehrzeilig: "1 ARTIKELNAME" dann "Fortsetzung Packungsgröße HERSTELLER"

    const match = line.match(/^(\d+)\s+(.+)$/)
    if (!match) return null

    const quantity = parseInt(match[1], 10)
    let rest = match[2].trim()

    // Versuche Packungsgröße und Hersteller am Ende zu extrahieren
    // Pattern: "... 10 St HIKMA" oder "... 5X10 ml RATIO" oder "... 30 g ASPEG"
    const packMatch = rest.match(/^(.+?)\s+(\d+\s*[Xx]?\s*\d*\s*(?:St|ml|mg|g|Stück))\s+([A-Z0-9]{3,6})$/i)

    let articleName = rest
    let packageSize = null
    let manufacturerCode = null

    if (packMatch) {
      articleName = packMatch[1].trim()
      packageSize = packMatch[2].trim()
      manufacturerCode = packMatch[3].trim()
    } else {
      // Einfacheres Pattern ohne Hersteller
      const simpleMatch = rest.match(/^(.+?)\s+(\d+\s*[Xx]?\s*\d*\s*(?:St|ml|mg|g|Stück))$/i)
      if (simpleMatch) {
        articleName = simpleMatch[1].trim()
        packageSize = simpleMatch[2].trim()
      }
    }

    return {
      quantity,
      article_name: articleName,
      package_size: packageSize,
      manufacturer_code: manufacturerCode,
      sort_order: sortOrder,
    }
  }

  const parseOcrText = useCallback((text) => {
    const stops = []
    let hasArticles = false

    // Zeilen bereinigen und filtern
    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l)
      // Seitenumbruch-Markierungen entfernen
      .filter(l => !/^-+\s*Seite\s*\d+\s*-+$/i.test(l))
      .filter(l => !/^Seite\s*\d+\s*(von|\/)\s*\d+$/i.test(l))
      // Header-Zeilen entfernen (aber nicht Pos. Zeilen)
      .filter(l => !/^(Apotheke|Lieferliste|Versandauftrag)/i.test(l))
      .filter(l => !/^Datum:\s*\d/i.test(l))
      .filter(l => !/^Pos\.\s+Lieferungsempfänger/i.test(l))
      // Leere € Zeilen entfernen
      .filter(l => !/^€\s*[\d,]+\s*€\s*[\d,]+\s*$/.test(l))

    // Extract tour name from header (aus Original-Text)
    let tourName = ''
    const tourMatch = text.match(/Versandauftrag:\s*(.+)/i)
    if (tourMatch) {
      tourName = tourMatch[1].trim()
    }

    // Extract date (aus Original-Text)
    let tourDate = new Date().toISOString().split('T')[0]
    const dateMatch = text.match(/Datum:\s*(\d{2}\.\d{2}\.\d{2,4})/i)
    if (dateMatch) {
      const parts = dateMatch[1].split('.')
      const year = parts[2].length === 2 ? '20' + parts[2] : parts[2]
      tourDate = `${year}-${parts[1]}-${parts[0]}`
    }

    // Pattern for stop entries
    // Format: Pos. | Name | Packungen | Offene Kredite | Aktuelle Kredite
    // Then: Address line, Phone line, Notes line
    // Optional: Article lines (eingerückt, beginnen mit Zahl)

    let currentStop = null
    let position = 0
    let currentArticles = []
    let articleSortOrder = 0
    let pendingArticleContinuation = null // Für mehrzeilige Artikel

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]

      // Seitenumbruch-Reste aus Zeilen entfernen
      line = line.replace(/Seite\s*\d+\s*(von|\/)\s*\d+/gi, '').trim()
      line = line.replace(/-+\s*Seite\s*\d+\s*-+/gi, '').trim()

      if (!line) continue

      // Prüfe auf Artikel-Zeile (vor Stop-Check, da Artikel auch mit Zahl beginnen)
      if (currentStop && isArticleLine(line)) {
        hasArticles = true
        const article = parseArticleLine(line, articleSortOrder++)
        if (article) {
          // Prüfe ob vorherige Zeile eine unvollständige Artikel-Fortsetzung war
          if (pendingArticleContinuation) {
            // Füge die Fortsetzung zum letzten Artikel hinzu
            const lastArticle = currentArticles[currentArticles.length - 1]
            if (lastArticle) {
              lastArticle.article_name += ' ' + pendingArticleContinuation
            }
            pendingArticleContinuation = null
          }
          currentArticles.push(article)
        }
        continue
      }

      // Prüfe auf Artikel-Fortsetzungszeile (keine Zahl am Anfang, aber pharma-keywords)
      if (currentStop && currentArticles.length > 0) {
        const isPharmaLine = /(Injektions|Infusions|lösung|Lsg|Amp|Dsfl)/i.test(line) && !/^(\d+\s+|Tel|Empf|Liefer|€)/.test(line)
        if (isPharmaLine && !/\d{5}/.test(line)) {
          // Fortsetzung des letzten Artikels
          const lastArticle = currentArticles[currentArticles.length - 1]
          if (lastArticle) {
            // Prüfe ob die Zeile Packungsgröße/Hersteller enthält
            const packMatch = line.match(/^(.+?)\s+(\d+\s*[Xx]?\s*\d*\s*(?:St|ml|mg|g))\s+([A-Z0-9]{3,6})$/i)
            if (packMatch) {
              lastArticle.article_name += ' ' + packMatch[1].trim()
              lastArticle.package_size = packMatch[2].trim()
              lastArticle.manufacturer_code = packMatch[3].trim()
            } else {
              lastArticle.article_name += ' ' + line.trim()
            }
          }
          continue
        }
      }

      // Check for position number at start of line (indicates new stop)
      // Muss € enthalten um es von Artikeln zu unterscheiden
      const posMatch = line.match(/^(\d+)\s+(.+€.*)/)
      if (posMatch) {
        // Save previous stop if exists
        if (currentStop && currentStop.customer_name) {
          currentStop.items = currentArticles
          stops.push(currentStop)
        }

        position++
        currentArticles = []
        articleSortOrder = 0
        pendingArticleContinuation = null

        currentStop = {
          sort_order: position - 1,
          customer_name: '',
          street: '',
          postal_code: '',
          city: '',
          phone: '',
          package_count: 1,
          cash_amount: 0,
          delivery_notes: '',
          items: [],
        }

        // Parse the name from the rest of the line
        // Format might be: "1 Bolz, Hilde 1 € 0,00 € 0,00"
        const restOfLine = posMatch[2]

        // Try to extract name (before numbers/currency)
        const nameMatch = restOfLine.match(/^([^€\d]+?)(?:\s+\d|\s*€|$)/)
        if (nameMatch) {
          currentStop.customer_name = nameMatch[1].trim()
        }

        // Try to extract package count
        const packMatch = restOfLine.match(/(\d+)\s*€/)
        if (packMatch) {
          currentStop.package_count = parseInt(packMatch[1], 10)
        }

        // Try to extract cash amount (last € value = Aktuelle Kredite)
        const cashMatches = restOfLine.match(/€\s*(\d+[.,]\d{2})/g)
        if (cashMatches && cashMatches.length >= 1) {
          const lastCash = cashMatches[cashMatches.length - 1]
          const amount = lastCash.replace('€', '').trim().replace(',', '.')
          currentStop.cash_amount = parseFloat(amount)
        }
      } else if (currentStop) {
        // € Beträge aus Zeile entfernen für Adress-Parsing
        const lineWithoutMoney = line.replace(/€\s*[\d.,]+/g, '').trim()

        // Prüfe auf "bei XYZ" Lieferhinweis in der Zeile
        const beiMatch = lineWithoutMoney.match(/^(.+?)\s+(bei\s+.+)$/i)
        if (beiMatch && !currentStop.street) {
          // Straße ist vor "bei", Lieferhinweis ist "bei ..."
          const streetPart = beiMatch[1].trim()
          const notesPart = beiMatch[2].trim()

          // Straße mit PLZ und Stadt parsen
          const addrMatch = streetPart.match(/^(.+?),?\s*(\d{5})?\s*([A-Za-zäöüÄÖÜß\s]+)?$/)
          if (addrMatch) {
            currentStop.street = addrMatch[1].trim()
            if (addrMatch[2]) currentStop.postal_code = addrMatch[2]
            if (addrMatch[3]) currentStop.city = addrMatch[3].trim()
          } else {
            currentStop.street = streetPart
          }
          // Nur setzen wenn sinnvoller Inhalt
          if (notesPart && notesPart !== ':' && notesPart.length > 1) {
            currentStop.delivery_notes = notesPart
          }
          continue
        }

        // Address line - contains street and postal code
        const addressMatch = lineWithoutMoney.match(/^(.+?),?\s+(\d{5})\s+(.+)$/i)
        if (addressMatch && !currentStop.street) {
          currentStop.street = addressMatch[1].trim()
          currentStop.postal_code = addressMatch[2]
          currentStop.city = addressMatch[3].trim()
          continue
        }

        // Simpler address pattern - just street with number (ohne € Beträge)
        const streetMatch = lineWithoutMoney.match(/^([A-Za-zäöüÄÖÜß\s.\-]+\s*\d+[a-zA-Z]?)\s*,?\s*(\d{5})?\s*([A-Za-zäöüÄÖÜß\s]*)$/i)
        if (streetMatch && !currentStop.street) {
          currentStop.street = streetMatch[1].trim()
          if (streetMatch[2]) currentStop.postal_code = streetMatch[2]
          if (streetMatch[3]) currentStop.city = streetMatch[3].trim()
          continue
        }

        // Phone line
        const phoneMatch = line.match(/Tel\.?:?\s*([0-9\s/()-]+)/i)
        if (phoneMatch) {
          currentStop.phone = phoneMatch[1].trim()
          continue
        }

        // Delivery notes - kann mehrzeilig sein
        const notesMatch = line.match(/Lieferhinweis:?\s*(.+)/i)
        if (notesMatch) {
          // € Beträge aus Lieferhinweis entfernen
          let notes = notesMatch[1].replace(/€\s*[\d.,]+/g, '').trim()
          // Ignoriere leere Werte oder nur Doppelpunkte/Sonderzeichen
          if (notes && notes !== ':' && notes.length > 1 && !/^[:\-–—]+$/.test(notes)) {
            currentStop.delivery_notes = notes
          }
          currentStop._collectingNotes = true
          continue
        }

        // Check for "Empfber. Person" line which might contain notes
        const empfMatch = line.match(/Empf.*Person:?\s*(.*)/i)
        if (empfMatch) {
          currentStop._collectingNotes = false
          if (empfMatch[1].trim()) {
            let empfNotes = empfMatch[1].replace(/€\s*[\d.,]+/g, '').trim()
            // Nur hinzufügen wenn sinnvoller Inhalt
            if (empfNotes && empfNotes !== ':' && empfNotes.length > 1 && !/^[:\-–—]+$/.test(empfNotes)) {
              if (currentStop.delivery_notes) {
                currentStop.delivery_notes += ' | ' + empfNotes
              } else {
                currentStop.delivery_notes = empfNotes
              }
            }
          }
          continue
        }

        // Fortsetzungszeile für Lieferhinweis (keine bekannten Labels, kein leerer Text)
        if (currentStop._collectingNotes && line.length > 2) {
          // Prüfen ob es keine neue Sektion ist oder Seitenumbruch
          const isNewSection = /^(Pos|Tel|Straße|PLZ|\d{5}|Empf|Seite|Apotheke|Liefer)/i.test(line)
          const isJunkLine = /^€|^\d+\s*€|^-+$|^:+$/.test(line)
          if (!isNewSection && !isJunkLine) {
            // € Beträge aus Fortsetzung entfernen
            const cleanLine = line.replace(/€\s*[\d.,]+/g, '').trim()
            // Nur hinzufügen wenn sinnvoller Inhalt (nicht nur Doppelpunkte)
            if (cleanLine && cleanLine !== ':' && !/^[:\-–—]+$/.test(cleanLine)) {
              if (currentStop.delivery_notes) {
                currentStop.delivery_notes += ' ' + cleanLine
              } else {
                currentStop.delivery_notes = cleanLine
              }
            }
            continue
          }
          currentStop._collectingNotes = false
        }
      }
    }

    // Don't forget the last stop
    if (currentStop && currentStop.customer_name) {
      currentStop.items = currentArticles
      stops.push(currentStop)
    }

    const cleanedStops = stops.map((stop, index) => {
      // Entferne internes Flag
      const { _collectingNotes, ...cleanStop } = stop
      return {
        ...cleanStop,
        sort_order: index,
        // Clean up name (remove trailing numbers/currency)
        customer_name: cleanStop.customer_name
          .replace(/\s+\d+\s*$/, '')
          .replace(/\s+€.*$/, '')
          .trim(),
      }
    })

    return { stops: cleanedStops, tourDate, tourName, hasArticles }
  }, [])

  // ============================================
  // MANUAL TEXT PARSING (if user pastes text)
  // ============================================

  const parseManualText = useCallback((text) => {
    setRawText(text)
    const { stops, tourDate, tourName } = parseOcrText(text)
    setParsedStops(stops)
    setParsedTourDate(tourDate)
    setParsedTourName(tourName)
    return { stops, tourDate, tourName }
  }, [parseOcrText])

  // ============================================
  // CLEAR STATE
  // ============================================

  const clearOcr = useCallback(() => {
    setProcessing(false)
    setProgress(0)
    setOcrError(null)
    setRawText('')
    setParsedStops([])
    setParsedTourDate(null)
    setParsedTourName('')
    setHasArticles(false)
  }, [])

  // ============================================
  // EDIT PARSED STOP
  // ============================================

  const updateParsedStop = useCallback((index, updates) => {
    setParsedStops(prev => prev.map((stop, i) =>
      i === index ? { ...stop, ...updates } : stop
    ))
  }, [])

  // ============================================
  // REMOVE PARSED STOP
  // ============================================

  const removeParsedStop = useCallback((index) => {
    setParsedStops(prev => prev.filter((_, i) => i !== index))
  }, [])

  // ============================================
  // ADD EMPTY STOP
  // ============================================

  const addEmptyStop = useCallback(() => {
    setParsedStops(prev => [...prev, {
      sort_order: prev.length,
      customer_name: '',
      street: '',
      postal_code: '',
      city: '',
      phone: '',
      package_count: 1,
      cash_amount: 0,
      delivery_notes: '',
    }])
  }, [])

  return {
    // State
    processing,
    progress,
    ocrError,
    rawText,
    parsedStops,
    parsedTourDate,
    parsedTourName,
    hasArticles,

    // Actions
    processPdf,
    parseManualText,
    clearOcr,
    updateParsedStop,
    removeParsedStop,
    addEmptyStop,
  }
}
