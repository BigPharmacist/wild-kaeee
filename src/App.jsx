import { useState, useEffect, useRef } from 'react'
import { supabase, supabaseUrl } from './lib/supabase'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

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
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [darkMode, setDarkMode] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
  const [staffAvatarFile, setStaffAvatarFile] = useState(null)
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
  const isResizing = useRef(false)
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

  // Modern minimalist palette with graphite neutrals + emerald accent
  const theme = darkMode ? {
    // Backgrounds
    bg: 'bg-zinc-950',
    bgPattern: 'bg-[radial-gradient(120%_70%_at_0%_0%,rgba(16,185,129,0.12),transparent_60%),radial-gradient(70%_60%_at_100%_0%,rgba(234,179,8,0.08),transparent_60%)]',
    surface: 'bg-zinc-900/65 backdrop-blur',
    panel: 'bg-zinc-900/80',
    bgHover: 'hover:bg-zinc-900/70',
    // Borders
    border: 'border-zinc-800/80',
    borderLight: 'border-zinc-700/80',
    // Text
    text: 'text-zinc-50',
    textSecondary: 'text-zinc-300',
    textMuted: 'text-zinc-400',
    // Navigation
    navActive: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20',
    navHover: 'hover:bg-zinc-900/70 hover:text-zinc-200',
    // Inputs
    input: 'bg-zinc-900/60 border-zinc-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400',
    inputPlaceholder: 'placeholder-zinc-500',
    // Accent
    accent: 'bg-emerald-500 hover:bg-emerald-400',
    accentText: 'text-emerald-400',
    // Resize handle
    resizeHandle: 'bg-zinc-800 hover:bg-emerald-400',
    // Danger
    danger: 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10',
    // Card
    cardShadow: 'shadow-[0_30px_60px_-35px_rgba(0,0,0,0.8)]',
    // Overlay
    overlay: 'bg-black/45',
  } : {
    // Backgrounds
    bg: 'bg-zinc-50',
    bgPattern: 'bg-[radial-gradient(120%_70%_at_0%_0%,rgba(16,185,129,0.14),transparent_60%),radial-gradient(70%_60%_at_100%_0%,rgba(234,179,8,0.10),transparent_60%)]',
    surface: 'bg-white/80 backdrop-blur',
    panel: 'bg-white',
    bgHover: 'hover:bg-zinc-100',
    // Borders
    border: 'border-zinc-200',
    borderLight: 'border-zinc-300',
    // Text
    text: 'text-zinc-900',
    textSecondary: 'text-zinc-600',
    textMuted: 'text-zinc-500',
    // Navigation
    navActive: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20',
    navHover: 'hover:bg-zinc-100 hover:text-zinc-900',
    // Inputs
    input: 'bg-white border-zinc-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500',
    inputPlaceholder: 'placeholder-zinc-400',
    // Accent
    accent: 'bg-emerald-600 hover:bg-emerald-700',
    accentText: 'text-emerald-700',
    // Resize handle
    resizeHandle: 'bg-zinc-200 hover:bg-emerald-400',
    // Danger
    danger: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50',
    // Card
    cardShadow: 'shadow-[0_20px_50px_-30px_rgba(24,24,27,0.35)]',
    // Overlay
    overlay: 'bg-zinc-900/40',
  }

  const startResizing = () => {
    isResizing.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', stopResizing)
  }

  const handleMouseMove = (e) => {
    if (!isResizing.current) return
    const newWidth = e.clientX
    if (newWidth >= 64 && newWidth <= 320) {
      setSidebarWidth(newWidth)
    }
  }

  const stopResizing = () => {
    isResizing.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', stopResizing)
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

  const pharmacyLookup = Object.fromEntries(
    pharmacies.map((pharmacy) => [pharmacy.id, pharmacy.name]),
  )
  const staffByAuthId = Object.fromEntries(
    staff
      .filter((member) => member.auth_user_id)
      .map((member) => [member.auth_user_id, member]),
  )

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

    // Bei "all" alle Kalender laden, sonst nur den ausgewaehlten
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
    if (!confirm('Termin unwiderruflich loeschen?')) return

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
      // Zeit aus Date-Objekt fuer lokale Anzeige
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
    // Bei "Alle Kalender" keine Schreibberechtigung (man muss einen spezifischen Kalender waehlen)
    if (selectedCalendarId === 'all') return null
    if (currentStaff?.is_admin) return 'write'
    const cal = calendars.find((c) => c.id === selectedCalendarId)
    return cal?.userPermission || null
  }

  const canWriteCurrentCalendar = () => currentCalendarPermission() === 'write'

  // Hilfsfunktion: Farbe fuer ein Event basierend auf seinem Kalender
  const getEventColor = (event) => {
    const cal = calendars.find((c) => c.id === event.calendar_id)
    return cal?.color || '#10b981'
  }

  const weatherDescription = (code) => {
    const map = {
      0: 'Klar',
      1: 'Ueberwiegend klar',
      2: 'Leicht bewoelkt',
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
    if (!confirm('Foto unwiderruflich loeschen?')) return
    const { data, error } = await supabase
      .storage
      .from('documents')
      .remove([`photos/${photoName}`])
    console.log('Delete response:', { data, error, photoName })
    if (error) {
      alert('Loeschen fehlgeschlagen: ' + error.message)
      return
    }
    if (!data || data.length === 0) {
      alert('Foto konnte nicht geloescht werden. Pruefe die Storage-Berechtigungen.')
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
      setEditMessage('Bitte Inhaber oder Filialleiter waehlen.')
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
      setStaffSaveMessage('Bitte Beruf waehlen.')
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      fetchPharmacies()
      fetchStaff()
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

  // Realtime-Subscription fuer Kalender-Events
  useEffect(() => {
    if (!session || activeView !== 'calendar' || !selectedCalendarId) return

    // Bei "all" auf alle Events hoeren, sonst nur auf den ausgewaehlten Kalender
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(error.message)
    else setMessage('')
    setLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setMessage('')
    setMobileMenuOpen(false)
  }

  // Dashboard view
  if (session) {
    return (
      <div className={`min-h-screen ${theme.bg} ${theme.bgPattern} ${theme.text} flex flex-col relative overflow-hidden`}>
        {/* Header */}
        <header className={`${theme.surface} border-b ${theme.border} px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-40`}>
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
              title={mobileMenuOpen ? 'Menue schliessen' : 'Menue oeffnen'}
            >
              {mobileMenuOpen ? <Icons.X /> : <Icons.Menu />}
            </button>
            <h1 className="text-xl font-semibold tracking-tight">Kaeee</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted} transition-colors`}
              title={darkMode ? 'Hellmodus' : 'Dunkelmodus'}
            >
              {darkMode ? <Icons.Sun /> : <Icons.Moon />}
            </button>

            {/* Camera button */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted} transition-colors ${photoUploading ? 'opacity-50' : ''}`}
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
                  className="h-9 w-9 rounded-full object-cover border border-zinc-700/60"
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
              className={`p-2 rounded-lg ${theme.danger} transition-colors`}
              title="Ausloggen"
            >
              <Icons.Logout />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Mobile sidebar overlay */}
          {mobileMenuOpen && (
            <div
              className={`fixed inset-0 ${theme.overlay} z-30 lg:hidden`}
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`
              ${theme.surface} border-r ${theme.border}
              flex-shrink-0 overflow-hidden z-40
              fixed lg:relative inset-y-0 left-0 top-[57px] lg:top-0
              transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
              transition-transform duration-200 ease-out
              w-64 lg:w-auto
            `}
            style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? sidebarWidth : undefined }}
          >
            <nav className="p-3 space-y-1">
              {navItems.map((item, index) => (
                <a
                  key={index}
                  href="#"
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium border border-transparent
                    transition-colors whitespace-nowrap overflow-hidden
                    ${activeView === item.id ? theme.navActive : `${theme.textMuted} ${theme.navHover}`}
                  `}
                  title={item.label}
                  onClick={(event) => {
                    event.preventDefault()
                    setActiveView(item.id)
                    setMobileMenuOpen(false)
                  }}
                >
                  <item.icon />
                  {(sidebarWidth > 100 || mobileMenuOpen) && <span>{item.label}</span>}
                </a>
              ))}
            </nav>
          </aside>

          {/* Resize Handle - hidden on mobile */}
          <div
            className={`hidden lg:block w-1 ${theme.resizeHandle} cursor-col-resize flex-shrink-0 transition-colors`}
            onMouseDown={startResizing}
          />

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
                        Dein persoenliches Dashboard ist bereit.
                      </p>
                    </div>
                    <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
                      <h3 className={`text-lg font-medium mb-2 ${theme.text}`}>Naechste Schritte</h3>
                      <p className={theme.textMuted}>
                        Verknuepfe Daten, um Live-Statistiken zu sehen.
                      </p>
                    </div>
                    <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow} flex flex-col gap-3`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className={`text-lg font-medium ${theme.text}`}>Wetter</h3>
                          <p className={`text-xs ${theme.textMuted}`}>
                            {weatherData?.name || weatherLocation || 'Ort waehlen'}
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
                              <p className={theme.textMuted}>Gefuehlt</p>
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
                          Kein Wetter verfuegbar.
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
                          className={`${theme.panel} rounded-xl border ${theme.border} ${theme.cardShadow} overflow-hidden hover:ring-2 hover:ring-emerald-400 transition-all relative group`}
                        >
                          <button
                            type="button"
                            onClick={(e) => deletePhoto(photo.name, e)}
                            className={`absolute top-2 right-2 p-1.5 rounded-lg ${theme.panel} border ${theme.border} opacity-0 group-hover:opacity-100 transition-opacity ${theme.danger} z-10`}
                            title="Foto loeschen"
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
                        title="Naechster Monat"
                      >
                        <Icons.ChevronRight />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-6">
                    <button
                      type="button"
                      onClick={() => setApoTab('lav')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        apoTab === 'lav'
                          ? `${theme.accent} text-white`
                          : `${theme.bgHover} ${theme.textSecondary} border ${theme.border}`
                      }`}
                    >
                      LAK-Info
                    </button>
                    <button
                      type="button"
                      onClick={() => setApoTab('amk')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        apoTab === 'amk'
                          ? `${theme.accent} text-white`
                          : `${theme.bgHover} ${theme.textSecondary} border ${theme.border}`
                      }`}
                    >
                      AMK-Meldungen
                    </button>
                    <button
                      type="button"
                      onClick={() => setApoTab('recall')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        apoTab === 'recall'
                          ? `${theme.accent} text-white`
                          : `${theme.bgHover} ${theme.textSecondary} border ${theme.border}`
                      }`}
                    >
                      Rueckrufe
                    </button>
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
                            className={`w-full text-left ${theme.panel} rounded-xl border ${theme.border} p-4 hover:ring-2 hover:ring-emerald-400 transition-all`}
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
                        <p className={theme.textMuted}>Rueckrufe werden geladen...</p>
                      ) : recallMessages.length === 0 ? (
                        <p className={theme.textMuted}>Keine Rueckrufe in diesem Monat.</p>
                      ) : (
                        recallMessages.map((msg) => (
                          <button
                            key={msg.id}
                            type="button"
                            onClick={() => setSelectedApoMessage({ ...msg, type: 'recall' })}
                            className={`w-full text-left ${theme.panel} rounded-xl border ${theme.border} p-4 hover:ring-2 hover:ring-emerald-400 transition-all`}
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
                            className={`w-full text-left ${theme.panel} rounded-xl border ${theme.border} p-4 hover:ring-2 hover:ring-emerald-400 transition-all`}
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
                                className="h-9 w-9 rounded-full object-cover border border-zinc-700/60"
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
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-100'
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
                                          ? 'bg-emerald-500 text-white'
                                          : day.isTodayDate
                                            ? `border-2 border-emerald-500/50 ${day.hasData ? theme.text : theme.textMuted}`
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
                                <p className={theme.textMuted}>Keine Daten fuer {selectedPlanDate} verfuegbar.</p>
                              </div>
                            )
                          }

                          return (
                            <div className={`${theme.panel} rounded-2xl p-5 border ${isToday ? 'border-emerald-500/40' : theme.border} ${theme.cardShadow}`}>
                              <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-lg font-semibold">{dayData.issueDate}</h3>
                                {isToday && (
                                  <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                    Heute
                                  </span>
                                )}
                              </div>

                              {Object.entries(dayData.groups).map(([groupName, employees]) => (
                                <div key={groupName} className="mb-6 last:mb-0">
                                  <p className={`text-xs font-medium mb-3 ${theme.textMuted}`}>{groupName}</p>

                                  {/* Zeitachse */}
                                  <div className="relative mb-2">
                                    <div className="flex justify-between text-[10px] text-zinc-500">
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
                                          className={`relative h-7 rounded ${darkMode ? 'bg-zinc-800/50' : 'bg-zinc-200/50'}`}
                                        >
                                          {/* Hintergrund-Raster */}
                                          <div className="absolute inset-0 flex">
                                            {hours.slice(0, -1).map((h) => (
                                              <div key={h} className={`flex-1 border-r ${darkMode ? 'border-zinc-700/30' : 'border-zinc-300/50'}`} />
                                            ))}
                                          </div>

                                          {/* Arbeitsbalken */}
                                          {hasWork && !isAbsent && (
                                            <>
                                              <div
                                                className="absolute top-0.5 bottom-0.5 bg-emerald-500 rounded"
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
                                                <span className="text-[11px] font-semibold text-zinc-900 truncate px-2 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
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
                                              <span className="text-[11px] font-semibold text-zinc-900 truncate px-2 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
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
                                              <span className="text-[11px] font-semibold text-zinc-900 truncate px-2 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
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
                                  <div className="w-3 h-3 rounded bg-emerald-500" />
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
                      <p className={theme.textMuted}>Keine Plandaten verfuegbar.</p>
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
                                ? 'bg-emerald-500 text-white'
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
                        title="Zurueck"
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
                        Keine Kalender verfuegbar.
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
                                      ${day.isToday ? 'border-emerald-500/50' : theme.border}
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
                                className={`min-h-48 p-2 rounded-lg border ${day.isToday ? 'border-emerald-500/50' : theme.border} ${theme.panel}`}
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
                                          ? 'Ganztaegig'
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

                  <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
                    <aside className={`${theme.panel} rounded-2xl p-3 border ${theme.border} ${theme.cardShadow} h-fit`}>
                      <button
                        onClick={() => setSettingsTab('pharmacies')}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                          settingsTab === 'pharmacies'
                            ? `${theme.navActive}`
                            : `${theme.textMuted} ${theme.bgHover} border-transparent`
                        }`}
                        title="Apothekendaten"
                      >
                        Apothekendaten
                      </button>
                      <button
                        onClick={() => setSettingsTab('staff')}
                        className={`w-full text-left mt-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                          settingsTab === 'staff'
                            ? `${theme.navActive}`
                            : `${theme.textMuted} ${theme.bgHover} border-transparent`
                        }`}
                        title="Kollegium"
                      >
                        Kollegium
                      </button>
                    </aside>

                    <div className="space-y-4">
                      {settingsTab === 'pharmacies' && (
                        <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="text-base font-semibold">Apothekendaten</h3>
                              <p className={`text-xs ${theme.textMuted}`}>Maximal 4 Eintraege.</p>
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
                                title="Apotheke hinzufuegen"
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
                              <p className={`text-xs ${theme.textMuted}`}>Global ueber alle Apotheken.</p>
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
                                title="Person hinzufuegen"
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
                                          className="h-8 w-8 rounded-full object-cover border border-zinc-700/60"
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
                                      Login verknuepft
                                    </p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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
                    {editingPharmacy.id ? 'Apotheke bearbeiten' : 'Apotheke hinzufuegen'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {editingPharmacy.id ? 'Aenderungen werden sofort gespeichert.' : 'Neue Apotheke anlegen.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                  title="Popup schliessen"
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
                        <option value="">Bitte waehlen</option>
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
                    {editingStaff.id ? 'Kollegium bearbeiten' : 'Kollegium hinzufuegen'}
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {editingStaff.id ? 'Aenderungen werden sofort gespeichert.' : 'Neue Person anlegen.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeStaffModal}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                  title="Popup schliessen"
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
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      E-Mail
                    </label>
                    <input
                      value={staffForm.email}
                      onChange={(e) => handleStaffInput('email', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                      type="email"
                    />
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
                      <option value="">Bitte waehlen</option>
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
                      <option value="">Bitte waehlen</option>
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
                        className="h-12 w-12 rounded-full object-cover border border-zinc-700/60"
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
                    title="Mit aktuellem Login verknuepfen"
                    disabled={!session?.user?.id}
                  >
                    {staffForm.authUserId ? 'Login verknuepft' : 'Mit aktuellem Login verknuepfen'}
                  </button>
                  <label className={`flex items-center gap-2 text-xs ${theme.textMuted}`}>
                    <input
                      type="checkbox"
                      checked={staffForm.isAdmin}
                      onChange={(e) => handleStaffInput('isAdmin', e.target.checked)}
                      className="accent-emerald-500"
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
                  title="Popup schliessen"
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
                      className="w-full accent-emerald-500"
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
                      className="w-full accent-emerald-500"
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
                      <p className={`text-sm ${theme.accentText}`}>OCR wird ausgefuehrt...</p>
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
                      <p className={`text-sm ${theme.textMuted}`}>Noch kein OCR durchgefuehrt</p>
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
                <button
                  type="button"
                  onClick={() => setSelectedApoMessage(null)}
                  className={`${theme.textMuted} ${theme.bgHover} p-2 rounded-lg flex-shrink-0`}
                >
                  <Icons.X />
                </button>
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
                    <strong>Rueckrufnummer:</strong> {selectedApoMessage.recall_number}
                  </p>
                )}

                {/* AI-Analyse Felder für Rückrufe */}
                {selectedApoMessage.type === 'recall' && selectedApoMessage.ai_zusammenfassung && (
                  <div className={`mb-4 p-3 rounded-lg ${theme.surface} border ${theme.border}`}>
                    <p className={`text-sm font-medium ${theme.accentText} mb-1`}>KI-Zusammenfassung:</p>
                    <p className={`text-sm ${theme.text}`}>{selectedApoMessage.ai_zusammenfassung}</p>
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
                {selectedApoMessage.type === 'recall' && selectedApoMessage.ai_packungsgroessen && selectedApoMessage.ai_packungsgroessen.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Packungsgroessen:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedApoMessage.ai_packungsgroessen.map((groesse, i) => (
                        <span key={i} className={`text-xs px-2 py-1 rounded ${theme.surface} ${theme.text} border ${theme.border}`}>
                          {groesse}
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
                                <p className={`text-sm ${theme.text} whitespace-pre-wrap`}>{thema.volltext}</p>
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
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Anhaenge:</p>
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

                {selectedApoMessage.description && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Beschreibung:</p>
                    <p className={`text-sm ${theme.text}`}>{selectedApoMessage.description}</p>
                  </div>
                )}
                {selectedApoMessage.affected_products && selectedApoMessage.affected_products.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Betroffene Produkte:</p>
                    <ul className={`text-sm ${theme.text} list-disc list-inside`}>
                      {selectedApoMessage.affected_products.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedApoMessage.important_info && selectedApoMessage.important_info.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Wichtige Informationen:</p>
                    <ul className={`text-sm ${theme.text} list-disc list-inside`}>
                      {selectedApoMessage.important_info.map((info, i) => (
                        <li key={i}>{info}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedApoMessage.full_text && (
                  <div>
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Vollstaendiger Text:</p>
                    <div className={`text-sm ${theme.text} whitespace-pre-wrap ${theme.input} border rounded-lg p-3`}>
                      {selectedApoMessage.full_text}
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
                  Schliessen
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
                    className="rounded border-zinc-600"
                  />
                  <span className={`text-sm ${theme.textSecondary}`}>Ganztaegig</span>
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
                      Loeschen
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
                <h4 className={`text-sm font-medium mb-3 ${theme.textSecondary}`}>Berechtigung hinzufuegen</h4>
                <div className="flex gap-2">
                  <select id="newPermUser" className={`flex-1 px-3 py-2 rounded-lg border ${theme.input} text-sm ${theme.text}`}>
                    <option value="">Mitarbeiter waehlen...</option>
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

  // Login view
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.bgPattern} ${theme.text} flex items-center justify-center p-4 relative overflow-hidden`}>
      <div className={`${theme.panel} p-6 sm:p-8 rounded-2xl border ${theme.border} ${theme.cardShadow} max-w-sm w-full`}>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Kaeee</h1>
            <p className={`text-sm ${theme.textMuted}`}>Willkommen zurueck</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted} transition-colors`}
            title={darkMode ? 'Hellmodus' : 'Dunkelmodus'}
          >
            {darkMode ? <Icons.Sun /> : <Icons.Moon />}
          </button>
        </div>

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
        </form>
      </div>
    </div>
  )
}

export default App
