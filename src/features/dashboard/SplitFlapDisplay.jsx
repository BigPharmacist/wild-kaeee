import { useState, useEffect, useRef } from 'react'

const CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ0123456789:.-!?'

const SplitFlapChar = ({ targetChar, delay = 0 }) => {
  const [currentChar, setCurrentChar] = useState(' ')
  const [isFlipping, setIsFlipping] = useState(false)
  const charIndex = useRef(0)

  useEffect(() => {
    const target = (targetChar || ' ').toUpperCase()
    const targetIndex = CHARS.indexOf(target) >= 0 ? CHARS.indexOf(target) : 0

    if (CHARS[charIndex.current] === target) return

    const timeout = setTimeout(() => {
      const flipInterval = setInterval(() => {
        charIndex.current = (charIndex.current + 1) % CHARS.length
        setCurrentChar(CHARS[charIndex.current])
        setIsFlipping(true)

        setTimeout(() => setIsFlipping(false), 50)

        if (charIndex.current === targetIndex) {
          clearInterval(flipInterval)
        }
      }, 40)

      return () => clearInterval(flipInterval)
    }, delay)

    return () => clearTimeout(timeout)
  }, [targetChar, delay])

  return (
    <div className="relative w-[1.1em] h-[1.6em] mx-[1px]">
      {/* Hintergrund */}
      <div className="absolute inset-0 bg-[#3C4255] rounded-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" />

      {/* Obere Hälfte */}
      <div
        className={`absolute top-0 left-0 right-0 h-1/2 bg-[#4F5469] rounded-t-[2px] overflow-hidden flex items-end justify-center ${
          isFlipping ? 'origin-bottom' : ''
        }`}
        style={{
          transform: isFlipping ? 'perspective(100px) rotateX(-10deg)' : 'none',
          transition: 'transform 40ms ease-in',
        }}
      >
        <span
          className="text-[#ffd900] font-bold leading-none translate-y-[55%]"
          style={{
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            textShadow: '0 0 3px rgba(255,217,0,0.3)'
          }}
        >
          {currentChar}
        </span>
      </div>

      {/* Trennlinie */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#3C4255] z-10" />

      {/* Untere Hälfte */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1/2 bg-[#4a4e5f] rounded-b-[2px] overflow-hidden flex items-start justify-center ${
          isFlipping ? 'origin-top' : ''
        }`}
        style={{
          transform: isFlipping ? 'perspective(100px) rotateX(10deg)' : 'none',
          transition: 'transform 40ms ease-out',
        }}
      >
        <span
          className="text-[#ffd900] font-bold leading-none -translate-y-[45%]"
          style={{
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            textShadow: '0 0 3px rgba(255,217,0,0.3)'
          }}
        >
          {currentChar}
        </span>
      </div>

      {/* Glanz-Effekt */}
      <div className="absolute top-0 left-0 right-0 h-[30%] bg-gradient-to-b from-white/5 to-transparent rounded-t-[2px] pointer-events-none" />
    </div>
  )
}

const SplitFlapDisplay = ({ messages = [], charCount = 20, interval = 5000, urgentFaxe = [] }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')

  // Standard-Nachrichten falls keine übergeben
  const defaultMessages = [
    'WILLKOMMEN',
    () => {
      const now = new Date()
      const day = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'][now.getDay()]
      const date = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
      return `${day} ${date}`
    },
    () => {
      const now = new Date()
      return now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    },
    'KAEEE',
  ]

  // Fax-Nachrichten erstellen wenn vorhanden
  const faxMessages = urgentFaxe.flatMap(fax => [
    `FAX: ${fax.absender || 'UNBEKANNT'}`,
    fax.zusammenfassung || '',
  ]).filter(msg => msg.length > 0)

  // Priorität: Fax-Nachrichten > übergebene Messages > Standard
  const activeMessages = faxMessages.length > 0
    ? faxMessages
    : messages.length > 0
      ? messages
      : defaultMessages

  useEffect(() => {
    const updateDisplay = () => {
      const msg = activeMessages[currentMessageIndex]
      const text = (typeof msg === 'function' ? msg() : msg).toUpperCase()
      const padding = charCount - text.length
      const leftPad = Math.floor(padding / 2)
      const centered = text.padStart(text.length + leftPad, ' ').padEnd(charCount, ' ')
      setDisplayText(centered.slice(0, charCount))
    }

    updateDisplay()

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % activeMessages.length)
    }, interval)

    // Für Uhrzeit: jede Minute aktualisieren
    const timeUpdate = setInterval(updateDisplay, 60000)

    return () => {
      clearInterval(messageInterval)
      clearInterval(timeUpdate)
    }
  }, [currentMessageIndex, activeMessages, charCount, interval])

  return (
    <div
      className="flex items-center bg-[#3C4255] px-2 py-1.5 rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]"
      style={{ fontSize: '14px' }}
    >
      {displayText.split('').map((char, index) => (
        <SplitFlapChar
          key={index}
          targetChar={char}
          delay={index * 30}
        />
      ))}
    </div>
  )
}

export default SplitFlapDisplay
