import { useState, useEffect } from 'react'

// DWD Biowetter API URL (über CORS-Proxy, da DWD keine CORS-Header sendet)
const DWD_URL = 'https://opendata.dwd.de/climate_environment/health/alerts/biowetter.json'
const BIOWETTER_API_URL = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(DWD_URL)}`

// Cache-Key für localStorage
const CACHE_KEY = 'biowetter_cache'
const CACHE_DURATION = 6 * 60 * 60 * 1000 // 6 Stunden in ms

// Mapping von PLZ-Präfixen zu DWD Biowetter-Zonen
// Zonen: A=Küste Nord, B=Mecklenburg, C=NRW, D=Niedersachsen Süd/Ost,
// E=Berlin/Brandenburg, F=Hessen/RLP/Saarland, G=Sachsen/Thüringen/Sachsen-Anhalt,
// H=Baden, I=Württemberg/Franken, J=Niederbayern/Oberpfalz, K=Schwaben/Oberbayern
const plzToZone = {
  // Zone A: Schleswig-Holstein, Hamburg, nördl. Niedersachsen, Bremen
  '20': 'A', '21': 'A', '22': 'A', '23': 'A', '24': 'A', '25': 'A',
  '26': 'A', '27': 'A', '28': 'A',
  // Zone B: Mecklenburg-Vorpommern
  '17': 'B', '18': 'B', '19': 'B',
  // Zone C: Südwestliches Niedersachsen, NRW
  '32': 'C', '33': 'C', '40': 'C', '41': 'C', '42': 'C', '44': 'C',
  '45': 'C', '46': 'C', '47': 'C', '48': 'C', '49': 'C', '50': 'C',
  '51': 'C', '52': 'C', '53': 'C', '57': 'C', '58': 'C', '59': 'C',
  // Zone D: Östliches und südliches Niedersachsen
  '29': 'D', '30': 'D', '31': 'D', '34': 'D', '37': 'D', '38': 'D',
  // Zone E: Berlin, Brandenburg, nördl. Sachsen-Anhalt
  '10': 'E', '12': 'E', '13': 'E', '14': 'E', '15': 'E', '16': 'E',
  '03': 'E', '39': 'E',
  // Zone F: Hessen, Rheinland-Pfalz, Saarland
  '35': 'F', '36': 'F', '54': 'F', '55': 'F', '56': 'F', '60': 'F',
  '61': 'F', '63': 'F', '64': 'F', '65': 'F', '66': 'F',
  // Zone G: südl. Sachsen-Anhalt, Thüringen, Sachsen
  '01': 'G', '02': 'G', '04': 'G', '06': 'G', '07': 'G', '08': 'G',
  '09': 'G', '98': 'G', '99': 'G',
  // Zone H: Baden
  '67': 'H', '68': 'H', '69': 'H', '76': 'H', '77': 'H', '78': 'H', '79': 'H',
  // Zone I: Württemberg, Franken ohne östl. Oberfranken
  '70': 'I', '71': 'I', '72': 'I', '73': 'I', '74': 'I', '75': 'I',
  '88': 'I', '89': 'I', '90': 'I', '91': 'I', '96': 'I', '97': 'I',
  // Zone J: Niederbayern, Oberpfalz, östl. Oberfranken
  '84': 'J', '92': 'J', '93': 'J', '94': 'J', '95': 'J',
  // Zone K: Schwaben, Oberbayern
  '80': 'K', '81': 'K', '82': 'K', '83': 'K', '85': 'K', '86': 'K', '87': 'K',
}

const DEFAULT_ZONE = 'E' // Berlin/Brandenburg als Fallback

function getZoneFromPostalCode(postalCode) {
  if (!postalCode) return DEFAULT_ZONE
  const prefix = String(postalCode).substring(0, 2)
  return plzToZone[prefix] || DEFAULT_ZONE
}

// Kurze Labels für Effektnamen
const effectLabels = {
  'Wettereinfluss auf das allgemeine Befinden': 'Allgemeines Befinden',
  'Wettereinfluss auf Herz- und Kreislaufgeschehen (hypotone Form)': 'Niedriger Blutdruck',
  'Wettereinfluss auf Herz- und Kreislaufgeschehen (hypertone Form)': 'Hoher Blutdruck',
  'Wettereinfluss auf entzündliche rheumatische Beschwerden': 'Rheuma (entzündlich)',
  'Wettereinfluss auf degenerative rheumatische Beschwerden': 'Rheuma (degenerativ)',
  'Wettereinfluss auf Asthma': 'Asthma',
  'Thermische Belastung': 'Wärme-/Kältebelastung',
}

// Farben für Belastungsstufen (Badge-Stil)
const severityColors = {
  // Allgemeine Gefährdungsstufen
  'kein Einfluss': 'bg-green-100 text-green-700',
  'keine': 'bg-green-100 text-green-700',
  'geringe Gefährdung': 'bg-yellow-100 text-yellow-700',
  'hohe Gefährdung': 'bg-orange-100 text-orange-700',
  'extreme Gefährdung': 'bg-red-100 text-red-700',
  // Thermische Reize (tatsächliche API-Werte)
  'schwache Wärmereize': 'bg-yellow-100 text-yellow-700',
  'mäßige Wärmereize': 'bg-orange-100 text-orange-700',
  'starke Wärmereize': 'bg-red-100 text-red-700',
  'extreme Wärmereize': 'bg-red-200 text-red-800',
  'schwache Kältereize': 'bg-blue-100 text-blue-700',
  'mäßige Kältereize': 'bg-blue-200 text-blue-700',
  'starke Kältereize': 'bg-blue-300 text-blue-800',
}

// Feld-Farben für schematische Darstellung (App-Farbsystem)
const dotColors = {
  // Allgemeine Gefährdungsstufen
  'kein Einfluss': 'bg-[#27AE60]',        // Success Green
  'keine': 'bg-[#27AE60]',                 // Success Green
  'geringe Gefährdung': 'bg-[#F2C94C]',   // Warning Yellow
  'hohe Gefährdung': 'bg-[#E5533D]',      // Error Red
  'extreme Gefährdung': 'bg-[#E11D48]',   // Error Red (darker)
  // Thermische Reize - Wärme
  'schwache Wärmereize': 'bg-[#F2C94C]',  // Warning Yellow
  'mäßige Wärmereize': 'bg-[#E5533D]',    // Error Red
  'starke Wärmereize': 'bg-[#E11D48]',    // Error Red (darker)
  'extreme Wärmereize': 'bg-[#A3362A]',   // Error Red (darkest)
  // Thermische Reize - Kälte
  'schwache Kältereize': 'bg-[#7DD3D8]',  // Teal light
  'mäßige Kältereize': 'bg-[#2EC4B6]',    // Accent Teal
  'starke Kältereize': 'bg-[#25A89C]',    // Accent Teal (darker)
}

// Cache-Funktionen
function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch {
    // localStorage nicht verfügbar
  }
}

// Nebius API für KI-Empfehlung
const NEBIUS_API_URL = 'https://api.tokenfactory.nebius.com/v1/chat/completions'
const AI_RECOMMENDATION_CACHE_KEY = 'biowetter_ai_recommendation'
const AI_CACHE_DURATION = 3 * 60 * 60 * 1000 // 3 Stunden

export function useBiowetter({ pharmacies, aiSettings }) {
  const [biowetterData, setBiowetterData] = useState(null)
  const [biowetterLoading, setBiowetterLoading] = useState(false)
  const [biowetterError, setBiowetterError] = useState('')
  const [biowetterZone, setBiowetterZone] = useState('')
  const [aiRecommendation, setAiRecommendation] = useState('')
  const [aiRecommendationLoading, setAiRecommendationLoading] = useState(false)

  const fetchBiowetter = async () => {
    // Erst Cache prüfen
    const cached = getCache()
    if (cached) {
      setBiowetterData(cached)
      return
    }

    setBiowetterLoading(true)
    setBiowetterError('')
    try {
      const response = await fetch(BIOWETTER_API_URL)
      if (!response.ok) {
        throw new Error('Biowetter-Daten konnten nicht geladen werden.')
      }
      const data = await response.json()
      setBiowetterData(data)
      setCache(data)
    } catch (error) {
      setBiowetterError(error.message || 'Fehler beim Laden der Biowetter-Daten.')
      setBiowetterData(null)
    } finally {
      setBiowetterLoading(false)
    }
  }

  // Zone aus erster Apotheke ermitteln
  useEffect(() => {
    if (!biowetterZone && pharmacies.length > 0) {
      const primary = pharmacies[0]
      const zone = getZoneFromPostalCode(primary.postal_code)
      setBiowetterZone(zone)
    }
  }, [pharmacies, biowetterZone])

  // Biowetter-Daten beim Start laden
  useEffect(() => {
    fetchBiowetter()
  }, [])

  // Daten für aktuelle Zone extrahieren
  const getZoneData = () => {
    if (!biowetterData || !biowetterData.zone || !biowetterZone) return null
    return biowetterData.zone.find(z => z.id === biowetterZone)
  }

  // Effekte aus einem Zeitslot extrahieren
  const extractEffects = (forecast) => {
    if (!forecast || !forecast.effect) return null

    const effectsWithInfluence = forecast.effect
      .filter(e => e.value && e.value !== 'kein Einfluss' && e.value !== 'keine')
      .map(e => ({
        name: e.name,
        label: effectLabels[e.name] || e.name,
        value: e.value,
        color: severityColors[e.value] || 'bg-gray-100 text-gray-700',
        dotColor: dotColors[e.value] || 'bg-gray-300',
      }))

    const recommendation = forecast.recomms?.[0]?.value || null

    return { effects: effectsWithInfluence, recommendation }
  }

  // Alle 6 Zeitslots mit Daten (Vormittag + Nachmittag für 3 Tage)
  const getForecasts = () => {
    const zoneData = getZoneData()
    if (!zoneData) return null

    // Alle 6 Zeitslots definieren
    const slotDefinitions = [
      { key: 'today_morning', field: 'today_morning', label: 'VM', dayLabel: 'Heute' },
      { key: 'today_afternoon', field: 'today_afternoon', label: 'NM', dayLabel: 'Heute' },
      { key: 'tomorrow_morning', field: 'tomorrow_morning', label: 'VM', dayLabel: 'Morgen' },
      { key: 'tomorrow_afternoon', field: 'tomorrow_afternoon', label: 'NM', dayLabel: 'Morgen' },
      { key: 'dayafter_morning', field: 'dayafter_to_morning', label: 'VM', dayLabel: 'Überm.' },
      { key: 'dayafter_afternoon', field: 'dayafter_to_afternoon', label: 'NM', dayLabel: 'Überm.' },
    ]

    const slots = slotDefinitions.map(def => {
      const forecast = zoneData[def.field]
      const data = extractEffects(forecast)
      return {
        key: def.key,
        label: def.label,
        dayLabel: def.dayLabel,
        available: !!forecast,
        effects: data?.effects || [],
        recommendation: data?.recommendation || null,
      }
    })

    // Erste verfügbare Empfehlung finden
    const recommendation = slots.find(s => s.recommendation)?.recommendation || null

    return {
      zoneName: zoneData.name,
      slots,
      recommendation,
      // Legacy-Kompatibilität
      today: slots[1]?.effects?.length ? { label: 'Heute', effects: slots[1].effects, recommendation: slots[1].recommendation } : null,
      tomorrow: slots[2]?.effects?.length ? { label: 'Morgen', effects: slots[2].effects, recommendation: slots[2].recommendation } : null,
    }
  }

  // Legacy: Einzelner aktueller Zeitslot (für Kompatibilität)
  const getCurrentEffects = () => {
    const forecasts = getForecasts()
    if (!forecasts || !forecasts.today) return null
    return {
      timeLabel: forecasts.today.label,
      zoneName: forecasts.zoneName,
      effects: forecasts.today.effects,
      recommendation: forecasts.today.recommendation,
    }
  }

  // KI-Empfehlung generieren
  const generateAiRecommendation = async (forecasts) => {
    if (!aiSettings?.api_key || !forecasts?.slots) return

    // Cache prüfen
    try {
      const cached = localStorage.getItem(AI_RECOMMENDATION_CACHE_KEY)
      if (cached) {
        const { text, timestamp, dataHash } = JSON.parse(cached)
        const currentHash = JSON.stringify(forecasts.slots.map(s => s.effects))
        if (Date.now() - timestamp < AI_CACHE_DURATION && dataHash === currentHash) {
          setAiRecommendation(text)
          return
        }
      }
    } catch { /* Cache-Fehler ignorieren */ }

    setAiRecommendationLoading(true)

    // Daten für das LLM aufbereiten
    const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
    const today = new Date()
    const getWeekday = (daysFromNow) => weekdayNames[(today.getDay() + daysFromNow) % 7]

    const dataForAi = forecasts.slots
      .filter(slot => slot.available)
      .map((slot) => {
        const dayOffset = slot.dayLabel === 'Heute' ? 0 : slot.dayLabel === 'Morgen' ? 1 : 2
        const dayName = getWeekday(dayOffset)
        const timeLabel = slot.label === 'VM' ? 'Vormittag' : 'Nachmittag'
        const effects = slot.effects.length > 0
          ? slot.effects.map(e => `${e.label}: ${e.value}`).join(', ')
          : 'kein Einfluss'
        return `${dayName} ${timeLabel}: ${effects}`
      })
      .join('\n')

    const systemPrompt = `Du bist ein freundlicher Gesundheitsberater in einer Apotheken-App.
Schreibe eine kurze, lockere Empfehlung basierend auf den Biowetter-Daten.
Fokussiere dich besonders auf den heutigen Tag.
Gib praktische Tipps in 2-3 Sätzen. Duze den Leser.
Keine Überschriften, keine Aufzählungen, nur Fließtext.
Antworte auf Deutsch.`

    const userPrompt = `Hier sind die aktuellen Biowetter-Daten für die nächsten Tage:

${dataForAi}

Mögliche Belastungsstufen:
- kein Einfluss (gut)
- geringe Gefährdung (leicht erhöht)
- hohe Gefährdung (deutlich erhöht)
- extreme Gefährdung (stark erhöht)
- schwache/mäßige/starke Kältereize oder Wärmereize

Schreibe eine kurze, freundliche Empfehlung für heute.`

    try {
      const response = await fetch(NEBIUS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiSettings.api_key}`,
        },
        body: JSON.stringify({
          model: aiSettings.model || 'Qwen/Qwen3-235B-A22B-Instruct-2507',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
      })

      if (!response.ok) {
        throw new Error('KI-Anfrage fehlgeschlagen')
      }

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content?.trim() || ''

      if (text) {
        setAiRecommendation(text)
        // Cache speichern
        try {
          localStorage.setItem(AI_RECOMMENDATION_CACHE_KEY, JSON.stringify({
            text,
            timestamp: Date.now(),
            dataHash: JSON.stringify(forecasts.slots.map(s => s.effects)),
          }))
        } catch { /* Cache-Fehler ignorieren */ }
      }
    } catch (error) {
      console.error('Biowetter KI-Empfehlung Fehler:', error)
    } finally {
      setAiRecommendationLoading(false)
    }
  }

  // KI-Empfehlung automatisch generieren wenn Daten da sind
  useEffect(() => {
    if (biowetterData && biowetterZone && aiSettings?.api_key) {
      const forecasts = getForecasts()
      if (forecasts) {
        generateAiRecommendation(forecasts)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biowetterData, biowetterZone, aiSettings?.api_key])

  return {
    biowetterData,
    biowetterLoading,
    biowetterError,
    biowetterZone,
    getZoneData,
    getCurrentEffects,
    getForecasts,
    effectLabels,
    severityColors,
    dotColors,
    lastUpdate: biowetterData?.last_update,
    aiRecommendation,
    aiRecommendationLoading,
  }
}
