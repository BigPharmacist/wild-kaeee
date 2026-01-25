import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { supabase, supabaseUrl } from './lib/supabase'
import { downloadAmkPdf, downloadRecallPdf } from './lib/pdfGenerator'
import {
  detectRotationWithAI,
  rotateImageByDegrees,
  compressImage,
  getEnhancedImage,
  rotateImage,
} from './lib/imageProcessing'
import { useNavigation, useAuth, usePharmacy, useTheme, useContactsContext, useEmail, usePhotosContext, useChatContext } from './context'
import { House, Camera, Pill, CalendarDots, CalendarBlank, ChatCircle, GearSix, EnvelopeSimple, Printer, Palette, Sparkle, DotsThree, Files, Archive, CheckSquare, Moped } from '@phosphor-icons/react'

// Hooks müssen synchron importiert werden
import { useFaxCounts, useUrgentFax } from './features/fax'
import { contactScan } from './features/contacts'
import { useWeather, usePollen, useBiowetter, useDashboardTasks } from './features/dashboard'
import { useTasks } from './features/tasks'
import { useProjects } from './features/projects'
import { useCalendar } from './features/calendar'
import { useRechnungen } from './features/rechnungen'
import { useArchiv } from './features/archiv'
import { useTracking } from './features/tracking'

// Lazy-loaded Feature Views (werden erst bei Bedarf geladen)
const EmailView = lazy(() => import('./features/email/EmailView'))
const EmailAccountModal = lazy(() => import('./features/email/EmailAccountModal'))
const EmailSettingsSection = lazy(() => import('./features/email/EmailSettingsSection'))
const FaxView = lazy(() => import('./features/fax/FaxView'))
const ContactDetailModal = lazy(() => import('./features/contacts/ContactDetailModal'))
const ContactFormModal = lazy(() => import('./features/contacts/ContactFormModal'))
const ContactsSettingsSection = lazy(() => import('./features/contacts/ContactsSettingsSection'))
const AuthView = lazy(() => import('./features/auth/AuthView'))
const DashboardHeader = lazy(() => import('./features/dashboard/DashboardHeader'))
const SidebarNav = lazy(() => import('./features/dashboard/SidebarNav'))
const DashboardHome = lazy(() => import('./features/dashboard/DashboardHome'))
const ApoView = lazy(() => import('./features/apo/ApoView'))
const PhotosView = lazy(() => import('./features/photos/PhotosView'))
const ChatView = lazy(() => import('./features/chat/ChatView'))
const SettingsView = lazy(() => import('./features/settings/SettingsView'))
const PlanView = lazy(() => import('./features/plan/PlanView'))
const TasksView = lazy(() => import('./features/tasks/TasksView'))
const TaskFormModal = lazy(() => import('./features/tasks/TaskFormModal'))
const TaskCompleteModal = lazy(() => import('./features/tasks/TaskCompleteModal'))
const ProjectFormModal = lazy(() => import('./features/projects/ProjectFormModal'))
const DokumenteView = lazy(() => import('./features/dokumente/DokumenteView'))
const CalendarView = lazy(() => import('./features/calendar/CalendarView'))
const NotdienstplanungView = lazy(() => import('./features/calendar/NotdienstplanungView'))
const ColorsView = lazy(() => import('./features/colors/ColorsView'))
const ArchivView = lazy(() => import('./features/archiv/ArchivView'))
const BotendienstView = lazy(() => import('./features/botendienst/BotendienstView'))
const TokenDriverView = lazy(() => import('./features/botendienst/TokenDriverView'))
const TrackingWidget = lazy(() => import('./features/tracking/TrackingWidget'))
const CourierMap = lazy(() => import('./features/tracking/CourierMap'))
const CourierTable = lazy(() => import('./features/tracking/CourierTable'))

// Schwere Libraries - ReactCrop lazy, remarkGfm synchron (klein)
const ReactCrop = lazy(() => import('react-image-crop').then(m => ({ default: m.default })))
import 'react-image-crop/dist/ReactCrop.css'
// jsPDF wird in den PDF-Funktionen dynamisch importiert
const ReactMarkdown = lazy(() => import('react-markdown'))
import remarkGfm from 'remark-gfm'

import { Icons, UnreadBadge, LoadingSpinner, FloatingAiChat } from './shared/ui'


function App() {
  // Navigation aus Context
  const {
    activeView,
    setActiveView,
    secondaryTab,
    setSecondaryTab,
    settingsTab,
    setSettingsTab,
    chatTab,
    setChatTab,
    dokumenteTab,
    setDokumenteTab,
    archivTab,
    setArchivTab,
    rechnungenTab,
    setRechnungenTab,
    apoTab,
    setApoTab,
    botendienstTab,
    setBotendienstTab,
    mobileNavOpen,
    setMobileNavOpen,
    getActiveSecondaryId,
    handleSecondarySelect,
    updateSecondaryForView,
  } = useNavigation()

  // Auth aus Context
  const {
    session,
    authView,
    email,
    setEmail,
    password,
    setPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    message,
    successMessage,
    handleSignIn,
    handleForgotPassword,
    handleResetPassword,
    handleAuthViewChange,
    handleSignOut,
  } = useAuth()

  // Pharmacy & Staff aus Context
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
    openPharmacyCreateModal,
    openEditModal,
    closeEditModal,
    handleEditSubmit,
    staff,
    filteredStaff,
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
    showExited,
    staffViewMode,
    fetchStaff,
    openStaffModal,
    closeStaffModal,
    handleStaffInput,
    handleStaffAvatarChange,
    linkCurrentUser,
    handleStaffSubmit,
    handleSendInvite,
    setShowExited,
    setStaffViewMode,
    isExited,
    toggleTrackingEnabled,
  } = usePharmacy()
  const {
    isTracking,
    trackingError,
    lastPosition,
    canTrack,
    courierLocations,
    locationsLoading,
    startTracking,
    stopTracking,
    fetchCourierLocations,
  } = useTracking({ currentStaff, session, isTrackingViewOpen: activeView === 'settings' && settingsTab === 'tracking' })

  // Email aus Context
  const {
    emailAccounts,
    emailPermissions,
    currentUserEmailAccess,
    editingEmailAccount,
    emailAccountForm,
    emailAccountSaving,
    emailAccountMessage,
    selectedEmailAccount,
    selectedEmailAccountObj,
    setEmailAccountForm,
    fetchEmailAccounts,
    fetchEmailPermissions,
    openEmailAccountModal,
    closeEmailAccountModal,
    handleSaveEmailAccount,
    handleDeleteEmailAccount,
    handleSelectEmailAccount,
    toggleEmailPermission,
    emailUnreadCount,
    // KI-Assistent
    aiSettings,
    setAiSettings,
    aiSettingsSaving,
    aiSettingsMessage,
    fetchAiSettings,
    saveAiSettings,
  } = useEmail()

  // Contacts aus Context
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
    contactFormCardView,
    contactTypeLabels,
    filteredContacts,
    setContactSearch,
    setContactViewMode,
    setSelectedContact,
    setSelectedContactCardView,
    setContactFormCardView,
    fetchContacts,
    openContactModal,
    closeContactModal,
    handleContactInput,
    deleteContact,
    saveContact,
    openContactDetail,
    contactScanApi,
  } = useContactsContext()

  const {
    tasks,
    tasksLoading,
    tasksError,
    quickAddInput,
    setQuickAddInput,
    groupedTasks,
    allProjects,
    filteredTasks,
    filterPriority,
    setFilterPriority,
    filterProjectId,
    setFilterProjectId,
    filterAssignee,
    setFilterAssignee,
    filterDue,
    setFilterDue,
    showCompleted,
    setShowCompleted,
    groupBy,
    setGroupBy,
    editingTask,
    taskForm,
    taskSaving,
    taskSaveError,
    openTaskModal,
    closeTaskModal,
    handleTaskInput,
    saveTaskFromModal,
    completingTask,
    confirmTaskComplete,
    cancelTaskComplete,
    createTask,
    toggleTaskComplete,
    deleteTask,
    updateTaskOrder,
    calculateSortOrder,
  } = useTasks({ session, activeView, currentStaff })

  const {
    projects,
    editingProject,
    projectForm,
    projectSaving,
    projectSaveError,
    openProjectModal,
    closeProjectModal,
    handleProjectInput,
    saveProject,
  } = useProjects({ session, currentStaff })

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

  // Photos aus Context (inkl. API Keys)
  const {
    mistralApiKey,
    googleApiKey,
    fetchMistralApiKey,
    fetchGoogleApiKey,
    latestPhoto,
    photoUploading,
    allPhotos,
    photosLoading,
    businessCards,
    businessCardsLoading,
    selectedPhoto,
    photoEditorOpen,
    crop,
    completedCrop,
    brightness,
    contrast,
    photoSaving,
    photoOcrData,
    ocrProcessing,
    cameraInputRef,
    photoImgRef,
    setCrop,
    setCompletedCrop,
    setBrightness,
    setContrast,
    setPhotoSaving,
    fetchLatestPhoto,
    handleCameraCapture,
    fetchAllPhotos,
    deletePhoto,
    fetchBusinessCards,
    deleteBusinessCard,
    fetchPhotoOcrData,
    runOcrForPhoto,
    openPhotoEditor,
    closePhotoEditor,
  } = usePhotosContext()

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
    fetchWeather: _fetchWeather,  
    openWeatherModal,
    closeWeatherModal,
  } = useWeather({ pharmacies })
  const {
    pollenData,
    pollenLoading,
    pollenError,
    pollenRegion,
    pollenNames,
    severityLabels,
    severityColors,
  } = usePollen({ pharmacies })
  const {
    biowetterLoading,
    biowetterError,
    biowetterZone,
    getForecasts: getBiowetterForecasts,
    lastUpdate: biowetterLastUpdate,
    aiRecommendation: biowetterAiRecommendation,
    aiRecommendationLoading: biowetterAiLoading,
  } = useBiowetter({ pharmacies, aiSettings })
  const {
    tasks: dashboardTasks,
    tasksLoading: dashboardTasksLoading,
    tasksError: dashboardTasksError,
    tasksByDue,
  } = useDashboardTasks({ session, currentStaff })

  // Chat aus Context
  const {
    chatMessages,
    chatLoading,
    chatLoadingMore,
    chatError,
    chatInput,
    chatSending,
    chatEndRef,
    messageReads,
    messageReactions,
    hasMoreMessages,
    editingMessageId,
    pendingFile,
    chatUnreadCounts,
    setChatInput,
    setEditingMessageId,
    fetchChatMessages,
    loadMoreMessages,
    sendChatMessage,
    deleteChatMessage,
    editChatMessage,
    canEditMessage,
    toggleReaction,
    selectChatFile,
    setPendingFile,
    EMOJI_SET,
    ALLOWED_FILE_TYPES,
  } = useChatContext()

  const signatureCanvasRef = useRef(null)
  const signatureCtxRef = useRef(null)
  const pznCameraInputRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [enhanceFile, setEnhanceFile] = useState(null)
  const [enhancePreview, setEnhancePreview] = useState('')
  const [enhanceResultPreview, setEnhanceResultPreview] = useState('')
  const [enhanceLoading, setEnhanceLoading] = useState(false)
  const [enhanceMessage, setEnhanceMessage] = useState('')
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
  const [showBiowetterModal, setShowBiowetterModal] = useState(false)
  const [dokumentationBemerkung, setDokumentationBemerkung] = useState('')
  const [dokumentationSignature, setDokumentationSignature] = useState(null)
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false)
  const [dokumentationLoading, setDokumentationLoading] = useState(false)
  const [existingDokumentationen, setExistingDokumentationen] = useState([])
  const [savedPznFotos, setSavedPznFotos] = useState({})  // { pzn: foto_path } - aus DB geladen
  const [pznFotoUploading, setPznFotoUploading] = useState(false)
  const [activePzn, setActivePzn] = useState(null)
  const [unreadCounts, setUnreadCounts] = useState({ amk: 0, recall: 0, lav: 0 })
  const {
    count: faxCount,
    decrementCount: _decrementFaxCount,  
    refresh: _refreshFaxCount,  
  } = useFaxCounts()
  const { urgentFaxe } = useUrgentFax()
  const [pendingFaxId, setPendingFaxId] = useState(null)
  const [faxPdfPopup, setFaxPdfPopup] = useState(null) // { id, pdfUrl, absender }
  const [readMessageIds, setReadMessageIds] = useState({ amk: new Set(), recall: new Set(), lav: new Set() })
  const [planData, setPlanData] = useState(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState('')
  const [selectedPlanDate, setSelectedPlanDate] = useState(() => {
    const today = new Date()
    return today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  })

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
    // Paperless
    paperlessRechnungen,
    paperlessLoading,
    paperlessCollapsedDays,
    paperlessPdfModalOpen,
    selectedPaperlessPdf,
    fetchPaperlessRechnungen,
    openPaperlessPdfModal,
    closePaperlessPdfModal,
    togglePaperlessDayCollapsed,
    getGrosshaendler,
  } = useRechnungen()
  const {
    documents: archivDocuments,
    tags: archivTags,
    correspondents: archivCorrespondents,
    documentTypes: archivDocumentTypes,
    loading: archivLoading,
    uploading: archivUploading,
    error: archivError,
    selectedDocument: archivSelectedDocument,
    previewUrl: archivPreviewUrl,
    previewLoading: archivPreviewLoading,
    searchQuery: archivSearchQuery,
    selectedTag: archivSelectedTag,
    selectedCorrespondent: archivSelectedCorrespondent,
    selectedType: archivSelectedType,
    fetchDocuments: fetchArchivDocuments,
    fetchMetadata: fetchArchivMetadata,
    uploadDocument: uploadArchivDocument,
    downloadDocument: downloadArchivDocument,
    loadPreview: loadArchivPreview,
    closePreview: closeArchivPreview,
    loadThumbnail: loadArchivThumbnail,
    fetchPaperlessConfig,
    search: archivSearch,
    filterByTag: archivFilterByTag,
    filterByCorrespondent: archivFilterByCorrespondent,
    filterByType: archivFilterByType,
    filterBySavedView: archivFilterBySavedView,
    clearFilters: archivClearFilters,
    createSavedView: archivCreateSavedView,
    deleteSavedView: archivDeleteSavedView,
    getTagsForDocument: getArchivTagsForDocument,
    getCorrespondentForDocument: getArchivCorrespondentForDocument,
    getTypeForDocument: getArchivTypeForDocument,
    savedViews: archivSavedViews,
    activeSavedView: archivActiveSavedView,
  } = useArchiv()
  const {
    calendars,
    calendarsLoading,
    calendarsError,
    selectedCalendarId,
    setSelectedCalendarId,
    calendarEvents,
    eventsLoading,
    calendarViewDate,
    setCalendarViewDate,
    calendarViewMode,
    setCalendarViewMode,
    showWeekends,
    setShowWeekends,
    editingEvent,
    eventForm,
    setEventForm,
    eventSaving,
    eventError,
    editingCalendar,
    calendarForm,
    setCalendarForm,
    calendarSaving,
    permissionsModalOpen,
    setPermissionsModalOpen,
    calendarPermissions,
    permissionsLoading,
    dashboardEvents,
    dashboardEventsLoading,
    fetchCalendars: _fetchCalendars,  
    fetchCalendarEvents: _fetchCalendarEvents,  
    fetchCalendarPermissions,
    fetchDashboardEvents: _fetchDashboardEvents,  
    createCalendar,
    updateCalendar,
    createEvent,
    updateEvent,
    deleteEvent,
    addCalendarPermission,
    removeCalendarPermission,
    openEventModal,
    closeEventModal,
    openCalendarModal,
    closeCalendarModal,
    currentCalendarPermission: _currentCalendarPermission,  
    canWriteCurrentCalendar,
    getEventColor,
  } = useCalendar({ session, activeView })

  // Theme aus Context
  const { theme } = useTheme()

  const navItems = [
    { id: 'dashboard', icon: () => <House size={20} weight="regular" />, label: 'Dashboard' },
    { id: 'apo', icon: () => <Pill size={20} weight="regular" />, label: 'Apo' },
    { id: 'tasks', icon: () => <CheckSquare size={20} weight="regular" />, label: 'Tasks' },
    { id: 'plan', icon: () => <CalendarDots size={20} weight="regular" />, label: 'Team' },
    { id: 'calendar', icon: () => <CalendarBlank size={20} weight="regular" />, label: 'Kalender' },
    { id: 'chat', icon: () => <ChatCircle size={20} weight="regular" />, label: 'Chat' },
    { id: 'botendienst', icon: () => <Moped size={20} weight="regular" />, label: 'Botendienst' },
    { id: 'post', icon: () => <Icons.PostHorn />, label: 'Post' },
    { id: 'dokumente', icon: () => <Files size={20} weight="regular" />, label: 'Dokumente' },
    { id: 'archiv', icon: () => <Archive size={20} weight="regular" />, label: 'Archiv' },
    { id: 'settings', icon: () => <GearSix size={20} weight="regular" />, label: 'Einstellungen' },
  ]

  // Sonstiges-Item (separat, über dem Avatar)
  const miscNavItem = { id: 'misc', icon: () => <DotsThree size={20} weight="bold" />, label: 'Sonstiges' }

  const secondaryNavMap = useMemo(() => ({
    tasks: [
      { id: 'all', label: 'Alle Aufgaben' },
      ...(projects.length > 0 ? [{ id: 'divider' }] : []),
      ...projects.map(p => ({
        id: `project-${p.id}`,
        label: p.name,
        color: p.color,
      })),
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
      { id: 'notdienstplanung', label: 'Notdienstplanung' },
    ],
    chat: [
      { id: 'group', label: 'Gruppenchat' },
      ...staff
        .filter((s) => s.auth_user_id && s.auth_user_id !== session?.user?.id)
        .map((s) => ({ id: s.auth_user_id, label: s.first_name || 'Unbekannt' })),
    ],
    botendienst: [
      { id: 'overview', label: 'Übersicht' },
      { id: 'map', label: 'Karte' },
      { id: 'customers', label: 'Kunden' },
      { id: 'history', label: 'Verlauf' },
      { id: 'divider' },
      { id: 'driver', label: 'Fahrer-Modus' },
    ],
    post: [
      { id: 'email', label: 'Email' },
      { id: 'fax', label: 'Fax' },
    ],
    dokumente: [
      { id: 'briefe', label: 'Briefe' },
      { id: 'alle', label: 'Alle Dokumente' },
      { id: 'rechnungen', label: 'Rechnungen' },
      { id: 'vertraege', label: 'Verträge' },
      { id: 'sonstiges', label: 'Sonstiges' },
    ],
    archiv: [
      { id: 'alle', label: 'Alle Dokumente' },
      // Dokumenttypen dynamisch hinzufügen
      ...archivDocumentTypes.map(dt => ({
        id: `type-${dt.id}`,
        label: dt.name,
      })),
      // Saved Views als Trenner und Liste
      ...(archivSavedViews.length > 0 ? [
        { id: 'divider', label: '─────────', disabled: true },
        ...archivSavedViews.map(sv => ({
          id: `view-${sv.id}`,
          label: `⭐ ${sv.name}`,
        })),
      ] : []),
    ],
    rechnungen: [
      { id: 'alt', label: 'Alt' },
      { id: 'neu', label: 'Neu' },
    ],
    misc: [
      { id: 'uploads', label: 'Uploads' },
      { id: 'ocr', label: 'OCR' },
      { id: 'visitenkarten', label: 'Visitenkarten' },
      { id: 'colors', label: 'Farben' },
      { id: 'card-enhance', label: 'Karten-Test' },
    ],
    settings: [
      { id: 'pharmacies', label: 'Apotheken' },
      { id: 'staff', label: 'Kollegium' },
      { id: 'contacts', label: 'Kontakte' },
      { id: 'email', label: 'E-Mail' },
      { id: 'ai-chat', label: 'KI-Chat' },
      ...(currentStaff?.is_admin ? [{ id: 'tracking', label: 'Tracking' }] : []),
      ...(currentStaff?.is_admin ? [{ id: 'admin', label: 'Admin' }] : []),
    ],
  }), [currentStaff?.is_admin, staff, session?.user?.id, archivDocumentTypes, archivSavedViews, projects])

  // Fax-PDF Popup öffnen (für Kalender-Links)
  const openFaxPdfPopup = async (faxId) => {
    try {
      const { data: fax, error } = await supabase
        .from('faxe')
        .select('id, absender, storage_url, storage_path')
        .eq('id', faxId)
        .single()

      if (error || !fax) {
        console.error('Fax nicht gefunden:', error)
        return
      }

      // PDF-URL konstruieren
      let pdfUrl = null
      if (fax.storage_url) {
        const match = fax.storage_url.match(/\/storage\/v1\/object\/public\/(.+)$/)
        if (match) {
          pdfUrl = `${supabaseUrl}/storage/v1/object/public/${match[1]}`
        }
      }
      if (!pdfUrl && fax.storage_path) {
        pdfUrl = `${supabaseUrl}/storage/v1/object/public/${fax.storage_path}`
      }

      if (pdfUrl) {
        setFaxPdfPopup({ id: fax.id, pdfUrl, absender: fax.absender })
      }
    } catch (err) {
      console.error('Fehler beim Laden des Fax:', err)
    }
  }

  // Secondary-Tab wird im NavigationContext verwaltet
  useEffect(() => {
    updateSecondaryForView(secondaryNavMap)
  }, [activeView, updateSecondaryForView, secondaryNavMap])

  // Archiv-Metadaten laden wenn Archiv-Ansicht aktiv wird
  useEffect(() => {
    if (activeView === 'archiv') {
      fetchPaperlessConfig().then(() => {
        fetchArchivMetadata()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView])

  // Navigation localStorage wird jetzt im NavigationContext gespeichert

  // Browser-Tab-Titel mit Fax-Count aktualisieren
  useEffect(() => {
    if (faxCount > 0) {
      document.title = `(${faxCount}) Kaeee`
    } else {
      document.title = 'Kaeee'
    }
  }, [faxCount])

  // Browser-Notification Klick -> zur Fax-View navigieren
  useEffect(() => {
    const handleNavigateToFax = () => {
      setActiveView('post')
      setSecondaryTab('fax')
    }

    window.addEventListener('navigate-to-fax', handleNavigateToFax)
    return () => window.removeEventListener('navigate-to-fax', handleNavigateToFax)
  }, [])

  // Browser-Notification Klick -> zur Chat-View navigieren
  useEffect(() => {
    const handleNavigateToChat = (event) => {
      const { chatType, chatId } = event.detail || {}
      setActiveView('chat')
      // Zum richtigen Chat-Tab wechseln
      if (chatType === 'group') {
        setChatTab('group')
      } else if (chatId) {
        setChatTab(chatId)
      }
    }

    window.addEventListener('navigate-to-chat', handleNavigateToChat)
    return () => window.removeEventListener('navigate-to-chat', handleNavigateToChat)
  }, [])

  // Mobile Nav Timer und getActiveSecondaryId/handleSecondarySelect sind jetzt im NavigationContext

  // Wrapper für handleSecondarySelect mit Archiv- und Tasks-spezifischer Logik
  const handleSecondarySelectWithArchiv = (itemId) => {
    // Divider ignorieren
    if (itemId === 'divider') return

    // Basis-Navigation über Context
    handleSecondarySelect(itemId)

    // Tasks-spezifische Filter anwenden (Projekte)
    if (activeView === 'tasks') {
      if (itemId === 'all') {
        setFilterProjectId(null)
      } else if (itemId.startsWith('project-')) {
        const projectId = itemId.replace('project-', '')
        setFilterProjectId(projectId)
      }
    }

    // Archiv-spezifische Filter anwenden
    if (activeView === 'archiv') {
      if (itemId === 'alle') {
        archivClearFilters()
      } else if (itemId.startsWith('type-')) {
        const typeId = itemId.replace('type-', '')
        archivFilterByType(typeId)
      } else if (itemId.startsWith('view-')) {
        const viewId = itemId.replace('view-', '')
        archivFilterBySavedView(viewId)
      }
    }
  }

  // Klick auf dringendes Fax im Header
  const handleUrgentFaxClick = (faxId) => {
    setActiveView('post')
    setSecondaryTab('fax')
    setPendingFaxId(faxId)
  }

  // PDF-Download Wrapper-Funktionen (nutzen das extrahierte Modul)
  const handleDownloadAmkPdf = (msg) => downloadAmkPdf(msg, supabase, supabaseUrl)
  const handleDownloadRecallPdf = (msg) => downloadRecallPdf(msg, supabase, supabaseUrl)

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
    ctx.strokeStyle = '#1E293B'
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

  const openCreateModal = () => {
    openPharmacyCreateModal()
    closeWeatherModal()
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

  // Alle Daten werden jetzt von Contexts geladen (Pharmacies, Staff, Contacts, Email, Photos)

  useEffect(() => {
    if (session && activeView === 'photos' && secondaryTab === 'visitenkarten') {
      fetchBusinessCards()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (session && activeView === 'plan' && !planData && !planLoading && !planError) {
      fetchPlanData()
    }
  }, [activeView, session, planData, planLoading, planError])

  // GH-Rechnungen laden bei View-Wechsel
  useEffect(() => {
    if (session && activeView === 'rechnungen') {
      // Alt (Supabase)
      if (rechnungenTab === 'alt' && rechnungen.length === 0 && !rechnungenLoading) {
        fetchRechnungen()
      }
      // Neu (Paperless)
      if (rechnungenTab === 'neu' && paperlessRechnungen.length === 0 && !paperlessLoading) {
        fetchPaperlessRechnungen()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, session, rechnungenTab])

  // Token-basierter Fahrer-Zugriff (ohne Login)
  const pathMatch = window.location.pathname.match(/^\/fahrer\/([a-f0-9-]{36})$/i)
  if (pathMatch) {
    const driverToken = pathMatch[1]
    return (
      <Suspense fallback={<LoadingSpinner message="Tour wird geladen..." />}>
        <TokenDriverView token={driverToken} />
      </Suspense>
    )
  }

  // Password reset view (even if logged in via invite link)
  if (authView === 'resetPassword') {
    return (
      <Suspense fallback={<LoadingSpinner message="Lädt..." />}>
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
      </Suspense>
    )
  }

  // Dashboard view
  if (session) {
    // Fahrermodus: Vollbild ohne Header und Sidebar
    const isDriverMode = activeView === 'botendienst' && botendienstTab === 'driver'

    return (
      <Suspense fallback={<div className="h-screen flex items-center justify-center"><LoadingSpinner message="App wird geladen..." /></div>}>
        <div className={`h-screen ${theme.bgApp} ${theme.textPrimary} flex flex-col relative overflow-hidden`}>
          {!isDriverMode && (
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
            Icons={Icons}
            urgentFaxe={urgentFaxe}
            faxCount={faxCount}
            onUrgentFaxClick={handleUrgentFaxClick}
          />
          )}

        <div className="flex flex-1 overflow-hidden relative min-h-0">
          {!isDriverMode && (
            <SidebarNav
              theme={theme}
              mobileNavOpen={mobileNavOpen}
              setMobileNavOpen={setMobileNavOpen}
              navItems={navItems}
              miscNavItem={miscNavItem}
              activeView={activeView}
              setActiveView={setActiveView}
              secondaryNavMap={secondaryNavMap}
              getActiveSecondaryId={getActiveSecondaryId}
              handleSecondarySelect={handleSecondarySelectWithArchiv}
              unreadCounts={{ ...unreadCounts, fax: faxCount, email: emailUnreadCount, chat: chatUnreadCounts }}
              Icons={Icons}
              UnreadBadge={UnreadBadge}
              currentStaff={currentStaff}
              session={session}
              handleSignOut={handleSignOut}
              onAddTask={openTaskModal}
              onAddProject={openProjectModal}
            />
          )}

          {/* Main Content */}
          <main className={`flex-1 overflow-auto min-h-0 ${isDriverMode ? '' : 'p-4 lg:p-8'}`}>
            <div className={activeView === 'chat' || activeView === 'post' ? 'w-full' : 'max-w-5xl'}>
              {activeView === 'dashboard' && (
                <>
                  {canTrack && (
                    <div className="mb-6">
                      <TrackingWidget
                        theme={theme}
                        isTracking={isTracking}
                        trackingError={trackingError}
                        lastPosition={lastPosition}
                        canTrack={canTrack}
                        onStartTracking={startTracking}
                        onStopTracking={stopTracking}
                      />
                    </div>
                  )}
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
                    pollenData={pollenData}
                    pollenLoading={pollenLoading}
                    pollenError={pollenError}
                    pollenRegion={pollenRegion}
                    pollenNames={pollenNames}
                    severityLabels={severityLabels}
                    severityColors={severityColors}
                    biowetterLoading={biowetterLoading}
                    biowetterError={biowetterError}
                    biowetterZone={biowetterZone}
                    getBiowetterForecasts={getBiowetterForecasts}
                    biowetterLastUpdate={biowetterLastUpdate}
                    biowetterAiRecommendation={biowetterAiRecommendation}
                    biowetterAiLoading={biowetterAiLoading}
                    openBiowetterModal={() => setShowBiowetterModal(true)}
                    dashboardTasks={dashboardTasks}
                    dashboardTasksLoading={dashboardTasksLoading}
                    dashboardTasksError={dashboardTasksError}
                    tasksByDue={tasksByDue}
                  />
                </>
              )}

              {activeView === 'misc' && ['uploads', 'ocr', 'visitenkarten'].includes(secondaryTab) && (
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

              {activeView === 'archiv' && (
                <ArchivView
                  theme={theme}
                  documents={archivDocuments}
                  tags={archivTags}
                  correspondents={archivCorrespondents}
                  documentTypes={archivDocumentTypes}
                  loading={archivLoading}
                  uploading={archivUploading}
                  error={archivError}
                  selectedDocument={archivSelectedDocument}
                  previewUrl={archivPreviewUrl}
                  previewLoading={archivPreviewLoading}
                  searchQuery={archivSearchQuery}
                  selectedTag={archivSelectedTag}
                  selectedCorrespondent={archivSelectedCorrespondent}
                  selectedType={archivSelectedType}
                  fetchDocuments={fetchArchivDocuments}
                  fetchMetadata={fetchArchivMetadata}
                  uploadDocument={uploadArchivDocument}
                  downloadDocument={downloadArchivDocument}
                  loadPreview={loadArchivPreview}
                  closePreview={closeArchivPreview}
                  loadThumbnail={loadArchivThumbnail}
                  fetchPaperlessConfig={fetchPaperlessConfig}
                  search={archivSearch}
                  filterByTag={archivFilterByTag}
                  filterByCorrespondent={archivFilterByCorrespondent}
                  filterByType={archivFilterByType}
                  filterBySavedView={archivFilterBySavedView}
                  clearFilters={archivClearFilters}
                  getTagsForDocument={getArchivTagsForDocument}
                  getCorrespondentForDocument={getArchivCorrespondentForDocument}
                  getTypeForDocument={getArchivTypeForDocument}
                  savedViews={archivSavedViews}
                  activeSavedView={archivActiveSavedView}
                  activeTab={archivTab}
                  createSavedView={archivCreateSavedView}
                  deleteSavedView={archivDeleteSavedView}
                />
              )}

              {activeView === 'botendienst' && (
                <BotendienstView
                  theme={theme}
                  session={session}
                  currentStaff={currentStaff}
                  pharmacies={pharmacies}
                  staff={staff}
                  botendienstTab={botendienstTab}
                  setBotendienstTab={setBotendienstTab}
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
                  chatLoadingMore={chatLoadingMore}
                  chatMessages={chatMessages}
                  staffByAuthId={staffByAuthId}
                  session={session}
                  chatEndRef={chatEndRef}
                  chatError={chatError}
                  sendChatMessage={sendChatMessage}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  chatSending={chatSending}
                  directChatUserId={chatTab === 'group' ? null : chatTab}
                  directChatUser={chatTab === 'group' ? null : staffByAuthId[chatTab]}
                  messageReads={messageReads}
                  messageReactions={messageReactions}
                  deleteChatMessage={deleteChatMessage}
                  hasMoreMessages={hasMoreMessages}
                  loadMoreMessages={loadMoreMessages}
                  fetchChatMessages={fetchChatMessages}
                  editingMessageId={editingMessageId}
                  setEditingMessageId={setEditingMessageId}
                  editChatMessage={editChatMessage}
                  canEditMessage={canEditMessage}
                  toggleReaction={toggleReaction}
                  selectChatFile={selectChatFile}
                  pendingFile={pendingFile}
                  setPendingFile={setPendingFile}
                  EMOJI_SET={EMOJI_SET}
                  ALLOWED_FILE_TYPES={ALLOWED_FILE_TYPES}
                />
              )}

              {activeView === 'tasks' && (
                <TasksView
                  theme={theme}
                  tasksLoading={tasksLoading}
                  tasksError={tasksError}
                  quickAddInput={quickAddInput}
                  setQuickAddInput={setQuickAddInput}
                  groupedTasks={groupedTasks}
                  allProjects={allProjects}
                  staff={staff}
                  currentStaff={currentStaff}
                  filteredTasks={filteredTasks}
                  filterPriority={filterPriority}
                  setFilterPriority={setFilterPriority}
                  filterProjectId={filterProjectId}
                  setFilterProjectId={setFilterProjectId}
                  filterAssignee={filterAssignee}
                  projects={projects}
                  setFilterAssignee={setFilterAssignee}
                  filterDue={filterDue}
                  setFilterDue={setFilterDue}
                  showCompleted={showCompleted}
                  setShowCompleted={setShowCompleted}
                  groupBy={groupBy}
                  setGroupBy={setGroupBy}
                  createTask={createTask}
                  toggleTaskComplete={toggleTaskComplete}
                  deleteTask={deleteTask}
                  openTaskModal={openTaskModal}
                  openProjectModal={openProjectModal}
                  updateTaskOrder={updateTaskOrder}
                  calculateSortOrder={calculateSortOrder}
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

              {activeView === 'calendar' && secondaryTab === 'calendars' && (
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

              {activeView === 'calendar' && secondaryTab === 'notdienstplanung' && (
                <NotdienstplanungView
                  theme={theme}
                  staff={staff}
                  session={session}
                />
              )}

              {activeView === 'dokumente' && (
                <DokumenteView
                  theme={theme}
                  dokumenteTab={dokumenteTab}
                  pharmacies={pharmacies}
                  aiSettings={aiSettings}
                />
              )}

              {activeView === 'misc' && secondaryTab === 'colors' && (
                <ColorsView theme={theme} />
              )}

              {activeView === 'misc' && secondaryTab === 'card-enhance' && (
                <>
                  <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Karten-Test</h2>
                  <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-base font-semibold">Visitenkarten-Enhance</h3>
                        <p className={`text-xs ${theme.textMuted}`}>Google Nano Banana Pro: zuschneiden + Lesbarkeit verbessern.</p>
                      </div>
                      <button
                        type="button"
                        onClick={fetchGoogleApiKey}
                        className={`text-xs font-medium ${theme.accentText} hover:opacity-80`}
                        title="Google API Key aus DB laden"
                      >
                        Key laden
                      </button>
                    </div>

                    {enhanceMessage && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 mb-3">
                        <p className="text-rose-400 text-sm">{enhanceMessage}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEnhanceFileChange}
                        className={`flex-1 text-sm ${theme.input} ${theme.inputPlaceholder} border rounded-xl px-3 py-2`}
                      />
                      <button
                        type="button"
                        onClick={runBusinessCardEnhance}
                        disabled={!enhanceFile || enhanceLoading}
                        className={`h-10 px-4 rounded-xl text-sm font-medium ${theme.accent} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {enhanceLoading ? 'Verbessere...' : 'Verbessern'}
                      </button>
                    </div>

                    {enhanceLoading && (
                      <div className={`mb-4 flex items-center gap-2 text-xs ${theme.textMuted}`}>
                        <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current" />
                        Nano Banana Pro arbeitet im Hintergrund...
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className={`rounded-xl border ${theme.border} p-3`}>
                        <p className={`text-xs ${theme.textMuted} mb-2`}>Vorher</p>
                        {enhancePreview ? (
                          <img
                            src={enhancePreview}
                            alt="Original"
                            className="w-full max-h-[360px] object-contain rounded-lg bg-white"
                          />
                        ) : (
                          <div className={`h-48 rounded-lg ${theme.bgHover} flex items-center justify-center text-xs ${theme.textMuted}`}>
                            Kein Bild ausgewählt
                          </div>
                        )}
                      </div>
                      <div className={`rounded-xl border ${theme.border} p-3`}>
                        <p className={`text-xs ${theme.textMuted} mb-2`}>Nachher</p>
                        {enhanceResultPreview ? (
                          <img
                            src={enhanceResultPreview}
                            alt="Verbessert"
                            className="w-full max-h-[360px] object-contain rounded-lg bg-white"
                          />
                        ) : (
                          <div className={`h-48 rounded-lg ${theme.bgHover} flex items-center justify-center text-xs ${theme.textMuted}`}>
                            Noch kein Ergebnis
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeView === 'rechnungen' && (
                <>
                  <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Großhandelsrechnungen</h2>

                  {rechnungenTab === 'neu' ? (
                    // Paperless-Ansicht
                    paperlessLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <svg className="w-8 h-8 animate-spin text-[#F59E0B]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                    ) : paperlessRechnungen.length === 0 ? (
                      <div className={`${theme.panel} rounded-2xl p-8 border ${theme.border} ${theme.cardShadow} text-center`}>
                        <Icons.FileText className="w-12 h-12 mx-auto mb-4 text-[#64748B]" />
                        <p className={theme.textMuted}>Keine Rechnungen in Paperless gefunden.</p>
                        <p className={`text-xs ${theme.textMuted} mt-2`}>Saved View "Rechnungsdatum 8 Tage" prüfen</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {(() => {
                          // Nach Datum gruppieren
                          const byDate = paperlessRechnungen.reduce((acc, doc) => {
                            const dateKey = doc.datum || 'unbekannt'
                            if (!acc[dateKey]) acc[dateKey] = []
                            acc[dateKey].push(doc)
                            return acc
                          }, {})

                          // Sortierte Datumsschlüssel (neueste zuerst)
                          const sortedDates = Object.keys(byDate).sort((a, b) => new Date(b) - new Date(a))

                          return sortedDates.map((dateKey, index) => {
                            const dayDocs = byDate[dateKey]
                            // Nach Titel sortieren (kleinste Rechnungsnummer oben)
                            const phoenix = dayDocs.filter(d => getGrosshaendler(d.correspondentName) === 'phoenix').sort((a, b) => b.title.localeCompare(a.title))
                            const ahd = dayDocs.filter(d => getGrosshaendler(d.correspondentName) === 'ahd').sort((a, b) => b.title.localeCompare(a.title))
                            const sanacorp = dayDocs.filter(d => getGrosshaendler(d.correspondentName) === 'sanacorp').sort((a, b) => b.title.localeCompare(a.title))

                            const dateLabel = dateKey === 'unbekannt' ? 'Unbekanntes Datum' : new Date(dateKey).toLocaleDateString('de-DE', {
                              weekday: 'long',
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })

                            // Erster Tag ausgeklappt, Rest eingeklappt
                            const isCollapsed = index === 0
                              ? paperlessCollapsedDays[dateKey] === true
                              : paperlessCollapsedDays[dateKey] !== false

                            return (
                              <div key={dateKey}>
                                {/* Tagesüberschrift */}
                                <button
                                  onClick={() => togglePaperlessDayCollapsed(dateKey)}
                                  className="w-full flex items-center gap-3 mb-3 group cursor-pointer"
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
                                  <span className={`text-xs ${theme.textMuted}`}>({dayDocs.length})</span>
                                  <div className={`flex-1 h-px ${theme.border} border-t`} />
                                </button>

                                {/* Drei Spalten */}
                                {!isCollapsed && (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Phoenix - grün */}
                                    <div className="space-y-1">
                                      {phoenix.length > 0 ? phoenix.map(doc => (
                                        <button
                                          key={doc.id}
                                          onClick={() => openPaperlessPdfModal(doc)}
                                          className="w-full text-left px-3 py-2 rounded-lg bg-[#0D9488]/10 hover:bg-[#0D9488]/20 transition-colors border-l-4 border-[#0D9488]"
                                        >
                                          <div className="flex justify-between items-start">
                                            <p className="text-sm font-medium text-[#0D9488] truncate">{doc.title}</p>
                                          </div>
                                          <p className={`text-xs ${theme.textMuted} truncate`}>{doc.original_file_name}</p>
                                        </button>
                                      )) : (
                                        <div className="px-3 py-2 rounded-lg bg-gray-50 text-center">
                                          <p className={`text-xs ${theme.textMuted}`}>–</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* AHD - gelb */}
                                    <div className="space-y-1">
                                      {ahd.length > 0 ? ahd.map(doc => (
                                        <button
                                          key={doc.id}
                                          onClick={() => openPaperlessPdfModal(doc)}
                                          className="w-full text-left px-3 py-2 rounded-lg bg-[#FEF3C7]/50 hover:bg-[#FEF3C7] transition-colors border-l-4 border-[#F59E0B]"
                                        >
                                          <div className="flex justify-between items-start">
                                            <p className="text-sm font-medium text-[#D97706] truncate">{doc.title}</p>
                                          </div>
                                          <p className={`text-xs ${theme.textMuted} truncate`}>{doc.original_file_name}</p>
                                        </button>
                                      )) : (
                                        <div className="px-3 py-2 rounded-lg bg-gray-50 text-center">
                                          <p className={`text-xs ${theme.textMuted}`}>–</p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Sanacorp - blau */}
                                    <div className="space-y-1">
                                      {sanacorp.length > 0 ? sanacorp.map(doc => (
                                        <button
                                          key={doc.id}
                                          onClick={() => openPaperlessPdfModal(doc)}
                                          className="w-full text-left px-3 py-2 rounded-lg bg-[#1E293B]/10 hover:bg-[#1E293B]/20 transition-colors border-l-4 border-[#1E293B]"
                                        >
                                          <div className="flex justify-between items-start">
                                            <p className="text-sm font-medium text-[#1E293B] truncate">{doc.title}</p>
                                          </div>
                                          <p className={`text-xs ${theme.textMuted} truncate`}>{doc.original_file_name}</p>
                                        </button>
                                      )) : (
                                        <div className="px-3 py-2 rounded-lg bg-gray-50 text-center">
                                          <p className={`text-xs ${theme.textMuted}`}>–</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })
                        })()}
                      </div>
                    )
                  ) : rechnungenLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <svg className="w-8 h-8 animate-spin text-[#F59E0B]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  ) : rechnungen.length === 0 ? (
                    <div className={`${theme.panel} rounded-2xl p-8 border ${theme.border} ${theme.cardShadow} text-center`}>
                      <Icons.FileText className="w-12 h-12 mx-auto mb-4 text-[#64748B]" />
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
                          const phoenix = dayRechnungen.filter(r => r.grosshaendler?.toLowerCase() === 'phoenix').sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                          const ahd = dayRechnungen.filter(r => r.grosshaendler?.toLowerCase() === 'ahd').sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                          const sanacorp = dayRechnungen.filter(r => r.grosshaendler?.toLowerCase() === 'sanacorp').sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

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
                                      className="w-full text-left px-3 py-2 rounded-lg bg-[#0D9488]/10 hover:bg-[#0D9488]/20 transition-colors border-l-4 border-[#0D9488]"
                                    >
                                      <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-[#0D9488]">{r.rechnungsnummer}</p>
                                        <span className="text-xs text-[#0D9488]/70">{new Date(r.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</span>
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
                                      className="w-full text-left px-3 py-2 rounded-lg bg-[#FEF3C7]/50 hover:bg-[#FEF3C7] transition-colors border-l-4 border-[#F59E0B]"
                                    >
                                      <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-[#D97706]">{r.rechnungsnummer}</p>
                                        <span className="text-xs text-[#F59E0B]">{new Date(r.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</span>
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
                                      className="w-full text-left px-3 py-2 rounded-lg bg-[#1E293B]/10 hover:bg-[#1E293B]/20 transition-colors border-l-4 border-[#1E293B]"
                                    >
                                      <div className="flex justify-between items-start">
                                        <p className="text-sm font-medium text-[#1E293B]">{r.rechnungsnummer}</p>
                                        <span className="text-xs text-[#1E293B]/70">{new Date(r.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</span>
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
                  {secondaryTab === 'email' && (
                    <>
                      <div className="mb-2">
                        <label className={`text-xs ${theme.textMuted}`}>Kontoauswahl</label>
                        <select
                          value={selectedEmailAccount || ''}
                          onChange={(e) => handleSelectEmailAccount(e.target.value)}
                          className={`ml-2 text-sm font-medium bg-transparent border ${theme.border} rounded px-2 py-0.5 cursor-pointer ${theme.text} focus:outline-none focus:ring-1 focus:ring-[#0D9488]`}
                        >
                          {emailAccounts.length === 0 && (
                            <option value="">Kein Konto</option>
                          )}
                          {emailAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name || acc.email}
                            </option>
                          ))}
                        </select>
                      </div>
                      <EmailView
                        theme={theme}
                        account={emailAccounts.find(a => a.id === selectedEmailAccount)}
                        hasAccess={currentUserEmailAccess}
                        onConfigureClick={() => {
                          setActiveView('settings')
                          setSettingsTab('email')
                        }}
                        aiSettings={aiSettings}
                      />
                    </>
                  )}

                  {secondaryTab === 'fax' && (
                    <FaxView
                      theme={theme}
                      pendingFaxId={pendingFaxId}
                      onClearPendingFax={() => setPendingFaxId(null)}
                    />
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
                  filteredStaff={filteredStaff}
                  staffMessage={staffMessage}
                  staffLoading={staffLoading}
                  fetchStaff={fetchStaff}
                  openStaffModal={openStaffModal}
                  pharmacyLookup={pharmacyLookup}
                  showExited={showExited}
                  setShowExited={setShowExited}
                  isExited={isExited}
                  staffViewMode={staffViewMode}
                  setStaffViewMode={setStaffViewMode}
                  EmailSettingsSection={EmailSettingsSection}
                  currentStaff={currentStaff}
                  emailAccounts={emailAccounts}
                  selectedEmailAccount={selectedEmailAccount}
                  handleSelectEmailAccount={handleSelectEmailAccount}
                  openEmailAccountModal={openEmailAccountModal}
                  handleDeleteEmailAccount={handleDeleteEmailAccount}
                  emailPermissions={emailPermissions}
                  toggleEmailPermission={toggleEmailPermission}
                  aiSettings={aiSettings}
                  setAiSettings={setAiSettings}
                  saveAiSettings={saveAiSettings}
                  aiSettingsSaving={aiSettingsSaving}
                  aiSettingsMessage={aiSettingsMessage}
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
                  toggleTrackingEnabled={toggleTrackingEnabled}
                  CourierMap={CourierMap}
                  courierLocations={courierLocations}
                  locationsLoading={locationsLoading}
                  fetchCourierLocations={fetchCourierLocations}
                  CourierTable={CourierTable}
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

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Umsatzsteuer-ID
                    </label>
                    <input
                      value={editForm.vatId}
                      onChange={(e) => handleEditInput('vatId', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Handelsregistereintrag
                    </label>
                    <input
                      value={editForm.tradeRegister}
                      onChange={(e) => handleEditInput('tradeRegister', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      Amtsgericht
                    </label>
                    <input
                      value={editForm.registryCourt}
                      onChange={(e) => handleEditInput('registryCourt', e.target.value)}
                      className={`w-full px-3 py-2 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                      BGA/IDF-Nummer
                    </label>
                    <input
                      value={editForm.bgaIdfNumber}
                      onChange={(e) => handleEditInput('bgaIdfNumber', e.target.value)}
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
                  {currentStaff?.is_admin && (
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>
                        Ausscheidedatum
                      </label>
                      <input
                        type="date"
                        value={staffForm.exitDate}
                        onChange={(e) => handleStaffInput('exitDate', e.target.value)}
                        className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none transition-all ${theme.text} text-sm`}
                      />
                    </div>
                  )}
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
                      className="accent-[#F59E0B]"
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
          selectedCardNeedsConfirmation={selectedCardHasEnhanced && !selectedContact?.business_card_enhanced_confirmed}
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
          contactFormCardView={contactFormCardView}
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
            const hasOriginal = contactCardPreview || contactForm.businessCardUrl
            const hasEnhanced = contactCardEnhancedPreview || contactForm.businessCardUrlEnhanced
            const hasBoth = hasOriginal && hasEnhanced

            if (hasBoth) {
              // Nur die aktuell angezeigte Version entfernen
              if (contactFormCardView === 'enhanced') {
                contactScanApi.setContactCardEnhancedFile(null)
                contactScanApi.setContactCardEnhancedPreview('')
                handleContactInput('businessCardUrlEnhanced', '')
                // Zur verbleibenden Version wechseln
                setContactFormCardView('original')
              } else {
                contactScanApi.setContactCardFile(null)
                contactScanApi.setContactCardPreview('')
                contactScanApi.setContactCardRotation(0)
                handleContactInput('businessCardUrl', '')
                // Zur verbleibenden Version wechseln
                setContactFormCardView('enhanced')
              }
            } else {
              // Nur eine Version vorhanden - alles entfernen
              contactScanApi.setContactCardFile(null)
              contactScanApi.setContactCardPreview('')
              contactScanApi.setContactCardEnhancedFile(null)
              contactScanApi.setContactCardEnhancedPreview('')
              contactScanApi.setContactCardEnhancing(false)
              contactScanApi.setContactCardRotation(0)
              handleContactInput('businessCardUrl', '')
              handleContactInput('businessCardUrlEnhanced', '')
            }
          }}
          onRotateLeft={() => contactScanApi.setContactCardRotation((r) => (r - 90 + 360) % 360)}
          onRotateRight={() => contactScanApi.setContactCardRotation((r) => (r + 90) % 360)}
          onSelectFormCardView={setContactFormCardView}
          onConfirmEnhanced={async () => {
            handleContactInput('businessCardEnhancedConfirmed', true)
            // Sofort in DB speichern wenn Kontakt existiert
            if (editingContact?.id) {
              await supabase
                .from('contacts')
                .update({ business_card_enhanced_confirmed: true })
                .eq('id', editingContact.id)
              fetchContacts()
            }
          }}
          PhotoIcon={Icons.Photo}
          CloseIcon={Icons.X}
          deleteIcon={(
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        />

        {/* Task Form Modal */}
        <TaskFormModal
          theme={theme}
          editingTask={editingTask}
          taskForm={taskForm}
          taskSaving={taskSaving}
          taskSaveError={taskSaveError}
          handleTaskInput={handleTaskInput}
          saveTaskFromModal={saveTaskFromModal}
          closeTaskModal={closeTaskModal}
          staff={staff}
          projects={projects}
        />

        {/* Task Complete Modal */}
        <TaskCompleteModal
          task={completingTask}
          currentStaff={currentStaff}
          onConfirm={confirmTaskComplete}
          onCancel={cancelTaskComplete}
        />

        {/* Project Form Modal */}
        <ProjectFormModal
          editingProject={editingProject}
          projectForm={projectForm}
          projectSaving={projectSaving}
          projectSaveError={projectSaveError}
          handleProjectInput={handleProjectInput}
          saveProject={saveProject}
          closeProjectModal={closeProjectModal}
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

        {/* PDF-Modal für Paperless-Rechnungen */}
        {paperlessPdfModalOpen && selectedPaperlessPdf && (
          <div
            className={`fixed inset-0 z-50 ${theme.overlay} flex items-center justify-center p-4`}
            onClick={closePaperlessPdfModal}
          >
            <div
              className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-5xl h-[90vh] flex flex-col`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`flex items-center justify-between px-5 py-4 border-b ${theme.border} flex-shrink-0`}>
                <div>
                  <h3 className="text-base font-semibold">{selectedPaperlessPdf.correspondentName} - {selectedPaperlessPdf.title}</h3>
                  <p className={`text-xs ${theme.textMuted}`}>
                    {selectedPaperlessPdf.datum ? new Date(selectedPaperlessPdf.datum).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'Unbekanntes Datum'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedPaperlessPdf.url}
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
                    href={selectedPaperlessPdf.url}
                    download={selectedPaperlessPdf.original_file_name || `${selectedPaperlessPdf.title}.pdf`}
                    className={`p-2 rounded-lg ${theme.bgHover} ${theme.textSecondary}`}
                    title="Herunterladen"
                  >
                    <Icons.Download />
                  </a>
                  <button
                    type="button"
                    onClick={closePaperlessPdfModal}
                    className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                    title="Schließen"
                  >
                    <Icons.X />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={selectedPaperlessPdf.url}
                  className="w-full h-full border-0"
                  title={`PDF ${selectedPaperlessPdf.title}`}
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
                      className="w-full accent-[#F59E0B]"
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
                      className="w-full accent-[#F59E0B]"
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
                        className={`${isComplete ? theme.primaryBg : 'bg-[#FF6500] hover:bg-[#E65A00]'} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadAmkPdf(selectedApoMessage)}
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
                        className={`${isComplete ? theme.primaryBg : 'bg-[#FF6500] hover:bg-[#E65A00]'} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadRecallPdf(selectedApoMessage)}
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
                      className={`w-full px-4 py-3 rounded-xl border-2 border-dashed ${theme.border} ${theme.textMuted} hover:border-[#F59E0B] hover:text-[#F59E0B] transition-colors`}
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
                  {/* Prüfen ob Fax-Link vorhanden */}
                  {eventForm.description && eventForm.description.includes('[fax:') ? (
                    <div className={`w-full px-4 py-2.5 rounded-xl border ${theme.border} ${theme.surface} ${theme.text} text-sm`}>
                      {/* Text vor dem Link */}
                      {eventForm.description.split('[fax:')[0].trim() && (
                        <p className="mb-2 whitespace-pre-wrap">{eventForm.description.split('[fax:')[0].trim()}</p>
                      )}
                      {/* Fax-Link als Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const match = eventForm.description.match(/\[fax:([a-f0-9-]+)\]/)
                          if (match) {
                            openFaxPdfPopup(match[1])
                          }
                        }}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <Printer size={18} />
                        <span className="font-medium">Fax-Ankündigung anzeigen</span>
                      </button>
                    </div>
                  ) : (
                    <textarea
                      value={eventForm.description}
                      onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className={`w-full px-4 py-2.5 rounded-xl border ${theme.input} ${theme.inputPlaceholder} resize-none ${theme.text}`}
                      placeholder="Optional"
                    />
                  )}
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
                      {['#0D9488', '#F59E0B', '#FEF3C7', '#FF6500', '#1E293B', '#64748B'].map((color) => (
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

        {/* Biowetter Modal */}
        {showBiowetterModal && (
          <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-50 p-4`}>
            <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-lg max-h-[80vh] flex flex-col`}>
              <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
                <h3 className={`text-lg font-semibold ${theme.text}`}>Biowetter</h3>
                <button
                  type="button"
                  onClick={() => setShowBiowetterModal(false)}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                >
                  <Icons.X />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* Biowetter-Tabelle */}
                {(() => {
                  const forecasts = getBiowetterForecasts?.()
                  if (!forecasts?.slots) return <p className={theme.textMuted}>Keine Daten verfügbar.</p>

                  const availableSlots = forecasts.slots.filter(slot => slot.available)
                  const allEffectLabels = new Map()
                  const slotEffectsMap = availableSlots.map(slot => {
                    const effectMap = new Map()
                    slot.effects.forEach(e => {
                      allEffectLabels.set(e.label, e.label)
                      effectMap.set(e.label, e)
                    })
                    return effectMap
                  })
                  const effectList = Array.from(allEffectLabels.keys())

                  const weekdayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
                  const today = new Date()
                  const getWeekday = (daysFromNow) => weekdayNames[(today.getDay() + daysFromNow) % 7]

                  const days = [
                    { label: getWeekday(0), slots: availableSlots.filter(s => s.dayLabel === 'Heute') },
                    { label: getWeekday(1), slots: availableSlots.filter(s => s.dayLabel === 'Morgen') },
                    { label: getWeekday(2), slots: availableSlots.filter(s => s.dayLabel === 'Überm.') },
                  ].filter(day => day.slots.length > 0)

                  return (
                    <>
                      {effectList.length > 0 ? (
                        <div className="flex">
                          <div className="flex-1 mr-2">
                            <div className="h-5" />
                            <div className="h-4 mb-1" />
                            <div className="space-y-1">
                              {effectList.map((label) => (
                                <div key={label} className="h-4 flex items-center">
                                  <span className={`text-xs ${theme.text} truncate`}>{label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {days.map((day, dayIdx) => (
                            <div key={day.label} className={`${dayIdx > 0 ? 'border-l border-[#E5E7EB] pl-1 ml-1' : ''}`}>
                              <div className="h-5 flex justify-center items-center">
                                <span className="text-[10px] text-[#6B7280]">{day.label}</span>
                              </div>
                              <div className="h-4 mb-1 flex gap-px justify-center items-center">
                                {day.slots.map((slot) => (
                                  <div key={slot.key} className="w-[18px] text-center">
                                    <span className="text-[8px] text-[#9CA3AF]">{slot.label}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-1">
                                {effectList.map((label) => (
                                  <div key={label} className="h-4 flex gap-px justify-center items-center">
                                    {day.slots.map((slot) => {
                                      const slotIdx = availableSlots.findIndex(s => s.key === slot.key)
                                      const effect = slotEffectsMap[slotIdx]?.get(label)
                                      return (
                                        <div key={slot.key} className="w-[18px] flex justify-center items-center">
                                          <span
                                            className={`w-3 h-3 rounded-sm ${effect?.dotColor || 'bg-[#27AE60]'}`}
                                            title={effect ? `${effect.value}` : 'kein Einfluss'}
                                          />
                                        </div>
                                      )
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={`text-sm ${theme.textMuted}`}>Kein Einfluss erwartet.</p>
                      )}
                    </>
                  )
                })()}

                {/* KI-Empfehlung */}
                <div className={`pt-4 border-t ${theme.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkle size={18} weight="fill" className="text-violet-500" />
                    <p className={`text-sm font-medium ${theme.textSecondary}`}>KI-Empfehlung</p>
                  </div>
                  {biowetterAiLoading ? (
                    <p className={`text-sm ${theme.textMuted} italic`}>Empfehlung wird generiert...</p>
                  ) : biowetterAiRecommendation ? (
                    <p className={`text-sm ${theme.text} leading-relaxed`}>{biowetterAiRecommendation}</p>
                  ) : (
                    <p className={`text-sm ${theme.textMuted}`}>Keine Empfehlung verfügbar.</p>
                  )}
                </div>

                {/* Legende */}
                <div className={`pt-4 border-t ${theme.border}`}>
                  <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>Legende</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-[#27AE60]" />
                      <span className={theme.textMuted}>kein Einfluss</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-[#F2C94C]" />
                      <span className={theme.textMuted}>gering</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-[#E5533D]" />
                      <span className={theme.textMuted}>hoch</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm bg-[#2EC4B6]" />
                      <span className={theme.textMuted}>Kälte</span>
                    </div>
                  </div>
                </div>

                {biowetterLastUpdate && (
                  <p className={`text-xs ${theme.textMuted}`}>Stand: {biowetterLastUpdate}</p>
                )}
              </div>

              <div className={`flex justify-end p-4 border-t ${theme.border}`}>
                <button
                  type="button"
                  onClick={() => setShowBiowetterModal(false)}
                  className={`px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium`}
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Fax-PDF Popup */}
        {faxPdfPopup && (
          <div className={`fixed inset-0 ${theme.overlay} flex items-center justify-center z-50 p-4`}>
            <div className={`${theme.panel} rounded-2xl border ${theme.border} ${theme.cardShadow} w-full max-w-4xl h-[85vh] flex flex-col`}>
              <div className={`flex items-center justify-between p-4 border-b ${theme.border}`}>
                <div className="flex items-center gap-3">
                  <Printer size={24} className={theme.accentText} />
                  <div>
                    <h3 className={`text-lg font-semibold ${theme.text}`}>Fax-Ankündigung</h3>
                    <p className={`text-sm ${theme.textMuted}`}>{faxPdfPopup.absender || 'Unbekannter Absender'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFaxPdfPopup(null)}
                  className={`p-2 rounded-lg ${theme.bgHover} ${theme.textMuted}`}
                >
                  <Icons.X />
                </button>
              </div>
              <div className="flex-1 min-h-0 bg-gray-100">
                <iframe
                  src={faxPdfPopup.pdfUrl}
                  className="w-full h-full border-0"
                  title="Fax PDF"
                />
              </div>
            </div>
          </div>
        )}

        {/* Floating AI Chat Widget */}
        <FloatingAiChat theme={theme} currentStaff={currentStaff} staff={staff} />

        </div>
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<LoadingSpinner message="Lädt..." />}>
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
    </Suspense>
  )
}

export default App
