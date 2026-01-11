import { useState, useEffect, useRef } from 'react'
import { supabase, supabaseUrl } from './lib/supabase'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { jsPDF } from 'jspdf'
import ReactMarkdown from 'react-markdown'

// AMK Logo als Base64
const AMK_LOGO_BASE64 = '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'

// SVG Icons as components for modern look
const Icons = {
  Sun: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Moon: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Home: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Chart: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Chat: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 20l3.5-3.5H19a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2h0z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Menu: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  X: () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Download: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Camera: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Photo: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Pill: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a3.187 3.187 0 01-4.508 0L5 14.5m14 0l-4.5 4.5m-5-4.5l4.5 4.5" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  ),
}

function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [authView, setAuthView] = useState('login') // 'login' | 'forgot' | 'resetPassword'
  const [successMessage, setSuccessMessage] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [secondaryTab, setSecondaryTab] = useState('overview')
  const [activeView, setActiveView] = useState('dashboard')
  const [settingsTab, setSettingsTab] = useState('pharmacies')
  const [pharmacies, setPharmacies] = useState([])
  const [pharmaciesLoading, setPharmaciesLoading] = useState(false)
  const [pharmaciesMessage, setPharmaciesMessage] = useState('')
  const [editingPharmacy, setEditingPharmacy] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    street: '',
    postalCode: '',
    city: '',
    phone: '',
    owner: '',
    ownerRole: '',
    website: '',
    email: '',
    fax: '',
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editMessage, setEditMessage] = useState('')
  const [staff, setStaff] = useState([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffMessage, setStaffMessage] = useState('')
  const [editingStaff, setEditingStaff] = useState(null)
  const [staffForm, setStaffForm] = useState({
    firstName: '',
    lastName: '',
    street: '',
    postalCode: '',
    city: '',
    mobile: '',
    email: '',
    role: '',
    pharmacyId: '',
    authUserId: '',
    isAdmin: false,
    avatarUrl: '',
  })
  const [staffSaveLoading, setStaffSaveLoading] = useState(false)
  const [staffSaveMessage, setStaffSaveMessage] = useState('')
  const [staffInviteLoading, setStaffInviteLoading] = useState(false)
  const [staffInviteMessage, setStaffInviteMessage] = useState('')
  const [staffAvatarFile, setStaffAvatarFile] = useState(null)
  // Contacts state
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsMessage, setContactsMessage] = useState('')
  const [editingContact, setEditingContact] = useState(null)
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    company: '',
    position: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    street: '',
    postalCode: '',
    city: '',
    country: 'DE',
    contactType: 'business',
    tags: [],
    notes: '',
    shared: true,
    businessCardUrl: '',
  })
  const [contactSaveLoading, setContactSaveLoading] = useState(false)
  const [contactSaveMessage, setContactSaveMessage] = useState('')
  const [contactCardFile, setContactCardFile] = useState(null)
  const [contactCardPreview, setContactCardPreview] = useState('')
  const contactCardInputRef = useRef(null)
  const [contactSearch, setContactSearch] = useState('')
  const [contactViewMode, setContactViewMode] = useState('cards') // 'cards' | 'list'
  const [selectedContact, setSelectedContact] = useState(null) // Für Detail-Ansicht
  const [staffAvatarPreview, setStaffAvatarPreview] = useState('')
  const [weatherLocation, setWeatherLocation] = useState('')
  const [weatherInput, setWeatherInput] = useState('')
  const [weatherData, setWeatherData] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState('')
  const [weatherModalOpen, setWeatherModalOpen] = useState(false)
  const [currentStaff, setCurrentStaff] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const chatEndRef = useRef(null)
  const cameraInputRef = useRef(null)
  const [latestPhoto, setLatestPhoto] = useState(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [allPhotos, setAllPhotos] = useState([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false)
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [photoSaving, setPhotoSaving] = useState(false)
  const photoImgRef = useRef(null)
  const [photoOcrData, setPhotoOcrData] = useState({})
  const [mistralApiKey, setMistralApiKey] = useState(null)
  const [ocrProcessing, setOcrProcessing] = useState({})
  const [apoTab, setApoTab] = useState('amk')
  const [apoMonth, setApoMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [amkMessages, setAmkMessages] = useState([])
  const [amkLoading, setAmkLoading] = useState(false)
  const [recallMessages, setRecallMessages] = useState([])
  const [recallLoading, setRecallLoading] = useState(false)
  const [lavAusgaben, setLavAusgaben] = useState([])
  const [lavLoading, setLavLoading] = useState(false)
  const [selectedApoMessage, setSelectedApoMessage] = useState(null)
  const [planData, setPlanData] = useState(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState('')
  const [selectedPlanDate, setSelectedPlanDate] = useState(() => {
    const today = new Date()
    return today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  })

  // Kalender-System State
  const [calendars, setCalendars] = useState([])
  const [calendarsLoading, setCalendarsLoading] = useState(false)
  const [calendarsError, setCalendarsError] = useState('')
  const [selectedCalendarId, setSelectedCalendarId] = useState(null)
  const [calendarEvents, setCalendarEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [calendarViewDate, setCalendarViewDate] = useState(new Date())
  const [calendarViewMode, setCalendarViewMode] = useState('month')
  const [editingEvent, setEditingEvent] = useState(null)
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    allDay: false,
    location: '',
  })
  const [eventSaving, setEventSaving] = useState(false)
  const [eventError, setEventError] = useState('')
  const [editingCalendar, setEditingCalendar] = useState(null)
  const [calendarForm, setCalendarForm] = useState({
    name: '',
    description: '',
    color: '#10b981',
  })
  const [calendarSaving, setCalendarSaving] = useState(false)
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false)
  const [calendarPermissions, setCalendarPermissions] = useState([])
  const [permissionsLoading, setPermissionsLoading] = useState(false)

  const theme = {
    bgApp: 'bg-[#F5F7FA]',
    bg: 'bg-[#F5F7FA]',
    surface: 'bg-white',
    panel: 'bg-white',
    bgHover: 'hover:bg-[#F5F7FA]',
    bgCard: 'bg-white',
    textPrimary: 'text-[#1F2937]',
    text: 'text-[#1F2937]',
    textSecondary: 'text-[#6B7280]',
    textMuted: 'text-[#9CA3AF]',
    border: 'border-[#E5E7EB]',
    navActive: 'bg-[#EEF4FD] text-[#1F2937] border border-[#D6E6FB]',
    navHover: 'hover:bg-[#F5F7FA] hover:text-[#1F2937]',
    accent: 'bg-[#4A90E2] hover:bg-[#6AA9F0]',
    accentText: 'text-[#4A90E2]',
    primary: 'text-[#4A90E2]',
    primaryBg: 'bg-[#4A90E2]',
    primaryHover: 'hover:bg-[#6AA9F0]',
    secondary: 'text-[#7B6CF6]',
    sidebarBg: 'bg-[#3c4255]',
    sidebarHover: 'hover:bg-[#4a5066]',
    sidebarActive: 'border-white bg-transparent',
    sidebarText: 'text-[#E5E7EB]',
    sidebarTextActive: 'text-[#E5E7EB]',
    secondarySidebarBg: 'bg-[#4f5469]',
    secondaryActive: 'border-l-4 border-[#4A90E2] bg-[#3c4255] text-[#E5E7EB]',
    input: 'bg-white border-[#E5E7EB] focus:border-[#4A90E2] focus:ring-1 focus:ring-[#4A90E2]',
    inputPlaceholder: 'placeholder-[#9CA3AF]',
    cardShadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.05)]',
    cardHoverShadow: 'hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]',
    overlay: 'bg-[#1F2937]/30',
    danger: 'text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2]',
  }

  const navItems = [
    { id: 'dashboard', icon: Icons.Home, label: 'Dashboard' },
    { id: 'photos', icon: Icons.Photo, label: 'Fotos' },
    { id: 'apo', icon: Icons.Pill, label: 'Apo' },
    { id: 'plan', icon: Icons.Calendar, label: 'Plan' },
    { id: 'calendar', icon: Icons.Calendar, label: 'Kalender' },
    { id: 'chat', icon: Icons.Chat, label: 'Chat' },
    { id: 'stats', icon: Icons.Chart, label: 'Statistiken' },
    { id: 'settings', icon: Icons.Settings, label: 'Einstellungen' },
  ]

  const secondaryNavMap = {
    dashboard: [
      { id: 'overview', label: 'Übersicht' },
      { id: 'insights', label: 'Insights' },
      { id: 'reports', label: 'Reports' },
    ],
    photos: [
      { id: 'uploads', label: 'Uploads' },
      { id: 'library', label: 'Archiv' },
      { id: 'ocr', label: 'OCR' },
    ],
    apo: [
      { id: 'amk', label: 'AMK' },
      { id: 'recall', label: 'Rückrufe' },
      { id: 'lav', label: 'LAV' },
    ],
    plan: [
      { id: 'timeline', label: 'Zeitplan' },
      { id: 'team', label: 'Team' },
      { id: 'shift', label: 'Schichten' },
    ],
    calendar: [
      { id: 'calendars', label: 'Kalender' },
      { id: 'events', label: 'Termine' },
      { id: 'permissions', label: 'Freigaben' },
    ],
    chat: [
      { id: 'inbox', label: 'Inbox' },
      { id: 'team', label: 'Team' },
      { id: 'settings', label: 'Einstellungen' },
    ],
    stats: [
      { id: 'kpis', label: 'KPIs' },
      { id: 'charts', label: 'Charts' },
      { id: 'exports', label: 'Exports' },
    ],
    settings: [
      { id: 'pharmacies', label: 'Apotheken' },
      { id: 'staff', label: 'Kollegium' },
      { id: 'contacts', label: 'Kontakte' },
    ],
  }

  useEffect(() => {
    if (activeView === 'settings' || activeView === 'apo') return
    const nextItems = secondaryNavMap[activeView] || []
    if (nextItems.length) {
      setSecondaryTab(nextItems[0].id)
    }
  }, [activeView])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [activeView])

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  const getActiveSecondaryId = () => {
    if (activeView === 'settings') return settingsTab
    if (activeView === 'apo') return apoTab
    return secondaryTab
  }

  const handleSecondarySelect = (itemId) => {
    if (activeView === 'settings') {
      setSettingsTab(itemId)
    } else if (activeView === 'apo') {
      setApoTab(itemId)
    } else {
      setSecondaryTab(itemId)
    }
  }

  const pharmacyLookup = Object.fromEntries(
    pharmacies.map((pharmacy) => [pharmacy.id, pharmacy.name]),
  )
  const staffByAuthId = Object.fromEntries(
    staff
      .filter((member) => member.auth_user_id)
      .map((member) => [member.auth_user_id, member]),
  )

  // PDF-Download für AMK-Meldungen
  const downloadAmkPdf = (msg) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - margin * 2
    let y = 20

    // Logo hinzufügen
    try {
      doc.addImage(AMK_LOGO_BASE64, 'JPEG', margin, y, 60, 28)
      y += 38
    } catch (e) {
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

    // Volltext
    if (msg.full_text) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const textLines = doc.splitTextToSize(msg.full_text, maxWidth)

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

    // Fußzeile mit Unterschriftsfeldern
    if (y > pageHeight - 80) {
      doc.addPage()
      y = 20
    }

    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 10

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

    // Download
    const filename = `AMK_${msg.title?.substring(0, 30).replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_') || 'Meldung'}.pdf`
    doc.save(filename)
  }

  const fetchPharmacies = async () => {
    setPharmaciesLoading(true)
    const { data, error } = await supabase
      .from('pharmacies')
      .select('id, name, street, postal_code, city, phone, owner, owner_role, website, email, fax')
      .order('name', { ascending: true })

    if (error) {
      setPharmaciesMessage(error.message)
      setPharmacies([])
    } else {
      setPharmaciesMessage('')
      setPharmacies(data || [])
    }
    setPharmaciesLoading(false)
  }

  const fetchStaff = async () => {
    setStaffLoading(true)
    const { data, error } = await supabase
      .from('staff')
      .select('id, first_name, last_name, street, postal_code, city, mobile, email, role, pharmacy_id, auth_user_id, is_admin, avatar_url')
      .order('last_name', { ascending: true })

    if (error) {
      setStaffMessage(error.message)
      setStaff([])
    } else {
      setStaffMessage('')
      setStaff(data || [])
      if (session?.user?.id) {
        const matched = (data || []).find((member) => member.auth_user_id === session.user.id)
        setCurrentStaff(matched || null)
      }
    }
    setStaffLoading(false)
  }

  // Contacts functions
  const fetchContacts = async () => {
    setContactsLoading(true)
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('company', { ascending: true })
      .order('last_name', { ascending: true })

    if (error) {
      setContactsMessage(error.message)
      setContacts([])
    } else {
      setContactsMessage('')
      setContacts(data || [])
    }
    setContactsLoading(false)
  }

  const openContactModal = (contact = null) => {
    setEditingContact(contact || { id: null })
    setContactSaveMessage('')
    setContactForm({
      firstName: contact?.first_name || '',
      lastName: contact?.last_name || '',
      company: contact?.company || '',
      position: contact?.position || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      mobile: contact?.mobile || '',
      website: contact?.website || '',
      street: contact?.street || '',
      postalCode: contact?.postal_code || '',
      city: contact?.city || '',
      country: contact?.country || 'DE',
      contactType: contact?.contact_type || 'business',
      tags: contact?.tags || [],
      notes: contact?.notes || '',
      shared: contact?.shared ?? true,
      businessCardUrl: contact?.business_card_url || '',
    })
    setContactCardFile(null)
    setContactCardPreview(contact?.business_card_url || '')
  }

  const closeContactModal = () => {
    setEditingContact(null)
    setContactSaveMessage('')
    setContactCardFile(null)
    setContactCardPreview('')
  }

  const handleContactInput = (field, value) => {
    setContactForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleContactCardChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setContactCardFile(file)
    setContactCardPreview(URL.createObjectURL(file))
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    if (!editingContact) return
    if (!contactForm.firstName.trim() && !contactForm.lastName.trim() && !contactForm.company.trim()) {
      setContactSaveMessage('Bitte mindestens Name oder Firma eingeben.')
      return
    }

    // Find current staff member for owner_id
    if (!currentStaff?.id) {
      setContactSaveMessage('Kein Mitarbeiter-Profil gefunden.')
      return
    }

    setContactSaveLoading(true)
    const payload = {
      owner_id: editingContact.owner_id || currentStaff.id,
      first_name: contactForm.firstName.trim(),
      last_name: contactForm.lastName.trim(),
      company: contactForm.company.trim(),
      position: contactForm.position.trim(),
      email: contactForm.email.trim(),
      phone: contactForm.phone.trim(),
      mobile: contactForm.mobile.trim(),
      website: contactForm.website.trim(),
      street: contactForm.street.trim(),
      postal_code: contactForm.postalCode.trim(),
      city: contactForm.city.trim(),
      country: contactForm.country.trim() || 'DE',
      contact_type: contactForm.contactType,
      tags: contactForm.tags,
      notes: contactForm.notes.trim(),
      shared: contactForm.shared,
      business_card_url: contactForm.businessCardUrl || null,
    }

    const uploadBusinessCard = async (contactId) => {
      if (!contactCardFile) return null
      const fileExt = contactCardFile.name.split('.').pop() || 'jpg'
      const filePath = `${contactId}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase
        .storage
        .from('business-cards')
        .upload(filePath, contactCardFile, { upsert: true })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data } = supabase
        .storage
        .from('business-cards')
        .getPublicUrl(filePath)
      return data.publicUrl
    }

    let saveError = null
    let savedId = editingContact.id
    if (editingContact.id) {
      const { error } = await supabase
        .from('contacts')
        .update(payload)
        .eq('id', editingContact.id)
      saveError = error
    } else {
      const { data, error } = await supabase
        .from('contacts')
        .insert(payload)
        .select('id')
        .single()
      saveError = error
      savedId = data?.id
    }

    if (saveError) {
      setContactSaveMessage(saveError.message)
      setContactSaveLoading(false)
      return
    }

    if (contactCardFile && savedId) {
      try {
        const cardUrl = await uploadBusinessCard(savedId)
        if (cardUrl) {
          await supabase
            .from('contacts')
            .update({ business_card_url: cardUrl })
            .eq('id', savedId)
        }
      } catch (error) {
        setContactSaveMessage(error.message || 'Visitenkarte konnte nicht gespeichert werden.')
        setContactSaveLoading(false)
        return
      }
    }

    await fetchContacts()
    setContactSaveLoading(false)
    closeContactModal()
  }

  const deleteContact = async (contactId) => {
    if (!window.confirm('Kontakt wirklich löschen?')) return
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
    if (error) {
      setContactsMessage(error.message)
    } else {
      await fetchContacts()
    }
  }

  const contactTypeLabels = {
    business: 'Geschäftlich',
    supplier: 'Lieferant',
    customer: 'Kunde',
    employee: 'Mitarbeiter',
    other: 'Sonstige',
  }

  // Kontakte filtern nach Suchbegriff
  const filteredContacts = contacts.filter((contact) => {
    if (!contactSearch.trim()) return true
    const search = contactSearch.toLowerCase()
    return (
      (contact.first_name || '').toLowerCase().includes(search) ||
      (contact.last_name || '').toLowerCase().includes(search) ||
      (contact.company || '').toLowerCase().includes(search) ||
      (contact.position || '').toLowerCase().includes(search) ||
      (contact.email || '').toLowerCase().includes(search) ||
      (contact.phone || '').toLowerCase().includes(search) ||
      (contact.mobile || '').toLowerCase().includes(search) ||
      (contact.street || '').toLowerCase().includes(search) ||
      (contact.postal_code || '').toLowerCase().includes(search) ||
      (contact.city || '').toLowerCase().includes(search) ||
      (contact.notes || '').toLowerCase().includes(search)
    )
  })

  const fetchChatMessages = async () => {
    setChatLoading(true)
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, user_id, message, created_at')
      .order('created_at', { ascending: true })
      .limit(200)

    if (error) {
      setChatError(error.message)
      setChatMessages([])
    } else {
      setChatError('')
      setChatMessages(data || [])
    }
    setChatLoading(false)
  }

  const sendChatMessage = async (event) => {
    event.preventDefault()
    if (!chatInput.trim() || !session?.user?.id) return
    setChatSending(true)
    setChatError('')
    const { error } = await supabase
      .from('chat_messages')
      .insert({ user_id: session.user.id, message: chatInput.trim() })

    if (error) {
      setChatError(error.message)
    } else {
      setChatInput('')
    }
    setChatSending(false)
  }

  const fetchPlanData = async () => {
    setPlanLoading(true)
    setPlanError('')
    setPlanData(null)

    try {
      const { data: files, error: listError } = await supabase
        .storage
        .from('tagesmep')
        .list('', { limit: 100, sortBy: { column: 'name', order: 'desc' } })

      if (listError) throw listError
      if (!files || files.length === 0) throw new Error('Keine XML-Dateien im Bucket gefunden.')

      const xmlFiles = files
        .filter((f) => f.name.endsWith('.xml'))
        .sort((a, b) => b.name.localeCompare(a.name))

      if (xmlFiles.length === 0) throw new Error('Keine XML-Dateien gefunden.')

      let xmlContent = null
      let usedFile = null

      for (const file of xmlFiles) {
        const { data, error: downloadError } = await supabase
          .storage
          .from('tagesmep')
          .download(file.name)

        if (!downloadError && data) {
          xmlContent = await data.text()
          usedFile = file.name
          break
        }
      }

      if (!xmlContent) throw new Error('Konnte keine XML-Datei laden.')

      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml')
      const parseError = xmlDoc.querySelector('parsererror')
      if (parseError) throw new Error('XML konnte nicht geparst werden.')

      const reportDate = xmlDoc.documentElement.getAttribute('date') || ''
      const orgGroups = xmlDoc.querySelectorAll('orggroup')
      const parsed = { reportDate, usedFile, days: {} }

      orgGroups.forEach((group) => {
        const issueDate = group.getAttribute('issueDate') || ''
        const groupName = group.getAttribute('name') || ''
        const dateMatch = issueDate.match(/(\d{2}\.\d{2}\.\d{4})/)
        const dateKey = dateMatch ? dateMatch[1] : issueDate

        if (!parsed.days[dateKey]) {
          parsed.days[dateKey] = { issueDate, groups: {} }
        }

        if (!parsed.days[dateKey].groups[groupName]) {
          parsed.days[dateKey].groups[groupName] = []
        }

        const employees = group.querySelectorAll('employee')
        employees.forEach((emp) => {
          const visible = emp.querySelector('visible')?.textContent
          if (visible !== 'true') return

          const firstName = emp.getAttribute('firstName') || ''
          const lastName = emp.getAttribute('lastName') || ''
          const workStart = emp.getAttribute('workStart') || ''
          const workStop = emp.getAttribute('workStop') || ''
          const color = emp.getAttribute('color') || ''

          const planEl = emp.querySelector('plan')
          const timeblocks = []
          if (planEl) {
            planEl.querySelectorAll('timeblock').forEach((tb) => {
              timeblocks.push({
                type: tb.getAttribute('type') || '',
                duration: parseInt(tb.getAttribute('duration') || '0', 10),
                color1: tb.getAttribute('color1') || '',
                text: tb.textContent?.trim() || '',
              })
            })
          }

          let status = ''
          const workBlock = timeblocks.find((tb) => tb.type === 'work' && tb.text)
          if (workBlock) {
            const txt = workBlock.text.toLowerCase()
            if (txt.includes('urlaub')) status = 'Urlaub'
            else if (txt.includes('krankheit') || txt.includes('krank')) status = 'Krank'
            else if (workStart && workStop) status = ''
          }

          parsed.days[dateKey].groups[groupName].push({
            firstName,
            lastName,
            workStart,
            workStop,
            color,
            status,
            timeblocks,
          })
        })
      })

      setPlanData(parsed)
    } catch (err) {
      setPlanError(err.message || 'Fehler beim Laden der Plandaten.')
    } finally {
      setPlanLoading(false)
    }
  }

  // ============================================
  // KALENDER-SYSTEM FUNKTIONEN
  // ============================================

  const fetchCalendars = async () => {
    setCalendarsLoading(true)
    setCalendarsError('')

    const { data, error } = await supabase
      .from('calendars')
      .select(`
        id,
        name,
        description,
        color,
        created_by,
        created_at,
        is_active,
        calendar_permissions(permission)
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      setCalendarsError(error.message)
      setCalendars([])
    } else {
      const calendarsWithPermission = (data || []).map((cal) => ({
        ...cal,
        userPermission: cal.calendar_permissions?.[0]?.permission || 'read',
      }))
      setCalendars(calendarsWithPermission)

      // Standard: "Alle Kalender" Ansicht
      if (!selectedCalendarId && calendarsWithPermission.length > 0) {
        setSelectedCalendarId('all')
      }
    }
    setCalendarsLoading(false)
  }

  const getCalendarViewRange = () => {
    const d = new Date(calendarViewDate)
    let startDate, endDate

    if (calendarViewMode === 'month') {
      startDate = new Date(d.getFullYear(), d.getMonth(), 1)
      startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7))
      endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      endDate.setDate(endDate.getDate() + (7 - endDate.getDay()) % 7)
    } else if (calendarViewMode === 'week') {
      startDate = new Date(d)
      startDate.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
    } else {
      startDate = new Date(d)
      endDate = new Date(d)
      endDate.setDate(endDate.getDate() + 1)  // +1 Tag für ganztägige Termine
    }

    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)
    return { startDate, endDate }
  }

  const fetchCalendarEvents = async (calendarId) => {
    if (!calendarId) return
    setEventsLoading(true)

    const { startDate, endDate } = getCalendarViewRange()

    let query = supabase
      .from('calendar_events')
      .select('*')
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString())
      .order('start_time', { ascending: true })

    // Bei "all" alle Kalender laden, sonst nur den ausgewählten
    if (calendarId !== 'all') {
      query = query.eq('calendar_id', calendarId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Events laden fehlgeschlagen:', error.message)
      setCalendarEvents([])
    } else {
      setCalendarEvents(data || [])
    }
    setEventsLoading(false)
  }

  const fetchCalendarPermissions = async (calendarId) => {
    setPermissionsLoading(true)

    const { data, error } = await supabase
      .from('calendar_permissions')
      .select('id, user_id, permission, granted_by, created_at')
      .eq('calendar_id', calendarId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const permissionsWithStaff = data.map((perm) => ({
        ...perm,
        staffMember: staff.find((s) => s.auth_user_id === perm.user_id),
      }))
      setCalendarPermissions(permissionsWithStaff)
    }
    setPermissionsLoading(false)
  }

  const createCalendar = async () => {
    if (!calendarForm.name.trim()) return
    setCalendarSaving(true)

    const { data, error } = await supabase
      .from('calendars')
      .insert({
        name: calendarForm.name.trim(),
        description: calendarForm.description.trim(),
        color: calendarForm.color,
        created_by: session.user.id,
      })
      .select()
      .single()

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      await supabase
        .from('calendar_permissions')
        .insert({
          calendar_id: data.id,
          user_id: session.user.id,
          permission: 'write',
          granted_by: session.user.id,
        })

      await fetchCalendars()
      setEditingCalendar(null)
      setCalendarForm({ name: '', description: '', color: '#10b981' })
    }
    setCalendarSaving(false)
  }

  const updateCalendar = async (calendarId) => {
    setCalendarSaving(true)

    const { error } = await supabase
      .from('calendars')
      .update({
        name: calendarForm.name.trim(),
        description: calendarForm.description.trim(),
        color: calendarForm.color,
        updated_at: new Date().toISOString(),
      })
      .eq('id', calendarId)

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      await fetchCalendars()
      setEditingCalendar(null)
    }
    setCalendarSaving(false)
  }

  const createEvent = async () => {
    if (!eventForm.title.trim() || !selectedCalendarId) return
    setEventSaving(true)
    setEventError('')

    const startTime = eventForm.allDay
      ? new Date(eventForm.startDate + 'T00:00:00')
      : new Date(eventForm.startDate + 'T' + eventForm.startTime)

    const endTime = eventForm.allDay
      ? new Date(eventForm.endDate + 'T23:59:59')
      : new Date(eventForm.endDate + 'T' + eventForm.endTime)

    const { error } = await supabase
      .from('calendar_events')
      .insert({
        calendar_id: selectedCalendarId,
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        all_day: eventForm.allDay,
        location: eventForm.location.trim(),
        created_by: session.user.id,
      })

    if (error) {
      setEventError(error.message)
    } else {
      await fetchCalendarEvents(selectedCalendarId)
      closeEventModal()
    }
    setEventSaving(false)
  }

  const updateEvent = async (eventId) => {
    setEventSaving(true)
    setEventError('')

    const startTime = eventForm.allDay
      ? new Date(eventForm.startDate + 'T00:00:00')
      : new Date(eventForm.startDate + 'T' + eventForm.startTime)

    const endTime = eventForm.allDay
      ? new Date(eventForm.endDate + 'T23:59:59')
      : new Date(eventForm.endDate + 'T' + eventForm.endTime)

    const { error } = await supabase
      .from('calendar_events')
      .update({
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        all_day: eventForm.allDay,
        location: eventForm.location.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)

    if (error) {
      setEventError(error.message)
    } else {
      await fetchCalendarEvents(selectedCalendarId)
      closeEventModal()
    }
    setEventSaving(false)
  }

  const deleteEvent = async (eventId) => {
    if (!confirm('Termin unwiderruflich löschen?')) return

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      await fetchCalendarEvents(selectedCalendarId)
      closeEventModal()
    }
  }

  const addCalendarPermission = async (calendarId, userId, permission) => {
    const { error } = await supabase
      .from('calendar_permissions')
      .upsert(
        {
          calendar_id: calendarId,
          user_id: userId,
          permission: permission,
          granted_by: session.user.id,
        },
        { onConflict: 'calendar_id,user_id' },
      )

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      await fetchCalendarPermissions(calendarId)
    }
  }

  const removeCalendarPermission = async (permissionId, calendarId) => {
    const { error } = await supabase
      .from('calendar_permissions')
      .delete()
      .eq('id', permissionId)

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      await fetchCalendarPermissions(calendarId)
    }
  }

  const openEventModal = (event = null, clickedDate = null) => {
    const today = clickedDate || new Date()
    // Lokales Datum formatieren (ohne Zeitzonenkonvertierung)
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    if (event) {
      // Datum direkt aus String extrahieren (vermeidet Zeitzonenprobleme)
      const startDate = event.start_time.substring(0, 10)
      const endDate = event.end_time.substring(0, 10)
      // Zeit aus Date-Objekt für lokale Anzeige
      const start = new Date(event.start_time)
      const end = new Date(event.end_time)
      setEditingEvent(event)
      setEventForm({
        title: event.title,
        description: event.description || '',
        startDate: startDate,
        startTime: start.toTimeString().slice(0, 5),
        endDate: endDate,
        endTime: end.toTimeString().slice(0, 5),
        allDay: event.all_day,
        location: event.location || '',
      })
    } else {
      setEditingEvent({ id: null })
      setEventForm({
        title: '',
        description: '',
        startDate: todayStr,
        startTime: '09:00',
        endDate: todayStr,
        endTime: '10:00',
        allDay: false,
        location: '',
      })
    }
    setEventError('')
  }

  const closeEventModal = () => {
    setEditingEvent(null)
    setEventError('')
  }

  const openCalendarModal = (calendar = null) => {
    if (calendar) {
      setEditingCalendar(calendar)
      setCalendarForm({
        name: calendar.name,
        description: calendar.description || '',
        color: calendar.color || '#10b981',
      })
    } else {
      setEditingCalendar({ id: null })
      setCalendarForm({ name: '', description: '', color: '#10b981' })
    }
  }

  const closeCalendarModal = () => {
    setEditingCalendar(null)
  }

  const currentCalendarPermission = () => {
    // Bei "Alle Kalender" keine Schreibberechtigung (man muss einen spezifischen Kalender wählen)
    if (selectedCalendarId === 'all') return null
    if (currentStaff?.is_admin) return 'write'
    const cal = calendars.find((c) => c.id === selectedCalendarId)
    return cal?.userPermission || null
  }

  const canWriteCurrentCalendar = () => currentCalendarPermission() === 'write'

  // Hilfsfunktion: Farbe für ein Event basierend auf seinem Kalender
  const getEventColor = (event) => {
    const cal = calendars.find((c) => c.id === event.calendar_id)
    return cal?.color || '#10b981'
  }

  const weatherDescription = (code) => {
    const map = {
      0: 'Klar',
      1: 'Überwiegend klar',
      2: 'Leicht bewölkt',
      3: 'Bedeckt',
      45: 'Nebel',
      48: 'Reifnebel',
      51: 'Nieselregen',
      53: 'Nieselregen',
      55: 'Nieselregen',
      61: 'Regen',
      63: 'Regen',
      65: 'Starker Regen',
      71: 'Schnee',
      73: 'Schnee',
      75: 'Starker Schnee',
      80: 'Schauer',
      81: 'Schauer',
      82: 'Starke Schauer',
      95: 'Gewitter',
    }
    return map[code] || 'Wetter'
  }

  const fetchWeather = async (location) => {
    if (!location) return
    setWeatherLoading(true)
    setWeatherError('')
    setWeatherData(null)
    try {
      const geocode = async (query) => {
        const geoResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=de&format=json`,
        )
        if (!geoResponse.ok) return null
        const geoData = await geoResponse.json()
        return geoData.results && geoData.results[0]
      }

      const parts = location.split(' ').filter(Boolean)
      const cityOnly = parts.length > 1 ? parts.slice(1).join(' ') : location
      const candidates = [location, cityOnly, parts[0]].filter(Boolean)
      let result = null
      for (const candidate of candidates) {
        result = await geocode(candidate)
        if (result) break
      }

      if (!result) throw new Error('Ort nicht gefunden.')

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${result.latitude}&longitude=${result.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weathercode,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset&forecast_days=5&timezone=auto`,
      )
      if (!weatherResponse.ok) throw new Error('Wetterdaten konnten nicht geladen werden.')
      const weatherJson = await weatherResponse.json()
      const daily = weatherJson.daily || {}
      const dailyEntries = (daily.time || []).map((date, index) => ({
        date,
        min: daily.temperature_2m_min?.[index],
        max: daily.temperature_2m_max?.[index],
        precipitation: daily.precipitation_sum?.[index],
        sunrise: daily.sunrise?.[index],
        sunset: daily.sunset?.[index],
      }))
      setWeatherData({
        name: `${result.name}${result.admin1 ? `, ${result.admin1}` : ''}`,
        temperature: weatherJson.current?.temperature_2m,
        feelsLike: weatherJson.current?.apparent_temperature,
        humidity: weatherJson.current?.relative_humidity_2m,
        precipitation: weatherJson.current?.precipitation,
        weatherCode: weatherJson.current?.weathercode,
        wind: weatherJson.current?.wind_speed_10m,
        daily: dailyEntries,
      })
    } catch (error) {
      setWeatherError(error.message || 'Fehler beim Laden der Wetterdaten.')
    } finally {
      setWeatherLoading(false)
    }
  }

  const openWeatherModal = () => {
    setWeatherInput(weatherLocation)
    setWeatherModalOpen(true)
  }

  const closeWeatherModal = () => {
    setWeatherModalOpen(false)
  }

  const handleEditInput = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const openCreateModal = () => {
    setEditingPharmacy({ id: null })
    setEditMessage('')
    setEditForm({
      name: '',
      street: '',
      postalCode: '',
      city: '',
      phone: '',
      owner: '',
      ownerRole: '',
      website: '',
      email: '',
      fax: '',
    })
    setWeatherModalOpen(false)
  }

  const openEditModal = (pharmacy) => {
    setEditingPharmacy(pharmacy)
    setEditMessage('')
    setEditForm({
      name: pharmacy.name || '',
      street: pharmacy.street || '',
      postalCode: pharmacy.postal_code || '',
      city: pharmacy.city || '',
      phone: pharmacy.phone || '',
      owner: pharmacy.owner || '',
      ownerRole: pharmacy.owner_role || '',
      website: pharmacy.website || '',
      email: pharmacy.email || '',
      fax: pharmacy.fax || '',
    })
  }

  const closeEditModal = () => {
    setEditingPharmacy(null)
    setEditMessage('')
  }

  const openStaffModal = (member = null) => {
    const fallbackPharmacyId = pharmacies[0]?.id || ''
    setEditingStaff(member || { id: null })
    setStaffSaveMessage('')
    setStaffInviteMessage('')
    setStaffForm({
      firstName: member?.first_name || '',
      lastName: member?.last_name || '',
      street: member?.street || '',
      postalCode: member?.postal_code || '',
      city: member?.city || '',
      mobile: member?.mobile || '',
      email: member?.email || '',
      role: member?.role || '',
      pharmacyId: member?.pharmacy_id || fallbackPharmacyId,
      authUserId: member?.auth_user_id || '',
      isAdmin: member?.is_admin || false,
      avatarUrl: member?.avatar_url || '',
    })
    setStaffAvatarFile(null)
    setStaffAvatarPreview(member?.avatar_url || '')
  }

  const closeStaffModal = () => {
    setEditingStaff(null)
    setStaffSaveMessage('')
    setStaffInviteMessage('')
    setStaffAvatarFile(null)
    setStaffAvatarPreview('')
  }

  const handleStaffInput = (field, value) => {
    setStaffForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleStaffAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setStaffAvatarFile(file)
    setStaffAvatarPreview(URL.createObjectURL(file))
  }

  const fetchLatestPhoto = async () => {
    const { data, error } = await supabase
      .storage
      .from('documents')
      .list('photos', { limit: 1, sortBy: { column: 'created_at', order: 'desc' } })
    if (error || !data || data.length === 0) {
      setLatestPhoto(null)
      return
    }
    const { data: urlData } = supabase
      .storage
      .from('documents')
      .getPublicUrl(`photos/${data[0].name}`)
    setLatestPhoto({ name: data[0].name, url: urlData.publicUrl, createdAt: data[0].created_at })
  }

  const handleCameraCapture = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `photos/${fileName}`
    const { error } = await supabase
      .storage
      .from('documents')
      .upload(filePath, file)
    if (error) {
      console.error('Foto-Upload fehlgeschlagen:', error.message)
      setPhotoUploading(false)
      return
    }
    await fetchLatestPhoto()
    await fetchAllPhotos()
    setPhotoUploading(false)

    // OCR im Hintergrund starten
    const { data: urlData } = supabase
      .storage
      .from('documents')
      .getPublicUrl(filePath)
    if (urlData?.publicUrl) {
      runOcrForPhoto(fileName, urlData.publicUrl)
    }
  }

  const fetchAllPhotos = async () => {
    setPhotosLoading(true)
    const { data, error } = await supabase
      .storage
      .from('documents')
      .list('photos', { sortBy: { column: 'created_at', order: 'desc' } })
    if (error || !data) {
      setAllPhotos([])
      setPhotosLoading(false)
      return
    }
    const photosWithUrls = data.map((file) => {
      const { data: urlData } = supabase
        .storage
        .from('documents')
        .getPublicUrl(`photos/${file.name}`)
      const ext = file.name.split('.').pop()?.toUpperCase() || 'JPG'
      const sizeKB = file.metadata?.size ? Math.round(file.metadata.size / 1024) : null
      return {
        name: file.name,
        url: urlData.publicUrl,
        createdAt: file.created_at,
        format: ext,
        sizeKB,
      }
    })
    setAllPhotos(photosWithUrls)
    setPhotosLoading(false)
  }

  const deletePhoto = async (photoName, event) => {
    event.stopPropagation()
    if (!confirm('Foto unwiderruflich löschen?')) return
    const { data, error } = await supabase
      .storage
      .from('documents')
      .remove([`photos/${photoName}`])
    console.log('Delete response:', { data, error, photoName })
    if (error) {
      alert('Löschen fehlgeschlagen: ' + error.message)
      return
    }
    if (!data || data.length === 0) {
      alert('Foto konnte nicht gelöscht werden. Prüfe die Storage-Berechtigungen.')
      return
    }
    setAllPhotos((prev) => prev.filter((p) => p.name !== photoName))
    await fetchLatestPhoto()
  }

  const fetchMistralApiKey = async () => {
    const { data, error } = await supabase
      .from('api_keys')
      .select('key')
      .eq('name', 'Mistral')
      .single()
    if (!error && data) {
      setMistralApiKey(data.key)
      return data.key
    }
    return null
  }

  const fetchPhotoOcrData = async () => {
    const { data, error } = await supabase
      .from('photo_ocr')
      .select('photo_name, ocr_text, ocr_status')
    if (!error && data) {
      const ocrMap = {}
      data.forEach((item) => {
        ocrMap[item.photo_name] = { text: item.ocr_text, status: item.ocr_status }
      })
      setPhotoOcrData(ocrMap)
    }
  }

  const runOcrForPhoto = async (photoName, photoUrl) => {
    let apiKey = mistralApiKey
    if (!apiKey) {
      apiKey = await fetchMistralApiKey()
    }
    if (!apiKey) {
      console.error('Mistral API Key nicht gefunden')
      return
    }

    setOcrProcessing((prev) => ({ ...prev, [photoName]: true }))

    try {
      const response = await fetch('https://api.mistral.ai/v1/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'mistral-ocr-latest',
          document: {
            type: 'image_url',
            image_url: photoUrl,
          },
        }),
      })

      const result = await response.json()
      let ocrText = ''

      if (result.pages && result.pages.length > 0) {
        ocrText = result.pages.map((p) => p.markdown || p.text || '').join('\n')
      } else if (result.text) {
        ocrText = result.text
      } else if (result.content) {
        ocrText = result.content
      }

      const { error } = await supabase
        .from('photo_ocr')
        .upsert({
          photo_name: photoName,
          ocr_text: ocrText || '(kein Text erkannt)',
          ocr_status: 'completed',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'photo_name' })

      if (!error) {
        setPhotoOcrData((prev) => ({
          ...prev,
          [photoName]: { text: ocrText || '(kein Text erkannt)', status: 'completed' },
        }))
      }
    } catch (err) {
      console.error('OCR fehlgeschlagen:', err)
      await supabase
        .from('photo_ocr')
        .upsert({
          photo_name: photoName,
          ocr_text: '',
          ocr_status: 'error',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'photo_name' })
      setPhotoOcrData((prev) => ({
        ...prev,
        [photoName]: { text: '', status: 'error' },
      }))
    } finally {
      setOcrProcessing((prev) => ({ ...prev, [photoName]: false }))
    }
  }

  const openPhotoEditor = (photo) => {
    setSelectedPhoto(photo)
    setCrop(undefined)
    setCompletedCrop(undefined)
    setBrightness(100)
    setContrast(100)
    setPhotoEditorOpen(true)
  }

  const closePhotoEditor = () => {
    setPhotoEditorOpen(false)
    setSelectedPhoto(null)
    setCrop(undefined)
    setCompletedCrop(undefined)
  }

  const fetchAmkMessages = async (year, month) => {
    setAmkLoading(true)
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('abda_amk_messages')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    if (!error && data) {
      setAmkMessages(data)
    } else {
      setAmkMessages([])
    }
    setAmkLoading(false)
  }

  const fetchRecallMessages = async (year, month) => {
    setRecallLoading(true)
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('abda_recall')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    if (!error && data) {
      setRecallMessages(data)
    } else {
      setRecallMessages([])
    }
    setRecallLoading(false)
  }

  const fetchLavAusgaben = async (year, month) => {
    setLavLoading(true)
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('lav_ausgaben')
      .select(`
        *,
        lav_themes (*)
      `)
      .gte('datum', startDate)
      .lte('datum', endDate)
      .order('datum', { ascending: false })
    if (!error && data) {
      setLavAusgaben(data)
    } else {
      setLavAusgaben([])
    }
    setLavLoading(false)
  }

  const changeApoMonth = (delta) => {
    setApoMonth((prev) => {
      let newMonth = prev.month + delta
      let newYear = prev.year
      if (newMonth < 0) {
        newMonth = 11
        newYear -= 1
      } else if (newMonth > 11) {
        newMonth = 0
        newYear += 1
      }
      return { year: newYear, month: newMonth }
    })
  }

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

  const saveEditedPhoto = async () => {
    if (!selectedPhoto || !photoImgRef.current) return
    setPhotoSaving(true)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const image = photoImgRef.current

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    if (completedCrop) {
      canvas.width = completedCrop.width * scaleX
      canvas.height = completedCrop.height * scaleY
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0, 0,
        canvas.width,
        canvas.height
      )
    } else {
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
      ctx.drawImage(image, 0, 0)
    }

    canvas.toBlob(async (blob) => {
      const fileName = `edited_${Date.now()}.jpg`
      const filePath = `photos/${fileName}`
      const { error } = await supabase
        .storage
        .from('documents')
        .upload(filePath, blob)
      if (error) {
        console.error('Speichern fehlgeschlagen:', error.message)
      } else {
        await fetchAllPhotos()
        await fetchLatestPhoto()
        closePhotoEditor()
      }
      setPhotoSaving(false)
    }, 'image/jpeg', 0.9)
  }

  const linkCurrentUser = () => {
    if (!session?.user?.id) return
    setStaffForm((prev) => ({
      ...prev,
      authUserId: session.user.id,
      email: prev.email || session.user.email || '',
    }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingPharmacy) return
    if (!editingPharmacy.id && pharmacies.length >= 4) {
      setEditMessage('Maximal 4 Apotheken erlaubt.')
      return
    }
    if (!editForm.name.trim()) {
      setEditMessage('Bitte einen Namen eingeben.')
      return
    }
    if (!editForm.ownerRole) {
      setEditMessage('Bitte Inhaber oder Filialleiter wählen.')
      return
    }

    setEditLoading(true)
    const payload = {
      name: editForm.name.trim(),
      street: editForm.street.trim(),
      postal_code: editForm.postalCode.trim(),
      city: editForm.city.trim(),
      phone: editForm.phone.trim(),
      owner: editForm.owner.trim(),
      owner_role: editForm.ownerRole,
      website: editForm.website.trim(),
      email: editForm.email.trim(),
      fax: editForm.fax.trim(),
    }

    const { error } = editingPharmacy.id
      ? await supabase
          .from('pharmacies')
          .update(payload)
          .eq('id', editingPharmacy.id)
      : await supabase
          .from('pharmacies')
          .insert(payload)

    if (error) {
      setEditMessage(error.message)
      setEditLoading(false)
      return
    }

    await fetchPharmacies()
    setEditLoading(false)
    closeEditModal()
  }

  const handleStaffSubmit = async (e) => {
    e.preventDefault()
    if (!editingStaff) return
    if (!staffForm.firstName.trim() || !staffForm.lastName.trim()) {
      setStaffSaveMessage('Bitte Vor- und Nachnamen eingeben.')
      return
    }
    if (!staffForm.role) {
      setStaffSaveMessage('Bitte Beruf wählen.')
      return
    }
    if (!staffForm.pharmacyId) {
      setStaffSaveMessage('Bitte Apotheke zuordnen.')
      return
    }

    setStaffSaveLoading(true)
    const payload = {
      first_name: staffForm.firstName.trim(),
      last_name: staffForm.lastName.trim(),
      street: staffForm.street.trim(),
      postal_code: staffForm.postalCode.trim(),
      city: staffForm.city.trim(),
      mobile: staffForm.mobile.trim(),
      email: staffForm.email.trim(),
      role: staffForm.role,
      pharmacy_id: staffForm.pharmacyId,
      auth_user_id: staffForm.authUserId || null,
      is_admin: staffForm.isAdmin,
      avatar_url: staffForm.avatarUrl || null,
    }

    const uploadAvatar = async (staffId) => {
      if (!staffAvatarFile) return null
      const fileExt = staffAvatarFile.name.split('.').pop() || 'jpg'
      const filePath = `staff/${staffId}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, staffAvatarFile, { upsert: true })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(filePath)
      return data.publicUrl
    }

    let saveError = null
    let savedId = editingStaff.id
    if (editingStaff.id) {
      const { error } = await supabase
        .from('staff')
        .update(payload)
        .eq('id', editingStaff.id)
      saveError = error
    } else {
      const { data, error } = await supabase
        .from('staff')
        .insert(payload)
        .select('id')
        .single()
      saveError = error
      savedId = data?.id
    }

    if (saveError) {
      setStaffSaveMessage(saveError.message)
      setStaffSaveLoading(false)
      return
    }

    if (staffAvatarFile && savedId) {
      try {
        const avatarUrl = await uploadAvatar(savedId)
        if (avatarUrl) {
          await supabase
            .from('staff')
            .update({ avatar_url: avatarUrl })
            .eq('id', savedId)
        }
      } catch (error) {
        setStaffSaveMessage(error.message || 'Avatar konnte nicht gespeichert werden.')
        setStaffSaveLoading(false)
        return
      }
    }

    await fetchStaff()
    setStaffSaveLoading(false)
    closeStaffModal()
  }

  const handleSendInvite = async () => {
    if (!staffForm.email.trim()) {
      setStaffInviteMessage('Bitte E-Mail-Adresse eingeben')
      return
    }
    setStaffInviteLoading(true)
    setStaffInviteMessage('')
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email: staffForm.email.trim(),
          staffId: editingStaff?.id || null,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Einladung fehlgeschlagen')
      }
      setStaffInviteMessage('Einladung wurde gesendet!')
    } catch (error) {
      setStaffInviteMessage(error.message)
    }
    setStaffInviteLoading(false)
  }

  useEffect(() => {
    // Check URL for invite or recovery tokens
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const searchParams = new URLSearchParams(window.location.search)
    const type = hashParams.get('type') || searchParams.get('type')
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const isAuthLink = type === 'invite' || type === 'recovery'
    const hasAuthTokens = Boolean(accessToken && refreshToken)

    const initAuth = async () => {
      // If this is an invite or recovery link with tokens
      if (isAuthLink && hasAuthTokens) {
        const { data: { session: existingSession } } = await supabase.auth.getSession()
        if (existingSession) {
          setSession(existingSession)
          setAuthView('resetPassword')
          window.history.replaceState({}, document.title, window.location.pathname)
          return
        }

        // Set the new session from the tokens in the URL
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (!error && data.session) {
          setSession(data.session)
          setAuthView('resetPassword')
          // Clean up the URL
          window.history.replaceState({}, document.title, window.location.pathname)
          return
        }
      }

      // Normal session check (also covers auth links where the session is already set)
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session && isAuthLink) {
        setAuthView('resetPassword')
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') {
        setAuthView('resetPassword')
      }
      if (event === 'SIGNED_IN') {
        const nextHashParams = new URLSearchParams(window.location.hash.substring(1))
        const nextSearchParams = new URLSearchParams(window.location.search)
        const nextType = nextHashParams.get('type') || nextSearchParams.get('type')
        if (nextType === 'invite' || nextType === 'recovery') {
          setAuthView('resetPassword')
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      fetchPharmacies()
      fetchStaff()
      fetchContacts()
      fetchLatestPhoto()
      fetchAllPhotos()
      fetchPhotoOcrData()
      fetchMistralApiKey()
    }
  }, [session])

  useEffect(() => {
    if (session && activeView === 'apo') {
      if (apoTab === 'amk') {
        fetchAmkMessages(apoMonth.year, apoMonth.month)
      } else if (apoTab === 'recall') {
        fetchRecallMessages(apoMonth.year, apoMonth.month)
      } else if (apoTab === 'lav') {
        fetchLavAusgaben(apoMonth.year, apoMonth.month)
      }
    }
  }, [session, activeView, apoTab, apoMonth])

  useEffect(() => {
    if (session?.user?.id) {
      const matched = staff.find((member) => member.auth_user_id === session.user.id)
      setCurrentStaff(matched || null)
    }
  }, [staff, session])

  useEffect(() => {
    if (!weatherLocation && pharmacies.length > 0) {
      const primary = pharmacies[0]
      const cityLabel = primary.city ? [primary.postal_code, primary.city].filter(Boolean).join(' ') : ''
      const fallback = cityLabel || primary.name
      if (fallback) {
        setWeatherLocation(fallback)
      }
    }
  }, [pharmacies, weatherLocation])

  useEffect(() => {
    if (weatherLocation) {
      fetchWeather(weatherLocation)
    }
  }, [weatherLocation])

  useEffect(() => {
    if (!session || activeView !== 'chat') return
    fetchChatMessages()
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setChatMessages((prev) => {
          if (prev.some((message) => message.id === payload.new.id)) {
            return prev
          }
          return [...prev, payload.new]
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeView, session])

  useEffect(() => {
    if (activeView === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeView, chatMessages])

  useEffect(() => {
    if (session && activeView === 'plan' && !planData && !planLoading && !planError) {
      fetchPlanData()
    }
  }, [activeView, session, planData, planLoading, planError])

  // Kalender laden bei View-Wechsel
  useEffect(() => {
    if (session && activeView === 'calendar') {
      fetchCalendars()
    }
  }, [session, activeView])

  // Events laden bei Kalender/Datum-Wechsel
  useEffect(() => {
    if (session && activeView === 'calendar' && selectedCalendarId) {
      fetchCalendarEvents(selectedCalendarId)
    }
  }, [selectedCalendarId, calendarViewDate, calendarViewMode])

  // Realtime-Subscription für Kalender-Events
  useEffect(() => {
    if (!session || activeView !== 'calendar' || !selectedCalendarId) return

    // Bei "all" auf alle Events hören, sonst nur auf den ausgewählten Kalender
    const subscriptionConfig = selectedCalendarId === 'all'
      ? { event: '*', schema: 'public', table: 'calendar_events' }
      : { event: '*', schema: 'public', table: 'calendar_events', filter: `calendar_id=eq.${selectedCalendarId}` }

    const channel = supabase
      .channel(`calendar_events_${selectedCalendarId}`)
      .on('postgres_changes', subscriptionConfig, () => {
        fetchCalendarEvents(selectedCalendarId)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeView, session, selectedCalendarId])

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setSuccessMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    setLoading(false)
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setMessage('Bitte E-Mail-Adresse eingeben')
      return
    }
    setLoading(true)
    setMessage('')
    setSuccessMessage('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) {
      setMessage(error.message)
    } else {
      setSuccessMessage('Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet.')
    }
    setLoading(false)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage('Passwörter stimmen nicht überein')
      return
    }
    if (newPassword.length < 6) {
      setMessage('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }
    setLoading(true)
    setMessage('')
    setSuccessMessage('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setMessage(error.message)
    } else {
      setSuccessMessage('Passwort erfolgreich geändert!')
      setNewPassword('')
      setConfirmPassword('')
      setAuthView('login')
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setMessage('')
    setSuccessMessage('')
    setAuthView('login')
    setSecondaryOpen(false)
  }

  // Password reset view (even if logged in via invite link)
  if (authView === 'resetPassword') {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.text} flex items-center justify-center p-4 relative overflow-hidden`}>
        <div className={`${theme.panel} p-6 sm:p-8 rounded-2xl border ${theme.border} ${theme.cardShadow} max-w-sm w-full`}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <img src="/logo.png" alt="Kaeee" className="h-10" />
              <p className={`text-sm ${theme.textMuted}`}>Neues Passwort setzen</p>
            </div>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                Neues Passwort
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                <p className="text-rose-400 text-sm">{message}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <p className="text-emerald-600 text-sm">{successMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              title="Passwort speichern"
              className={`w-full ${theme.accent} text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Wird gespeichert...' : 'Passwort speichern'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Dashboard view
  if (session) {
    return (
      <div className={`min-h-screen ${theme.bgApp} ${theme.textPrimary} flex flex-col relative overflow-hidden`}>
        {/* Header */}
        <header className={`bg-white border-b ${theme.border} px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-40`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className={`lg:hidden p-2 rounded-[6px] ${theme.textSecondary} hover:bg-[#F5F7FA]`}
              title={mobileNavOpen ? 'Menü schließen' : 'Menü öffnen'}
            >
              {mobileNavOpen ? <Icons.X /> : <Icons.Menu />}
            </button>
            <img src="/logo.png" alt="Kaeee" className="h-8" />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Camera button */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className={`p-2 rounded-[6px] hover:bg-[#F5F7FA] ${theme.textSecondary} transition-colors ${photoUploading ? 'opacity-50' : ''}`}
              title="Foto aufnehmen"
              disabled={photoUploading}
            >
              <Icons.Camera />
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />

            {/* User email - hidden on mobile */}
            <div className="hidden sm:flex items-center gap-2">
              {currentStaff?.avatar_url ? (
                <img
                  src={currentStaff.avatar_url}
                  alt={session.user.email}
                  className={`h-9 w-9 rounded-full object-cover border ${theme.border}`}
                />
              ) : (
                <div className={`h-9 w-9 rounded-full border ${theme.border} flex items-center justify-center text-xs ${theme.textMuted}`}>
                  {session.user.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className={`p-2 rounded-[6px] ${theme.danger} transition-colors`}
              title="Ausloggen"
            >
              <Icons.Logout />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Mobile nav overlay */}
          {mobileNavOpen && (
            <div
              className={`fixed inset-0 ${theme.overlay} z-40 lg:hidden`}
              onClick={() => setMobileNavOpen(false)}
            />
          )}

          {/* Mobile nav drawer */}
          <aside
            className={`
              ${theme.sidebarBg} text-white fixed inset-y-0 left-0 z-50 w-[85%] max-w-[320px]
              transform ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-out
              lg:hidden
            `}
          >
            <div className="h-full flex flex-col">
              <div className="px-4 pt-4 pb-3 border-b border-[#3c4255] flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[#9CA3AF]">Navigation</p>
                  <h2 className="text-sm font-semibold text-[#E5E7EB] mt-1">
                    {navItems.find((item) => item.id === activeView)?.label || 'Menü'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="p-2 rounded-[6px] text-[#E5E7EB] hover:bg-[#4a5066]"
                  title="Menü schließen"
                >
                  <Icons.X />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <nav className="p-2 space-y-1 border-b border-[#3c4255]">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm font-medium transition-colors ${
                        activeView === item.id ? 'bg-[#4a5066] text-white' : 'text-[#E5E7EB] hover:bg-[#4a5066]'
                      }`}
                      onClick={() => setActiveView(item.id)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>

                <nav className="p-2 space-y-1">
                  {(secondaryNavMap[activeView] || []).map((item) => {
                    const isActive = getActiveSecondaryId() === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`w-full text-left px-3 py-2.5 rounded-[6px] text-sm font-medium border-l-4 transition-colors ${
                          isActive
                            ? theme.secondaryActive
                            : 'border-transparent text-[#E5E7EB] hover:bg-[#4a5066] hover:text-white'
                        }`}
                        onClick={() => {
                          handleSecondarySelect(item.id)
                          setMobileNavOpen(false)
                        }}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Primary Sidebar */}
          <aside className={`hidden lg:flex flex-shrink-0 ${theme.sidebarBg} w-16 min-w-[4rem] max-w-[4rem]`}>
            <div className="h-full flex flex-col">
              <nav className="py-3 space-y-1 flex flex-col items-center">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`w-10 h-10 flex items-center justify-center mx-auto rounded-[6px] border-l-[3px] border-transparent box-border transition-colors ${theme.sidebarText} ${
                      activeView === item.id ? theme.sidebarActive : theme.sidebarHover
                    }`}
                    title={item.label}
                    onClick={() => {
                      setActiveView(item.id)
                    }}
                  >
                    <item.icon />
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Secondary Sidebar */}
          <aside
            className={`
              ${theme.secondarySidebarBg} border-r ${theme.border} flex-shrink-0 z-40
              hidden lg:flex lg:relative inset-y-0 left-0 top-0
              w-48
            `}
          >
            <div className="h-full flex flex-col">
              <div className="px-4 pt-4 pb-3 border-b border-[#3c4255]">
                <p className="text-xs uppercase tracking-[0.08em] text-[#9CA3AF]">Navigation</p>
                <h2 className="text-sm font-semibold text-[#E5E7EB] mt-1">
                  {navItems.find((item) => item.id === activeView)?.label || 'Kontext'}
                </h2>
              </div>
              <nav className="p-2 space-y-1 overflow-y-auto">
                {(secondaryNavMap[activeView] || []).map((item) => {
                  const isActive = getActiveSecondaryId() === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`w-full text-left px-3 py-2.5 rounded-[6px] text-sm font-medium border-l-4 transition-colors ${
                        isActive
                          ? theme.secondaryActive
                          : 'border-transparent text-[#E5E7EB] hover:bg-[#3c4255] hover:text-white'
                      }`}
                      title={item.label}
                      onClick={() => {
                        handleSecondarySelect(item.id)
                      }}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-8 overflow-auto">
            <div className={activeView === 'chat' ? 'w-full' : 'max-w-5xl'}>
              {activeView === 'dashboard' && (
                <>
                      <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Dashboard</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
                      <h3 className={`text-lg font-medium mb-2 ${theme.text}`}>Willkommen bei Kaeee</h3>
                      <p className={theme.textMuted}>
                        Dein persönliches Dashboard ist bereit.
                      </p>
                    </div>
                    <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
                      <h3 className={`text-lg font-medium mb-2 ${theme.text}`}>Nächste Schritte</h3>
                      <p className={theme.textMuted}>
                        Verknüpfe Daten, um Live-Statistiken zu sehen.
                      </p>
                    </div>
                    <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow} flex flex-col gap-3`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className={`text-lg font-medium ${theme.text}`}>Wetter</h3>
                          <p className={`text-xs ${theme.textMuted}`}>
                            {weatherData?.name || weatherLocation || 'Ort wählen'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={openWeatherModal}
                          className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                          title="Ort einstellen"
                        >
                          <Icons.Settings />
                        </button>
                      </div>
                      {weatherLoading && (
                        <p className={`text-xs ${theme.textMuted}`}>Wetterdaten werden geladen...</p>
                      )}
                      {!weatherLoading && weatherError && (
                        <p className="text-rose-400 text-xs">{weatherError}</p>
                      )}
                      {!weatherLoading && !weatherError && weatherData && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-semibold">
                                {Math.round(weatherData.temperature)}°
                              </p>
                              <p className={`text-xs ${theme.textMuted}`}>
                                {weatherDescription(weatherData.weatherCode)}
                              </p>
                            </div>
                            <div className="text-right text-xs">
                              <p className={theme.textMuted}>Wind</p>
                              <p className={theme.text}>
                                {Math.round(weatherData.wind)} km/h
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className={`rounded-lg border ${theme.border} px-2.5 py-2`}>
                              <p className={theme.textMuted}>Gefühlt</p>
                              <p className={theme.text}>{Math.round(weatherData.feelsLike ?? weatherData.temperature)}°</p>
                            </div>
                            <div className={`rounded-lg border ${theme.border} px-2.5 py-2`}>
                              <p className={theme.textMuted}>Luftfeuchte</p>
                              <p className={theme.text}>{Math.round(weatherData.humidity ?? 0)}%</p>
                            </div>
                            <div className={`rounded-lg border ${theme.border} px-2.5 py-2`}>
                              <p className={theme.textMuted}>Niederschlag</p>
                              <p className={theme.text}>{Math.round(weatherData.precipitation ?? 0)} mm</p>
                            </div>
                            <div className={`rounded-lg border ${theme.border} px-2.5 py-2`}>
                              <p className={theme.textMuted}>Heute</p>
                              <p className={theme.text}>
                                {Math.round(weatherData.daily?.[0]?.min ?? 0)}° / {Math.round(weatherData.daily?.[0]?.max ?? 0)}°
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs">
                            {weatherData.daily?.slice(0, 5).map((day) => {
                              const weekday = new Date(day.date).toLocaleDateString('de-DE', { weekday: 'short' })
                              return (
                                <div key={day.date} className={`rounded-full border ${theme.border} px-2.5 py-1.5`}>
                                  <span className={theme.textMuted}>{weekday}</span>{' '}
                                  <span className={theme.text}>
                                    {Math.round(day.min ?? 0)}°/{Math.round(day.max ?? 0)}°
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      {!weatherLoading && !weatherError && !weatherData && (
                        <p className={theme.textMuted}>
                          Kein Wetter verfügbar.
                        </p>
                      )}
                    </div>
                    <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow} flex flex-col gap-3`}>
                      <h3 className={`text-lg font-medium ${theme.text}`}>Letztes Foto</h3>
                      {photoUploading && (
                        <p className={`text-xs ${theme.textMuted}`}>Foto wird hochgeladen...</p>
                      )}
                      {!photoUploading && latestPhoto && (
                        <div className="space-y-2">
                          <img
                            src={latestPhoto.url}
                            alt="Letztes Foto"
                            className="w-full h-40 object-cover rounded-xl"
                          />
                          <p className={`text-xs ${theme.textMuted}`}>
                            {latestPhoto.createdAt
                              ? new Date(latestPhoto.createdAt).toLocaleString('de-DE')
                              : latestPhoto.name}
                          </p>
                        </div>
                      )}
                      {!photoUploading && !latestPhoto && (
                        <p className={theme.textMuted}>
                          Noch kein Foto vorhanden. Nutze das Kamera-Symbol oben.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeView === 'photos' && (
                <>
                  <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Fotos</h2>
                  {photosLoading ? (
                    <p className={theme.textMuted}>Fotos werden geladen...</p>
                  ) : allPhotos.length === 0 ? (
                    <p className={theme.textMuted}>Keine Fotos vorhanden. Nutze das Kamera-Symbol oben.</p>
                  ) : (
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                      {allPhotos.map((photo) => (
                        <div
                          key={photo.name}
                          className={`${theme.panel} rounded-xl border ${theme.border} ${theme.cardShadow} overflow-hidden hover:ring-2 hover:ring-[#6AA9F0] transition-all relative group`}
                        >
                          <button
                            type="button"
                            onClick={(e) => deletePhoto(photo.name, e)}
                            className={`absolute top-2 right-2 p-1.5 rounded-lg ${theme.panel} border ${theme.border} opacity-0 group-hover:opacity-100 transition-opacity ${theme.danger} z-10`}
                            title="Foto löschen"
                          >
                            <Icons.X />
                          </button>
                          <button
                            type="button"
                            onClick={() => openPhotoEditor(photo)}
                            className="w-full text-left"
                          >
                            <img
                              src={photo.url}
                              alt={photo.name}
                              className="w-full h-32 object-cover"
                            />
                            <div className="p-2 space-y-1">
                              <p className={`text-xs ${theme.textMuted} truncate`}>
                                {photo.createdAt
                                  ? new Date(photo.createdAt).toLocaleDateString('de-DE')
                                  : photo.name}
                              </p>
                              <p className={`text-xs ${theme.textMuted}`}>
                                {photo.format}{photo.sizeKB ? ` · ${photo.sizeKB} KB` : ''}
                              </p>
                              {ocrProcessing[photo.name] && (
                                <p className={`text-xs ${theme.accentText}`}>OCR läuft...</p>
                              )}
                              {!ocrProcessing[photo.name] && photoOcrData[photo.name]?.status === 'completed' && (
                                <p className={`text-xs ${theme.textMuted} line-clamp-2`}>
                                  {photoOcrData[photo.name].text}
                                </p>
                              )}
                              {!ocrProcessing[photo.name] && photoOcrData[photo.name]?.status === 'error' && (
                                <p className="text-xs text-rose-400">OCR fehlgeschlagen</p>
                              )}
                              {!ocrProcessing[photo.name] && !photoOcrData[photo.name] && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); runOcrForPhoto(photo.name, photo.url); }}
                                  className={`text-xs ${theme.accentText} hover:underline`}
                                >
                                  OCR starten
                                </button>
                              )}
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeView === 'apo' && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Apo</h2>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => changeApoMonth(-1)}
                        className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                        title="Vorheriger Monat"
                      >
                        <Icons.ChevronLeft />
                      </button>
                      <span className={`text-sm font-medium ${theme.text} min-w-[140px] text-center`}>
                        {monthNames[apoMonth.month]} {apoMonth.year}
                      </span>
                      <button
                        type="button"
                        onClick={() => changeApoMonth(1)}
                        className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                        title="Nächster Monat"
                      >
                        <Icons.ChevronRight />
                      </button>
                    </div>
                  </div>


                  {apoTab === 'amk' && (
                    <div className="space-y-3">
                      {amkLoading ? (
                        <p className={theme.textMuted}>AMK-Meldungen werden geladen...</p>
                      ) : amkMessages.length === 0 ? (
                        <p className={theme.textMuted}>Keine AMK-Meldungen in diesem Monat.</p>
                      ) : (
                        amkMessages.map((msg) => (
                          <button
                            key={msg.id}
                            type="button"
                            onClick={() => setSelectedApoMessage({ ...msg, type: 'amk' })}
                            className={`w-full text-left ${theme.panel} rounded-xl border ${theme.border} p-4 hover:ring-2 hover:ring-[#6AA9F0] transition-all`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h3 className={`font-medium ${theme.text} line-clamp-2`}>{msg.title}</h3>
                              <span className={`text-xs ${theme.textMuted} whitespace-nowrap`}>
                                {msg.date ? new Date(msg.date).toLocaleDateString('de-DE') : ''}
                              </span>
                            </div>
                            <p className={`text-sm ${theme.textMuted} mt-2 line-clamp-2`}>
                              {msg.description || msg.full_text?.substring(0, 150) || ''}
                            </p>
                            {msg.category && (
                              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${theme.surface} ${theme.textMuted}`}>
                                {msg.category}
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {apoTab === 'recall' && (
                    <div className="space-y-3">
                      {recallLoading ? (
                        <p className={theme.textMuted}>Rückrufe werden geladen...</p>
                      ) : recallMessages.length === 0 ? (
                        <p className={theme.textMuted}>Keine Rückrufe in diesem Monat.</p>
                      ) : (
                        recallMessages.map((msg) => (
                          <button
                            key={msg.id}
                            type="button"
                            onClick={() => setSelectedApoMessage({ ...msg, type: 'recall' })}
                            className={`w-full text-left ${theme.panel} rounded-xl border ${theme.border} p-4 hover:ring-2 hover:ring-[#6AA9F0] transition-all`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h3 className={`font-medium ${theme.text} line-clamp-2`}>{msg.title}</h3>
                              <span className={`text-xs ${theme.textMuted} whitespace-nowrap`}>
                                {msg.date ? new Date(msg.date).toLocaleDateString('de-DE') : ''}
                              </span>
                            </div>
                            <p className={`text-sm ${theme.textMuted} mt-2 line-clamp-2`}>
                              {msg.description || msg.full_text?.substring(0, 150) || ''}
                            </p>
                            {msg.product_name && (
                              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${theme.surface} ${theme.textMuted}`}>
                                {msg.product_name}
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {apoTab === 'lav' && (
                    <div className="space-y-3">
                      {lavLoading ? (
                        <p className={theme.textMuted}>LAK-Infos werden geladen...</p>
                      ) : lavAusgaben.length === 0 ? (
                        <p className={theme.textMuted}>Keine LAK-Infos in diesem Monat.</p>
                      ) : (
                        lavAusgaben.map((ausgabe) => (
                          <button
                            key={ausgabe.id}
                            type="button"
                            onClick={() => setSelectedApoMessage({ ...ausgabe, type: 'lav' })}
                            className={`w-full text-left ${theme.panel} rounded-xl border ${theme.border} p-4 hover:ring-2 hover:ring-[#6AA9F0] transition-all`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h3 className={`font-medium ${theme.text} line-clamp-2`}>{ausgabe.subject || `LAV-Info ${ausgabe.ausgabe}`}</h3>
                              <span className={`text-xs ${theme.textMuted} whitespace-nowrap`}>
                                {ausgabe.datum ? new Date(ausgabe.datum).toLocaleDateString('de-DE') : ''}
                              </span>
                            </div>
                            <p className={`text-sm ${theme.textMuted} mt-2`}>
                              Ausgabe {ausgabe.ausgabe} - {ausgabe.lav_themes?.length || 0} Themen
                            </p>
                            {ausgabe.lav_themes && ausgabe.lav_themes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {ausgabe.lav_themes.slice(0, 3).map((t) => (
                                  <span key={t.id} className={`text-xs px-2 py-1 rounded ${theme.surface} ${theme.textMuted}`}>
                                    {t.titel?.substring(0, 30) || 'Thema'}{t.titel?.length > 30 ? '...' : ''}
                                  </span>
                                ))}
                                {ausgabe.lav_themes.length > 3 && (
                                  <span className={`text-xs px-2 py-1 rounded ${theme.surface} ${theme.textMuted}`}>
                                    +{ausgabe.lav_themes.length - 3} weitere
                                  </span>
                                )}
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}

              {activeView === 'chat' && (
                <>
                  <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Chat</h2>
                  <div className="flex flex-col h-[70vh]">
                    <div className={`flex-1 overflow-auto rounded-2xl border ${theme.border} ${theme.bg} p-4 space-y-4`}>
                      {chatLoading && (
                        <p className={theme.textMuted}>Nachrichten werden geladen...</p>
                      )}
                      {!chatLoading && chatMessages.length === 0 && (
                        <p className={theme.textMuted}>Noch keine Nachrichten. Starte den Chat.</p>
                      )}
                      {chatMessages.map((entry) => {
                        const sender = staffByAuthId[entry.user_id] || {}
                        const senderName = sender.first_name || 'Unbekannt'
                        const timeLabel = entry.created_at
                          ? new Date(entry.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                          : ''
                        const isOwn = entry.user_id === session.user.id
                        return (
                          <div
                            key={entry.id}
                            className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse text-right' : ''}`}
                          >
                            {sender.avatar_url ? (
                              <img
                                src={sender.avatar_url}
                                alt={senderName}
                                className={`h-9 w-9 rounded-full object-cover border ${theme.border}`}
                              />
                            ) : (
                              <div className={`h-9 w-9 rounded-full border ${theme.border} flex items-center justify-center text-xs ${theme.textMuted}`}>
                                {senderName?.[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                            <div className="max-w-[75%]">
                              <div className={`text-xs ${theme.textMuted} flex items-center gap-2 ${isOwn ? 'justify-end' : ''}`}>
                                <span>{senderName}</span>
                                {timeLabel && <span>{timeLabel}</span>}
                              </div>
                              <div
                                className={`inline-block mt-2 rounded-2xl px-4 py-2 border ${
                                  isOwn
                                    ? 'bg-[#4A90E2]/15 border-[#4A90E2]/30 text-[#1F2937]'
                                    : `${theme.panel} ${theme.border}`
                                }`}
                              >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.message}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    {chatError && (
                      <div className="mt-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                        <p className="text-rose-400 text-sm">{chatError}</p>
                      </div>
                    )}

                    <form onSubmit={sendChatMessage} className="mt-4 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(event) => setChatInput(event.target.value)}
                        placeholder="Nachricht schreiben..."
                        className={`flex-1 px-4 py-3 rounded-xl border ${theme.input} ${theme.inputPlaceholder}`}
                      />
                      <button
                        type="submit"
                        disabled={chatSending || !chatInput.trim()}
                        className={`px-5 py-3 rounded-xl text-sm font-semibold ${theme.accent} text-white disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {chatSending ? 'Senden...' : 'Senden'}
                      </button>
                    </form>
                  </div>
                </>
              )}

              {activeView === 'plan' && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Plan</h2>
                    <button
                      type="button"
                      onClick={() => { setPlanData(null); setPlanError(''); fetchPlanData(); }}
                      className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
                      title="Daten neu laden"
                    >
                      Aktualisieren
                    </button>
                  </div>

                  {planLoading && (
                    <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
                      <p className={theme.textMuted}>Plandaten werden geladen...</p>
                    </div>
                  )}

                  {!planLoading && planError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                      <p className="text-rose-400 text-sm">{planError}</p>
                    </div>
                  )}

                  {!planLoading && !planError && planData && (
                    <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
                      {/* Kalender-Matrix links */}
                      <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow} h-fit`}>
                        <p className={`text-xs font-medium mb-3 ${theme.textMuted}`}>Kalender</p>
                        {(() => {
                          const today = new Date()
                          const todayStr = today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

                          // Erstelle 4 Wochen Kalender (28 Tage) ab Montag der aktuellen Woche
                          const currentDay = today.getDay()
                          const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
                          const startDate = new Date(today)
                          startDate.setDate(today.getDate() + mondayOffset)

                          const weeks = []
                          for (let w = 0; w < 4; w++) {
                            const week = []
                            for (let d = 0; d < 7; d++) {
                              const date = new Date(startDate)
                              date.setDate(startDate.getDate() + w * 7 + d)
                              const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                              const dayNum = date.getDate()
                              const hasData = planData.days[dateStr]
                              const isSelected = selectedPlanDate === dateStr
                              const isTodayDate = dateStr === todayStr
                              const isWeekend = d >= 5

                              week.push({ date, dateStr, dayNum, hasData, isSelected, isTodayDate, isWeekend })
                            }
                            weeks.push(week)
                          }

                          const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

                          return (
                            <div className="space-y-1">
                              {/* Wochentags-Header */}
                              <div className="grid grid-cols-7 gap-1 mb-2">
                                {weekDays.map((day, idx) => (
                                  <div key={day} className={`text-[10px] text-center ${idx >= 5 ? theme.textMuted : theme.textSecondary}`}>
                                    {day}
                                  </div>
                                ))}
                              </div>
                              {/* Wochen */}
                              {weeks.map((week, wIdx) => (
                                <div key={wIdx} className="grid grid-cols-7 gap-1">
                                  {week.map((day) => (
                                    <button
                                      key={day.dateStr}
                                      type="button"
                                      onClick={() => day.hasData && setSelectedPlanDate(day.dateStr)}
                                      disabled={!day.hasData}
                                      className={`
                                        w-8 h-8 rounded-lg text-xs font-medium transition-colors
                                        ${day.isSelected
                                          ? 'bg-[#4A90E2] text-white'
                                          : day.isTodayDate
                                            ? `border-2 border-[#4A90E2]/50 ${day.hasData ? theme.text : theme.textMuted}`
                                            : day.hasData
                                              ? `${theme.bgHover} ${day.isWeekend ? theme.textMuted : theme.text}`
                                              : `${theme.textMuted} opacity-40 cursor-not-allowed`
                                        }
                                      `}
                                      title={day.dateStr}
                                    >
                                      {day.dayNum}
                                    </button>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )
                        })()}
                        <p className={`text-[10px] mt-3 ${theme.textMuted}`}>
                          Quelle: {planData.usedFile}
                        </p>
                      </div>

                      {/* Tagesansicht rechts - Timeline */}
                      <div className="space-y-4 min-w-0">
                        {(() => {
                          const dayData = planData.days[selectedPlanDate]
                          const today = new Date()
                          const todayStr = today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          const isToday = selectedPlanDate === todayStr

                          // Zeitachse: 6:00 - 20:00 (14 Stunden)
                          const START_HOUR = 6
                          const END_HOUR = 20
                          const TOTAL_HOURS = END_HOUR - START_HOUR
                          const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i)

                          const parseTime = (timeStr) => {
                            if (!timeStr) return null
                            const [h, m] = timeStr.split(':').map(Number)
                            return h + m / 60
                          }

                          const getBarStyle = (start, end) => {
                            // Behandle Nachtschichten
                            let displayStart = start
                            let displayEnd = end

                            // Wenn Ende 0:00 (Mitternacht) oder kleiner als Start -> bis 20:00 anzeigen
                            if (end <= start && end < START_HOUR) {
                              displayEnd = END_HOUR
                            }

                            // Wenn Start vor 6:00 -> ab 6:00 anzeigen
                            if (displayStart < START_HOUR) {
                              displayStart = START_HOUR
                            }

                            // Wenn Ende nach 20:00 -> bis 20:00 anzeigen
                            if (displayEnd > END_HOUR) {
                              displayEnd = END_HOUR
                            }

                            // Clamp to visible range
                            displayStart = Math.max(START_HOUR, Math.min(END_HOUR, displayStart))
                            displayEnd = Math.max(START_HOUR, Math.min(END_HOUR, displayEnd))

                            const left = ((displayStart - START_HOUR) / TOTAL_HOURS) * 100
                            const width = ((displayEnd - displayStart) / TOTAL_HOURS) * 100

                            return { left: `${left}%`, width: `${Math.max(0, width)}%` }
                          }

                          if (!dayData) {
                            return (
                              <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
                                <p className={theme.textMuted}>Keine Daten für {selectedPlanDate} verfügbar.</p>
                              </div>
                            )
                          }

                          return (
                            <div className={`${theme.panel} rounded-2xl p-5 border ${isToday ? 'border-[#4A90E2]/40' : theme.border} ${theme.cardShadow}`}>
                              <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-lg font-semibold">{dayData.issueDate}</h3>
                                {isToday && (
                                  <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-[#4A90E2]/15 text-[#4A90E2] border border-[#4A90E2]/20">
                                    Heute
                                  </span>
                                )}
                              </div>

                              {Object.entries(dayData.groups).map(([groupName, employees]) => (
                                <div key={groupName} className="mb-6 last:mb-0">
                                  <p className={`text-xs font-medium mb-3 ${theme.textMuted}`}>{groupName}</p>

                                  {/* Zeitachse */}
                                  <div className="relative mb-2">
                                    <div className="flex justify-between text-[10px] text-[#9CA3AF]">
                                      {hours.map((h) => (
                                        <span key={h} className="w-0 text-center" style={{ marginLeft: h === START_HOUR ? 0 : undefined }}>
                                          {h}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Mitarbeiter-Balken */}
                                  <div className="space-y-1.5">
                                    {employees.map((emp, idx) => {
                                      const startTime = parseTime(emp.workStart)
                                      const endTime = parseTime(emp.workStop)
                                      const hasWork = startTime !== null && endTime !== null && emp.workStart !== emp.workStop
                                      const isAbsent = emp.status === 'Urlaub' || emp.status === 'Krank'
                                      const isFree = !hasWork && !isAbsent

                                      // Finde Pausen aus timeblocks
                                      const breakBlock = emp.timeblocks.find((tb) => tb.type === 'break')
                                      const breakDuration = breakBlock ? breakBlock.duration : 0

                                      // Berechne Pausenposition (nach dem ersten Arbeitsblock)
                                      let breakStart = null
                                      let breakEnd = null
                                      if (breakDuration > 0 && hasWork) {
                                        let accumulated = 0
                                        for (const tb of emp.timeblocks) {
                                          if (tb.type === 'empty') {
                                            accumulated += tb.duration
                                          } else if (tb.type === 'work') {
                                            accumulated += tb.duration
                                          } else if (tb.type === 'break') {
                                            breakStart = START_HOUR + accumulated / 60
                                            breakEnd = breakStart + tb.duration / 60
                                            break
                                          }
                                        }
                                      }

                                      return (
                                        <div
                                          key={`${emp.firstName}-${emp.lastName}-${idx}`}
                                          className="relative h-7 rounded bg-[#E5E7EB]/70"
                                        >
                                          {/* Hintergrund-Raster */}
                                          <div className="absolute inset-0 flex">
                                            {hours.slice(0, -1).map((h) => (
                                              <div key={h} className="flex-1 border-r border-[#E5E7EB]" />
                                            ))}
                                          </div>

                                          {/* Arbeitsbalken */}
                                          {hasWork && !isAbsent && (
                                            <>
                                              <div
                                                className="absolute top-0.5 bottom-0.5 bg-[#4A90E2] rounded"
                                                style={getBarStyle(startTime, endTime)}
                                              />
                                              {/* Pause */}
                                              {breakStart && breakEnd && (
                                                <div
                                                  className="absolute top-0.5 bottom-0.5 bg-rose-500 rounded"
                                                  style={getBarStyle(breakStart, breakEnd)}
                                                />
                                              )}
                                              {/* Name über allem */}
                                              <div
                                                className="absolute top-0.5 bottom-0.5 flex items-center justify-center overflow-hidden pointer-events-none"
                                                style={getBarStyle(startTime, endTime)}
                                              >
                                                <span className="text-[11px] font-semibold text-[#1F2937] truncate px-2 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
                                                  {emp.firstName} {emp.lastName}
                                                </span>
                                              </div>
                                            </>
                                          )}

                                          {/* Urlaub */}
                                          {emp.status === 'Urlaub' && (
                                            <div
                                              className="absolute top-0.5 bottom-0.5 rounded flex items-center justify-center overflow-hidden"
                                              style={{ left: '0%', width: '100%', backgroundColor: '#A481A2' }}
                                            >
                                              <span className="text-[11px] font-semibold text-[#1F2937] truncate px-2 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
                                                {emp.firstName} {emp.lastName} - Urlaub
                                              </span>
                                            </div>
                                          )}

                                          {/* Krank */}
                                          {emp.status === 'Krank' && (
                                            <div
                                              className="absolute top-0.5 bottom-0.5 rounded flex items-center justify-center overflow-hidden"
                                              style={{ left: '0%', width: '100%', backgroundColor: '#FBBF24' }}
                                            >
                                              <span className="text-[11px] font-semibold text-[#1F2937] truncate px-2 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
                                                {emp.firstName} {emp.lastName} - Krank
                                              </span>
                                            </div>
                                          )}

                                          {/* Frei */}
                                          {isFree && (
                                            <div className="absolute inset-0 flex items-center px-2">
                                              <span className={`text-[11px] ${theme.textMuted} truncate`}>
                                                {emp.firstName} {emp.lastName}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              ))}

                              {/* Legende */}
                              <div className={`flex flex-wrap gap-4 mt-4 pt-4 border-t ${theme.border} text-[10px] ${theme.textMuted}`}>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-3 h-3 rounded bg-[#4A90E2]" />
                                  <span>Arbeit</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-3 h-3 rounded bg-rose-500" />
                                  <span>Pause</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#A481A2' }} />
                                  <span>Urlaub</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#FBBF24' }} />
                                  <span>Krank</span>
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )}

                  {!planLoading && !planError && !planData && (
                    <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
                      <p className={theme.textMuted}>Keine Plandaten verfügbar.</p>
                    </div>
                  )}
                </>
              )}

              {activeView === 'calendar' && (
                <>
                  {/* Header mit Kalender-Auswahl und Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Kalender</h2>

                      {calendars.length > 0 && (
                        <select
                          value={selectedCalendarId || ''}
                          onChange={(e) => setSelectedCalendarId(e.target.value)}
                          className={`px-3 py-2 rounded-lg border ${theme.input} ${theme.text} text-sm`}
                        >
                          <option value="all">Alle Kalender</option>
                          {calendars.map((cal) => (
                            <option key={cal.id} value={cal.id}>
                              {cal.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Ansicht-Wechsler */}
                      <div className={`flex rounded-lg border ${theme.border} overflow-hidden`}>
                        {['month', 'week', 'day'].map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setCalendarViewMode(mode)}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                              calendarViewMode === mode
                                ? 'bg-[#4A90E2] text-white'
                                : `${theme.panel} ${theme.textMuted} ${theme.bgHover}`
                            }`}
                          >
                            {mode === 'month' ? 'Monat' : mode === 'week' ? 'Woche' : 'Tag'}
                          </button>
                        ))}
                      </div>

                      {/* Navigation */}
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(calendarViewDate)
                          if (calendarViewMode === 'month') d.setMonth(d.getMonth() - 1)
                          else if (calendarViewMode === 'week') d.setDate(d.getDate() - 7)
                          else d.setDate(d.getDate() - 1)
                          setCalendarViewDate(d)
                        }}
                        className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                        title="Zurück"
                      >
                        <Icons.ChevronLeft />
                      </button>

                      <button
                        type="button"
                        onClick={() => setCalendarViewDate(new Date())}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                      >
                        Heute
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(calendarViewDate)
                          if (calendarViewMode === 'month') d.setMonth(d.getMonth() + 1)
                          else if (calendarViewMode === 'week') d.setDate(d.getDate() + 7)
                          else d.setDate(d.getDate() + 1)
                          setCalendarViewDate(d)
                        }}
                        className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                        title="Vor"
                      >
                        <Icons.ChevronRight />
                      </button>

                      {/* Admin-Aktionen */}
                      {currentStaff?.is_admin && (
                        <>
                          <button
                            type="button"
                            onClick={() => openCalendarModal()}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg ${theme.accent} text-white`}
                          >
                            + Kalender
                          </button>
                          {selectedCalendarId && selectedCalendarId !== 'all' && (
                            <button
                              type="button"
                              onClick={() => {
                                setPermissionsModalOpen(true)
                                fetchCalendarPermissions(selectedCalendarId)
                              }}
                              className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                              title="Berechtigungen verwalten"
                            >
                              <Icons.Settings />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Aktueller Monat/Woche Anzeige */}
                  <div className="mb-4">
                    <h3 className={`text-lg font-medium ${theme.text}`}>
                      {calendarViewDate.toLocaleDateString('de-DE', {
                        month: 'long',
                        year: 'numeric',
                        ...(calendarViewMode === 'day' && { day: 'numeric', weekday: 'long' }),
                      })}
                    </h3>
                  </div>

                  {calendarsLoading || eventsLoading ? (
                    <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
                      <p className={theme.textMuted}>{calendarsLoading ? 'Kalender werden geladen...' : 'Termine werden geladen...'}</p>
                    </div>
                  ) : calendarsError ? (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                      <p className="text-rose-400 text-sm">{calendarsError}</p>
                    </div>
                  ) : calendars.length === 0 ? (
                    <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
                      <p className={theme.textMuted}>
                        Keine Kalender verfügbar.
                        {currentStaff?.is_admin && ' Erstelle einen neuen Kalender.'}
                      </p>
                    </div>
                  ) : (
                    <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow}`}>
                      {/* Monatsansicht */}
                      {calendarViewMode === 'month' && (() => {
                        const today = new Date()
                        // Lokales Datum formatieren (ohne Zeitzonenkonvertierung)
                        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

                        const firstDay = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth(), 1)
                        const startOffset = (firstDay.getDay() + 6) % 7
                        const startDate = new Date(firstDay)
                        startDate.setDate(startDate.getDate() - startOffset)

                        const weeks = []
                        const currentDate = new Date(startDate)

                        for (let w = 0; w < 6; w++) {
                          const week = []
                          for (let d = 0; d < 7; d++) {
                            const dayDate = new Date(currentDate)
                            // Lokales Datum formatieren (ohne Zeitzonenkonvertierung)
                            const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`
                            const isCurrentMonth = dayDate.getMonth() === calendarViewDate.getMonth()
                            const isToday = dateStr === todayStr

                            const dayEvents = calendarEvents.filter((e) => {
                              // Datum direkt aus String extrahieren (vermeidet Zeitzonenprobleme)
                              const eventDate = e.start_time.substring(0, 10)
                              return eventDate === dateStr
                            })

                            week.push({ date: dayDate, dateStr, isCurrentMonth, isToday, events: dayEvents })
                            currentDate.setDate(currentDate.getDate() + 1)
                          }
                          weeks.push(week)
                        }

                        const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

                        return (
                          <div className="space-y-1">
                            <div className="grid grid-cols-7 gap-1 mb-2">
                              {weekDays.map((day, idx) => (
                                <div
                                  key={day}
                                  className={`text-xs font-medium text-center py-2 ${idx >= 5 ? theme.textMuted : theme.textSecondary}`}
                                >
                                  {day}
                                </div>
                              ))}
                            </div>

                            {weeks.map((week, wIdx) => (
                              <div key={wIdx} className="grid grid-cols-7 gap-1">
                                {week.map((day) => (
                                  <div
                                    key={day.dateStr}
                                    onClick={() => canWriteCurrentCalendar() && openEventModal(null, day.date)}
                                    className={`
                                      min-h-24 p-1 rounded-lg border transition-colors
                                      ${day.isCurrentMonth ? theme.panel : `${theme.panel} opacity-40`}
                                      ${day.isToday ? 'border-[#4A90E2]/50' : theme.border}
                                      ${canWriteCurrentCalendar() ? 'cursor-pointer ' + theme.bgHover : ''}
                                    `}
                                  >
                                    <div
                                      className={`text-xs font-medium mb-1 ${
                                        day.isToday ? theme.accentText : day.isCurrentMonth ? theme.text : theme.textMuted
                                      }`}
                                    >
                                      {day.date.getDate()}
                                    </div>

                                    <div className="space-y-0.5">
                                      {day.events.slice(0, 3).map((event) => (
                                        <div
                                          key={event.id}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            openEventModal(event)
                                          }}
                                          className="text-[10px] px-1.5 py-0.5 rounded truncate text-white cursor-pointer hover:opacity-80"
                                          style={{ backgroundColor: getEventColor(event) }}
                                          title={event.title}
                                        >
                                          {!event.all_day && (
                                            <span className="opacity-75 mr-1">
                                              {new Date(event.start_time).toLocaleTimeString('de-DE', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              })}
                                            </span>
                                          )}
                                          {event.title}
                                        </div>
                                      ))}
                                      {day.events.length > 3 && (
                                        <div className={`text-[10px] ${theme.textMuted}`}>+{day.events.length - 3} weitere</div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )
                      })()}

                      {/* Wochenansicht */}
                      {calendarViewMode === 'week' && (() => {
                        const today = new Date()
                        // Lokales Datum formatieren (ohne Zeitzonenkonvertierung)
                        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

                        const startOfWeek = new Date(calendarViewDate)
                        startOfWeek.setDate(calendarViewDate.getDate() - ((calendarViewDate.getDay() + 6) % 7))

                        const days = []
                        for (let i = 0; i < 7; i++) {
                          const d = new Date(startOfWeek)
                          d.setDate(startOfWeek.getDate() + i)
                          // Lokales Datum formatieren (ohne Zeitzonenkonvertierung)
                          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                          const dayEvents = calendarEvents.filter((e) => e.start_time.substring(0, 10) === dateStr)
                          days.push({ date: d, dateStr, isToday: dateStr === todayStr, events: dayEvents })
                        }

                        const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

                        return (
                          <div className="grid grid-cols-7 gap-2">
                            {days.map((day, idx) => (
                              <div
                                key={day.dateStr}
                                className={`min-h-48 p-2 rounded-lg border ${day.isToday ? 'border-[#4A90E2]/50' : theme.border} ${theme.panel}`}
                              >
                                <div className={`text-xs font-medium mb-2 ${day.isToday ? theme.accentText : theme.textSecondary}`}>
                                  {weekDays[idx]} {day.date.getDate()}
                                </div>
                                <div className="space-y-1">
                                  {day.events.map((event) => (
                                    <div
                                      key={event.id}
                                      onClick={() => openEventModal(event)}
                                      className="text-[10px] px-1.5 py-1 rounded text-white cursor-pointer hover:opacity-80"
                                      style={{ backgroundColor: getEventColor(event) }}
                                    >
                                      {!event.all_day && (
                                        <div className="opacity-75">
                                          {new Date(event.start_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      )}
                                      <div className="truncate">{event.title}</div>
                                    </div>
                                  ))}
                                </div>
                                {canWriteCurrentCalendar() && (
                                  <button
                                    type="button"
                                    onClick={() => openEventModal(null, day.date)}
                                    className={`mt-2 w-full text-[10px] py-1 rounded ${theme.bgHover} ${theme.textMuted}`}
                                  >
                                    + Termin
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      })()}

                      {/* Tagesansicht */}
                      {calendarViewMode === 'day' && (() => {
                        // Lokales Datum formatieren (ohne Zeitzonenkonvertierung)
                        const dateStr = `${calendarViewDate.getFullYear()}-${String(calendarViewDate.getMonth() + 1).padStart(2, '0')}-${String(calendarViewDate.getDate()).padStart(2, '0')}`
                        const dayEvents = calendarEvents.filter((e) => e.start_time.substring(0, 10) === dateStr)

                        return (
                          <div className="space-y-2">
                            {dayEvents.length === 0 ? (
                              <p className={theme.textMuted}>Keine Termine an diesem Tag.</p>
                            ) : (
                              dayEvents.map((event) => (
                                <div
                                  key={event.id}
                                  onClick={() => openEventModal(event)}
                                  className={`p-3 rounded-xl border ${theme.border} cursor-pointer ${theme.bgHover}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-1 h-12 rounded" style={{ backgroundColor: getEventColor(event) }} />
                                    <div>
                                      <p className={`font-medium ${theme.text}`}>{event.title}</p>
                                      <p className={`text-xs ${theme.textMuted}`}>
                                        {event.all_day
                                          ? 'Ganztägig'
                                          : `${new Date(event.start_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.end_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`}
                                      </p>
                                      {event.location && <p className={`text-xs ${theme.textMuted}`}>{event.location}</p>}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                            {canWriteCurrentCalendar() && (
                              <button
                                type="button"
                                onClick={() => openEventModal(null, calendarViewDate)}
                                className={`w-full py-2 rounded-xl border ${theme.border} ${theme.bgHover} ${theme.textMuted} text-sm`}
                              >
                                + Neuer Termin
                              </button>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* Floating Add Button */}
                  {canWriteCurrentCalendar() && calendars.length > 0 && (
                    <button
                      type="button"
                      onClick={() => openEventModal()}
                      className={`fixed bottom-6 right-6 p-4 rounded-full ${theme.accent} text-white shadow-lg hover:scale-105 transition-transform z-30`}
                      title="Neuer Termin"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  )}
                </>
              )}

              {activeView === 'stats' && (
                <>
                  <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Statistiken</h2>
                  <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
                    <p className={theme.textMuted}>
                      Hier entstehen bald deine Live-Auswertungen.
                    </p>
                  </div>
                </>
              )}

              {activeView === 'settings' && (
                <>
                  <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Einstellungen</h2>

                  <div className="space-y-4">
                    {settingsTab === 'pharmacies' && (
                      <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-base font-semibold">Apothekendaten</h3>
                            <p className={`text-xs ${theme.textMuted}`}>Maximal 4 Einträge.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={fetchPharmacies}
                              className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
                              title="Liste aktualisieren"
                            >
                              Aktualisieren
                            </button>
                            <button
                              type="button"
                              onClick={openCreateModal}
                              disabled={pharmacies.length >= 4}
                              className={`h-8 w-8 rounded-full flex items-center justify-center border ${theme.border} ${theme.bgHover} ${theme.text} disabled:opacity-40 disabled:cursor-not-allowed`}
                              title="Apotheke hinzufügen"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {pharmaciesMessage && (
                          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-3">
                            <p className="text-rose-400 text-sm">{pharmaciesMessage}</p>
                          </div>
                        )}

                        {pharmaciesLoading && (
                          <p className={theme.textMuted}>Lade Daten...</p>
                        )}

                        {!pharmaciesLoading && pharmacies.length === 0 && (
                          <p className={theme.textMuted}>
                            Noch keine Apotheke gespeichert. Nutze das + oben rechts.
                          </p>
                        )}

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {pharmacies.map((pharmacy) => (
                            <button
                              type="button"
                              key={pharmacy.id}
                              className={`rounded-xl border ${theme.border} p-4 ${theme.bgHover} text-left`}
                              title="Apotheke bearbeiten"
                              onClick={() => openEditModal(pharmacy)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-sm">{pharmacy.name}</p>
                                  <p className={`text-xs ${theme.textMuted}`}>
                                    {[pharmacy.street, [pharmacy.postal_code, pharmacy.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 grid gap-1.5 text-xs">
                                  <p className={theme.textMuted}>
                                    Telefon: <span className={theme.text}>{pharmacy.phone || '-'}</span>
                                  </p>
                                  <p className={theme.textMuted}>
                                    {pharmacy.owner_role === 'manager' ? 'Filialleiter' : 'Inhaber'}:{' '}
                                    <span className={theme.text}>{pharmacy.owner || '-'}</span>
                                  </p>
                                  <p className={theme.textMuted}>
                                    Webseite: <span className={theme.text}>{pharmacy.website || '-'}</span>
                                  </p>
                                  <p className={theme.textMuted}>
                                    E-Mail: <span className={theme.text}>{pharmacy.email || '-'}</span>
                                  </p>
                                  <p className={theme.textMuted}>
                                    Fax: <span className={theme.text}>{pharmacy.fax || '-'}</span>
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    {settingsTab === 'staff' && (
                      <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="text-base font-semibold">Kollegium</h3>
                              <p className={`text-xs ${theme.textMuted}`}>Global über alle Apotheken.</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={fetchStaff}
                                className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
                                title="Liste aktualisieren"
                              >
                                Aktualisieren
                              </button>
                              <button
                                type="button"
                                onClick={() => openStaffModal()}
                                disabled={pharmacies.length === 0}
                                className={`h-8 w-8 rounded-full flex items-center justify-center border ${theme.border} ${theme.bgHover} ${theme.text} disabled:opacity-40 disabled:cursor-not-allowed`}
                                title="Person hinzufügen"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {staffMessage && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-3">
                              <p className="text-rose-400 text-sm">{staffMessage}</p>
                            </div>
                          )}

                          {staffLoading && (
                            <p className={theme.textMuted}>Lade Daten...</p>
                          )}

                          {!staffLoading && pharmacies.length === 0 && (
                            <p className={theme.textMuted}>
                              Bitte zuerst eine Apotheke anlegen, um Kollegium zuzuordnen.
                            </p>
                          )}

                          {!staffLoading && pharmacies.length > 0 && staff.length === 0 && (
                            <p className={theme.textMuted}>
                              Noch keine Personen erfasst. Nutze das + oben rechts.
                            </p>
                          )}

                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {staff.map((member) => (
                              <button
                                type="button"
                                key={member.id}
                                className={`rounded-xl border ${theme.border} p-4 ${theme.bgHover} text-left`}
                                title="Person bearbeiten"
                                onClick={() => openStaffModal(member)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      {member.avatar_url ? (
                                        <img
                                          src={member.avatar_url}
                                          alt={`${member.first_name} ${member.last_name}`}
                                          className={`h-8 w-8 rounded-full object-cover border ${theme.border}`}
                                        />
                                      ) : (
                                        <div className={`h-8 w-8 rounded-full border ${theme.border} flex items-center justify-center text-[10px] ${theme.textMuted}`}>
                                          {(member.first_name?.[0] || '') + (member.last_name?.[0] || '')}
                                        </div>
                                      )}
                                      <div>
                                        <p className="font-medium text-sm">
                                          {member.first_name} {member.last_name}
                                        </p>
                                        <p className={`text-xs ${theme.textMuted}`}>
                                          {member.role || '-'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  {member.is_admin && (
                                    <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${theme.border} ${theme.textMuted}`}>
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <div className="mt-3 grid gap-1.5 text-xs">
                                  <p className={theme.textMuted}>
                                    Apotheke: <span className={theme.text}>{pharmacyLookup[member.pharmacy_id] || '-'}</span>
                                  </p>
                                  <p className={theme.textMuted}>
                                    Adresse: <span className={theme.text}>
                                      {[member.street, [member.postal_code, member.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '-'}
                                    </span>
                                  </p>
                                  <p className={theme.textMuted}>
                                    Mobil: <span className={theme.text}>{member.mobile || '-'}</span>
                                  </p>
                                  <p className={theme.textMuted}>
                                    E-Mail: <span className={theme.text}>{member.email || '-'}</span>
                                  </p>
                                  {member.auth_user_id && (
                                    <p className={theme.textMuted}>
                                      Login verknüpft
                                    </p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                    )}

                    {settingsTab === 'contacts' && (
                      <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-base font-semibold">Kontakte</h3>
                            <p className={`text-xs ${theme.textMuted}`}>Business-Kontakte und Visitenkarten.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={fetchContacts}
                              className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
                              title="Liste aktualisieren"
                            >
                              Aktualisieren
                            </button>
                            <button
                              type="button"
                              onClick={() => openContactModal()}
                              disabled={!currentStaff}
                              className={`h-8 w-8 rounded-full flex items-center justify-center border ${theme.border} ${theme.bgHover} ${theme.text} disabled:opacity-40 disabled:cursor-not-allowed`}
                              title="Kontakt hinzufügen"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Suchfeld und Ansicht-Umschalter */}
                        <div className="mb-4 flex flex-col sm:flex-row gap-3">
                          <div className="relative flex-1">
                            <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                              type="text"
                              value={contactSearch}
                              onChange={(e) => setContactSearch(e.target.value)}
                              placeholder="Suchen nach Name, Firma, Adresse, E-Mail..."
                              className={`w-full pl-10 pr-10 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                            />
                            {contactSearch && (
                              <button
                                type="button"
                                onClick={() => setContactSearch('')}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:${theme.text}`}
                                title="Suche löschen"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          {/* Ansicht-Umschalter */}
                          <div className={`flex rounded-xl border ${theme.border} overflow-hidden`}>
                            <button
                              type="button"
                              onClick={() => setContactViewMode('cards')}
                              className={`px-3 py-2 ${contactViewMode === 'cards' ? theme.accent + ' text-white' : theme.bgHover + ' ' + theme.textMuted}`}
                              title="Kartenansicht"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setContactViewMode('list')}
                              className={`px-3 py-2 ${contactViewMode === 'list' ? theme.accent + ' text-white' : theme.bgHover + ' ' + theme.textMuted}`}
                              title="Listenansicht"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {contactSearch && (
                          <p className={`text-xs ${theme.textMuted} mb-3`}>
                            {filteredContacts.length} von {contacts.length} Kontakten
                          </p>
                        )}

                        {contactsMessage && (
                          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-3">
                            <p className="text-rose-400 text-sm">{contactsMessage}</p>
                          </div>
                        )}

                        {contactsLoading && (
                          <p className={theme.textMuted}>Lade Daten...</p>
                        )}

                        {!contactsLoading && !currentStaff && (
                          <p className={theme.textMuted}>
                            Bitte zuerst ein Mitarbeiter-Profil anlegen.
                          </p>
                        )}

                        {!contactsLoading && currentStaff && contacts.length === 0 && (
                          <p className={theme.textMuted}>
                            Noch keine Kontakte erfasst. Nutze das + oben rechts.
                          </p>
                        )}

                        {!contactsLoading && currentStaff && contacts.length > 0 && filteredContacts.length === 0 && (
                          <p className={theme.textMuted}>
                            Keine Kontakte gefunden für "{contactSearch}".
                          </p>
                        )}

                        {/* Kartenansicht */}
                        {contactViewMode === 'cards' && (
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {filteredContacts.map((contact) => (
                              <button
                                type="button"
                                key={contact.id}
                                className={`rounded-xl border ${theme.border} p-4 ${theme.bgHover} text-left ${contact.staff_id ? 'border-l-4 border-l-[#4A90E2]' : ''}`}
                                title={contact.staff_id ? 'Mitarbeiter - wird über Kollegium gepflegt' : 'Kontakt anzeigen'}
                                onClick={() => setSelectedContact(contact)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    {contact.business_card_url ? (
                                      <img
                                        src={contact.business_card_url}
                                        alt="Visitenkarte"
                                        className={`h-10 w-14 rounded object-cover border ${theme.border}`}
                                      />
                                    ) : (
                                      <div className={`h-10 w-14 rounded border ${theme.border} flex items-center justify-center text-[10px] ${theme.textMuted}`}>
                                        {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || contact.company?.[0] || '')}
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium text-sm">
                                        {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.company || '-'}
                                      </p>
                                      {contact.company && (contact.first_name || contact.last_name) && (
                                        <p className={`text-xs ${theme.textMuted}`}>{contact.company}</p>
                                      )}
                                      {contact.position && (
                                        <p className={`text-xs ${theme.textMuted}`}>{contact.position}</p>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${theme.border} ${theme.textMuted}`}>
                                    {contactTypeLabels[contact.contact_type] || contact.contact_type}
                                  </span>
                                </div>
                                <div className="mt-3 grid gap-1.5 text-xs">
                                  <p className={theme.textMuted}>
                                    Adresse: <span className={theme.text}>
                                      {[contact.street, [contact.postal_code, contact.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '-'}
                                    </span>
                                  </p>
                                  {contact.phone && (
                                    <p className={theme.textMuted}>
                                      Tel: <span className={theme.text}>{contact.phone}</span>
                                    </p>
                                  )}
                                  {contact.mobile && (
                                    <p className={theme.textMuted}>
                                      Mobil: <span className={theme.text}>{contact.mobile}</span>
                                    </p>
                                  )}
                                  {contact.email && (
                                    <p className={theme.textMuted}>
                                      E-Mail: <span className={theme.text}>{contact.email}</span>
                                    </p>
                                  )}
                                  {!contact.shared && (
                                    <p className={`${theme.textMuted} italic`}>Privat</p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Listenansicht */}
                        {contactViewMode === 'list' && (
                          <div className={`rounded-xl border ${theme.border} overflow-hidden`}>
                            <table className="w-full text-sm">
                              <thead className={`${theme.bg} border-b ${theme.border}`}>
                                <tr>
                                  <th className={`text-left px-4 py-3 font-medium ${theme.textSecondary}`}>Name</th>
                                  <th className={`text-left px-4 py-3 font-medium ${theme.textSecondary} hidden sm:table-cell`}>Firma</th>
                                  <th className={`text-left px-4 py-3 font-medium ${theme.textSecondary} hidden md:table-cell`}>Adresse</th>
                                  <th className={`text-left px-4 py-3 font-medium ${theme.textSecondary} hidden lg:table-cell`}>Kontakt</th>
                                  <th className={`text-left px-4 py-3 font-medium ${theme.textSecondary} w-24`}>Typ</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredContacts.map((contact) => (
                                  <tr
                                    key={contact.id}
                                    className={`border-b ${theme.border} ${theme.bgHover} cursor-pointer ${contact.staff_id ? 'border-l-4 border-l-[#4A90E2]' : ''}`}
                                    title={contact.staff_id ? 'Mitarbeiter - wird über Kollegium gepflegt' : 'Kontakt anzeigen'}
                                    onClick={() => setSelectedContact(contact)}
                                  >
                                    <td className={`px-4 py-3 ${theme.text}`}>
                                      <div className="flex items-center gap-2">
                                        <div className={`h-8 w-8 rounded-full border ${theme.border} flex items-center justify-center text-[10px] ${theme.textMuted} flex-shrink-0`}>
                                          {(contact.first_name?.[0] || '') + (contact.last_name?.[0] || contact.company?.[0] || '')}
                                        </div>
                                        <div>
                                          <p className="font-medium">
                                            {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '-'}
                                          </p>
                                          {contact.position && (
                                            <p className={`text-xs ${theme.textMuted}`}>{contact.position}</p>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className={`px-4 py-3 ${theme.textMuted} hidden sm:table-cell`}>
                                      {contact.company || '-'}
                                    </td>
                                    <td className={`px-4 py-3 ${theme.textMuted} hidden md:table-cell`}>
                                      {[contact.street, [contact.postal_code, contact.city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || '-'}
                                    </td>
                                    <td className={`px-4 py-3 hidden lg:table-cell`}>
                                      <div className={`text-xs ${theme.textMuted}`}>
                                        {contact.email && <p>{contact.email}</p>}
                                        {contact.phone && <p>{contact.phone}</p>}
                                        {contact.mobile && <p>{contact.mobile}</p>}
                                        {!contact.email && !contact.phone && !contact.mobile && '-'}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${theme.border} ${theme.textMuted}`}>
                                        {contactTypeLabels[contact.contact_type] || contact.contact_type}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>

        {editingPharmacy && (
          <div
            className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
            onClick={closeEditModal}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-xl`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border}`}>
                <div>
                  <h3 className="text-base font-semibold">
                    {editingPharmacy.id ? 'Apotheke bearbeiten' : 'Apotheke hinzufügen'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {editingPharmacy.id ? 'Aenderungen werden sofort gespeichert.' : 'Neue Apotheke anlegen.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                  title="Popup schließen"
                >
                  <Icons.X />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Name
                    </label>
                    <input
                      value={editForm.name}
                      onChange={(e) => handleEditInput('name', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Strasse
                    </label>
                    <input
                      value={editForm.street}
                      onChange={(e) => handleEditInput('street', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      PLZ
                    </label>
                    <input
                      value={editForm.postalCode}
                      onChange={(e) => handleEditInput('postalCode', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Ort
                    </label>
                    <input
                      value={editForm.city}
                      onChange={(e) => handleEditInput('city', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Telefonnummer
                    </label>
                    <input
                      value={editForm.phone}
                      onChange={(e) => handleEditInput('phone', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Inhaber / Filialleiter
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select
                        value={editForm.ownerRole}
                        onChange={(e) => handleEditInput('ownerRole', e.target.value)}
                        className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                        required
                      >
                        <option value="">Bitte wählen</option>
                        <option value="owner">Inhaber</option>
                        <option value="manager">Filialleiter</option>
                      </select>
                      <input
                        value={editForm.owner}
                        onChange={(e) => handleEditInput('owner', e.target.value)}
                        className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Webseite
                    </label>
                    <input
                      value={editForm.website}
                      onChange={(e) => handleEditInput('website', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      E-Mail
                    </label>
                    <input
                      value={editForm.email}
                      onChange={(e) => handleEditInput('email', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                      type="email"
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Fax
                    </label>
                    <input
                      value={editForm.fax}
                      onChange={(e) => handleEditInput('fax', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                </div>

                {editMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                    <p className="text-rose-400 text-sm">{editMessage}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border ${theme.border} ${theme.bgHover}`}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.accent} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {editLoading ? 'Speichert...' : 'Speichern'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editingStaff && (
          <div
            className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
            onClick={closeStaffModal}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-xl`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border}`}>
                <div>
                  <h3 className="text-base font-semibold">
                    {editingStaff.id ? 'Kollegium bearbeiten' : 'Kollegium hinzufügen'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {editingStaff.id ? 'Aenderungen werden sofort gespeichert.' : 'Neue Person anlegen.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeStaffModal}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                  title="Popup schließen"
                >
                  <Icons.X />
                </button>
              </div>

              <form onSubmit={handleStaffSubmit} className="p-5 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Vorname
                    </label>
                    <input
                      value={staffForm.firstName}
                      onChange={(e) => handleStaffInput('firstName', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Nachname
                    </label>
                    <input
                      value={staffForm.lastName}
                      onChange={(e) => handleStaffInput('lastName', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Strasse
                    </label>
                    <input
                      value={staffForm.street}
                      onChange={(e) => handleStaffInput('street', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      PLZ
                    </label>
                    <input
                      value={staffForm.postalCode}
                      onChange={(e) => handleStaffInput('postalCode', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Ort
                    </label>
                    <input
                      value={staffForm.city}
                      onChange={(e) => handleStaffInput('city', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Mobil
                    </label>
                    <input
                      value={staffForm.mobile}
                      onChange={(e) => handleStaffInput('mobile', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      E-Mail
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={staffForm.email}
                        onChange={(e) => handleStaffInput('email', e.target.value)}
                        className={`flex-1 px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                        type="email"
                      />
                      {currentStaff?.is_admin && !staffForm.authUserId && (
                        <button
                          type="button"
                          onClick={handleSendInvite}
                          disabled={staffInviteLoading || !staffForm.email.trim()}
                          className={`px-3 py-2 rounded-xl text-xs font-medium ${theme.accent} text-white disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap`}
                          title="Einladung senden"
                        >
                          {staffInviteLoading ? 'Sende...' : 'Einladen'}
                        </button>
                      )}
                    </div>
                    {staffInviteMessage && (
                      <p className={`text-xs mt-1 ${staffInviteMessage.includes('gesendet') ? 'text-emerald-600' : 'text-rose-400'}`}>
                        {staffInviteMessage}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Beruf
                    </label>
                    <select
                      value={staffForm.role}
                      onChange={(e) => handleStaffInput('role', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                      required
                    >
                      <option value="">Bitte wählen</option>
                      <option value="ApothekerIn">ApothekerIn</option>
                      <option value="PTA">PTA</option>
                      <option value="PKA">PKA</option>
                      <option value="Sonst.">Sonst.</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Apotheke
                    </label>
                    <select
                      value={staffForm.pharmacyId}
                      onChange={(e) => handleStaffInput('pharmacyId', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                      required
                    >
                      <option value="">Bitte wählen</option>
                      {pharmacies.map((pharmacy) => (
                        <option key={pharmacy.id} value={pharmacy.id}>
                          {pharmacy.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Avatar
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStaffAvatarChange}
                      className={`w-full text-xs ${theme.textMuted}`}
                    />
                  </div>
                  <div className="flex items-end gap-3">
                    {staffAvatarPreview ? (
                      <img
                        src={staffAvatarPreview}
                        alt="Avatar Vorschau"
                        className={`h-12 w-12 rounded-full object-cover border ${theme.border}`}
                      />
                    ) : (
                      <div className={`h-12 w-12 rounded-full border ${theme.border} flex items-center justify-center text-xs ${theme.textMuted}`}>
                        --
                      </div>
                    )}
                    {staffForm.avatarUrl && !staffAvatarFile && (
                      <span className={`text-xs ${theme.textMuted}`}>Aktuell gesetzt</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={linkCurrentUser}
                    className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
                    title="Mit aktuellem Login verknüpfen"
                    disabled={!session?.user?.id}
                  >
                    {staffForm.authUserId ? 'Login verknüpft' : 'Mit aktuellem Login verknüpfen'}
                  </button>
                  <label className={`flex items-center gap-2 text-xs ${theme.textMuted}`}>
                    <input
                      type="checkbox"
                      checked={staffForm.isAdmin}
                      onChange={(e) => handleStaffInput('isAdmin', e.target.checked)}
                      className="accent-[#4A90E2]"
                    />
                    Admin
                  </label>
                </div>

                {staffSaveMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                    <p className="text-rose-400 text-sm">{staffSaveMessage}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={closeStaffModal}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border ${theme.border} ${theme.bgHover}`}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={staffSaveLoading}
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.accent} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {staffSaveLoading ? 'Speichert...' : 'Speichern'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Kontakt Detail-Ansicht */}
        {selectedContact && (
          <div
            className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
            onClick={() => setSelectedContact(null)}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-4xl max-h-[90vh] overflow-y-auto`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border}`}>
                <div>
                  <h3 className="text-base font-semibold">
                    {[selectedContact.first_name, selectedContact.last_name].filter(Boolean).join(' ') || selectedContact.company || 'Kontakt'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {selectedContact.company && (selectedContact.first_name || selectedContact.last_name) ? selectedContact.company : ''}
                    {selectedContact.position ? (selectedContact.company ? ' · ' : '') + selectedContact.position : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!selectedContact.staff_id && (
                    <button
                      type="button"
                      onClick={() => {
                        openContactModal(selectedContact)
                        setSelectedContact(null)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${theme.border} ${theme.bgHover}`}
                      title="Kontakt bearbeiten"
                    >
                      Bearbeiten
                    </button>
                  )}
                  {selectedContact.staff_id && (
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsTab('staff')
                        setSelectedContact(null)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${theme.border} ${theme.bgHover}`}
                      title="Im Kollegium bearbeiten"
                    >
                      Im Kollegium bearbeiten
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedContact(null)}
                    className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                    title="Schließen"
                  >
                    <Icons.X />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Visitenkarte / Bild */}
                  <div>
                    <h4 className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Visitenkarte</h4>
                    {selectedContact.business_card_url ? (
                      <a
                        href={selectedContact.business_card_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        {selectedContact.business_card_url.toLowerCase().endsWith('.pdf') ? (
                          <div className={`rounded-xl border ${theme.border} overflow-hidden`}>
                            <iframe
                              src={selectedContact.business_card_url}
                              className="w-full h-80"
                              title="Visitenkarte PDF"
                            />
                            <p className={`text-xs ${theme.textMuted} text-center py-2 border-t ${theme.border}`}>
                              Klicken zum Öffnen in neuem Tab
                            </p>
                          </div>
                        ) : (
                          <img
                            src={selectedContact.business_card_url}
                            alt="Visitenkarte"
                            className={`w-full rounded-xl border ${theme.border} object-contain max-h-80`}
                          />
                        )}
                      </a>
                    ) : (
                      <div className={`h-40 rounded-xl border-2 border-dashed ${theme.border} flex items-center justify-center ${theme.textMuted}`}>
                        Keine Visitenkarte hinterlegt
                      </div>
                    )}
                  </div>

                  {/* Kontaktdaten */}
                  <div className="space-y-4">
                    <div>
                      <h4 className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Kontaktdaten</h4>
                      <div className={`rounded-xl border ${theme.border} divide-y ${theme.border}`}>
                        {selectedContact.email && (
                          <a href={`mailto:${selectedContact.email}`} className={`flex items-center gap-3 px-4 py-3 ${theme.bgHover}`}>
                            <svg className={`w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className={`text-sm ${theme.text}`}>{selectedContact.email}</span>
                          </a>
                        )}
                        {selectedContact.phone && (
                          <a href={`tel:${selectedContact.phone}`} className={`flex items-center gap-3 px-4 py-3 ${theme.bgHover}`}>
                            <svg className={`w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className={`text-sm ${theme.text}`}>{selectedContact.phone}</span>
                          </a>
                        )}
                        {selectedContact.mobile && (
                          <a href={`tel:${selectedContact.mobile}`} className={`flex items-center gap-3 px-4 py-3 ${theme.bgHover}`}>
                            <svg className={`w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className={`text-sm ${theme.text}`}>{selectedContact.mobile}</span>
                          </a>
                        )}
                        {selectedContact.website && (
                          <a href={selectedContact.website.startsWith('http') ? selectedContact.website : `https://${selectedContact.website}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 px-4 py-3 ${theme.bgHover}`}>
                            <svg className={`w-4 h-4 ${theme.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            <span className={`text-sm ${theme.text}`}>{selectedContact.website}</span>
                          </a>
                        )}
                        {!selectedContact.email && !selectedContact.phone && !selectedContact.mobile && !selectedContact.website && (
                          <p className={`px-4 py-3 text-sm ${theme.textMuted}`}>Keine Kontaktdaten</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Adresse</h4>
                      <div className={`rounded-xl border ${theme.border} px-4 py-3`}>
                        {selectedContact.street || selectedContact.postal_code || selectedContact.city ? (
                          <div className={`text-sm ${theme.text}`}>
                            {selectedContact.street && <p>{selectedContact.street}</p>}
                            {(selectedContact.postal_code || selectedContact.city) && (
                              <p>{[selectedContact.postal_code, selectedContact.city].filter(Boolean).join(' ')}</p>
                            )}
                            {selectedContact.country && selectedContact.country !== 'DE' && (
                              <p>{selectedContact.country}</p>
                            )}
                          </div>
                        ) : (
                          <p className={`text-sm ${theme.textMuted}`}>Keine Adresse</p>
                        )}
                      </div>
                    </div>

                    {selectedContact.notes && (
                      <div>
                        <h4 className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Notizen</h4>
                        <div className={`rounded-xl border ${theme.border} px-4 py-3`}>
                          <p className={`text-sm ${theme.text} whitespace-pre-wrap`}>{selectedContact.notes}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${theme.border} ${theme.textMuted}`}>
                        {contactTypeLabels[selectedContact.contact_type] || selectedContact.contact_type}
                      </span>
                      {!selectedContact.shared && (
                        <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${theme.border} ${theme.textMuted}`}>
                          Privat
                        </span>
                      )}
                      {selectedContact.staff_id && (
                        <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-[#4A90E2]/10 text-[#4A90E2] border border-[#4A90E2]/20`}>
                          Mitarbeiter
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {editingContact && (
          <div
            className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
            onClick={closeContactModal}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border}`}>
                <div>
                  <h3 className="text-base font-semibold">
                    {editingContact.id ? 'Kontakt bearbeiten' : 'Kontakt hinzufügen'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {editingContact.id ? 'Änderungen werden sofort gespeichert.' : 'Neuen Kontakt anlegen.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {editingContact.id && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteContact(editingContact.id)
                        closeContactModal()
                      }}
                      className={`p-2 rounded-lg ${theme.danger}`}
                      title="Kontakt löschen"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeContactModal}
                    className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                    title="Popup schließen"
                  >
                    <Icons.X />
                  </button>
                </div>
              </div>

              <form onSubmit={handleContactSubmit} className="p-5 space-y-4">
                {/* Visitenkarte Upload */}
                <div>
                  <label className={`block text-xs font-medium mb-2 ${theme.textSecondary}`}>
                    Visitenkarte
                  </label>
                  <div className="flex items-center gap-4">
                    {contactCardPreview ? (
                      <img
                        src={contactCardPreview}
                        alt="Visitenkarte Vorschau"
                        className={`h-20 w-32 rounded-lg object-cover border ${theme.border}`}
                      />
                    ) : (
                      <div className={`h-20 w-32 rounded-lg border-2 border-dashed ${theme.border} flex items-center justify-center ${theme.textMuted}`}>
                        <Icons.Photo />
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={contactCardInputRef}
                        onChange={handleContactCardChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => contactCardInputRef.current?.click()}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${theme.border} ${theme.bgHover}`}
                      >
                        {contactCardPreview ? 'Ändern' : 'Hochladen'}
                      </button>
                      {contactCardPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setContactCardFile(null)
                            setContactCardPreview('')
                            handleContactInput('businessCardUrl', '')
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${theme.danger}`}
                        >
                          Entfernen
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Vorname
                    </label>
                    <input
                      value={contactForm.firstName}
                      onChange={(e) => handleContactInput('firstName', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Nachname
                    </label>
                    <input
                      value={contactForm.lastName}
                      onChange={(e) => handleContactInput('lastName', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Firma
                    </label>
                    <input
                      value={contactForm.company}
                      onChange={(e) => handleContactInput('company', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Position
                    </label>
                    <input
                      value={contactForm.position}
                      onChange={(e) => handleContactInput('position', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => handleContactInput('email', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Webseite
                    </label>
                    <input
                      value={contactForm.website}
                      onChange={(e) => handleContactInput('website', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Telefon
                    </label>
                    <input
                      value={contactForm.phone}
                      onChange={(e) => handleContactInput('phone', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Mobil
                    </label>
                    <input
                      value={contactForm.mobile}
                      onChange={(e) => handleContactInput('mobile', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Straße
                    </label>
                    <input
                      value={contactForm.street}
                      onChange={(e) => handleContactInput('street', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      PLZ
                    </label>
                    <input
                      value={contactForm.postalCode}
                      onChange={(e) => handleContactInput('postalCode', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Ort
                    </label>
                    <input
                      value={contactForm.city}
                      onChange={(e) => handleContactInput('city', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Land
                    </label>
                    <input
                      value={contactForm.country}
                      onChange={(e) => handleContactInput('country', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Kategorie
                    </label>
                    <select
                      value={contactForm.contactType}
                      onChange={(e) => handleContactInput('contactType', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    >
                      <option value="business">Geschäftlich</option>
                      <option value="supplier">Lieferant</option>
                      <option value="customer">Kunde</option>
                      <option value="other">Sonstige</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Notizen
                    </label>
                    <textarea
                      value={contactForm.notes}
                      onChange={(e) => handleContactInput('notes', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm resize-none`}
                    />
                  </div>
                </div>

                <label className={`flex items-center gap-2 text-xs ${theme.textMuted}`}>
                  <input
                    type="checkbox"
                    checked={contactForm.shared}
                    onChange={(e) => handleContactInput('shared', e.target.checked)}
                    className="accent-[#4A90E2]"
                  />
                  Für alle Mitarbeiter sichtbar
                </label>

                {contactSaveMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                    <p className="text-rose-400 text-sm">{contactSaveMessage}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={closeContactModal}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border ${theme.border} ${theme.bgHover}`}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={contactSaveLoading}
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.accent} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {contactSaveLoading ? 'Speichert...' : 'Speichern'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {weatherModalOpen && (
          <div
            className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
            onClick={closeWeatherModal}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-md`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border}`}>
                <div>
                  <h3 className="text-base font-semibold">Wetter-Ort</h3>
                  <p className={`text-xs ${theme.textMuted}`}>Standard ist der Apothekenort.</p>
                </div>
                <button
                  type="button"
                  onClick={closeWeatherModal}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                  title="Popup schließen"
                >
                  <Icons.X />
                </button>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  setWeatherLocation(weatherInput.trim())
                  closeWeatherModal()
                }}
                className="p-5 space-y-4"
              >
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                    Ort
                  </label>
                  <input
                    value={weatherInput}
                    onChange={(event) => setWeatherInput(event.target.value)}
                    className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    placeholder="z.B. Berlin"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeWeatherModal}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border ${theme.border} ${theme.bgHover}`}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.accent} text-white`}
                  >
                    Speichern
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {photoEditorOpen && selectedPhoto && (
          <div className={`fixed inset-0 ${theme.overlay} z-50 flex items-center justify-center p-4`}>
            <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-3xl max-h-[90vh] overflow-auto`}>
              <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
                <h3 className={`text-lg font-semibold ${theme.text}`}>Foto bearbeiten</h3>
                <button
                  type="button"
                  onClick={closePhotoEditor}
                  className={`${theme.textMuted} ${theme.bgHover} p-2 rounded-lg`}
                >
                  <Icons.X />
                </button>
              </div>

              <div className="p-4">
                <div className="flex justify-center">
                  <ReactCrop crop={crop} onChange={setCrop} onComplete={setCompletedCrop}>
                    <img
                      ref={photoImgRef}
                      src={selectedPhoto.url}
                      alt="Bearbeiten"
                      className="max-w-full max-h-[50vh]"
                      style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
                      crossOrigin="anonymous"
                    />
                  </ReactCrop>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                      Helligkeit: {brightness}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full accent-[#4A90E2]"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                      Kontrast: {contrast}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full accent-[#4A90E2]"
                    />
                  </div>

                  <div className={`border-t ${theme.border} pt-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className={`text-sm font-medium ${theme.textSecondary}`}>
                        OCR-Text
                      </label>
                      {!photoOcrData[selectedPhoto.name] && !ocrProcessing[selectedPhoto.name] && (
                        <button
                          type="button"
                          onClick={() => runOcrForPhoto(selectedPhoto.name, selectedPhoto.url)}
                          className={`text-xs px-3 py-1 rounded-lg ${theme.accent} text-white`}
                        >
                          OCR starten
                        </button>
                      )}
                    </div>
                    {ocrProcessing[selectedPhoto.name] && (
                      <p className={`text-sm ${theme.accentText}`}>OCR wird ausgeführt...</p>
                    )}
                    {photoOcrData[selectedPhoto.name]?.status === 'completed' && (
                      <div className={`${theme.input} border rounded-lg p-3 max-h-40 overflow-auto`}>
                        <pre className={`text-sm ${theme.text} whitespace-pre-wrap font-sans`}>
                          {photoOcrData[selectedPhoto.name].text}
                        </pre>
                      </div>
                    )}
                    {photoOcrData[selectedPhoto.name]?.status === 'error' && (
                      <p className="text-sm text-rose-400">OCR fehlgeschlagen</p>
                    )}
                    {!photoOcrData[selectedPhoto.name] && !ocrProcessing[selectedPhoto.name] && (
                      <p className={`text-sm ${theme.textMuted}`}>Noch kein OCR durchgeführt</p>
                    )}
                  </div>
                </div>
              </div>

              <div className={`flex justify-end gap-3 p-4 border-t ${theme.border}`}>
                <button
                  type="button"
                  onClick={closePhotoEditor}
                  className={`px-4 py-2.5 rounded-lg ${theme.bgHover} ${theme.textSecondary} border ${theme.border}`}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={saveEditedPhoto}
                  disabled={photoSaving}
                  className={`px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium disabled:opacity-50`}
                >
                  {photoSaving ? 'Speichere...' : 'Als Kopie speichern'}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedApoMessage && (
          <div
            className={`fixed inset-0 ${theme.overlay} z-50 flex items-center justify-center p-4`}
            onClick={() => setSelectedApoMessage(null)}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`flex items-start justify-between p-4 border-b ${theme.border}`}>
                <div className="flex-1 pr-4">
                  <h3 className={`text-lg font-semibold ${theme.text}`}>
                    {selectedApoMessage.type === 'lav'
                      ? (selectedApoMessage.subject || `LAV-Info ${selectedApoMessage.ausgabe}`)
                      : selectedApoMessage.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-sm ${theme.textMuted}`}>
                      {selectedApoMessage.type === 'lav'
                        ? (selectedApoMessage.datum ? new Date(selectedApoMessage.datum).toLocaleDateString('de-DE') : '')
                        : (selectedApoMessage.date ? new Date(selectedApoMessage.date).toLocaleDateString('de-DE') : '')}
                    </span>
                    {selectedApoMessage.type === 'lav' && selectedApoMessage.ausgabe && (
                      <span className={`text-xs px-2 py-0.5 rounded ${theme.surface} ${theme.textMuted}`}>
                        Ausgabe {selectedApoMessage.ausgabe}
                      </span>
                    )}
                    {selectedApoMessage.category && (
                      <span className={`text-xs px-2 py-0.5 rounded ${theme.surface} ${theme.textMuted}`}>
                        {selectedApoMessage.category}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedApoMessage.type === 'amk' && (
                    <button
                      type="button"
                      onClick={() => downloadAmkPdf(selectedApoMessage)}
                      className={`${theme.accentText} ${theme.bgHover} p-2 rounded-lg`}
                      title="Als PDF herunterladen"
                    >
                      <Icons.Download />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedApoMessage(null)}
                    className={`${theme.textMuted} ${theme.bgHover} p-2 rounded-lg`}
                  >
                    <Icons.X />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4">
                {selectedApoMessage.type === 'amk' && selectedApoMessage.institution && (
                  <p className={`text-sm ${theme.textSecondary} mb-3`}>
                    <strong>Institution:</strong> {selectedApoMessage.institution}
                  </p>
                )}
                {selectedApoMessage.type === 'recall' && selectedApoMessage.product_name && (
                  <p className={`text-sm ${theme.textSecondary} mb-3`}>
                    <strong>Produkt:</strong> {selectedApoMessage.product_name}
                  </p>
                )}
                {selectedApoMessage.type === 'recall' && selectedApoMessage.recall_number && (
                  <p className={`text-sm ${theme.textSecondary} mb-3`}>
                    <strong>Rückrufnummer:</strong> {selectedApoMessage.recall_number}
                  </p>
                )}

                {/* AI-Analyse Felder für Rückrufe */}
                {selectedApoMessage.type === 'recall' && selectedApoMessage.ai_zusammenfassung && (
                  <div className={`mb-4 p-3 rounded-lg ${theme.surface} border ${theme.border}`}>
                    <p className={`text-sm font-medium ${theme.accentText} mb-1`}>KI-Zusammenfassung:</p>
                    <div className={`text-sm ${theme.text} markdown-content`}>
                      <ReactMarkdown>{selectedApoMessage.ai_zusammenfassung}</ReactMarkdown>
                    </div>
                    {selectedApoMessage.ai_analysiert_am && (
                      <p className={`text-xs ${theme.textMuted} mt-2`}>
                        Analysiert am: {new Date(selectedApoMessage.ai_analysiert_am).toLocaleString('de-DE')}
                      </p>
                    )}
                  </div>
                )}
                {selectedApoMessage.type === 'recall' && selectedApoMessage.ai_chargen_alle !== null && (
                  <p className={`text-sm ${theme.textSecondary} mb-3`}>
                    <strong>Alle Chargen betroffen:</strong> {selectedApoMessage.ai_chargen_alle ? 'Ja' : 'Nein'}
                  </p>
                )}
                {selectedApoMessage.type === 'recall' && selectedApoMessage.ai_chargen_liste && selectedApoMessage.ai_chargen_liste.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Betroffene Chargen:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedApoMessage.ai_chargen_liste.map((charge, i) => (
                        <span key={i} className={`text-xs px-2 py-1 rounded ${theme.surface} ${theme.text} border ${theme.border}`}>
                          {charge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedApoMessage.type === 'recall' && selectedApoMessage.ai_pzn_betroffen && selectedApoMessage.ai_pzn_betroffen.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Betroffene PZN:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedApoMessage.ai_pzn_betroffen.map((pzn, i) => (
                        <span key={i} className={`text-xs px-2 py-1 rounded ${theme.accent} text-white font-mono`}>
                          {pzn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedApoMessage.type === 'recall' && selectedApoMessage.ai_packungsgrößen && selectedApoMessage.ai_packungsgrößen.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Packungsgrößen:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedApoMessage.ai_packungsgrößen.map((größe, i) => (
                        <span key={i} className={`text-xs px-2 py-1 rounded ${theme.surface} ${theme.text} border ${theme.border}`}>
                          {größe}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* LAV-Info Themen */}
                {selectedApoMessage.type === 'lav' && selectedApoMessage.lav_themes && selectedApoMessage.lav_themes.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-2`}>Themen dieser Ausgabe:</p>
                    <div className="space-y-2">
                      {selectedApoMessage.lav_themes
                        .sort((a, b) => (a.punkt_nr || 0) - (b.punkt_nr || 0))
                        .map((thema) => (
                          <details
                            key={thema.id}
                            className={`${theme.surface} border ${theme.border} rounded-lg overflow-hidden`}
                          >
                            <summary className={`px-3 py-2 cursor-pointer ${theme.bgHover} flex items-center gap-2`}>
                              {thema.punkt_nr && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${theme.accent} text-white font-medium`}>
                                  {thema.punkt_nr}
                                </span>
                              )}
                              <span className={`text-sm font-medium ${theme.text}`}>{thema.titel || 'Kein Titel'}</span>
                              {thema.ist_arbeitsrecht && (
                                <span className={`text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400`}>
                                  Arbeitsrecht
                                </span>
                              )}
                            </summary>
                            {thema.volltext && (
                              <div className={`px-3 py-2 border-t ${theme.border}`}>
                                <div className={`text-sm ${theme.text} markdown-content`}>
                                  <ReactMarkdown>{thema.volltext}</ReactMarkdown>
                                </div>
                              </div>
                            )}
                          </details>
                        ))}
                    </div>
                  </div>
                )}

                {/* LAV-Info PDF Links */}
                {selectedApoMessage.type === 'lav' && selectedApoMessage.main_pdf_url && (
                  <div className="mb-4">
                    <a
                      href={`${supabaseUrl}${selectedApoMessage.main_pdf_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 text-sm ${theme.accentText} hover:underline`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      PDF herunterladen
                    </a>
                  </div>
                )}

                {selectedApoMessage.type === 'lav' && selectedApoMessage.attachment_urls && selectedApoMessage.attachment_urls.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Anhänge:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApoMessage.attachment_urls.map((url, i) => (
                        <a
                          key={i}
                          href={`${supabaseUrl}${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${theme.surface} ${theme.accentText} hover:underline border ${theme.border}`}
                        >
                          Anhang {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Beschreibung, Produkte, wichtige Infos nur für Nicht-AMK (bei AMK ist alles im full_text) */}
                {selectedApoMessage.type !== 'amk' && selectedApoMessage.description && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Beschreibung:</p>
                    <div className={`text-sm ${theme.text} markdown-content`}>
                      <ReactMarkdown>{selectedApoMessage.description}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {selectedApoMessage.type !== 'amk' && selectedApoMessage.affected_products && selectedApoMessage.affected_products.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Betroffene Produkte:</p>
                    <ul className={`text-sm ${theme.text} list-disc list-inside space-y-1`}>
                      {selectedApoMessage.affected_products.map((p, i) => (
                        <li key={i} className="markdown-content"><ReactMarkdown>{p}</ReactMarkdown></li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedApoMessage.type !== 'amk' && selectedApoMessage.important_info && selectedApoMessage.important_info.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Wichtige Informationen:</p>
                    <ul className={`text-sm ${theme.text} list-disc list-inside space-y-1`}>
                      {selectedApoMessage.important_info.map((info, i) => (
                        <li key={i} className="markdown-content"><ReactMarkdown>{info}</ReactMarkdown></li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedApoMessage.full_text && (
                  <div>
                    {selectedApoMessage.type !== 'amk' && (
                      <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Vollständiger Text:</p>
                    )}
                    <div className={`text-sm ${theme.text} markdown-content`}>
                      <ReactMarkdown>
                        {selectedApoMessage.type === 'amk'
                          ? selectedApoMessage.full_text.replace(/^#[^\n]*\n+/, '')
                          : selectedApoMessage.full_text}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                {selectedApoMessage.message_url && (
                  <a
                    href={selectedApoMessage.message_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-block mt-4 text-sm ${theme.accentText} hover:underline`}
                  >
                    Zur Originalquelle →
                  </a>
                )}
                {selectedApoMessage.recall_url && (
                  <a
                    href={selectedApoMessage.recall_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-block mt-4 text-sm ${theme.accentText} hover:underline`}
                  >
                    Zur Originalquelle →
                  </a>
                )}
              </div>

              <div className={`flex justify-end p-4 border-t ${theme.border}`}>
                <button
                  type="button"
                  onClick={() => setSelectedApoMessage(null)}
                  className={`px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium`}
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Event Modal */}
        {editingEvent && (
          <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-50 p-4`}>
            <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow} w-full max-w-md`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-semibold ${theme.text}`}>
                  {editingEvent.id ? 'Termin bearbeiten' : 'Neuer Termin'}
                </h3>
                <button
                  type="button"
                  onClick={closeEventModal}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                >
                  <Icons.X />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Titel *</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} ${theme.inputPlaceholder} ${theme.text}`}
                    placeholder="Terminname"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventForm.allDay}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, allDay: e.target.checked }))}
                    className={`rounded ${theme.border}`}
                  />
                  <span className={`text-sm ${theme.textSecondary}`}>Ganztägig</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Start</label>
                    <input
                      type="date"
                      value={eventForm.startDate}
                      onChange={(e) =>
                        setEventForm((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                          endDate: prev.endDate || e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-xl border ${theme.input} text-sm ${theme.text}`}
                    />
                    {!eventForm.allDay && (
                      <input
                        type="time"
                        value={eventForm.startTime}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, startTime: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-xl border ${theme.input} text-sm mt-2 ${theme.text}`}
                      />
                    )}
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Ende</label>
                    <input
                      type="date"
                      value={eventForm.endDate}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, endDate: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border ${theme.input} text-sm ${theme.text}`}
                    />
                    {!eventForm.allDay && (
                      <input
                        type="time"
                        value={eventForm.endTime}
                        onChange={(e) => setEventForm((prev) => ({ ...prev, endTime: e.target.value }))}
                        className={`w-full px-3 py-2 rounded-xl border ${theme.input} text-sm mt-2 ${theme.text}`}
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Ort</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, location: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} ${theme.inputPlaceholder} ${theme.text}`}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Beschreibung</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} ${theme.inputPlaceholder} resize-none ${theme.text}`}
                    placeholder="Optional"
                  />
                </div>

                {eventError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                    <p className="text-rose-400 text-sm">{eventError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {editingEvent.id && canWriteCurrentCalendar() && (
                    <button
                      type="button"
                      onClick={() => deleteEvent(editingEvent.id)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium ${theme.danger} border ${theme.border}`}
                    >
                      Löschen
                    </button>
                  )}
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={closeEventModal}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium ${theme.textMuted} ${theme.bgHover}`}
                  >
                    Abbrechen
                  </button>
                  {canWriteCurrentCalendar() && (
                    <button
                      type="button"
                      onClick={() => (editingEvent.id ? updateEvent(editingEvent.id) : createEvent())}
                      disabled={eventSaving || !eventForm.title.trim()}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${theme.accent} text-white disabled:opacity-40`}
                    >
                      {eventSaving ? 'Speichern...' : 'Speichern'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Kalender erstellen/bearbeiten Modal (Admin) */}
        {editingCalendar && (
          <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-50 p-4`}>
            <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow} w-full max-w-md`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-semibold ${theme.text}`}>
                  {editingCalendar.id ? 'Kalender bearbeiten' : 'Neuer Kalender'}
                </h3>
                <button
                  type="button"
                  onClick={closeCalendarModal}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                >
                  <Icons.X />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Name *</label>
                  <input
                    type="text"
                    value={calendarForm.name}
                    onChange={(e) => setCalendarForm((prev) => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} ${theme.inputPlaceholder} ${theme.text}`}
                    placeholder="Kalendername"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Beschreibung</label>
                  <textarea
                    value={calendarForm.description}
                    onChange={(e) => setCalendarForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} ${theme.inputPlaceholder} resize-none ${theme.text}`}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${theme.textSecondary}`}>Farbe</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={calendarForm.color}
                      onChange={(e) => setCalendarForm((prev) => ({ ...prev, color: e.target.value }))}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0"
                    />
                    <div className="flex gap-2">
                      {['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setCalendarForm((prev) => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-lg border-2 ${calendarForm.color === color ? 'border-white' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={closeCalendarModal}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium ${theme.textMuted} ${theme.bgHover}`}
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => (editingCalendar.id ? updateCalendar(editingCalendar.id) : createCalendar())}
                    disabled={calendarSaving || !calendarForm.name.trim()}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold ${theme.accent} text-white disabled:opacity-40`}
                  >
                    {calendarSaving ? 'Speichern...' : 'Speichern'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Berechtigungen Modal (Admin) */}
        {permissionsModalOpen && (
          <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-50 p-4`}>
            <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow} w-full max-w-lg max-h-[80vh] overflow-auto`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-semibold ${theme.text}`}>Berechtigungen verwalten</h3>
                <button
                  type="button"
                  onClick={() => setPermissionsModalOpen(false)}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                >
                  <Icons.X />
                </button>
              </div>

              <div className={`p-4 rounded-xl border ${theme.border} mb-6`}>
                <h4 className={`text-sm font-medium mb-3 ${theme.textSecondary}`}>Berechtigung hinzufügen</h4>
                <div className="flex gap-2">
                  <select id="newPermUser" className={`flex-1 px-3 py-2 rounded-lg border ${theme.input} text-sm ${theme.text}`}>
                    <option value="">Mitarbeiter wählen...</option>
                    {staff
                      .filter((s) => s.auth_user_id && !calendarPermissions.some((p) => p.user_id === s.auth_user_id))
                      .map((s) => (
                        <option key={s.id} value={s.auth_user_id}>
                          {s.first_name} {s.last_name}
                        </option>
                      ))}
                  </select>
                  <select id="newPermLevel" className={`px-3 py-2 rounded-lg border ${theme.input} text-sm ${theme.text}`}>
                    <option value="read">Lesen</option>
                    <option value="write">Schreiben</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const userId = document.getElementById('newPermUser').value
                      const perm = document.getElementById('newPermLevel').value
                      if (userId) addCalendarPermission(selectedCalendarId, userId, perm)
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${theme.accent} text-white`}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {permissionsLoading ? (
                  <p className={theme.textMuted}>Laden...</p>
                ) : calendarPermissions.length === 0 ? (
                  <p className={theme.textMuted}>Keine Berechtigungen vergeben.</p>
                ) : (
                  calendarPermissions.map((perm) => (
                    <div key={perm.id} className={`flex items-center justify-between p-3 rounded-xl border ${theme.border}`}>
                      <div>
                        <p className={`font-medium ${theme.text}`}>
                          {perm.staffMember?.first_name} {perm.staffMember?.last_name}
                        </p>
                        <p className={`text-xs ${theme.textMuted}`}>{perm.staffMember?.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={perm.permission}
                          onChange={(e) => addCalendarPermission(selectedCalendarId, perm.user_id, e.target.value)}
                          className={`px-2 py-1 rounded-lg border ${theme.input} text-xs ${theme.text}`}
                        >
                          <option value="read">Lesen</option>
                          <option value="write">Schreiben</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeCalendarPermission(perm.id, selectedCalendarId)}
                          className={`p-1.5 rounded-lg ${theme.danger}`}
                          title="Berechtigung entfernen"
                        >
                          <Icons.X />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    )
  }

  // Login / Forgot Password / Reset Password views
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex items-center justify-center p-4 relative overflow-hidden`}>
      <div className={`${theme.panel} p-6 sm:p-8 rounded-2xl border ${theme.border} ${theme.cardShadow} max-w-sm w-full`}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <img src="/logo.png" alt="Kaeee" className="h-10" />
            <p className={`text-sm ${theme.textMuted}`}>
              {authView === 'login' && 'Willkommen zurück'}
              {authView === 'forgot' && 'Passwort zurücksetzen'}
              {authView === 'resetPassword' && 'Neues Passwort setzen'}
            </p>
          </div>
        </div>

        {/* Login Form */}
        {authView === 'login' && (
          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                <p className="text-rose-400 text-sm">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              title="Einloggen"
              className={`w-full ${theme.accent} text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Wird geladen...' : 'Einloggen'}
            </button>

            <button
              type="button"
              onClick={() => { setAuthView('forgot'); setMessage(''); setSuccessMessage(''); }}
              className={`w-full text-sm ${theme.accentText} hover:opacity-80`}
            >
              Passwort vergessen?
            </button>
          </form>
        )}

        {/* Forgot Password Form */}
        {authView === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
                placeholder="email@example.com"
              />
            </div>

            {message && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                <p className="text-rose-400 text-sm">{message}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <p className="text-emerald-600 text-sm">{successMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              title="Link senden"
              className={`w-full ${theme.accent} text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Wird gesendet...' : 'Link senden'}
            </button>

            <button
              type="button"
              onClick={() => { setAuthView('login'); setMessage(''); setSuccessMessage(''); }}
              className={`w-full text-sm ${theme.accentText} hover:opacity-80`}
            >
              Zurück zum Login
            </button>
          </form>
        )}

        {/* Reset Password Form */}
        {authView === 'resetPassword' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                Neues Passwort
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                <p className="text-rose-400 text-sm">{message}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <p className="text-emerald-600 text-sm">{successMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              title="Passwort speichern"
              className={`w-full ${theme.accent} text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Wird gespeichert...' : 'Passwort speichern'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default App
