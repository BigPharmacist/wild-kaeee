import { useState, useEffect, useRef } from 'react'
import { supabase, supabaseUrl } from './lib/supabase'
import { House, Camera, Pill, CalendarDots, CalendarBlank, ChatCircle, GearSix, EnvelopeSimple, Printer } from '@phosphor-icons/react'
import { EmailAccountModal, EmailSettingsSection, EmailView, useEmailSettings } from './features/email'
import { ContactDetailModal, ContactFormModal, ContactsSettingsSection, useContacts } from './features/contacts'
import { contactScan } from './features/contacts'
import { AuthView } from './features/auth'
import { DashboardHeader, SidebarNav, DashboardHome, useWeather } from './features/dashboard'
import { ApoView } from './features/apo'
import { PhotosView } from './features/photos'
import { ChatView } from './features/chat'
import { SettingsView, usePharmacies, useStaff } from './features/settings'
import { PlanView } from './features/plan'
import { CalendarView } from './features/calendar'
import { useRechnungen } from './features/rechnungen'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { jsPDF } from 'jspdf'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Icons, UnreadBadge } from './shared/ui'


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
  const [secondaryTab, setSecondaryTab] = useState(() => localStorage.getItem('nav_secondaryTab') || 'overview')
  const [activeView, setActiveView] = useState(() => localStorage.getItem('nav_activeView') || 'dashboard')
  const [settingsTab, setSettingsTab] = useState(() => localStorage.getItem('nav_settingsTab') || 'pharmacies')
  const {
    pharmacies,
    pharmaciesLoading,
    pharmaciesMessage,
    editingPharmacy,
    editForm,
    editLoading,
    editMessage,
    pharmacyLookup,
    fetchPharmacies,
    handleEditInput,
    openCreateModal: openPharmacyCreateModal,
    openEditModal,
    closeEditModal,
    handleEditSubmit,
  } = usePharmacies()
  const {
    staff,
    staffLoading,
    staffMessage,
    editingStaff,
    staffForm,
    staffSaveLoading,
    staffSaveMessage,
    staffInviteLoading,
    staffInviteMessage,
    staffAvatarFile,
    staffAvatarPreview,
    currentStaff,
    staffByAuthId,
    fetchStaff,
    openStaffModal,
    closeStaffModal,
    handleStaffInput,
    handleStaffAvatarChange,
    linkCurrentUser,
    handleStaffSubmit,
    handleSendInvite,
  } = useStaff({ session, pharmacies })
  const {
    emailAccounts,
    emailPermissions,
    currentUserEmailAccess,
    editingEmailAccount,
    emailAccountForm,
    emailAccountSaving,
    emailAccountMessage,
    selectedEmailAccount,
    setEmailAccountForm,
    fetchEmailAccounts,
    fetchEmailPermissions,
    openEmailAccountModal,
    closeEmailAccountModal,
    handleSaveEmailAccount,
    handleDeleteEmailAccount,
    handleSelectEmailAccount,
    toggleEmailPermission,
  } = useEmailSettings({ sessionUserId: session?.user?.id })
  const {
    contacts,
    contactsLoading,
    contactsMessage,
    editingContact,
    contactForm,
    contactSaveLoading,
    contactSaveMessage,
    ocrError,
    contactCardFile,
    contactCardPreview,
    contactCardEnhancedFile,
    contactCardEnhancedPreview,
    contactCardRotation,
    contactCardEnhancing,
    businessCardScanning,
    duplicateCheckResult,
    duplicateDialogOpen,
    contactSearch,
    contactViewMode,
    selectedContact,
    selectedContactCardView,
    selectedCardUrl,
    selectedCardHasEnhanced,
    selectedCardHasOriginal,
    contactTypeLabels,
    filteredContacts,
    setContactSearch,
    setContactViewMode,
    setSelectedContact,
    setSelectedContactCardView,
    fetchContacts,
    openContactModal,
    closeContactModal,
    handleContactInput,
    deleteContact,
    saveContact,
    openContactDetail,
    contactScanApi,
  } = useContacts({ sessionUserId: session?.user?.id })

  const {
    checkContactDuplicates,
    openContactFormWithOcrData,
    handleDuplicateUpdate,
    handleNewRepresentative,
    handleCreateNewContact,
  } = contactScan.useContactDuplicates({
    supabase,
    fetchContacts,
    contactsApi: contactScanApi,
  })

  const [mistralApiKey, setMistralApiKey] = useState(null)
  const [googleApiKey, setGoogleApiKey] = useState(null)

  // API Key Fetch-Funktionen (müssen vor useBusinessCardScan definiert sein)
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

  const fetchGoogleApiKey = async () => {
    console.log('fetchGoogleApiKey: Suche nach Google Nano Banana Key...')
    const { data, error } = await supabase
      .from('api_keys')
      .select('key')
      .eq('name', 'Google Nano Banana')
      .single()
    console.log('fetchGoogleApiKey Result:', { found: !!data, error: error?.message })
    if (!error && data) {
      setGoogleApiKey(data.key)
      return data.key
    }
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('api_keys')
      .select('key')
      .ilike('name', '%google%nano%banana%')
      .limit(1)
      .single()
    console.log('fetchGoogleApiKey Fallback:', { found: !!fallbackData, error: fallbackError?.message })
    if (!fallbackError && fallbackData) {
      setGoogleApiKey(fallbackData.key)
      return fallbackData.key
    }
    return null
  }

  // Bildverarbeitungsfunktionen (müssen vor useBusinessCardScan definiert sein)
  const detectRotationWithAI = async (file, apiKey) => {
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.readAsDataURL(file)
    })
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'pixtral-12b-2409',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analysiere dieses Bild einer Visitenkarte. Um wie viel Grad im Uhrzeigersinn muss es gedreht werden, damit der Text richtig lesbar ist (horizontal, von links nach rechts)? Antworte NUR mit einer Zahl: 0, 90, 180 oder 270'
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64}` }
            }
          ]
        }],
        max_tokens: 10,
      }),
    })
    const result = await response.json()
    const content = result.choices?.[0]?.message?.content || '0'
    const match = content.match(/\b(0|90|180|270)\b/)
    return match ? parseInt(match[1], 10) : 0
  }

  const rotateImageByDegrees = (file, degrees) => {
    if (degrees === 0) return Promise.resolve(file)
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (degrees === 90 || degrees === 270) {
            canvas.width = img.height
            canvas.height = img.width
          } else {
            canvas.width = img.width
            canvas.height = img.height
          }
          ctx.translate(canvas.width / 2, canvas.height / 2)
          ctx.rotate((degrees * Math.PI) / 180)
          ctx.drawImage(img, -img.width / 2, -img.height / 2)
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          }, 'image/jpeg', 0.95)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          }, 'image/jpeg', quality)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const getEnhancedImage = async (file, apiKey) => {
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.readAsDataURL(file)
    })
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: file.type || 'image/jpeg',
                  data: base64
                }
              },
              {
                text: `Enhance this business card photo:
1. Crop tightly to the card edges
2. Correct perspective distortion (make edges straight and rectangular)
3. Improve sharpness and readability
4. Keep all text, logos, and colors exactly as they are
5. Output as a clean, professional-looking scan`
              }
            ]
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          }
        })
      }
    )
    const result = await response.json()
    console.log('Nano Banana Pro Response:', response.status, result)
    const imagePart = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)
    if (imagePart?.inlineData?.data) {
      const binaryString = atob(imagePart.inlineData.data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: imagePart.inlineData.mimeType || 'image/png' })
      const previewUrl = URL.createObjectURL(blob)
      const enhancedFile = new File([blob], 'enhanced.png', { type: blob.type })
      return { previewUrl, enhancedFile }
    }
    throw new Error('Keine verbesserte Bilddaten in der Antwort')
  }

  const { handleBusinessCardScan } = contactScan.useBusinessCardScan({
    mistralApiKey,
    googleApiKey,
    fetchMistralApiKey,
    fetchGoogleApiKey,
    detectRotationWithAI,
    rotateImageByDegrees,
    compressImage,
    getEnhancedImage,
    checkContactDuplicates,
    openContactFormWithOcrData,
    contactsApi: contactScanApi,
  })
  const businessCardScanRef = useRef(null)
  const mobileNavTimerRef = useRef(null)
  const isInitialMount = useRef(true)
  const {
    weatherLocation,
    weatherInput,
    weatherData,
    weatherLoading,
    weatherError,
    weatherModalOpen,
    setWeatherLocation,
    setWeatherInput,
    weatherDescription,
    WeatherIcon,
    fetchWeather,
    openWeatherModal,
    closeWeatherModal,
  } = useWeather({ pharmacies })
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
  const [businessCards, setBusinessCards] = useState([])
  const [businessCardsLoading, setBusinessCardsLoading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false)
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [photoSaving, setPhotoSaving] = useState(false)
  const photoImgRef = useRef(null)
  const signatureCanvasRef = useRef(null)
  const signatureCtxRef = useRef(null)
  const pznCameraInputRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [photoOcrData, setPhotoOcrData] = useState({})
  const [enhanceFile, setEnhanceFile] = useState(null)
  const [enhancePreview, setEnhancePreview] = useState('')
  const [enhanceResultPreview, setEnhanceResultPreview] = useState('')
  const [enhanceLoading, setEnhanceLoading] = useState(false)
  const [enhanceMessage, setEnhanceMessage] = useState('')
  const [ocrProcessing, setOcrProcessing] = useState({})
  const [apoTab, setApoTab] = useState(() => localStorage.getItem('nav_apoTab') || 'amk')
  const [apoYear, setApoYear] = useState(() => new Date().getFullYear())
  const [apoSearch, setApoSearch] = useState('')
  const [amkMessages, setAmkMessages] = useState([])
  const [amkLoading, setAmkLoading] = useState(false)
  const [recallMessages, setRecallMessages] = useState([])
  const [recallLoading, setRecallLoading] = useState(false)
  const [lavAusgaben, setLavAusgaben] = useState([])
  const [lavLoading, setLavLoading] = useState(false)
  const [selectedApoMessage, setSelectedApoMessage] = useState(null)
  const [showDokumentationModal, setShowDokumentationModal] = useState(false)
  const [dokumentationBemerkung, setDokumentationBemerkung] = useState('')
  const [dokumentationSignature, setDokumentationSignature] = useState(null)
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false)
  const [dokumentationLoading, setDokumentationLoading] = useState(false)
  const [existingDokumentationen, setExistingDokumentationen] = useState([])
  const [savedPznFotos, setSavedPznFotos] = useState({})  // { pzn: foto_path } - aus DB geladen
  const [pznFotoUploading, setPznFotoUploading] = useState(false)
  const [activePzn, setActivePzn] = useState(null)
  const [unreadCounts, setUnreadCounts] = useState({ amk: 0, recall: 0, lav: 0 })
  const [readMessageIds, setReadMessageIds] = useState({ amk: new Set(), recall: new Set(), lav: new Set() })
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
  const [showWeekends, setShowWeekends] = useState(false)
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
  const [dashboardEvents, setDashboardEvents] = useState([])
  const [dashboardEventsLoading, setDashboardEventsLoading] = useState(false)

  // GH-Rechnungen
  const {
    rechnungen,
    rechnungenLoading,
    collapsedDays,
    pdfModalOpen,
    selectedPdf,
    fetchRechnungen,
    openPdfModal,
    closePdfModal,
    setCollapsedDays,
  } = useRechnungen()

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
    { id: 'dashboard', icon: () => <House size={20} weight="regular" />, label: 'Dashboard' },
    { id: 'photos', icon: () => <Camera size={20} weight="regular" />, label: 'Fotos' },
    { id: 'apo', icon: () => <Pill size={20} weight="regular" />, label: 'Apo' },
    { id: 'plan', icon: () => <CalendarDots size={20} weight="regular" />, label: 'Plan' },
    { id: 'calendar', icon: () => <CalendarBlank size={20} weight="regular" />, label: 'Kalender' },
    { id: 'chat', icon: () => <ChatCircle size={20} weight="regular" />, label: 'Chat' },
    { id: 'post', icon: () => <Icons.PostHorn />, label: 'Post' },
    { id: 'settings', icon: () => <GearSix size={20} weight="regular" />, label: 'Einstellungen' },
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
      { id: 'visitenkarten', label: 'Visitenkarten' },
    ],
    apo: [
      { id: 'amk', label: 'AMK' },
      { id: 'recall', label: 'Rückrufe' },
      { id: 'lav', label: 'LAV' },
    ],
    plan: [
      { id: 'timeline', label: 'Zeitplan' },
    ],
    calendar: [
      { id: 'calendars', label: 'Kalender' },
    ],
    chat: [
      { id: 'inbox', label: 'Inbox' },
      { id: 'team', label: 'Team' },
      { id: 'settings', label: 'Einstellungen' },
    ],
    post: [
      { id: 'email', label: 'Email' },
      { id: 'fax', label: 'Fax' },
    ],
    settings: [
      { id: 'pharmacies', label: 'Apotheken' },
      { id: 'staff', label: 'Kollegium' },
      { id: 'contacts', label: 'Kontakte' },
      { id: 'email', label: 'E-Mail' },
      { id: 'card-enhance', label: 'Karten-Test' },
    ],
  }

  useEffect(() => {
    // Beim ersten Mount den gespeicherten Wert behalten
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (activeView === 'settings' || activeView === 'apo') return
    const nextItems = secondaryNavMap[activeView] || []
    if (nextItems.length) {
      setSecondaryTab(nextItems[0].id)
    }
  }, [activeView])

  // Navigation in localStorage speichern
  useEffect(() => {
    localStorage.setItem('nav_activeView', activeView)
  }, [activeView])

  useEffect(() => {
    localStorage.setItem('nav_secondaryTab', secondaryTab)
  }, [secondaryTab])

  useEffect(() => {
    localStorage.setItem('nav_settingsTab', settingsTab)
  }, [settingsTab])

  useEffect(() => {
    localStorage.setItem('nav_apoTab', apoTab)
  }, [apoTab])

  // Mobile Nav: Nach 3 Sekunden automatisch schließen wenn primärer Punkt gewählt
  useEffect(() => {
    // Timer abbrechen wenn vorhanden
    if (mobileNavTimerRef.current) {
      clearTimeout(mobileNavTimerRef.current)
      mobileNavTimerRef.current = null
    }
    // Nur Timer starten wenn Menü offen ist
    if (mobileNavOpen) {
      mobileNavTimerRef.current = setTimeout(() => {
        setMobileNavOpen(false)
      }, 5000)
    }
    return () => {
      if (mobileNavTimerRef.current) {
        clearTimeout(mobileNavTimerRef.current)
      }
    }
  }, [activeView, mobileNavOpen])

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

  // PDF-Download für AMK-Meldungen
  const downloadAmkPdf = async (msg) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - margin * 2
    let y = 20

    // Logo laden und einfügen
    try {
      const logoUrl = `${supabaseUrl}/storage/v1/object/public/assets/AMK-Logo.jpg`
      const response = await fetch(logoUrl)
      const blob = await response.blob()
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result.split(',')[1])
        reader.readAsDataURL(blob)
      })
      doc.addImage(base64, 'JPEG', margin, y, 60, 28)
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

    // Volltext (ohne doppelten Titel/Datum am Anfang)
    if (msg.full_text) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      // Entferne Titel und Datum am Anfang des Textes, falls vorhanden
      let cleanedText = msg.full_text
      if (msg.title && cleanedText.startsWith(msg.title)) {
        cleanedText = cleanedText.substring(msg.title.length).trim()
      }
      // Entferne Datumszeile am Anfang (Format: dd.mm.yyyy oder yyyy-mm-dd)
      cleanedText = cleanedText.replace(/^\d{1,2}\.\d{1,2}\.\d{4}\s*\n?/, '').trim()
      cleanedText = cleanedText.replace(/^\d{4}-\d{2}-\d{2}\s*\n?/, '').trim()

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
        // Berechne Box-Höhe
        let boxHeight = 16 // Padding oben/unten
        const boxPadding = 8
        const innerWidth = maxWidth - boxPadding * 2

        let bemerkungLines = []
        if (dok.bemerkung) {
          doc.setFontSize(14)
          bemerkungLines = doc.splitTextToSize(dok.bemerkung, innerWidth)
          boxHeight += bemerkungLines.length * 7
        }
        if (dok.unterschrift_data) {
          boxHeight += 38 // Größere Unterschrift (75x30) + Abstand
        }
        boxHeight += 14 // Name/Datum

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
          } catch (e) {
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
    }

    // Download
    const filename = `AMK_${msg.title?.substring(0, 30).replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_') || 'Meldung'}.pdf`
    doc.save(filename)
  }

  // PDF-Download für Rückrufe
  const downloadRecallPdf = async (msg) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - margin * 2
    let y = 20

    // Logo laden und einfügen (AMK-Logo)
    try {
      const logoUrl = `${supabaseUrl}/storage/v1/object/public/assets/AMK-Logo.jpg`
      const response = await fetch(logoUrl)
      const blob = await response.blob()
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result.split(',')[1])
        reader.readAsDataURL(blob)
      })
      doc.addImage(base64, 'JPEG', margin, y, 60, 28)
      y += 38
    } catch (e) {
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

      let cleanedText = msg.full_text
      if (msg.title && cleanedText.startsWith(msg.title)) {
        cleanedText = cleanedText.substring(msg.title.length).trim()
      }
      cleanedText = cleanedText.replace(/^\d{1,2}\.\d{1,2}\.\d{4}\s*\n?/, '').trim()
      cleanedText = cleanedText.replace(/^\d{4}-\d{2}-\d{2}\s*\n?/, '').trim()

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
        // Berechne Box-Höhe
        let boxHeight = 16 // Padding oben/unten
        const boxPadding = 8
        const innerWidth = maxWidth - boxPadding * 2

        let bemerkungLines = []
        if (dok.bemerkung) {
          doc.setFontSize(14)
          bemerkungLines = doc.splitTextToSize(dok.bemerkung, innerWidth)
          boxHeight += bemerkungLines.length * 7
        }
        if (dok.unterschrift_data) {
          boxHeight += 38 // Größere Unterschrift (75x30) + Abstand
        }
        // Platz für PZN-Fotos
        if (dok.pzn_fotos && Object.keys(dok.pzn_fotos).length > 0) {
          boxHeight += 65 // Foto (60x45) + Label + Abstand
        }
        boxHeight += 14 // Name/Datum

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
          } catch (e) {
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
              const photoResponse = await fetch(photoUrl)
              const photoBlob = await photoResponse.blob()
              const photoBase64 = await new Promise((resolve) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result)
                reader.readAsDataURL(photoBlob)
              })

              // Foto einfügen (60x45 - 50% größer)
              doc.addImage(photoBase64, 'JPEG', photoX, boxY, 60, 45)

              // PZN-Label unter dem Foto
              doc.setFontSize(8)
              doc.setFont('helvetica', 'normal')
              doc.text(pzn, photoX + 30, boxY + 50, { align: 'center' })

              photoX += 65
            } catch (e) {
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
    }

    // Download
    const filename = `Rueckruf_${msg.product_name?.substring(0, 30).replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_') || msg.title?.substring(0, 30).replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_') || 'Meldung'}.pdf`
    doc.save(filename)
  }

  // EXIF-Orientation aus JPEG auslesen (1-8)
  const getExifOrientation = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const view = new DataView(e.target.result)
        if (view.getUint16(0, false) !== 0xFFD8) {
          resolve(1) // Kein JPEG
          return
        }
        let offset = 2
        while (offset < view.byteLength) {
          const marker = view.getUint16(offset, false)
          offset += 2
          if (marker === 0xFFE1) { // APP1 (EXIF)
            if (view.getUint32(offset + 2, false) !== 0x45786966) { // "Exif"
              resolve(1)
              return
            }
            const little = view.getUint16(offset + 8, false) === 0x4949
            const tags = view.getUint16(offset + 16, little)
            for (let i = 0; i < tags; i++) {
              const tagOffset = offset + 18 + i * 12
              if (view.getUint16(tagOffset, little) === 0x0112) { // Orientation tag
                resolve(view.getUint16(tagOffset + 8, little))
                return
              }
            }
            resolve(1)
            return
          } else if ((marker & 0xFF00) !== 0xFF00) {
            break
          } else {
            offset += view.getUint16(offset, false)
          }
        }
        resolve(1)
      }
      reader.readAsArrayBuffer(file.slice(0, 65536))
    })
  }

  // Bild automatisch drehen basierend auf EXIF-Orientation
  const autoRotateImage = async (file) => {
    const orientation = await getExifOrientation(file)
    if (orientation === 1) return file // Keine Drehung nötig

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          // Canvas-Größe basierend auf Orientation
          if (orientation >= 5 && orientation <= 8) {
            canvas.width = img.height
            canvas.height = img.width
          } else {
            canvas.width = img.width
            canvas.height = img.height
          }

          // Transformation basierend auf Orientation
          switch (orientation) {
            case 2: ctx.transform(-1, 0, 0, 1, canvas.width, 0); break // Horizontal flip
            case 3: ctx.transform(-1, 0, 0, -1, canvas.width, canvas.height); break // 180°
            case 4: ctx.transform(1, 0, 0, -1, 0, canvas.height); break // Vertical flip
            case 5: ctx.transform(0, 1, 1, 0, 0, 0); break // 90° CW + flip
            case 6: ctx.transform(0, 1, -1, 0, canvas.width, 0); break // 90° CW
            case 7: ctx.transform(0, -1, -1, 0, canvas.width, canvas.height); break // 90° CCW + flip
            case 8: ctx.transform(0, -1, 1, 0, 0, canvas.height); break // 90° CCW
            default: break
          }

          ctx.drawImage(img, 0, 0)
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          }, 'image/jpeg', 0.95)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const rotateImage = (file, degrees) => {
    return new Promise((resolve) => {
      if (degrees === 0) {
        resolve(file)
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const isRotated90or270 = degrees === 90 || degrees === 270
          canvas.width = isRotated90or270 ? img.height : img.width
          canvas.height = isRotated90or270 ? img.width : img.height
          const ctx = canvas.getContext('2d')
          ctx.translate(canvas.width / 2, canvas.height / 2)
          ctx.rotate((degrees * Math.PI) / 180)
          ctx.drawImage(img, -img.width / 2, -img.height / 2)
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
          }, 'image/jpeg', 0.9)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const handleContactCardChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    contactScanApi.setContactCardFile(file)
    contactScanApi.setContactCardPreview(URL.createObjectURL(file))
    contactScanApi.setContactCardEnhancedFile(null)
    contactScanApi.setContactCardEnhancedPreview('')
    contactScanApi.setContactCardEnhancing(false)
    contactScanApi.setContactCardRotation(0)
  }

  const handleEnhanceFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setEnhanceFile(file)
    setEnhancePreview(URL.createObjectURL(file))
    setEnhanceResultPreview('')
    setEnhanceMessage('')
  }

  const runBusinessCardEnhance = async () => {
    if (!enhanceFile) {
      setEnhanceMessage('Bitte zuerst ein Foto auswählen.')
      return
    }

    let apiKey = googleApiKey
    if (!apiKey) {
      apiKey = await fetchGoogleApiKey()
    }
    if (!apiKey) {
      setEnhanceMessage('Google API Key nicht gefunden (erwartet: name = "Google Nano Banana").')
      return
    }

    setEnhanceLoading(true)
    setEnhanceMessage('')
    setEnhanceResultPreview('')

    try {
      const { previewUrl } = await getEnhancedImage(enhanceFile, apiKey)
      setEnhanceResultPreview(previewUrl)
    } catch (error) {
      setEnhanceMessage(error.message || 'Verbesserung fehlgeschlagen.')
    } finally {
      setEnhanceLoading(false)
    }
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

  // Dokumentationen laden (AMK oder Recall)
  const loadDokumentationen = async (messageId, messageType = 'amk') => {
    setDokumentationLoading(true)
    const tableName = messageType === 'recall' ? 'recall_dokumentationen' : 'amk_dokumentationen'
    const idColumn = messageType === 'recall' ? 'recall_message_id' : 'amk_message_id'

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(idColumn, messageId)
      .order('erstellt_am', { ascending: false })

    if (!error && data) {
      setExistingDokumentationen(data)
    } else {
      setExistingDokumentationen([])
    }
    setDokumentationLoading(false)
  }

  // Signature Canvas initialisieren
  const initSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#1F2937'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    signatureCtxRef.current = ctx
    // Canvas leeren
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const startDrawing = (e) => {
    const canvas = signatureCanvasRef.current
    const ctx = signatureCtxRef.current
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let x, y
    if (e.touches) {
      x = (e.touches[0].clientX - rect.left) * scaleX
      y = (e.touches[0].clientY - rect.top) * scaleY
    } else {
      x = (e.clientX - rect.left) * scaleX
      y = (e.clientY - rect.top) * scaleY
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = signatureCanvasRef.current
    const ctx = signatureCtxRef.current
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let x, y
    if (e.touches) {
      e.preventDefault()
      x = (e.touches[0].clientX - rect.left) * scaleX
      y = (e.touches[0].clientY - rect.top) * scaleY
    } else {
      x = (e.clientX - rect.left) * scaleX
      y = (e.clientY - rect.top) * scaleY
    }

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (isDrawing) {
      signatureCtxRef.current?.closePath()
      setIsDrawing(false)
      // Signatur als Base64 speichern
      const canvas = signatureCanvasRef.current
      if (canvas) {
        setDokumentationSignature(canvas.toDataURL('image/png'))
      }
    }
  }

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current
    const ctx = signatureCtxRef.current
    if (canvas && ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      setDokumentationSignature(null)
    }
  }

  // Dokumentation speichern (AMK oder Recall)
  const saveDokumentation = async () => {
    const hasSavedPznFotos = Object.keys(savedPznFotos).length > 0
    if (!selectedApoMessage?.id || (!dokumentationBemerkung.trim() && !dokumentationSignature && !hasSavedPznFotos)) return

    const messageType = selectedApoMessage.type
    const tableName = messageType === 'recall' ? 'recall_dokumentationen' : 'amk_dokumentationen'
    const idColumn = messageType === 'recall' ? 'recall_message_id' : 'amk_message_id'

    // Name des eingeloggten Nutzers ermitteln
    const currentStaffMember = staffByAuthId[session?.user?.id]
    const userName = currentStaffMember
      ? `${currentStaffMember.first_name || ''} ${currentStaffMember.last_name || ''}`.trim()
      : session?.user?.email || 'Unbekannt'

    setDokumentationLoading(true)

    // PZN-Fotos aus der recall_pzn_fotos Tabelle in die Dokumentation kopieren
    const pznFotoPaths = messageType === 'recall' && hasSavedPznFotos ? savedPznFotos : null

    const { error } = await supabase
      .from(tableName)
      .insert({
        [idColumn]: selectedApoMessage.id,
        bemerkung: dokumentationBemerkung.trim() || null,
        unterschrift_data: dokumentationSignature || null,
        erstellt_von: session?.user?.id || null,
        erstellt_von_name: userName,
        pharmacy_id: pharmacies[0]?.id || null,
        ...(pznFotoPaths ? { pzn_fotos: pznFotoPaths } : {})
      })

    if (!error) {
      // Dokumentationen neu laden (für Button-Status)
      await loadDokumentationen(selectedApoMessage.id, messageType)
      // Liste aktualisieren (für Karten-Status)
      if (messageType === 'recall') {
        fetchRecallMessages(apoYear)
      } else {
        fetchAmkMessages(apoYear)
      }
      // Modal schließen nach erfolgreichem Speichern
      setShowDokumentationModal(false)
      setShowSignatureCanvas(false)
      setDokumentationBemerkung('')
      setDokumentationSignature(null)
    }
    setDokumentationLoading(false)
  }

  // PZN-Fotos aus Datenbank laden
  const loadSavedPznFotos = async (recallMessageId) => {
    const { data, error } = await supabase
      .from('recall_pzn_fotos')
      .select('pzn, foto_path')
      .eq('recall_message_id', recallMessageId)

    if (!error && data) {
      const fotosMap = {}
      data.forEach(item => {
        fotosMap[item.pzn] = item.foto_path
      })
      setSavedPznFotos(fotosMap)
    } else {
      setSavedPznFotos({})
    }
  }

  // PZN-Foto Handler
  const handlePznClick = (pzn) => {
    if (pznFotoUploading) return
    setActivePzn(pzn)
    pznCameraInputRef.current?.click()
  }

  const handlePznCameraCapture = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !activePzn || !selectedApoMessage?.id) return

    setPznFotoUploading(true)

    try {
      // Bestehende compressImage Funktion nutzen (max 800px, 0.7 quality)
      const compressed = await compressImage(file, 800, 0.7)

      // Foto sofort nach Storage hochladen
      const fileName = `${Date.now()}-${activePzn}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('recall-fotos')
        .upload(fileName, compressed)

      if (uploadError) {
        console.error('Foto-Upload fehlgeschlagen:', uploadError.message)
        return
      }

      // Name des eingeloggten Nutzers ermitteln
      const currentStaffMember = staffByAuthId[session?.user?.id]
      const userName = currentStaffMember
        ? `${currentStaffMember.first_name || ''} ${currentStaffMember.last_name || ''}`.trim()
        : session?.user?.email || 'Unbekannt'

      // In Datenbank speichern (upsert - ersetzt bestehendes Foto für diese PZN)
      const { error: dbError } = await supabase
        .from('recall_pzn_fotos')
        .upsert({
          recall_message_id: selectedApoMessage.id,
          pzn: activePzn,
          foto_path: fileName,
          erstellt_von: session?.user?.id || null,
          erstellt_von_name: userName
        }, {
          onConflict: 'recall_message_id,pzn'
        })

      if (!dbError) {
        // State aktualisieren
        setSavedPznFotos(prev => ({
          ...prev,
          [activePzn]: fileName
        }))
      }
    } catch (e) {
      console.error('Fehler beim Speichern des PZN-Fotos:', e)
    } finally {
      setPznFotoUploading(false)
      setActivePzn(null)
      event.target.value = ''  // Reset für erneute Auswahl
    }
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

  // Dashboard: Alle Termine laden (für Widget)
  const fetchDashboardEvents = async () => {
    setDashboardEventsLoading(true)

    // Erst Kalender laden um Notdienst zu identifizieren
    const { data: calsData } = await supabase
      .from('calendars')
      .select('id, name, color')
      .eq('is_active', true)

    const calendarsList = calsData || []

    // Termine der nächsten 30 Tage laden
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + 30)
    const futureStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}`

    const { data: eventsData, error } = await supabase
      .from('calendar_events')
      .select('id, title, start_time, end_time, all_day, calendar_id, location')
      .gte('start_time', todayStr)
      .lte('start_time', futureStr + 'T23:59:59')
      .order('start_time', { ascending: true })

    if (!error && eventsData) {
      // Events mit Kalenderinfo anreichern
      const enrichedEvents = eventsData.map((event) => {
        const cal = calendarsList.find((c) => c.id === event.calendar_id)
        return {
          ...event,
          calendarName: cal?.name || '',
          calendarColor: cal?.color || '#6B7280',
        }
      })
      setDashboardEvents(enrichedEvents)
    }
    setDashboardEventsLoading(false)
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

  const openCreateModal = () => {
    openPharmacyCreateModal()
    setWeatherModalOpen(false)
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

  const fetchBusinessCards = async () => {
    setBusinessCardsLoading(true)
    try {
      // Hole alle Kontakte mit Visitenkarten-URL
      const { data: contactsWithCards, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, company, business_card_url, business_card_url_enhanced, created_at')
        .or('business_card_url.not.is.null,business_card_url_enhanced.not.is.null')
        .order('created_at', { ascending: false })

      if (error || !contactsWithCards) {
        console.error('Fehler beim Laden der Visitenkarten:', error)
        setBusinessCards([])
        setBusinessCardsLoading(false)
        return
      }

      const cards = contactsWithCards
        .filter((contact) => contact.business_card_url_enhanced || contact.business_card_url)
        .map((contact) => {
          const url = contact.business_card_url_enhanced || contact.business_card_url
          const ext = url.split('.').pop()?.toUpperCase() || 'JPG'
          return {
            id: contact.id,
            contactName: [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unbekannt',
            company: contact.company || '',
            url: url,
            originalUrl: contact.business_card_url || '',
            enhancedUrl: contact.business_card_url_enhanced || '',
            createdAt: contact.created_at,
            format: ext,
          }
        })
      setBusinessCards(cards)
    } catch (err) {
      console.error('Fehler beim Laden der Visitenkarten:', err)
      setBusinessCards([])
    }
    setBusinessCardsLoading(false)
  }

  const deleteBusinessCard = async (card, event) => {
    event.stopPropagation()
    if (!confirm(`Visitenkarte von "${card.contactName}" unwiderruflich löschen?`)) return

    // Lösche die URL aus dem Kontakt
    const { error } = await supabase
      .from('contacts')
      .update({ business_card_url: null, business_card_url_enhanced: null })
      .eq('id', card.id)

    if (error) {
      alert('Löschen fehlgeschlagen: ' + error.message)
      return
    }

    // Optional: Versuche auch die Datei aus dem Storage zu löschen (falls im eigenen Bucket)
    const urlsToDelete = [card.originalUrl, card.enhancedUrl, card.url].filter(Boolean)
    const paths = urlsToDelete
      .map((url) => url.match(/business-cards\/(.+)$/))
      .filter(Boolean)
      .map((match) => match[1])
    if (paths.length > 0) {
      await supabase.storage.from('business-cards').remove(paths)
    }

    setBusinessCards((prev) => prev.filter((c) => c.id !== card.id))
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

  const fetchAmkMessages = async (year) => {
    setAmkLoading(true)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    const { data, error } = await supabase
      .from('abda_amk_messages')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    if (!error && data) {
      // Dokumentationen für alle AMK-Meldungen laden
      const amkIds = data.map(m => m.id)
      const { data: allDoks } = await supabase
        .from('amk_dokumentationen')
        .select('*')
        .in('amk_message_id', amkIds)
        .order('erstellt_am', { ascending: false })

      // Dokumentationen den Meldungen zuordnen
      const doksById = {}
      if (allDoks) {
        for (const dok of allDoks) {
          if (!doksById[dok.amk_message_id]) {
            doksById[dok.amk_message_id] = []
          }
          doksById[dok.amk_message_id].push(dok)
        }
      }

      // Meldungen mit Dokumentationen anreichern
      const enrichedData = data.map(msg => ({
        ...msg,
        dokumentationen: doksById[msg.id] || []
      }))
      setAmkMessages(enrichedData)
    } else {
      setAmkMessages([])
    }
    setAmkLoading(false)
  }

  const fetchRecallMessages = async (year) => {
    setRecallLoading(true)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    const { data, error } = await supabase
      .from('abda_recall')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })
    if (!error && data) {
      // Dokumentationen für alle Rückrufe laden
      const recallIds = data.map(m => m.id)
      const { data: allDoks } = await supabase
        .from('recall_dokumentationen')
        .select('*')
        .in('recall_message_id', recallIds)
        .order('erstellt_am', { ascending: false })

      // Dokumentationen den Rückrufen zuordnen
      const doksById = {}
      if (allDoks) {
        for (const dok of allDoks) {
          if (!doksById[dok.recall_message_id]) {
            doksById[dok.recall_message_id] = []
          }
          doksById[dok.recall_message_id].push(dok)
        }
      }

      // Rückrufe mit Dokumentationen anreichern
      const enrichedData = data.map(msg => ({
        ...msg,
        dokumentationen: doksById[msg.id] || []
      }))
      setRecallMessages(enrichedData)
    } else {
      setRecallMessages([])
    }
    setRecallLoading(false)
  }

  const fetchLavAusgaben = async (year) => {
    setLavLoading(true)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
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

  // Ungelesene Meldungen zählen
  const fetchUnreadCounts = async (year) => {
    if (!session?.user?.id) return
    const { data, error } = await supabase.rpc('get_unread_counts', {
      p_user_id: session.user.id,
      p_year: year,
    })
    if (!error && data) {
      const counts = { amk: 0, recall: 0, lav: 0 }
      data.forEach((row) => {
        counts[row.message_type] = Number(row.unread_count)
      })
      setUnreadCounts(counts)
    }
  }

  // IDs der gelesenen Meldungen laden (für Karten-Hervorhebung)
  const fetchReadMessageIds = async () => {
    if (!session?.user?.id) return
    const { data, error } = await supabase
      .from('message_read_status')
      .select('message_type, message_id')
      .eq('user_id', session.user.id)
    if (!error && data) {
      const ids = { amk: new Set(), recall: new Set(), lav: new Set() }
      data.forEach((row) => {
        ids[row.message_type].add(row.message_id)
      })
      setReadMessageIds(ids)
    }
  }

  // Meldung als gelesen markieren
  const markAsRead = async (messageType, messageId) => {
    if (!session?.user?.id) return
    const idStr = String(messageId)
    // Prüfen ob bereits gelesen
    if (readMessageIds[messageType].has(idStr)) return
    const { error } = await supabase.from('message_read_status').insert({
      user_id: session.user.id,
      message_type: messageType,
      message_id: idStr,
    })
    if (error) {
      // Duplikat-Fehler ignorieren (bereits gelesen)
      if (error.code !== '23505') {
        console.error('markAsRead error:', error)
      }
      return
    }
    if (!error) {
      // Lokalen State aktualisieren
      setUnreadCounts((prev) => ({
        ...prev,
        [messageType]: Math.max(0, prev[messageType] - 1),
      }))
      setReadMessageIds((prev) => {
        const newIds = { ...prev }
        newIds[messageType] = new Set(prev[messageType])
        newIds[messageType].add(idStr)
        return newIds
      })
    }
  }

  const changeApoYear = (delta) => {
    setApoYear((prev) => prev + delta)
  }

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

  const groupByMonth = (items, dateField) => {
    const groups = {}
    items.forEach((item) => {
      const dateValue = item[dateField]
      if (dateValue) {
        const month = new Date(dateValue).getMonth()
        if (!groups[month]) groups[month] = []
        groups[month].push(item)
      }
    })
    return [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
      .filter((m) => groups[m] && groups[m].length > 0)
      .map((m) => ({ month: m, items: groups[m] }))
  }

  const filterApoItems = (items, searchTerm, type) => {
    if (!searchTerm.trim()) return items
    const term = searchTerm.toLowerCase()
    return items.filter((item) => {
      if (type === 'amk' || type === 'recall') {
        return (
          item.title?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term) ||
          item.full_text?.toLowerCase().includes(term) ||
          item.category?.toLowerCase().includes(term) ||
          item.product_name?.toLowerCase().includes(term)
        )
      } else if (type === 'lav') {
        const themeMatch = item.lav_themes?.some((t) => t.titel?.toLowerCase().includes(term))
        return (
          item.subject?.toLowerCase().includes(term) ||
          themeMatch
        )
      }
      return false
    })
  }

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
      fetchEmailAccounts()
      fetchEmailPermissions()
      fetchLatestPhoto()
      fetchAllPhotos()
      fetchPhotoOcrData()
      fetchMistralApiKey()
      fetchGoogleApiKey()
    }
  }, [session])

  useEffect(() => {
    if (session && activeView === 'photos' && secondaryTab === 'visitenkarten') {
      fetchBusinessCards()
    }
  }, [session, activeView, secondaryTab])

  useEffect(() => {
    if (session && activeView === 'apo') {
      if (apoTab === 'amk') {
        fetchAmkMessages(apoYear)
      } else if (apoTab === 'recall') {
        fetchRecallMessages(apoYear)
      } else if (apoTab === 'lav') {
        fetchLavAusgaben(apoYear)
      }
    }
  }, [session, activeView, apoTab, apoYear])

  // Unread-Counts und Read-IDs laden
  useEffect(() => {
    if (session?.user?.id) {
      fetchUnreadCounts(apoYear)
      fetchReadMessageIds()
    }
  }, [session?.user?.id, apoYear])

  // PZN-Fotos laden bei Message-Wechsel (nur für Rückrufe)
  useEffect(() => {
    if (selectedApoMessage?.id && selectedApoMessage?.type === 'recall') {
      loadSavedPznFotos(selectedApoMessage.id)
    } else {
      setSavedPznFotos({})
    }
  }, [selectedApoMessage?.id, selectedApoMessage?.type])

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

  // Dashboard Events laden
  useEffect(() => {
    if (session && activeView === 'dashboard' && dashboardEvents.length === 0 && !dashboardEventsLoading) {
      fetchDashboardEvents()
    }
  }, [activeView, session])

  // GH-Rechnungen laden bei View-Wechsel
  useEffect(() => {
    if (session && activeView === 'rechnungen' && rechnungen.length === 0 && !rechnungenLoading) {
      fetchRechnungen()
    }
  }, [activeView, session])

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

  const handleAuthViewChange = (view) => {
    setAuthView(view)
    setMessage('')
    setSuccessMessage('')
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
      <AuthView
        authView={authView}
        onAuthViewChange={handleAuthViewChange}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        loading={loading}
        message={message}
        successMessage={successMessage}
        handleSignIn={handleSignIn}
        handleForgotPassword={handleForgotPassword}
        handleResetPassword={handleResetPassword}
        theme={theme}
      />
    )
  }

  // Dashboard view
  if (session) {
    return (
      <div className={`min-h-screen ${theme.bgApp} ${theme.textPrimary} flex flex-col relative overflow-hidden`}>
        <DashboardHeader
          theme={theme}
          mobileNavOpen={mobileNavOpen}
          setMobileNavOpen={setMobileNavOpen}
          activeView={activeView}
          settingsTab={settingsTab}
          businessCardScanRef={businessCardScanRef}
          cameraInputRef={cameraInputRef}
          photoUploading={photoUploading}
          businessCardScanning={businessCardScanning}
          handleCameraCapture={handleCameraCapture}
          BusinessCardScanInput={contactScan.BusinessCardScanInput}
          handleBusinessCardScan={handleBusinessCardScan}
          pznCameraInputRef={pznCameraInputRef}
          handlePznCameraCapture={handlePznCameraCapture}
          setActiveView={setActiveView}
          currentStaff={currentStaff}
          session={session}
          handleSignOut={handleSignOut}
          Icons={Icons}
        />

        <div className="flex flex-1 overflow-hidden relative">
          <SidebarNav
            theme={theme}
            mobileNavOpen={mobileNavOpen}
            setMobileNavOpen={setMobileNavOpen}
            navItems={navItems}
            activeView={activeView}
            setActiveView={setActiveView}
            secondaryNavMap={secondaryNavMap}
            getActiveSecondaryId={getActiveSecondaryId}
            handleSecondarySelect={handleSecondarySelect}
            unreadCounts={unreadCounts}
            Icons={Icons}
            UnreadBadge={UnreadBadge}
          />

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-8 overflow-auto">
            <div className={activeView === 'chat' || activeView === 'post' ? 'w-full' : 'max-w-5xl'}>
              {activeView === 'dashboard' && (
                <DashboardHome
                  theme={theme}
                  openWeatherModal={openWeatherModal}
                  weatherLoading={weatherLoading}
                  weatherError={weatherError}
                  weatherData={weatherData}
                  weatherLocation={weatherLocation}
                  weatherDescription={weatherDescription}
                  WeatherIcon={WeatherIcon}
                  Icons={Icons}
                  dashboardEventsLoading={dashboardEventsLoading}
                  dashboardEvents={dashboardEvents}
                  setActiveView={setActiveView}
                  photoUploading={photoUploading}
                  latestPhoto={latestPhoto}
                />
              )}

              {activeView === 'photos' && (
                <PhotosView
                  theme={theme}
                  Icons={Icons}
                  secondaryTab={secondaryTab}
                  photosLoading={photosLoading}
                  allPhotos={allPhotos}
                  deletePhoto={deletePhoto}
                  openPhotoEditor={openPhotoEditor}
                  ocrProcessing={ocrProcessing}
                  photoOcrData={photoOcrData}
                  runOcrForPhoto={runOcrForPhoto}
                  businessCardsLoading={businessCardsLoading}
                  businessCards={businessCards}
                  deleteBusinessCard={deleteBusinessCard}
                />
              )}

              {activeView === 'apo' && (
                <ApoView
                  theme={theme}
                  Icons={Icons}
                  apoYear={apoYear}
                  changeApoYear={changeApoYear}
                  apoSearch={apoSearch}
                  setApoSearch={setApoSearch}
                  apoTab={apoTab}
                  amkLoading={amkLoading}
                  amkMessages={amkMessages}
                  recallLoading={recallLoading}
                  recallMessages={recallMessages}
                  lavLoading={lavLoading}
                  lavAusgaben={lavAusgaben}
                  filterApoItems={filterApoItems}
                  groupByMonth={groupByMonth}
                  monthNames={monthNames}
                  currentStaff={currentStaff}
                  readMessageIds={readMessageIds}
                  setSelectedApoMessage={setSelectedApoMessage}
                  markAsRead={markAsRead}
                  loadDokumentationen={loadDokumentationen}
                  ReactMarkdown={ReactMarkdown}
                  remarkGfm={remarkGfm}
                />
              )}

              {activeView === 'chat' && (
                <ChatView
                  theme={theme}
                  chatLoading={chatLoading}
                  chatMessages={chatMessages}
                  staffByAuthId={staffByAuthId}
                  session={session}
                  chatEndRef={chatEndRef}
                  chatError={chatError}
                  sendChatMessage={sendChatMessage}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  chatSending={chatSending}
                />
              )}

              {activeView === 'plan' && (
                <PlanView
                  theme={theme}
                  planData={planData}
                  planLoading={planLoading}
                  planError={planError}
                  fetchPlanData={fetchPlanData}
                  setPlanData={setPlanData}
                  setPlanError={setPlanError}
                  selectedPlanDate={selectedPlanDate}
                  setSelectedPlanDate={setSelectedPlanDate}
                />
              )}

              {activeView === 'calendar' && (
                <CalendarView
                  theme={theme}
                  calendars={calendars}
                  selectedCalendarId={selectedCalendarId}
                  setSelectedCalendarId={setSelectedCalendarId}
                  calendarViewMode={calendarViewMode}
                  setCalendarViewMode={setCalendarViewMode}
                  calendarViewDate={calendarViewDate}
                  setCalendarViewDate={setCalendarViewDate}
                  Icons={Icons}
                  currentStaff={currentStaff}
                  openCalendarModal={openCalendarModal}
                  setPermissionsModalOpen={setPermissionsModalOpen}
                  fetchCalendarPermissions={fetchCalendarPermissions}
                  calendarsLoading={calendarsLoading}
                  eventsLoading={eventsLoading}
                  calendarsError={calendarsError}
                  calendarEvents={calendarEvents}
                  showWeekends={showWeekends}
                  setShowWeekends={setShowWeekends}
                  canWriteCurrentCalendar={canWriteCurrentCalendar}
                  openEventModal={openEventModal}
                  getEventColor={getEventColor}
                />
              )}

              {activeView === 'rechnungen' && (
                <>
                  <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Großhandelsrechnungen</h2>

                  {rechnungenLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <svg className="w-8 h-8 animate-spin text-[#4A90E2]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  ) : rechnungen.length === 0 ? (
                    <div className={`${theme.panel} rounded-2xl p-8 border ${theme.border} ${theme.cardShadow} text-center`}>
                      <Icons.FileText className="w-12 h-12 mx-auto mb-4 text-[#9CA3AF]" />
                      <p className={theme.textMuted}>Keine Rechnungen vorhanden.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(() => {
                        // Nach Datum gruppieren
                        const byDate = rechnungen.reduce((acc, r) => {
                          const dateKey = r.datum
                          if (!acc[dateKey]) acc[dateKey] = []
                          acc[dateKey].push(r)
                          return acc
                        }, {})

                        // Sortierte Datumsschlüssel (neueste zuerst)
                        const sortedDates = Object.keys(byDate).sort((a, b) => new Date(b) - new Date(a))

                        return sortedDates.map((dateKey, index) => {
                          const dayRechnungen = byDate[dateKey]
                          const phoenix = dayRechnungen.filter(r => r.grosshaendler?.toLowerCase() === 'phoenix')
                          const ahd = dayRechnungen.filter(r => r.grosshaendler?.toLowerCase() === 'ahd')
                          const sanacorp = dayRechnungen.filter(r => r.grosshaendler?.toLowerCase() === 'sanacorp')

                          const dateLabel = new Date(dateKey).toLocaleDateString('de-DE', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })

                          // Erster Tag (neueste) ist ausgeklappt, alle anderen eingeklappt
                          const isCollapsed = index === 0
                            ? collapsedDays[dateKey] === true
                            : collapsedDays[dateKey] !== false

                          const toggleDay = () => {
                            setCollapsedDays(prev => ({
                              ...prev,
                              [dateKey]: !isCollapsed
                            }))
                          }

                          return (
                            <div key={dateKey}>
                              {/* Tagesüberschrift - klickbar */}
                              <button
                                onClick={toggleDay}
                                className={`w-full flex items-center gap-3 mb-3 group cursor-pointer`}
                              >
                                <svg
                                  className={`w-4 h-4 ${theme.textMuted} transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <h3 className="text-base font-semibold">{dateLabel}</h3>
                                <span className={`text-xs ${theme.textMuted}`}>({dayRechnungen.length})</span>
                                <div className={`flex-1 h-px ${theme.border} border-t`} />
                              </button>

                              {/* Drei Spalten für den Tag - nur wenn ausgeklappt */}
                              {!isCollapsed && <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {/* Phoenix - grün */}
                                <div className="space-y-1">
                                  {phoenix.length > 0 ? phoenix.map(r => (
                                    <button
                                      key={r.id}
                                      onClick={() => openPdfModal(r)}
                                      className="w-full text-left px-3 py-2 rounded-lg bg-[#E8F5E9] hover:bg-[#C8E6C9] transition-colors border-l-4 border-[#2E7D32]"
                                    >
                                      <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-[#1B5E20]">{r.rechnungsnummer}</p>
                                        <span className="text-xs text-[#2E7D32]">{new Date(r.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</span>
                                      </div>
                                      <p className={`text-xs ${theme.textMuted}`}>{r.dateiname}</p>
                                    </button>
                                  )) : (
                                    <div className="px-3 py-2 rounded-lg bg-gray-50 text-center">
                                      <p className={`text-xs ${theme.textMuted}`}>–</p>
                                    </div>
                                  )}
                                </div>

                                {/* AHD - gelb */}
                                <div className="space-y-1">
                                  {ahd.length > 0 ? ahd.map(r => (
                                    <button
                                      key={r.id}
                                      onClick={() => openPdfModal(r)}
                                      className="w-full text-left px-3 py-2 rounded-lg bg-[#FFF8E1] hover:bg-[#FFECB3] transition-colors border-l-4 border-[#F9A825]"
                                    >
                                      <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-[#F57F17]">{r.rechnungsnummer}</p>
                                        <span className="text-xs text-[#F9A825]">{new Date(r.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</span>
                                      </div>
                                      <p className={`text-xs ${theme.textMuted}`}>{r.dateiname}</p>
                                    </button>
                                  )) : (
                                    <div className="px-3 py-2 rounded-lg bg-gray-50 text-center">
                                      <p className={`text-xs ${theme.textMuted}`}>–</p>
                                    </div>
                                  )}
                                </div>

                                {/* Sanacorp - blau */}
                                <div className="space-y-1">
                                  {sanacorp.length > 0 ? sanacorp.map(r => (
                                    <button
                                      key={r.id}
                                      onClick={() => openPdfModal(r)}
                                      className="w-full text-left px-3 py-2 rounded-lg bg-[#E3F2FD] hover:bg-[#BBDEFB] transition-colors border-l-4 border-[#1565C0]"
                                    >
                                      <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-[#0D47A1]">{r.rechnungsnummer}</p>
                                        <span className="text-xs text-[#1565C0]">{new Date(r.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</span>
                                      </div>
                                      <p className={`text-xs ${theme.textMuted}`}>{r.dateiname}</p>
                                    </button>
                                  )) : (
                                    <div className="px-3 py-2 rounded-lg bg-gray-50 text-center">
                                      <p className={`text-xs ${theme.textMuted}`}>–</p>
                                    </div>
                                  )}
                                </div>
                              </div>}
                            </div>
                          )
                        })
                      })()}
                    </div>
                  )}
                </>
              )}

              {activeView === 'post' && (
                <>
                  <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">
                    {secondaryTab === 'email' ? 'Email' : 'Fax'}
                  </h2>

                  {secondaryTab === 'email' && (
                    <EmailView
                      theme={theme}
                      account={emailAccounts.find(a => a.id === selectedEmailAccount)}
                      hasAccess={currentUserEmailAccess}
                      onConfigureClick={() => {
                        setActiveView('settings')
                        setSettingsTab('email')
                      }}
                    />
                  )}

                  {secondaryTab === 'fax' && (
                    <div className={`${theme.panel} rounded-2xl p-8 border ${theme.border} ${theme.cardShadow}`}>
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className={`${theme.textMuted} mb-6`}>
                          <Printer size={80} weight="light" />
                        </div>
                        <p className={`text-lg ${theme.textMuted}`}>Fax-Bereich (in Entwicklung)</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeView === 'settings' && (
                <SettingsView
                  theme={theme}
                  settingsTab={settingsTab}
                  pharmacies={pharmacies}
                  pharmaciesMessage={pharmaciesMessage}
                  pharmaciesLoading={pharmaciesLoading}
                  fetchPharmacies={fetchPharmacies}
                  openCreateModal={openCreateModal}
                  openEditModal={openEditModal}
                  staff={staff}
                  staffMessage={staffMessage}
                  staffLoading={staffLoading}
                  fetchStaff={fetchStaff}
                  openStaffModal={openStaffModal}
                  pharmacyLookup={pharmacyLookup}
                  EmailSettingsSection={EmailSettingsSection}
                  currentStaff={currentStaff}
                  emailAccounts={emailAccounts}
                  selectedEmailAccount={selectedEmailAccount}
                  handleSelectEmailAccount={handleSelectEmailAccount}
                  openEmailAccountModal={openEmailAccountModal}
                  handleDeleteEmailAccount={handleDeleteEmailAccount}
                  emailPermissions={emailPermissions}
                  toggleEmailPermission={toggleEmailPermission}
                  Icons={Icons}
                  enhanceMessage={enhanceMessage}
                  fetchGoogleApiKey={fetchGoogleApiKey}
                  handleEnhanceFileChange={handleEnhanceFileChange}
                  runBusinessCardEnhance={runBusinessCardEnhance}
                  enhanceFile={enhanceFile}
                  enhanceLoading={enhanceLoading}
                  enhancePreview={enhancePreview}
                  enhanceResultPreview={enhanceResultPreview}
                  ContactsSettingsSection={ContactsSettingsSection}
                  contacts={contacts}
                  filteredContacts={filteredContacts}
                  contactSearch={contactSearch}
                  setContactSearch={setContactSearch}
                  contactViewMode={contactViewMode}
                  setContactViewMode={setContactViewMode}
                  contactsLoading={contactsLoading}
                  contactsMessage={contactsMessage}
                  contactTypeLabels={contactTypeLabels}
                  fetchContacts={fetchContacts}
                  openContactModal={openContactModal}
                  openContactDetail={openContactDetail}
                />
              )}
            </div>
          </main>
        </div>

        <contactScan.BusinessCardScanOverlay theme={theme} show={businessCardScanning} />

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

        <EmailAccountModal
          theme={theme}
          editingEmailAccount={editingEmailAccount}
          emailAccountForm={emailAccountForm}
          emailAccountMessage={emailAccountMessage}
          emailAccountSaving={emailAccountSaving}
          onClose={closeEmailAccountModal}
          onSave={handleSaveEmailAccount}
          setEmailAccountForm={setEmailAccountForm}
          CloseIcon={Icons.X}
        />

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
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Angestellt seit
                    </label>
                    <input
                      type="date"
                      value={staffForm.employedSince}
                      onChange={(e) => handleStaffInput('employedSince', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
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

        <ContactDetailModal
          theme={theme}
          selectedContact={selectedContact}
          selectedCardUrl={selectedCardUrl}
          selectedCardHasEnhanced={selectedCardHasEnhanced}
          selectedCardHasOriginal={selectedCardHasOriginal}
          selectedContactCardView={selectedContactCardView}
          contactTypeLabels={contactTypeLabels}
          onClose={() => setSelectedContact(null)}
          onEdit={() => {
            openContactModal(selectedContact)
            setSelectedContact(null)
          }}
          onEditInStaff={() => {
            setSettingsTab('staff')
            setSelectedContact(null)
          }}
          onSelectCardView={setSelectedContactCardView}
          CloseIcon={Icons.X}
        />

        <contactScan.ContactDuplicateDialog
          theme={theme}
          duplicateDialogOpen={duplicateDialogOpen}
          duplicateCheckResult={duplicateCheckResult}
          onClose={() => contactScanApi.setDuplicateDialogOpen(false)}
          onDuplicateUpdate={handleDuplicateUpdate}
          onNewRepresentative={handleNewRepresentative}
          onCreateNewContact={handleCreateNewContact}
        />

        <ContactFormModal
          theme={theme}
          editingContact={editingContact}
          contactForm={contactForm}
          contactSaveLoading={contactSaveLoading}
          contactSaveMessage={contactSaveMessage}
          contactCardPreview={contactCardPreview}
          contactCardEnhancedPreview={contactCardEnhancedPreview}
          contactCardRotation={contactCardRotation}
          contactCardEnhancing={contactCardEnhancing}
          contactScanStatus={
            <contactScan.BusinessCardScanStatusBanner
              businessCardScanning={businessCardScanning}
              ocrError={ocrError}
              theme={theme}
            />
          }
          onClose={closeContactModal}
          onDelete={() => {
            deleteContact(editingContact.id)
            closeContactModal()
          }}
          onSubmit={(event) => {
            event.preventDefault()
            saveContact({
              currentStaffId: currentStaff?.id,
              rotateImage,
              contactCardRotation,
              contactCardFile,
              contactCardEnhancedFile,
            })
          }}
          onContactInput={handleContactInput}
          onCardFileChange={handleContactCardChange}
          onResetCard={() => {
            contactScanApi.setContactCardFile(null)
            contactScanApi.setContactCardPreview('')
            contactScanApi.setContactCardEnhancedFile(null)
            contactScanApi.setContactCardEnhancedPreview('')
            contactScanApi.setContactCardEnhancing(false)
            contactScanApi.setContactCardRotation(0)
            handleContactInput('businessCardUrl', '')
            handleContactInput('businessCardUrlEnhanced', '')
          }}
          onRotateLeft={() => contactScanApi.setContactCardRotation((r) => (r - 90 + 360) % 360)}
          onRotateRight={() => contactScanApi.setContactCardRotation((r) => (r + 90) % 360)}
          PhotoIcon={Icons.Photo}
          CloseIcon={Icons.X}
          deleteIcon={(
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        />

        {/* PDF-Modal für GH-Rechnungen */}
        {pdfModalOpen && selectedPdf && (
          <div
            className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
            onClick={closePdfModal}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-5xl h-[90vh] flex flex-col`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border} flex-shrink-0`}>
                <div>
                  <h3 className="text-base font-semibold">{selectedPdf.grosshaendler} - {selectedPdf.rechnungsnummer}</h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {new Date(selectedPdf.datum).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedPdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-lg ${theme.bgHover} ${theme.textSecondary}`}
                    title="In neuem Tab öffnen"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <a
                    href={selectedPdf.url}
                    download={selectedPdf.dateiname}
                    className={`p-2 rounded-lg ${theme.bgHover} ${theme.textSecondary}`}
                    title="Herunterladen"
                  >
                    <Icons.Download />
                  </a>
                  <button
                    type="button"
                    onClick={closePdfModal}
                    className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                    title="Schließen"
                  >
                    <Icons.X />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={selectedPdf.url}
                  className="w-full h-full border-0"
                  title={`PDF ${selectedPdf.rechnungsnummer}`}
                />
              </div>
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
                  {selectedApoMessage.type === 'amk' && (() => {
                    const hasSignature = existingDokumentationen.some(dok => dok.unterschrift_data)
                    const isComplete = existingDokumentationen.length > 0 && hasSignature
                    return (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setDokumentationBemerkung('')
                          setDokumentationSignature(null)
                          setShowSignatureCanvas(false)
                          setShowDokumentationModal(true)
                        }}
                        className={`${isComplete ? theme.primaryBg : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadAmkPdf(selectedApoMessage)}
                        className={`${theme.accentText} ${theme.bgHover} p-2 rounded-lg`}
                        title="Als PDF herunterladen"
                      >
                        <Icons.Download />
                      </button>
                    </>
                    )
                  })()}
                  {selectedApoMessage.type === 'recall' && (() => {
                    const hasSignature = existingDokumentationen.some(dok => dok.unterschrift_data)
                    const isComplete = existingDokumentationen.length > 0 && hasSignature
                    return (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setDokumentationBemerkung('')
                          setDokumentationSignature(null)
                          setShowSignatureCanvas(false)
                          setShowDokumentationModal(true)
                        }}
                        className={`${isComplete ? theme.primaryBg : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadRecallPdf(selectedApoMessage)}
                        className={`${theme.accentText} ${theme.bgHover} p-2 rounded-lg`}
                        title="Als PDF herunterladen"
                      >
                        <Icons.Download />
                      </button>
                    </>
                    )
                  })()}
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

                {/* Volltext für Rückrufe - oben anzeigen */}
                {selectedApoMessage.type === 'recall' && selectedApoMessage.full_text && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Vollständiger Text:</p>
                    <div className={`text-sm ${theme.text} markdown-content`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedApoMessage.full_text}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* AI-Analyse Felder für Rückrufe */}
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
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Betroffene PZN (antippen für Foto):</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedApoMessage.ai_pzn_betroffen.map((pzn, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handlePznClick(pzn)}
                          disabled={pznFotoUploading}
                          className={`text-xs px-2 py-1 rounded ${theme.accent} text-white font-mono hover:opacity-80 transition-opacity relative ${pznFotoUploading ? 'opacity-50' : ''}`}
                          title={savedPznFotos[pzn] ? `Foto für PZN ${pzn} ersetzen` : `Foto für PZN ${pzn} aufnehmen`}
                        >
                          {pzn}
                          {pznFotoUploading && activePzn === pzn && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-white animate-pulse" />
                          )}
                          {savedPznFotos[pzn] && !(pznFotoUploading && activePzn === pzn) && (
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" />
                          )}
                        </button>
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
                          thema.volltext ? (
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
                              <div className={`px-3 py-2 border-t ${theme.border}`}>
                                <div className={`text-sm ${theme.text} markdown-content`}>
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{thema.volltext}</ReactMarkdown>
                                </div>
                              </div>
                            </details>
                          ) : (
                            <div
                              key={thema.id}
                              className={`${theme.surface} border ${theme.border} rounded-lg px-3 py-2 flex items-center gap-2`}
                            >
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
                            </div>
                          )
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
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedApoMessage.description}</ReactMarkdown>
                    </div>
                  </div>
                )}
                {selectedApoMessage.type !== 'amk' && selectedApoMessage.affected_products && selectedApoMessage.affected_products.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Betroffene Produkte:</p>
                    <ul className={`text-sm ${theme.text} list-disc list-inside space-y-1`}>
                      {selectedApoMessage.affected_products.map((p, i) => (
                        <li key={i} className="markdown-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{p}</ReactMarkdown></li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedApoMessage.type !== 'amk' && selectedApoMessage.important_info && selectedApoMessage.important_info.length > 0 && (
                  <div className="mb-4">
                    <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Wichtige Informationen:</p>
                    <ul className={`text-sm ${theme.text} list-disc list-inside space-y-1`}>
                      {selectedApoMessage.important_info.map((info, i) => (
                        <li key={i} className="markdown-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{info}</ReactMarkdown></li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedApoMessage.type !== 'recall' && selectedApoMessage.full_text && (
                  <div>
                    {selectedApoMessage.type !== 'amk' && (
                      <p className={`text-sm font-medium ${theme.textSecondary} mb-1`}>Vollständiger Text:</p>
                    )}
                    <div className={`text-sm ${theme.text} markdown-content`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
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

                {/* Gespeicherte Dokumentationen für AMK und Rückrufe - ganz unten */}
                {(selectedApoMessage.type === 'amk' || selectedApoMessage.type === 'recall') && existingDokumentationen.length > 0 && (
                  <div className={`mt-6 p-3 rounded-xl ${theme.surface} border ${theme.border}`}>
                    <p className={`text-sm font-medium ${theme.accentText} mb-2`}>Dokumentation:</p>
                    <div className="space-y-2">
                      {existingDokumentationen.map((dok) => (
                        <div key={dok.id} className={`p-2 rounded-lg bg-white border ${theme.border}`}>
                          {dok.bemerkung && (
                            <p className={`text-sm ${theme.text}`}>{dok.bemerkung}</p>
                          )}
                          {dok.unterschrift_data && (
                            <img src={dok.unterschrift_data} alt="Unterschrift" className="h-12 mt-2 border rounded" />
                          )}
                          <p className={`text-xs ${theme.textMuted} mt-1`}>
                            {dok.erstellt_von_name && <span className="font-medium">{dok.erstellt_von_name}</span>}
                            {dok.erstellt_von_name && dok.erstellt_am && ' · '}
                            {dok.erstellt_am ? new Date(dok.erstellt_am).toLocaleString('de-DE') : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
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

        {/* Dokumentation Modal (AMK und Rückrufe) */}
        {showDokumentationModal && (selectedApoMessage?.type === 'amk' || selectedApoMessage?.type === 'recall') && (
          <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-[60] p-4`}>
            <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-lg max-h-[90vh] flex flex-col`}>
              <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
                <h3 className={`text-lg font-semibold ${theme.text}`}>Dokumentation</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowDokumentationModal(false)
                    setShowSignatureCanvas(false)
                  }}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                >
                  <Icons.X />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* Bestehende Dokumentationen */}
                {existingDokumentationen.length > 0 && (
                  <div className="space-y-3">
                    <p className={`text-sm font-medium ${theme.textSecondary}`}>Bisherige Einträge:</p>
                    {existingDokumentationen.map((dok) => (
                      <div key={dok.id} className={`p-3 rounded-lg ${theme.surface} border ${theme.border}`}>
                        {dok.bemerkung && (
                          <p className={`text-sm ${theme.text} mb-2`}>{dok.bemerkung}</p>
                        )}
                        {dok.unterschrift_data && (
                          <img src={dok.unterschrift_data} alt="Unterschrift" className="h-16 border rounded" />
                        )}
                        {/* PZN-Fotos anzeigen */}
                        {dok.pzn_fotos && Object.keys(dok.pzn_fotos).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(dok.pzn_fotos).map(([pzn, path]) => (
                              <a
                                key={pzn}
                                href={`${supabaseUrl}/storage/v1/object/public/recall-fotos/${path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative block"
                              >
                                <img
                                  src={`${supabaseUrl}/storage/v1/object/public/recall-fotos/${path}`}
                                  alt={`PZN ${pzn}`}
                                  className="h-16 rounded border hover:opacity-80 transition-opacity"
                                />
                                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 text-center rounded-b">
                                  {pzn}
                                </span>
                              </a>
                            ))}
                          </div>
                        )}
                        <p className={`text-xs ${theme.textMuted} mt-2`}>
                          {dok.erstellt_am ? new Date(dok.erstellt_am).toLocaleString('de-DE') : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Neuer Eintrag */}
                {(() => {
                  const hasExistingSignature = existingDokumentationen.some(dok => dok.unterschrift_data)
                  return (
                <div className="space-y-3">
                  <p className={`text-sm font-medium ${theme.textSecondary}`}>
                    {hasExistingSignature ? 'Ergänzung hinzufügen:' : 'Neuer Eintrag:'}
                  </p>
                  <textarea
                    value={dokumentationBemerkung}
                    onChange={(e) => setDokumentationBemerkung(e.target.value)}
                    placeholder={hasExistingSignature ? 'Ergänzende Bemerkung...' : 'Bemerkung eingeben...'}
                    rows={4}
                    className={`w-full px-3 py-2 rounded-xl border ${theme.input} ${theme.inputPlaceholder} resize-none`}
                  />

                  {/* PZN-Fotos Vorschau (nur für Rückrufe) */}
                  {selectedApoMessage?.type === 'recall' && Object.keys(savedPznFotos).length > 0 && (
                    <div className="space-y-2">
                      <p className={`text-sm font-medium ${theme.textSecondary}`}>
                        Gespeicherte PZN-Fotos ({Object.keys(savedPznFotos).length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(savedPznFotos).map(([pzn, path]) => (
                          <div key={pzn} className="relative">
                            <img
                              src={`${supabaseUrl}/storage/v1/object/public/recall-fotos/${path}`}
                              alt={`PZN ${pzn}`}
                              className="h-20 rounded border"
                            />
                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 text-center rounded-b">
                              {pzn}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unterschrift-Bereich - nur wenn noch keine Unterschrift existiert */}
                  {!hasExistingSignature && !showSignatureCanvas && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowSignatureCanvas(true)
                        setTimeout(initSignatureCanvas, 50)
                      }}
                      className={`w-full px-4 py-3 rounded-xl border-2 border-dashed ${theme.border} ${theme.textMuted} hover:border-[#4A90E2] hover:text-[#4A90E2] transition-colors`}
                    >
                      Unterschreiben
                    </button>
                  )}
                  {!hasExistingSignature && showSignatureCanvas && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${theme.textSecondary}`}>Unterschrift:</p>
                        <button
                          type="button"
                          onClick={clearSignature}
                          className={`text-xs ${theme.accentText} hover:underline`}
                        >
                          Löschen
                        </button>
                      </div>
                      <canvas
                        ref={signatureCanvasRef}
                        width={400}
                        height={150}
                        className={`w-full border ${theme.border} rounded-xl bg-white touch-none cursor-crosshair`}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                    </div>
                  )}
                </div>
                  )
                })()}
              </div>

              <div className={`flex justify-end gap-3 p-4 border-t ${theme.border}`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDokumentationModal(false)
                    setShowSignatureCanvas(false)
                  }}
                  className={`px-4 py-2.5 rounded-lg ${theme.bgHover} ${theme.text} font-medium`}
                >
                  Abbrechen
                </button>
                {(() => {
                  const hasExistingSignature = existingDokumentationen.some(dok => dok.unterschrift_data)
                  const hasSavedPznFotos = Object.keys(savedPznFotos).length > 0
                  // Wenn bereits unterschrieben: Text ODER PZN-Fotos erforderlich
                  // Wenn noch nicht unterschrieben: (Text ODER PZN-Fotos) UND Unterschrift erforderlich
                  const hasContent = dokumentationBemerkung.trim() || hasSavedPznFotos
                  const isDisabled = hasExistingSignature
                    ? !hasContent
                    : (!hasContent || !dokumentationSignature)
                  return (
                    <button
                      type="button"
                      onClick={saveDokumentation}
                      disabled={dokumentationLoading || isDisabled}
                      className={`px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium disabled:opacity-50`}
                    >
                      {dokumentationLoading ? 'Speichern...' : hasExistingSignature ? 'Hinzufügen' : 'Speichern'}
                    </button>
                  )
                })()}
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

  return (
    <AuthView
      authView={authView}
      onAuthViewChange={handleAuthViewChange}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      newPassword={newPassword}
      setNewPassword={setNewPassword}
      confirmPassword={confirmPassword}
      setConfirmPassword={setConfirmPassword}
      loading={loading}
      message={message}
      successMessage={successMessage}
      handleSignIn={handleSignIn}
      handleForgotPassword={handleForgotPassword}
      handleResetPassword={handleResetPassword}
      theme={theme}
    />
  )
}

export default App
