// Audio context for scan sound
let audioContext = null
let scanSoundBuffer = null

// Initialize audio
export const initAudio = async () => {
  if (audioContext) return

  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()

    // Create a simple beep sound programmatically
    const sampleRate = audioContext.sampleRate
    const duration = 0.1 // 100ms
    const frequency = 880 // A5 note

    const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const channel = buffer.getChannelData(0)

    for (let i = 0; i < buffer.length; i++) {
      // Sine wave with exponential decay
      const t = i / sampleRate
      const envelope = Math.exp(-t * 20)
      channel[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.5
    }

    scanSoundBuffer = buffer
  } catch (error) {
    console.error('Audio konnte nicht initialisiert werden:', error)
  }
}

// Play scan success sound
export const playScanSound = async () => {
  if (!audioContext || !scanSoundBuffer) {
    await initAudio()
  }

  if (!audioContext || !scanSoundBuffer) return

  // Resume audio context if suspended (required for mobile)
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }

  try {
    const source = audioContext.createBufferSource()
    source.buffer = scanSoundBuffer
    source.connect(audioContext.destination)
    source.start()
  } catch (error) {
    console.error('Sound konnte nicht abgespielt werden:', error)
  }
}

// Trigger vibration
export const triggerVibration = (duration = 100) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(duration)
  }
}

// Give feedback on successful scan
export const giveScanFeedback = async (soundEnabled, vibrationEnabled) => {
  const promises = []

  if (soundEnabled) {
    promises.push(playScanSound())
  }

  if (vibrationEnabled) {
    triggerVibration(100)
  }

  await Promise.all(promises)
}

// Format code type for display
export const formatCodeType = (codeType) => {
  const typeMap = {
    'QR_CODE': 'QR',
    'EAN_13': 'EAN-13',
    'EAN_8': 'EAN-8',
    'UPC_A': 'UPC-A',
    'UPC_E': 'UPC-E',
    'CODE_128': 'Code-128',
    'CODE_39': 'Code-39',
    'CODE_93': 'Code-93',
    'CODABAR': 'Codabar',
    'ITF': 'ITF',
    'DATA_MATRIX': 'DataMatrix',
    'PDF_417': 'PDF417',
    'AZTEC': 'Aztec',
  }

  return typeMap[codeType] || codeType || 'Unbekannt'
}

// Check if code looks like an EAN/UPC
export const isProductCode = (code) => {
  // EAN-13, EAN-8, UPC-A patterns
  return /^\d{8,13}$/.test(code)
}

// Check if code is a URL
export const isUrl = (code) => {
  try {
    new URL(code)
    return true
  } catch {
    return false
  }
}

// Truncate long codes for display
export const truncateCode = (code, maxLength = 30) => {
  if (!code || code.length <= maxLength) return code
  return code.substring(0, maxLength - 3) + '...'
}

/**
 * Validiert eine PZN (Pharmazentralnummer) anhand der Prüfziffer
 * PZN verwendet das Modulo-11-Verfahren mit Gewichtung 1-7
 *
 * @param {string} pzn - Die zu prüfende PZN (7 oder 8 Stellen)
 * @returns {object} - { valid: boolean, error?: string, normalized?: string }
 */
export const validatePzn = (pzn) => {
  if (!pzn || typeof pzn !== 'string') {
    return { valid: false, error: 'Keine PZN angegeben' }
  }

  // Nur Ziffern behalten
  const digits = pzn.replace(/\D/g, '')

  // PZN muss 7 oder 8 Stellen haben
  if (digits.length < 7 || digits.length > 8) {
    return { valid: false, error: `Ungültige Länge: ${digits.length} Stellen (7-8 erwartet)` }
  }

  // Auf 8 Stellen normalisieren (mit führender 0)
  const normalized = digits.padStart(8, '0')

  // Prüfziffer berechnen (Modulo-11 mit Gewichtung 1-7)
  let sum = 0
  for (let i = 0; i < 7; i++) {
    sum += parseInt(normalized[i], 10) * (i + 1)
  }

  const checkDigit = sum % 11

  // Prüfziffer 10 ist ungültig (keine einzelne Ziffer)
  if (checkDigit === 10) {
    return { valid: false, error: 'Ungültige PZN (Prüfziffer wäre 10)', normalized }
  }

  // Vergleiche berechnete mit tatsächlicher Prüfziffer
  const actualCheckDigit = parseInt(normalized[7], 10)

  if (checkDigit !== actualCheckDigit) {
    return {
      valid: false,
      error: `Prüfziffer falsch (ist ${actualCheckDigit}, sollte ${checkDigit} sein)`,
      normalized,
      expectedCheckDigit: checkDigit
    }
  }

  return { valid: true, normalized }
}

/**
 * Formatiert eine PZN für die Anzeige (mit führenden Nullen)
 */
export const formatPzn = (pzn) => {
  if (!pzn) return null
  const digits = pzn.replace(/\D/g, '')
  return digits.padStart(8, '0')
}

/**
 * Extrahiert PZN aus einem EAN-13 Barcode oder direkt gescannter PZN
 * Deutsche Pharma-EAN: 40XXXXXXXP (4 + 0 + 7-stellige PZN + Prüfziffer)
 * Oder direkt: 8-stellige PZN
 */
export const extractPznFromBarcode = (code) => {
  if (!code || typeof code !== 'string') return null

  // Nur Ziffern behalten
  const digits = code.replace(/\D/g, '')

  // Direkte PZN (7-8 Stellen)
  if (digits.length >= 7 && digits.length <= 8) {
    return {
      pzn: digits.padStart(8, '0'),
      source: 'direct'
    }
  }

  // EAN-13 (13 Stellen, deutsche Pharma beginnt mit 4)
  if (digits.length === 13 && digits.startsWith('4')) {
    // Format: 4 + Herstellercode + Artikelnummer + Prüfziffer
    // Für deutsche Pharma oft: 40 + PZN(7) + XX + Prüfziffer
    // Oder: 4X + XXXXX + PZN teilweise
    // Am sichersten: Stellen 2-9 als potentielle PZN probieren
    const pznCandidate = digits.substring(1, 9) // 8 Stellen nach der 4
    return {
      pzn: pznCandidate,
      ean: digits,
      source: 'ean13'
    }
  }

  // EAN-8 (8 Stellen)
  if (digits.length === 8) {
    return {
      pzn: digits,
      source: 'ean8'
    }
  }

  return null
}

/**
 * Parst GS1 DataMatrix Format (für deutsche Pharma mit IFA-Prefix 415)
 * Application Identifiers: 01 (GTIN), 17 (Verfall), 10 (Charge), 21 (Seriennummer)
 *
 * Deutsche Pharma-GTIN: 0 + 415 + 0 + PZN(8) + Prüfziffer = 14 Stellen
 * Beispiel: 04150142740145 → PZN = 14274014
 *
 * Typische Struktur: 01<GTIN14>21<serial><GS>17<expiry6>10<batch>
 */
function parseGS1DataMatrix(code) {
  // GS (Group Separator) = ASCII 29 / 0x1D
  // Ersetze durch Pipe für einfacheres Parsing
  const GS = '\x1d'
  const normalizedCode = code.replace(/[\x1d\x1D]/g, '|')

  const result = {
    isPharmaceutical: false,
    gtin: null,
    pzn: null,
    expiryDate: null,
    expiryFormatted: null,
    batch: null,
    serialNumber: null,
    raw: code,
    format: 'GS1',
  }

  // AI 01 = GTIN (immer 14 Stellen nach 01)
  const gtinMatch = normalizedCode.match(/01(\d{14})/)
  if (!gtinMatch) {
    return null
  }

  result.gtin = gtinMatch[1]
  const gtinEndPos = gtinMatch.index + 16 // 01 + 14 digits

  // Prüfe ob deutsche Pharma-GTIN (beginnt mit 0415)
  if (result.gtin.startsWith('0415')) {
    result.isPharmaceutical = true
    // PZN ist Position 5-12 (8 Stellen) in der GTIN
    // Format: 0 + 415 + 0 + PZN(8) + Prüfziffer
    result.pzn = result.gtin.substring(5, 13)
    console.log('GS1 - Deutsche Pharma-GTIN erkannt, PZN:', result.pzn)
  }

  // Rest des Codes nach GTIN parsen
  const restCode = normalizedCode.substring(gtinEndPos)
  console.log('GS1 - Rest nach GTIN:', restCode)

  // AI 21 = Seriennummer (direkt nach GTIN, bis | oder nächster AI)
  // Seriennummer kann alphanumerisch sein
  const serialMatch = restCode.match(/^21([A-Za-z0-9]+?)(?:\||17|10|$)/)
  if (serialMatch) {
    result.serialNumber = serialMatch[1]
  }

  // AI 17 = Verfallsdatum (YYMMDD - 6 Stellen)
  // Kann irgendwo im Rest sein
  const expiryMatch = restCode.match(/17(\d{6})/)
  if (expiryMatch) {
    result.expiryDate = expiryMatch[1]
    const yy = parseInt(expiryMatch[1].substring(0, 2), 10)
    const mm = parseInt(expiryMatch[1].substring(2, 4), 10)
    const dd = parseInt(expiryMatch[1].substring(4, 6), 10)
    const year = yy < 70 ? 2000 + yy : 1900 + yy
    // Tag 00 bedeutet "Ende des Monats"
    const day = dd === 0 ? new Date(year, mm, 0).getDate() : dd
    result.expiryFormatted = `${day.toString().padStart(2, '0')}.${mm.toString().padStart(2, '0')}.${year}`
  }

  // AI 10 = Chargennummer (oft am Ende, variable Länge)
  // Suche nach 10 NACH dem Verfallsdatum oder am Ende
  const batchMatch = restCode.match(/10([A-Za-z0-9]+)$/)
  if (batchMatch) {
    result.batch = batchMatch[1]
  }

  // Nur zurückgeben wenn deutsche Pharma erkannt
  if (!result.isPharmaceutical) {
    return null
  }

  return result
}

/**
 * Parst IFA PPN Format (deutsches Pharma-Format)
 * Data Identifier: 9N, 1T, D, S
 */
function parseIFAPPN(code) {
  const result = {
    isPharmaceutical: true,
    gtin: null,
    pzn: null,
    expiryDate: null,
    expiryFormatted: null,
    batch: null,
    serialNumber: null,
    raw: code,
    format: 'IFA_PPN',
  }

  // 9N = Produktcode: "11" + PZN(8) + Prüfziffer(2) = 12 Zeichen nach 9N
  const idx9N = code.indexOf('9N')
  if (idx9N !== -1) {
    // Nach 9N kommen: 11 (2 Stellen) + PZN (8 Stellen) + Prüfziffer (2 Stellen) = 12 Zeichen
    const productCode = code.substring(idx9N + 2, idx9N + 14)
    console.log('IFA PPN - Produktcode nach 9N:', productCode)

    if (productCode.startsWith('11') && productCode.length >= 10) {
      // PZN ist Stelle 2-9 (8 Stellen)
      result.pzn = productCode.substring(2, 10)
      console.log('IFA PPN - Extrahierte PZN:', result.pzn)
    }
  }

  // 1T = Chargennummer (bis zum nächsten Identifier oder Ende)
  const idx1T = code.indexOf('1T')
  if (idx1T !== -1) {
    // Finde Ende der Charge (nächster bekannter Identifier: D, S, 9N)
    let endIdx = code.length
    for (const marker of ['D', 'S', '9N']) {
      const markerIdx = code.indexOf(marker, idx1T + 2)
      if (markerIdx !== -1 && markerIdx < endIdx) {
        endIdx = markerIdx
      }
    }
    result.batch = code.substring(idx1T + 2, endIdx)
  }

  // D = Verfallsdatum (YYMMDD - 6 Zeichen)
  // Suche nach 'D' gefolgt von 6 Ziffern
  const dateMatch = code.match(/D(\d{6})/)
  if (dateMatch) {
    result.expiryDate = dateMatch[1]
    const yy = parseInt(dateMatch[1].substring(0, 2), 10)
    const mm = parseInt(dateMatch[1].substring(2, 4), 10)
    const dd = parseInt(dateMatch[1].substring(4, 6), 10)
    const year = yy < 70 ? 2000 + yy : 1900 + yy
    const day = dd === 0 ? new Date(year, mm, 0).getDate() : dd
    result.expiryFormatted = `${day.toString().padStart(2, '0')}.${mm.toString().padStart(2, '0')}.${year}`
  }

  // S = Seriennummer (bis zum Ende oder nächsten Identifier)
  const idxS = code.indexOf('S')
  if (idxS !== -1 && idxS !== idx9N) { // Nicht das S in 9N
    let endIdx = code.length
    for (const marker of ['1T', 'D', '9N']) {
      const markerIdx = code.indexOf(marker, idxS + 1)
      if (markerIdx !== -1 && markerIdx < endIdx) {
        endIdx = markerIdx
      }
    }
    result.serialNumber = code.substring(idxS + 1, endIdx)
  }

  // Nur zurückgeben wenn PZN gefunden
  if (!result.pzn) {
    return null
  }

  return result
}

/**
 * Parst einen DataMatrix Code von deutschen Arzneimittelpackungen
 *
 * Unterstützte Formate:
 *
 * 1. GS1 DataMatrix (häufiger):
 *    - AI 01 = GTIN-14 (für deutsche Pharma: 0415 + 0 + PZN + Prüfziffer)
 *    - AI 17 = Verfallsdatum (YYMMDD)
 *    - AI 10 = Chargennummer
 *    - AI 21 = Seriennummer
 *    Beispiel: 010415014274014521...17270831101BAG1022
 *
 * 2. IFA PPN Format (Deutschland / securPharm):
 *    - 9N = Produktcode: "11" + PZN(8) + Prüfziffer(2)
 *    - 1T = Chargennummer
 *    - D = Verfallsdatum (YYMMDD)
 *    - S = Seriennummer
 *    Beispiel: 9N1112345678XX1TABC123D260831S12345
 */
export const parseDataMatrixCode = (code) => {
  if (!code || typeof code !== 'string') return null

  console.log('DataMatrix Parser - Input:', code.substring(0, 100))

  // Versuche zuerst GS1 Format (häufiger bei deutschen Pharma-Produkten)
  // GS1 beginnt typischerweise mit "01" (GTIN AI)
  if (code.includes('01') && /01\d{14}/.test(code)) {
    const gs1Result = parseGS1DataMatrix(code)
    if (gs1Result) {
      console.log('DataMatrix Parser - GS1 erkannt:', gs1Result)
      return gs1Result
    }
  }

  // Dann IFA PPN Format (mit 9N Identifier)
  if (code.includes('9N')) {
    const ppnResult = parseIFAPPN(code)
    if (ppnResult) {
      console.log('DataMatrix Parser - IFA PPN erkannt:', ppnResult)
      return ppnResult
    }
  }

  console.log('DataMatrix Parser - Kein deutsches Pharma-Format erkannt')
  return null
}

/**
 * Prüft ob ein Code ein deutsches Pharma-Format ist (GS1 mit 415 oder IFA PPN)
 */
export const isPharmaceuticalCode = (code) => {
  if (!code || typeof code !== 'string') return false
  // IFA PPN Format
  if (code.includes('9N')) return true
  // GS1 mit deutscher Pharma-GTIN (0415...)
  if (/01\d{14}/.test(code) && code.includes('010415')) return true
  return false
}

/**
 * Formatiert ein geparsten Arzneimittel-Code für die Anzeige
 */
export const formatPharmaceuticalCode = (parsed) => {
  if (!parsed) return null

  const parts = []
  if (parsed.pzn) parts.push(`PZN ${parsed.pzn}`)
  if (parsed.batch) parts.push(`Ch. ${parsed.batch}`)
  if (parsed.expiryFormatted) parts.push(`Verfall ${parsed.expiryFormatted}`)

  return parts.join(' | ')
}
