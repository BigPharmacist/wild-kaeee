/**
 * PDF-Generator für AMK-Meldungen und Rückrufe
 * Extrahiert aus App.jsx für bessere Wartbarkeit
 */

/**
 * Hilfsfunktion: Bild von URL als Base64 laden
 */
async function loadImageAsBase64(url) {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.readAsDataURL(blob)
  })
}

/**
 * Hilfsfunktion: Bild von URL als Data-URL laden (für Fotos)
 */
async function loadImageAsDataUrl(url) {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

/**
 * Hilfsfunktion: Text bereinigen (Titel und Datum am Anfang entfernen)
 */
function cleanFullText(text, title) {
  let cleanedText = text
  if (title && cleanedText.startsWith(title)) {
    cleanedText = cleanedText.substring(title.length).trim()
  }
  // Entferne Datumszeile am Anfang (Format: dd.mm.yyyy oder yyyy-mm-dd)
  cleanedText = cleanedText.replace(/^\d{1,2}\.\d{1,2}\.\d{4}\s*\n?/, '').trim()
  cleanedText = cleanedText.replace(/^\d{4}-\d{2}-\d{2}\s*\n?/, '').trim()
  return cleanedText
}

/**
 * Hilfsfunktion: Dokumentations-Box rendern
 */
function renderDokumentationBox(doc, dok, margin, maxWidth, y, pageHeight, supabaseUrl, pznFotosSupport = false) {
  const boxPadding = 8
  const innerWidth = maxWidth - boxPadding * 2

  // Berechne Box-Höhe
  let boxHeight = 16 // Padding oben/unten
  let bemerkungLines = []

  if (dok.bemerkung) {
    doc.setFontSize(14)
    bemerkungLines = doc.splitTextToSize(dok.bemerkung, innerWidth)
    boxHeight += bemerkungLines.length * 7
  }
  if (dok.unterschrift_data) {
    boxHeight += 38 // Größere Unterschrift (75x30) + Abstand
  }
  // Platz für PZN-Fotos (nur bei Rückrufen)
  if (pznFotosSupport && dok.pzn_fotos && Object.keys(dok.pzn_fotos).length > 0) {
    boxHeight += 65 // Foto (60x45) + Label + Abstand
  }
  boxHeight += 14 // Name/Datum

  return { boxHeight, bemerkungLines, boxPadding, innerWidth }
}

/**
 * Hilfsfunktion: Leere Unterschriftsfelder rendern
 */
function renderEmptySignatureFields(doc, margin, y) {
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Bearbeitet durch:', margin, y)
  doc.line(margin + 35, y, margin + 100, y)
  y += 8
  doc.text('Bearbeitet am:', margin, y)
  doc.line(margin + 35, y, margin + 100, y)
  y += 12

  doc.setFont('helvetica', 'bold')
  doc.text('Zur Kenntnis genommen:', margin, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  for (let i = 0; i < 5; i++) {
    doc.text('Name / Datum:', margin, y)
    doc.line(margin + 30, y, margin + 100, y)
    y += 8
  }
  return y
}

/**
 * PDF-Download für AMK-Meldungen
 * @param {Object} msg - Die AMK-Meldung
 * @param {Object} supabase - Supabase Client
 * @param {string} supabaseUrl - Supabase URL
 */
export async function downloadAmkPdf(msg, supabase, supabaseUrl) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - margin * 2
  let y = 20

  // Logo laden und einfügen
  try {
    const logoUrl = `${supabaseUrl}/storage/v1/object/public/assets/AMK-Logo.jpg`
    const base64 = await loadImageAsBase64(logoUrl)
    doc.addImage(base64, 'JPEG', margin, y, 60, 28)
    y += 38
  } catch {
    y += 10
  }

  // Titel
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(msg.title || '', maxWidth)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 7 + 5

  // Kategorie
  if (msg.category) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100)
    doc.text(msg.category, margin, y)
    y += 6
  }

  // Datum
  if (msg.date) {
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(new Date(msg.date).toLocaleDateString('de-DE'), margin, y)
    y += 10
  }

  doc.setTextColor(0)

  // Institution
  if (msg.institution) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Institution:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(msg.institution, margin + 25, y)
    y += 8
  }

  // Trennlinie
  doc.setDrawColor(200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  // Volltext (ohne doppelten Titel/Datum am Anfang)
  if (msg.full_text) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const cleanedText = cleanFullText(msg.full_text, msg.title)
    const textLines = doc.splitTextToSize(cleanedText, maxWidth)

    for (let i = 0; i < textLines.length; i++) {
      if (y > pageHeight - 40) {
        doc.addPage()
        y = 20
      }
      doc.text(textLines[i], margin, y)
      y += 5
    }
    y += 10
  }

  // Dokumentationen aus Datenbank laden
  const { data: dokumentationen } = await supabase
    .from('amk_dokumentationen')
    .select('*')
    .eq('amk_message_id', msg.id)
    .order('erstellt_am', { ascending: true })

  // Fußzeile mit Dokumentation
  if (y > pageHeight - 80) {
    doc.addPage()
    y = 20
  }

  doc.setDrawColor(200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Gespeicherte Dokumentationen anzeigen
  if (dokumentationen && dokumentationen.length > 0) {
    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.text('Dokumentation:', margin, y)
    y += 12

    for (const dok of dokumentationen) {
      const { boxHeight, bemerkungLines, boxPadding } = renderDokumentationBox(
        doc, dok, margin, maxWidth, y, pageHeight, supabaseUrl, false
      )

      // Seitenumbruch prüfen
      if (y + boxHeight > pageHeight - 20) {
        doc.addPage()
        y = 20
      }

      // Box mit runden Ecken zeichnen
      doc.setFillColor(245, 247, 250)
      doc.setDrawColor(200)
      doc.roundedRect(margin, y, maxWidth, boxHeight, 4, 4, 'FD')

      let boxY = y + boxPadding

      // Bemerkung
      if (dok.bemerkung && bemerkungLines.length > 0) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(14)
        doc.setTextColor(0)
        for (const line of bemerkungLines) {
          doc.text(line, margin + boxPadding, boxY + 4)
          boxY += 7
        }
        boxY += 4
      }

      // Unterschrift als Bild (50% größer: 75x30)
      if (dok.unterschrift_data) {
        try {
          doc.addImage(dok.unterschrift_data, 'PNG', margin + boxPadding, boxY, 75, 30)
          boxY += 34
        } catch {
          // Fehler beim Laden der Unterschrift ignorieren
        }
      }

      // Name und Datum
      doc.setFontSize(12)
      doc.setTextColor(100)
      const nameAndDate = [
        dok.erstellt_von_name || '',
        dok.erstellt_am ? new Date(dok.erstellt_am).toLocaleString('de-DE') : ''
      ].filter(Boolean).join(' · ')
      if (nameAndDate) {
        doc.text(nameAndDate, margin + boxPadding, boxY + 4)
      }
      doc.setTextColor(0)

      y += boxHeight + 8
    }
  } else {
    // Leere Unterschriftsfelder nur wenn keine Dokumentation vorhanden
    y = renderEmptySignatureFields(doc, margin, y)
  }

  // Download
  const filename = `AMK_${msg.title?.substring(0, 30).replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_') || 'Meldung'}.pdf`
  doc.save(filename)
}

/**
 * PDF-Download für Rückrufe
 * @param {Object} msg - Die Rückruf-Meldung
 * @param {Object} supabase - Supabase Client
 * @param {string} supabaseUrl - Supabase URL
 */
export async function downloadRecallPdf(msg, supabase, supabaseUrl) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - margin * 2
  let y = 20

  // Logo laden und einfügen (AMK-Logo)
  try {
    const logoUrl = `${supabaseUrl}/storage/v1/object/public/assets/AMK-Logo.jpg`
    const base64 = await loadImageAsBase64(logoUrl)
    doc.addImage(base64, 'JPEG', margin, y, 60, 28)
    y += 38
  } catch {
    y += 10
  }

  // Rückruf-Badge
  doc.setFillColor(239, 68, 68)
  doc.roundedRect(margin, y, 30, 8, 2, 2, 'F')
  doc.setFontSize(8)
  doc.setTextColor(255)
  doc.setFont('helvetica', 'bold')
  doc.text('RÜCKRUF', margin + 3, y + 5.5)
  y += 14

  doc.setTextColor(0)

  // Titel
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  const titleLines = doc.splitTextToSize(msg.title || '', maxWidth)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 7 + 5

  // Produktname
  if (msg.product_name) {
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(220, 38, 38)
    doc.text(msg.product_name, margin, y)
    y += 8
  }

  doc.setTextColor(0)

  // Rückrufnummer und Datum in einer Zeile
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  let infoLine = ''
  if (msg.recall_number) infoLine += `Rückrufnummer: ${msg.recall_number}`
  if (msg.date) {
    if (infoLine) infoLine += '  |  '
    infoLine += new Date(msg.date).toLocaleDateString('de-DE')
  }
  if (infoLine) {
    doc.text(infoLine, margin, y)
    y += 8
  }

  doc.setTextColor(0)

  // Trennlinie
  doc.setDrawColor(200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  // KI-Zusammenfassung (falls vorhanden)
  if (msg.ai_zusammenfassung) {
    doc.setFillColor(240, 249, 255)
    const summaryLines = doc.splitTextToSize(msg.ai_zusammenfassung.replace(/[*#]/g, ''), maxWidth - 10)
    const boxHeight = summaryLines.length * 5 + 12
    doc.roundedRect(margin, y, maxWidth, boxHeight, 3, 3, 'F')

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(59, 130, 246)
    doc.text('KI-Zusammenfassung:', margin + 5, y + 6)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0)
    doc.setFontSize(9)
    doc.text(summaryLines, margin + 5, y + 12)
    y += boxHeight + 8
  }

  // Chargen-Info
  if (msg.ai_chargen_alle !== null || (msg.ai_chargen_liste && msg.ai_chargen_liste.length > 0)) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Betroffene Chargen:', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')

    if (msg.ai_chargen_alle) {
      doc.setTextColor(220, 38, 38)
      doc.text('ALLE CHARGEN BETROFFEN', margin, y)
      doc.setTextColor(0)
      y += 6
    } else if (msg.ai_chargen_liste && msg.ai_chargen_liste.length > 0) {
      const chargenText = msg.ai_chargen_liste.join(', ')
      const chargenLines = doc.splitTextToSize(chargenText, maxWidth)
      doc.text(chargenLines, margin, y)
      y += chargenLines.length * 5 + 2
    }
    y += 4
  }

  // PZN-Info
  if (msg.ai_pzn_betroffen && msg.ai_pzn_betroffen.length > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Betroffene PZN:', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    const pznText = msg.ai_pzn_betroffen.join(', ')
    const pznLines = doc.splitTextToSize(pznText, maxWidth)
    doc.text(pznLines, margin, y)
    y += pznLines.length * 5 + 6
  }

  // Trennlinie vor Volltext
  if (msg.full_text) {
    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8
  }

  // Volltext
  if (msg.full_text) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const cleanedText = cleanFullText(msg.full_text, msg.title)
    const textLines = doc.splitTextToSize(cleanedText, maxWidth)

    for (let i = 0; i < textLines.length; i++) {
      if (y > pageHeight - 40) {
        doc.addPage()
        y = 20
      }
      doc.text(textLines[i], margin, y)
      y += 5
    }
    y += 10
  }

  // Dokumentationen aus Datenbank laden
  const { data: dokumentationen } = await supabase
    .from('recall_dokumentationen')
    .select('*')
    .eq('recall_message_id', msg.id)
    .order('erstellt_am', { ascending: true })

  // Fußzeile mit Dokumentation
  if (y > pageHeight - 80) {
    doc.addPage()
    y = 20
  }

  doc.setDrawColor(200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Gespeicherte Dokumentationen anzeigen
  if (dokumentationen && dokumentationen.length > 0) {
    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.text('Dokumentation:', margin, y)
    y += 12

    for (const dok of dokumentationen) {
      const { boxHeight, bemerkungLines, boxPadding } = renderDokumentationBox(
        doc, dok, margin, maxWidth, y, pageHeight, supabaseUrl, true
      )

      // Seitenumbruch prüfen
      if (y + boxHeight > pageHeight - 20) {
        doc.addPage()
        y = 20
      }

      // Box mit runden Ecken zeichnen
      doc.setFillColor(245, 247, 250)
      doc.setDrawColor(200)
      doc.roundedRect(margin, y, maxWidth, boxHeight, 4, 4, 'FD')

      let boxY = y + boxPadding

      // Bemerkung
      if (dok.bemerkung && bemerkungLines.length > 0) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(14)
        doc.setTextColor(0)
        for (const line of bemerkungLines) {
          doc.text(line, margin + boxPadding, boxY + 4)
          boxY += 7
        }
        boxY += 4
      }

      // Unterschrift als Bild (50% größer: 75x30)
      if (dok.unterschrift_data) {
        try {
          doc.addImage(dok.unterschrift_data, 'PNG', margin + boxPadding, boxY, 75, 30)
          boxY += 34
        } catch {
          // Fehler beim Laden der Unterschrift ignorieren
        }
      }

      // PZN-Fotos anzeigen
      if (dok.pzn_fotos && Object.keys(dok.pzn_fotos).length > 0) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0)
        doc.text('PZN-Fotos:', margin + boxPadding, boxY + 4)
        boxY += 8

        let photoX = margin + boxPadding
        for (const [pzn, path] of Object.entries(dok.pzn_fotos)) {
          try {
            const photoUrl = `${supabaseUrl}/storage/v1/object/public/recall-fotos/${path}`
            const photoBase64 = await loadImageAsDataUrl(photoUrl)

            // Foto einfügen (60x45 - 50% größer)
            doc.addImage(photoBase64, 'JPEG', photoX, boxY, 60, 45)

            // PZN-Label unter dem Foto
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.text(pzn, photoX + 30, boxY + 50, { align: 'center' })

            photoX += 65
          } catch {
            // Fehler beim Laden des Fotos ignorieren
          }
        }
        boxY += 55
      }

      // Name und Datum
      doc.setFontSize(12)
      doc.setTextColor(100)
      const nameAndDate = [
        dok.erstellt_von_name || '',
        dok.erstellt_am ? new Date(dok.erstellt_am).toLocaleString('de-DE') : ''
      ].filter(Boolean).join(' · ')
      if (nameAndDate) {
        doc.text(nameAndDate, margin + boxPadding, boxY + 4)
      }
      doc.setTextColor(0)

      y += boxHeight + 8
    }
  } else {
    // Leere Unterschriftsfelder nur wenn keine Dokumentation vorhanden
    y = renderEmptySignatureFields(doc, margin, y)
  }

  // Download
  const filename = `Rueckruf_${msg.product_name?.substring(0, 30).replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_') || msg.title?.substring(0, 30).replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_') || 'Meldung'}.pdf`
  doc.save(filename)
}
