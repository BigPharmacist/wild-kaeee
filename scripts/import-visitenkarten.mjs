#!/usr/bin/env node
/**
 * Einmaliger Import von Visitenkarten-PDFs
 * - Liest PDFs aus dem Ordner
 * - Lädt sie zu Supabase Storage hoch
 * - Führt OCR mit Mistral durch
 * - Erstellt Kontakte in der Datenbank
 */

import { createClient } from '@supabase/supabase-js'
import { readFile, readdir } from 'fs/promises'
import { join, basename } from 'path'

// Konfiguration
const SUPABASE_URL = 'https://kaeee.de/supabase'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Njc4MDE0OTMsImV4cCI6MjA4MzE2MTQ5M30.OSW6k9WdFIoCn1mTe_ase-b3KlOiOMk4iR8h8IYpBbI'
const VISITENKARTEN_ORDNER = '/home/matthias/Syncthing Austausch/Visitenkarten erfasst'

// Supabase Client mit Service Role (Admin)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Mistral API Key aus Datenbank holen
async function getMistralApiKey() {
  const { data, error } = await supabase
    .from('api_keys')
    .select('key')
    .eq('name', 'Mistral')
    .single()

  if (error || !data) {
    throw new Error('Mistral API Key nicht gefunden in api_keys Tabelle')
  }
  return data.key
}

// Ersten Staff-Member als Owner holen
async function getDefaultOwner() {
  const { data, error } = await supabase
    .from('staff')
    .select('id')
    .limit(1)
    .single()

  if (error || !data) {
    throw new Error('Kein Staff-Member gefunden. Bitte zuerst einen Mitarbeiter anlegen.')
  }
  return data.id
}

// PDF zu Base64 konvertieren
async function pdfToBase64(filePath) {
  const buffer = await readFile(filePath)
  return buffer.toString('base64')
}

// Schritt 1: OCR mit Mistral OCR API - Text aus PDF extrahieren
async function extractTextFromPdf(base64Pdf, apiKey) {
  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'document_url',
        document_url: `data:application/pdf;base64,${base64Pdf}`
      }
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Mistral OCR Fehler: ${response.status} - ${errorText}`)
  }

  const result = await response.json()

  // Text aus allen Seiten zusammenfügen
  let fullText = ''
  if (result.pages) {
    for (const page of result.pages) {
      if (page.markdown) {
        fullText += page.markdown + '\n'
      }
    }
  }

  return fullText.trim()
}

// Schritt 2: Text analysieren und Kontaktdaten extrahieren
async function parseContactFromText(text, apiKey) {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [
        {
          role: 'user',
          content: `Analysiere diesen Text einer Visitenkarte und extrahiere die Kontaktdaten.
Antworte NUR mit einem JSON-Objekt (keine Erklärung, kein Markdown):
{
  "first_name": "Vorname oder leer",
  "last_name": "Nachname oder leer",
  "company": "Firma oder leer",
  "position": "Position/Titel oder leer",
  "email": "E-Mail oder leer",
  "phone": "Telefon oder leer",
  "mobile": "Mobil oder leer",
  "website": "Website oder leer",
  "street": "Straße mit Hausnummer oder leer",
  "postal_code": "PLZ oder leer",
  "city": "Stadt oder leer",
  "country": "Land oder DE wenn Deutschland"
}

Visitenkarten-Text:
${text}`
        }
      ],
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Mistral Chat Fehler: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  const content = result.choices?.[0]?.message?.content || ''

  // JSON aus Antwort extrahieren
  try {
    return JSON.parse(content)
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error(`Konnte JSON nicht parsen: ${content}`)
  }
}

// Kombinierte Funktion: PDF → Text → Kontaktdaten
async function extractContactFromPdf(base64Pdf, apiKey) {
  // OCR durchführen
  const text = await extractTextFromPdf(base64Pdf, apiKey)

  if (!text || text.length < 5) {
    throw new Error('Kein Text aus PDF extrahiert')
  }

  // Text analysieren
  const contactData = await parseContactFromText(text, apiKey)
  return contactData
}

// PDF zu Storage hochladen
async function uploadPdfToStorage(filePath, contactId) {
  const buffer = await readFile(filePath)
  const fileName = basename(filePath)
  const storagePath = `${contactId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('business-cards')
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: true
    })

  if (error) {
    throw new Error(`Storage Upload Fehler: ${error.message}`)
  }

  // Public URL generieren
  const { data: urlData } = supabase.storage
    .from('business-cards')
    .getPublicUrl(storagePath)

  return urlData.publicUrl
}

// Kontakt in Datenbank erstellen
async function createContact(contactData, ownerId, businessCardUrl, sourceFile) {
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      owner_id: ownerId,
      first_name: contactData.first_name || null,
      last_name: contactData.last_name || null,
      company: contactData.company || null,
      position: contactData.position || null,
      email: contactData.email || null,
      phone: contactData.phone || null,
      mobile: contactData.mobile || null,
      website: contactData.website || null,
      street: contactData.street || null,
      postal_code: contactData.postal_code || null,
      city: contactData.city || null,
      country: contactData.country || 'DE',
      contact_type: 'business',
      shared: true,
      business_card_url: businessCardUrl,
      notes: `Importiert aus: ${sourceFile}`,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Datenbank Fehler: ${error.message}`)
  }

  return data.id
}

// Hauptfunktion
async function main() {
  console.log('='.repeat(60))
  console.log('Visitenkarten Import')
  console.log('='.repeat(60))

  // API Key und Owner holen
  console.log('\n[1/4] Hole Konfiguration...')
  const apiKey = await getMistralApiKey()
  console.log('  ✓ Mistral API Key gefunden')

  const ownerId = await getDefaultOwner()
  console.log(`  ✓ Owner ID: ${ownerId}`)

  // PDFs auflisten
  console.log('\n[2/4] Lese Visitenkarten-Ordner...')
  const files = await readdir(VISITENKARTEN_ORDNER)
  let pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'))
  console.log(`  ✓ ${pdfFiles.length} PDFs gefunden`)

  // TEST-MODUS: Nur erste X verarbeiten
  const TEST_MODUS = false
  const TEST_ANZAHL = 3
  if (TEST_MODUS) {
    pdfFiles = pdfFiles.slice(0, TEST_ANZAHL)
    console.log(`  ⚠ TEST-MODUS: Nur ${TEST_ANZAHL} PDFs werden verarbeitet`)
  }

  // Verarbeitung
  console.log('\n[3/4] Verarbeite Visitenkarten...')
  console.log('-'.repeat(60))

  let erfolg = 0
  let fehler = 0
  const fehlerListe = []

  for (let i = 0; i < pdfFiles.length; i++) {
    const pdfFile = pdfFiles[i]
    const pdfPath = join(VISITENKARTEN_ORDNER, pdfFile)
    const progress = `[${i + 1}/${pdfFiles.length}]`

    try {
      process.stdout.write(`${progress} ${pdfFile.substring(0, 40)}... `)

      // PDF zu Base64
      const base64 = await pdfToBase64(pdfPath)

      // OCR durchführen
      const contactData = await extractContactFromPdf(base64, apiKey)

      // Erst Kontakt erstellen (für ID)
      const contactId = await createContact(contactData, ownerId, null, pdfFile)

      // Dann PDF hochladen
      const cardUrl = await uploadPdfToStorage(pdfPath, contactId)

      // URL aktualisieren
      await supabase
        .from('contacts')
        .update({ business_card_url: cardUrl })
        .eq('id', contactId)

      const name = [contactData.first_name, contactData.last_name].filter(Boolean).join(' ') || contactData.company || 'Unbekannt'
      console.log(`✓ ${name}`)
      erfolg++

      // Kurze Pause um API nicht zu überlasten
      await new Promise(r => setTimeout(r, 500))

    } catch (err) {
      console.log(`✗ Fehler: ${err.message}`)
      fehler++
      fehlerListe.push({ file: pdfFile, error: err.message })
    }
  }

  // Zusammenfassung
  console.log('\n' + '='.repeat(60))
  console.log('[4/4] Zusammenfassung')
  console.log('='.repeat(60))
  console.log(`  Erfolgreich: ${erfolg}`)
  console.log(`  Fehler:      ${fehler}`)

  if (fehlerListe.length > 0) {
    console.log('\nFehlerhafte Dateien:')
    fehlerListe.forEach(f => console.log(`  - ${f.file}: ${f.error}`))
  }

  console.log('\nFertig!')
}

// Script starten
main().catch(err => {
  console.error('\nFataler Fehler:', err.message)
  process.exit(1)
})
