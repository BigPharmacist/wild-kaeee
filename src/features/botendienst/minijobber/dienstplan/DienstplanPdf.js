import { jsPDF } from 'jspdf'

const dayNamesShort = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const monthNames = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

function toLocalDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Farben
const COLORS = {
  primary: [30, 41, 59],       // Navy #1E293B
  accent: [245, 158, 11],      // Amber #F59E0B
  headerBg: [30, 41, 59],      // Navy
  headerText: [255, 255, 255], // Weiß
  rowEven: [255, 255, 255],
  rowOdd: [248, 250, 252],     // Sehr helles Blau-Grau
  saturday: [254, 243, 199],   // Helles Amber
  holiday: [254, 226, 226],    // Helles Rot
  holidayText: [185, 28, 28],
  border: [203, 213, 225],     // Slate-200
  textDark: [30, 41, 59],
  textMuted: [100, 116, 139],
  shiftVormittag: [219, 234, 254], // Blau
  shiftNachmittag: [220, 252, 231], // Grün
}

export function generateDienstplanPdf({ year, month, schedules, shifts, profiles, holidays, pharmacyName }) {
  const doc = new jsPDF('p', 'mm', 'a4') // Hochformat
  const pageWidth = 210
  const pageHeight = 297
  const margin = 15
  const contentWidth = pageWidth - 2 * margin

  // Profile-Map
  const profileMap = {}
  profiles.forEach(p => {
    profileMap[p.staff_id] = p.staff?.first_name || '?'
  })

  // Nur aktive Schichten, sortiert
  const shiftOrder = ['Vormittag', 'Nachmittag']
  const activeShifts = shifts
    .filter(s => s.active !== false)
    .sort((a, b) => {
      const iA = shiftOrder.indexOf(a.name)
      const iB = shiftOrder.indexOf(b.name)
      if (iA !== -1 && iB !== -1) return iA - iB
      if (iA !== -1) return -1
      if (iB !== -1) return 1
      return a.name.localeCompare(b.name)
    })

  // Holiday-Map
  const holidayMap = {}
  ;(holidays || []).forEach(h => { holidayMap[h.date] = h.name })

  // Schedule-Map
  const scheduleMap = {}
  schedules.forEach(s => {
    if (!scheduleMap[s.date]) scheduleMap[s.date] = {}
    const shiftId = s.shift_id || '_none'
    if (!scheduleMap[s.date][shiftId]) scheduleMap[s.date][shiftId] = []
    const name = profileMap[s.staff_id]
    if (name) {
      scheduleMap[s.date][shiftId].push({ name, absent: s.absent })
    }
  })

  // Tage generieren (ohne Sonntage)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    if (d.getDay() === 0) continue
    days.push({
      date: d,
      dateStr: toLocalDateStr(d),
      dayName: dayNamesShort[d.getDay()],
      isHoliday: !!holidayMap[toLocalDateStr(d)],
      holidayName: holidayMap[toLocalDateStr(d)],
      isSaturday: d.getDay() === 6,
      weekday: d.getDay(),
    })
  }

  // Spaltenbreiten
  const dateColWidth = 24
  const shiftColWidth = activeShifts.length > 0
    ? (contentWidth - dateColWidth) / activeShifts.length
    : contentWidth - dateColWidth

  const rowHeight = 7.5
  const headerHeight = 10

  // ===== Seiten-Header zeichnen =====
  function drawPageHeader(yPos) {
    // Akzentlinie oben
    doc.setFillColor(...COLORS.accent)
    doc.rect(margin, yPos, contentWidth, 1.5, 'F')
    yPos += 5

    // Titel
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.primary)
    doc.text(`Dienstplan Botendienst`, margin, yPos)

    // Monat/Jahr rechts
    doc.setFontSize(18)
    doc.text(`${monthNames[month]} ${year}`, pageWidth - margin, yPos, { align: 'right' })
    yPos += 5

    // Apothekenname
    if (pharmacyName) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLORS.textMuted)
      doc.text(pharmacyName, margin, yPos)
    }
    yPos += 6

    // Trennlinie
    doc.setDrawColor(...COLORS.border)
    doc.setLineWidth(0.3)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 4

    return yPos
  }

  // ===== Tabellen-Header zeichnen =====
  function drawTableHeader(yPos) {
    // Dunkler Header
    doc.setFillColor(...COLORS.headerBg)
    roundedRect(doc, margin, yPos, contentWidth, headerHeight, 1.5, 'F')

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...COLORS.headerText)
    doc.text('Datum', margin + 3, yPos + 6.5)

    let colX = margin + dateColWidth
    for (const shift of activeShifts) {
      // Vertikale Trennlinie im Header
      doc.setDrawColor(60, 75, 95)
      doc.setLineWidth(0.2)
      doc.line(colX, yPos + 2, colX, yPos + headerHeight - 2)

      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.text(shift.name, colX + 3, yPos + 5)
      doc.setFontSize(6)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(180, 190, 205)
      doc.text(`${shift.start_time?.slice(0, 5)} – ${shift.end_time?.slice(0, 5)}`, colX + 3, yPos + 8.5)
      doc.setTextColor(...COLORS.headerText)

      colX += shiftColWidth
    }

    return yPos + headerHeight
  }

  // ===== Seite starten =====
  let y = drawPageHeader(margin)
  y = drawTableHeader(y)

  let rowIndex = 0
  let prevWeekday = null

  for (const day of days) {
    // Wochentrenner: Montag nach Samstag = neue Woche
    const needsSeparator = prevWeekday !== null && day.weekday === 1
    const neededHeight = rowHeight + (needsSeparator ? 3 : 0)

    // Seitenumbruch prüfen
    if (y + neededHeight > pageHeight - 15) {
      // Untere Akzentlinie
      doc.setFillColor(...COLORS.accent)
      doc.rect(margin, y + 1, contentWidth, 0.5, 'F')

      doc.addPage()
      y = margin + 4
      y = drawTableHeader(y)
      rowIndex = 0
    }

    // Wochentrenner
    if (needsSeparator) {
      doc.setDrawColor(...COLORS.accent)
      doc.setLineWidth(0.6)
      doc.line(margin, y + 1.5, pageWidth - margin, y + 1.5)
      y += 3
    }

    // Zeilen-Hintergrund
    let bgColor
    if (day.isHoliday) {
      bgColor = COLORS.holiday
    } else if (day.isSaturday) {
      bgColor = COLORS.saturday
    } else {
      bgColor = rowIndex % 2 === 0 ? COLORS.rowEven : COLORS.rowOdd
    }
    doc.setFillColor(...bgColor)
    doc.rect(margin, y, contentWidth, rowHeight, 'F')

    // Rahmenlinien (nur horizontal + Außen)
    doc.setDrawColor(...COLORS.border)
    doc.setLineWidth(0.15)
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight)
    // Seitliche Ränder
    doc.line(margin, y, margin, y + rowHeight)
    doc.line(pageWidth - margin, y, pageWidth - margin, y + rowHeight)

    // Datum
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    if (day.isHoliday) {
      doc.setTextColor(...COLORS.holidayText)
    } else {
      doc.setTextColor(...COLORS.textDark)
    }
    doc.text(day.dayName, margin + 2.5, y + 5)

    doc.setFont('helvetica', 'normal')
    doc.text(day.date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }), margin + 9, y + 5)

    // Schicht-Spalten
    const dayData = scheduleMap[day.dateStr] || {}
    let colX = margin + dateColWidth
    for (let si = 0; si < activeShifts.length; si++) {
      const shift = activeShifts[si]

      // Spalten-Trennlinie
      doc.setDrawColor(...COLORS.border)
      doc.setLineWidth(0.15)
      doc.line(colX, y, colX, y + rowHeight)

      const entries = dayData[shift.id] || []
      if (entries.length > 0) {
        // Namen zeichnen
        let nameX = colX + 3
        for (let ni = 0; ni < entries.length; ni++) {
          const entry = entries[ni]
          const nameText = entry.name

          // Kleiner farbiger Hintergrund-Chip für jeden Namen
          const textWidth = doc.getTextWidth(nameText)
          const chipWidth = textWidth + 4
          const chipHeight = 4.5
          const chipY = y + (rowHeight - chipHeight) / 2

          if (entry.absent) {
            doc.setFillColor(240, 240, 240)
            doc.setTextColor(...COLORS.textMuted)
          } else {
            const chipColor = shift.name.includes('Vormittag') || shift.name.includes('Früh')
              ? COLORS.shiftVormittag
              : shift.name.includes('Nachmittag') || shift.name.includes('Spät')
                ? COLORS.shiftNachmittag
                : [240, 240, 240]
            doc.setFillColor(...chipColor)
            doc.setTextColor(...COLORS.textDark)
          }

          roundedRect(doc, nameX, chipY, chipWidth, chipHeight, 1, 'F')

          doc.setFontSize(7)
          doc.setFont('helvetica', 'bold')
          doc.text(nameText, nameX + 2, chipY + 3.3)

          nameX += chipWidth + 2
        }
      }

      colX += shiftColWidth
    }

    doc.setTextColor(0)
    prevWeekday = day.weekday
    rowIndex++
    y += rowHeight
  }

  // Untere Akzentlinie
  doc.setFillColor(...COLORS.accent)
  doc.rect(margin, y + 1, contentWidth, 0.5, 'F')

  // Footer
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORS.textMuted)
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  doc.text(`Erstellt am ${today}`, margin, pageHeight - 10)
  doc.text(`${monthNames[month]} ${year}`, pageWidth - margin, pageHeight - 10, { align: 'right' })

  // Speichern
  doc.save(`Dienstplan_${monthNames[month]}_${year}.pdf`)
}

// Hilfsfunktion: abgerundetes Rechteck
function roundedRect(doc, x, y, w, h, r, style) {
  doc.roundedRect(x, y, w, h, r, r, style)
}
