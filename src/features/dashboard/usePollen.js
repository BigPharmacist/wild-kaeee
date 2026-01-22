import { useState, useEffect } from 'react'

// Mapping von PLZ-Präfixen zu DWD-Subregionen
const plzToRegion = {
  '01': 'Tiefland_Sachsen',
  '02': 'Tiefland_Sachsen',
  '03': 'Brandenburg_und_Berlin',
  '04': 'Tiefland_Sachsen',
  '06': 'Tiefland_Thüringen',
  '07': 'Mittelgebirge_Thüringen',
  '08': 'Mittelgebirge_Sachsen',
  '09': 'Mittelgebirge_Sachsen',
  '10': 'Brandenburg_und_Berlin',
  '12': 'Brandenburg_und_Berlin',
  '13': 'Brandenburg_und_Berlin',
  '14': 'Brandenburg_und_Berlin',
  '15': 'Brandenburg_und_Berlin',
  '16': 'Brandenburg_und_Berlin',
  '17': 'Mecklenburg',
  '18': 'Mecklenburg',
  '19': 'Mecklenburg',
  '20': 'Geest_Schleswig_Holstein_und_Hamburg',
  '21': 'Geest_Schleswig_Holstein_und_Hamburg',
  '22': 'Geest_Schleswig_Holstein_und_Hamburg',
  '23': 'Inseln_und_Marschen',
  '24': 'Inseln_und_Marschen',
  '25': 'Inseln_und_Marschen',
  '26': 'Westl_Niedersachsen',
  '27': 'Westl_Niedersachsen',
  '28': 'Westl_Niedersachsen',
  '29': 'Östl_Niedersachsen',
  '30': 'Östl_Niedersachsen',
  '31': 'Östl_Niedersachsen',
  '32': 'Ostwestfalen',
  '33': 'Ostwestfalen',
  '34': 'Harz',
  '35': 'Rhein_Main',
  '36': 'Rhein_Main',
  '37': 'Harz',
  '38': 'Harz',
  '39': 'Harz',
  '40': 'Rhein_Westfäl_Tiefland',
  '41': 'Rhein_Westfäl_Tiefland',
  '42': 'Rhein_Westfäl_Tiefland',
  '44': 'Rhein_Westfäl_Tiefland',
  '45': 'Rhein_Westfäl_Tiefland',
  '46': 'Rhein_Westfäl_Tiefland',
  '47': 'Rhein_Westfäl_Tiefland',
  '48': 'Rhein_Westfäl_Tiefland',
  '49': 'Westl_Niedersachsen',
  '50': 'Rhein_Westfäl_Tiefland',
  '51': 'Rhein_Westfäl_Tiefland',
  '52': 'Rhein_Westfäl_Tiefland',
  '53': 'Mittelgebirgsbereich_NRW',
  '54': 'Mittelgebirge_Rheinland_Pfalz',
  '55': 'Rhein_Main',
  '56': 'Mittelgebirge_Rheinland_Pfalz',
  '57': 'Mittelgebirgsbereich_NRW',
  '58': 'Mittelgebirgsbereich_NRW',
  '59': 'Ostwestfalen',
  '60': 'Rhein_Main',
  '61': 'Rhein_Main',
  '63': 'Rhein_Main',
  '64': 'Rhein_Main',
  '65': 'Rhein_Main',
  '66': 'Saarland',
  '67': 'Oberrhein_und_unteres_Neckartal',
  '68': 'Oberrhein_und_unteres_Neckartal',
  '69': 'Oberrhein_und_unteres_Neckartal',
  '70': 'Hohenlohe_mittlerer_Neckar_Oberschwaben',
  '71': 'Hohenlohe_mittlerer_Neckar_Oberschwaben',
  '72': 'Hohenlohe_mittlerer_Neckar_Oberschwaben',
  '73': 'Hohenlohe_mittlerer_Neckar_Oberschwaben',
  '74': 'Hohenlohe_mittlerer_Neckar_Oberschwaben',
  '75': 'Hohenlohe_mittlerer_Neckar_Oberschwaben',
  '76': 'Oberrhein_und_unteres_Neckartal',
  '77': 'Oberrhein_und_unteres_Neckartal',
  '78': 'Oberrhein_und_unteres_Neckartal',
  '79': 'Oberrhein_und_unteres_Neckartal',
  '80': 'Allgäu_Oberbayern_Bay_Wald',
  '81': 'Allgäu_Oberbayern_Bay_Wald',
  '82': 'Allgäu_Oberbayern_Bay_Wald',
  '83': 'Allgäu_Oberbayern_Bay_Wald',
  '84': 'Donauniederungen',
  '85': 'Allgäu_Oberbayern_Bay_Wald',
  '86': 'Allgäu_Oberbayern_Bay_Wald',
  '87': 'Allgäu_Oberbayern_Bay_Wald',
  '88': 'Hohenlohe_mittlerer_Neckar_Oberschwaben',
  '89': 'Hohenlohe_mittlerer_Neckar_Oberschwaben',
  '90': 'Bayern_n_der_Donau_o_Bayr_Wald_o_Mainfranken',
  '91': 'Bayern_n_der_Donau_o_Bayr_Wald_o_Mainfranken',
  '92': 'Bayern_n_der_Donau_o_Bayr_Wald_o_Mainfranken',
  '93': 'Donauniederungen',
  '94': 'Donauniederungen',
  '95': 'Bayern_n_der_Donau_o_Bayr_Wald_o_Mainfranken',
  '96': 'Mainfranken',
  '97': 'Mainfranken',
  '98': 'Mittelgebirge_Thüringen',
  '99': 'Mittelgebirge_Thüringen',
}

// Fallback-Region
const DEFAULT_REGION = 'Brandenburg_und_Berlin'

function getRegionFromPostalCode(postalCode) {
  if (!postalCode) return DEFAULT_REGION
  const prefix = String(postalCode).substring(0, 2)
  return plzToRegion[prefix] || DEFAULT_REGION
}

// Übersetzung der Pollennamen
const pollenNames = {
  Ambrosia: 'Ambrosia',
  Beifuss: 'Beifuß',
  Birke: 'Birke',
  Erle: 'Erle',
  Esche: 'Esche',
  'Graeser': 'Gräser',
  Hasel: 'Hasel',
  Roggen: 'Roggen',
}

// Belastungsstufen
const severityLabels = {
  '-1': 'Keine Daten',
  '0': 'Keine',
  '0-1': 'Keine bis gering',
  '1': 'Gering',
  '1-2': 'Gering bis mittel',
  '2': 'Mittel',
  '2-3': 'Mittel bis hoch',
  '3': 'Hoch',
}

const severityColors = {
  '-1': 'bg-gray-200 text-gray-500',
  '0': 'bg-green-100 text-green-700',
  '0-1': 'bg-green-200 text-green-700',
  '1': 'bg-yellow-100 text-yellow-700',
  '1-2': 'bg-yellow-200 text-yellow-700',
  '2': 'bg-orange-100 text-orange-700',
  '2-3': 'bg-orange-200 text-orange-800',
  '3': 'bg-[#FFF5EB] text-[#FF6500]',
}

export function usePollen({ pharmacies }) {
  const [pollenData, setPollenData] = useState(null)
  const [pollenLoading, setPollenLoading] = useState(false)
  const [pollenError, setPollenError] = useState('')
  const [pollenRegion, setPollenRegion] = useState('')

  const fetchPollen = async (region) => {
    if (!region) return
    setPollenLoading(true)
    setPollenError('')
    try {
      const response = await fetch(`https://api.achoo.dev/pollen/subregion/${encodeURIComponent(region)}`)
      if (!response.ok) {
        throw new Error('Pollendaten konnten nicht geladen werden.')
      }
      const data = await response.json()
      setPollenData(data)
    } catch (error) {
      setPollenError(error.message || 'Fehler beim Laden der Pollendaten.')
      setPollenData(null)
    } finally {
      setPollenLoading(false)
    }
  }

  // Region aus erster Apotheke ermitteln
  useEffect(() => {
    if (!pollenRegion && pharmacies.length > 0) {
      const primary = pharmacies[0]
      const region = getRegionFromPostalCode(primary.postal_code)
      setPollenRegion(region)
    }
  }, [pharmacies, pollenRegion])

  // Pollendaten beim Start laden
  useEffect(() => {
    if (pollenRegion) {
      fetchPollen(pollenRegion)
    }
  }, [pollenRegion])

  return {
    pollenData,
    pollenLoading,
    pollenError,
    pollenRegion,
    pollenNames,
    severityLabels,
    severityColors,
  }
}
