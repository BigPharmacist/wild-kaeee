import { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { supabase, supabaseUrl } from '../../lib/supabase'
import { downloadAmkPdf, downloadRecallPdf } from '../../lib/pdfGenerator'
import {
  detectRotationWithAI,
  rotateImageByDegrees,
  compressImage,
  getEnhancedImage,
  rotateImage,
} from '../../lib/imageProcessing'
import { useNavigation, useAuth, usePharmacy, useStaff, useTheme, useContactsContext, useEmail, usePhotosContext, useChatContext } from '../../context'
import { Printer, Sparkle } from '@phosphor-icons/react'

// Hooks
import { useFaxCounts, useUrgentFax } from '../fax'
import { contactScan } from '../contacts'
import { useWeather, usePollen, useBiowetter, useDashboardTasks } from '../dashboard'
import { useTasks } from '../tasks'
import { useProjects } from '../projects'
import { useCalendar } from '../calendar'
import { useRechnungen } from '../rechnungen'
import { useArchiv } from '../archiv'
import { useTracking } from '../tracking'
import { useApoState } from '../apo/hooks/useApoState'
import { navItems, miscNavItem, createSecondaryNavMap } from './config/navigation'

// Lazy-loaded Feature Views
const EmailView = lazy(() => import('../email/EmailView'))
const EmailAccountModal = lazy(() => import('../email/EmailAccountModal'))
const EmailSettingsSection = lazy(() => import('../email/EmailSettingsSection'))
const FaxView = lazy(() => import('../fax/FaxView'))
const ContactDetailModal = lazy(() => import('../contacts/ContactDetailModal'))
const ContactFormModal = lazy(() => import('../contacts/ContactFormModal'))
const ContactsSettingsSection = lazy(() => import('../contacts/ContactsSettingsSection'))
const DashboardHeader = lazy(() => import('./DashboardHeader'))
const SidebarNav = lazy(() => import('./SidebarNav'))
const DashboardHome = lazy(() => import('./DashboardHome'))
const ApoView = lazy(() => import('../apo/ApoView'))
const PhotosView = lazy(() => import('../photos/PhotosView'))
const ChatView = lazy(() => import('../chat/ChatView'))
const SettingsView = lazy(() => import('../settings/SettingsView'))
const PlanView = lazy(() => import('../plan/PlanView'))
const TasksView = lazy(() => import('../tasks/TasksView'))
const TaskFormModal = lazy(() => import('../tasks/TaskFormModal'))
const TaskCompleteModal = lazy(() => import('../tasks/TaskCompleteModal'))
const ProjectFormModal = lazy(() => import('../projects/ProjectFormModal'))
const DokumenteView = lazy(() => import('../dokumente/DokumenteView'))
const CalendarView = lazy(() => import('../calendar/CalendarView'))
const NotdienstplanungView = lazy(() => import('../calendar/NotdienstplanungView'))
const ColorsView = lazy(() => import('../colors/ColorsView'))
const ScanView = lazy(() => import('../scan/ScanView'))
const ArchivView = lazy(() => import('../archiv/ArchivView'))
const BotendienstView = lazy(() => import('../botendienst/BotendienstView'))
const TrackingWidget = lazy(() => import('../tracking/TrackingWidget'))
const CourierMap = lazy(() => import('../tracking/CourierMap'))
const CourierTable = lazy(() => import('../tracking/CourierTable'))

// Modals
const ApoDetailModal = lazy(() => import('../apo/ApoDetailModal'))
const ApoDokumentationModal = lazy(() => import('../apo/ApoDokumentationModal'))
const PharmacyModal = lazy(() => import('../settings/modals/PharmacyModal'))
const StaffModal = lazy(() => import('../settings/modals/StaffModal'))
const EventModal = lazy(() => import('../calendar/modals/EventModal'))
const CalendarModal = lazy(() => import('../calendar/modals/CalendarModal'))
const PermissionsModal = lazy(() => import('../calendar/modals/PermissionsModal'))
const WeatherModal = lazy(() => import('./modals/WeatherModal'))
const BiowetterModal = lazy(() => import('./modals/BiowetterModal'))
const PhotoEditorModal = lazy(() => import('../photos/modals/PhotoEditorModal'))
const PdfModal = lazy(() => import('../rechnungen/modals/PdfModal'))
const PaperlessPdfModal = lazy(() => import('../rechnungen/modals/PaperlessPdfModal'))
const FaxPdfPopup = lazy(() => import('../fax/modals/FaxPdfPopup'))

// Schwere Libraries
const ReactCrop = lazy(() => import('react-image-crop').then(m => ({ default: m.default })))
import 'react-image-crop/dist/ReactCrop.css'
const ReactMarkdown = lazy(() => import('react-markdown'))
import remarkGfm from 'remark-gfm'

import { Icons, UnreadBadge, LoadingSpinner, FloatingAiChat } from '../../shared/ui'

/**
 * Main Dashboard Layout component
 * Orchestrates all views and modals for the authenticated user
 */
function DashboardLayout() {
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
    setDokumenteTab: _setDokumenteTab,
    archivTab,
    setArchivTab: _setArchivTab,
    rechnungenTab,
    setRechnungenTab: _setRechnungenTab,
    apoTab,
    setApoTab: _setApoTab,
    botendienstTab,
    setBotendienstTab,
    mobileNavOpen,
    setMobileNavOpen,
    getActiveSecondaryId,
    handleSecondarySelect,
    updateSecondaryForView,
  } = useNavigation()

  // Auth aus Context
  const { session, handleSignOut } = useAuth()

  // Pharmacy aus Context
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
  } = usePharmacy()

  // Staff aus Context
  const {
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
  } = useStaff()

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
    setEmailAccountForm,
    fetchEmailAccounts: _fetchEmailAccounts,
    fetchEmailPermissions,
    openEmailAccountModal,
    closeEmailAccountModal,
    handleSaveEmailAccount,
    handleDeleteEmailAccount,
    handleSelectEmailAccount,
    toggleEmailPermission,
    emailUnreadCount,
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

  // Photos aus Context
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

  // Apo State aus eigenem Hook
  const apoState = useApoState({
    session,
    activeView,
    apoTab,
    staffByAuthId,
    pharmacies,
  })

  // Local state
  const [showBiowetterModal, setShowBiowetterModal] = useState(false)
  const [enhanceFile, setEnhanceFile] = useState(null)
  const [enhancePreview, setEnhancePreview] = useState('')
  const [enhanceResultPreview, setEnhanceResultPreview] = useState('')
  const [enhanceLoading, setEnhanceLoading] = useState(false)
  const [enhanceMessage, setEnhanceMessage] = useState('')
  const [planData, setPlanData] = useState(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState('')
  const [selectedPlanDate, setSelectedPlanDate] = useState(() => {
    const today = new Date()
    return today.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  })
  const [pendingFaxId, setPendingFaxId] = useState(null)
  const [faxPdfPopup, setFaxPdfPopup] = useState(null)

  const { count: faxCount } = useFaxCounts()
  const { urgentFaxe } = useUrgentFax()

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
    fetchCalendarPermissions,
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
    canWriteCurrentCalendar,
    getEventColor,
  } = useCalendar({ session, activeView })

  // Theme aus Context
  const { theme } = useTheme()

  // Secondary navigation map
  const secondaryNavMap = useMemo(() => createSecondaryNavMap({
    projects,
    staff,
    session,
    archivDocumentTypes,
    archivSavedViews,
    currentStaff,
  }), [currentStaff?.is_admin, staff, session?.user?.id, archivDocumentTypes, archivSavedViews, projects])

  // Fax-PDF Popup öffnen
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

  // Effects
  useEffect(() => {
    updateSecondaryForView(secondaryNavMap)
  }, [activeView, updateSecondaryForView, secondaryNavMap])

  useEffect(() => {
    if (activeView === 'archiv') {
      fetchPaperlessConfig().then(() => {
        fetchArchivMetadata()
      })
    }
  }, [activeView])

  useEffect(() => {
    if (faxCount > 0) {
      document.title = `(${faxCount}) Kaeee`
    } else {
      document.title = 'Kaeee'
    }
  }, [faxCount])

  useEffect(() => {
    const handleNavigateToFax = () => {
      setActiveView('post')
      setSecondaryTab('fax')
    }
    window.addEventListener('navigate-to-fax', handleNavigateToFax)
    return () => window.removeEventListener('navigate-to-fax', handleNavigateToFax)
  }, [])

  useEffect(() => {
    const handleNavigateToChat = (event) => {
      const { chatType, chatId } = event.detail || {}
      setActiveView('chat')
      if (chatType === 'group') {
        setChatTab('group')
      } else if (chatId) {
        setChatTab(chatId)
      }
    }
    window.addEventListener('navigate-to-chat', handleNavigateToChat)
    return () => window.removeEventListener('navigate-to-chat', handleNavigateToChat)
  }, [])

  useEffect(() => {
    if (session && activeView === 'photos' && secondaryTab === 'visitenkarten') {
      fetchBusinessCards()
    }
  }, [session, activeView, secondaryTab])

  useEffect(() => {
    if (session && activeView === 'plan' && !planData && !planLoading && !planError) {
      fetchPlanData()
    }
  }, [activeView, session, planData, planLoading, planError])

  useEffect(() => {
    if (session && activeView === 'rechnungen') {
      if (rechnungenTab === 'alt' && rechnungen.length === 0 && !rechnungenLoading) {
        fetchRechnungen()
      }
      if (rechnungenTab === 'neu' && paperlessRechnungen.length === 0 && !paperlessLoading) {
        fetchPaperlessRechnungen()
      }
    }
  }, [activeView, session, rechnungenTab])

  // Handlers
  const handleSecondarySelectWithArchiv = (itemId) => {
    if (itemId === 'divider') return
    handleSecondarySelect(itemId)

    if (activeView === 'tasks') {
      if (itemId === 'all') {
        setFilterProjectId(null)
      } else if (itemId.startsWith('project-')) {
        const projectId = itemId.replace('project-', '')
        setFilterProjectId(projectId)
      }
    }

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

  const handleUrgentFaxClick = (faxId) => {
    setActiveView('post')
    setSecondaryTab('fax')
    setPendingFaxId(faxId)
  }

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
            pznCameraInputRef={apoState.pznCameraInputRef}
            handlePznCameraCapture={apoState.handlePznCameraCapture}
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
              unreadCounts={{ ...apoState.unreadCounts, fax: faxCount, email: emailUnreadCount, chat: chatUnreadCounts }}
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

              {activeView === 'scan' && (
                <ScanView
                  theme={theme}
                  session={session}
                  pharmacyId={pharmacies?.[0]?.id || null}
                />
              )}

              {activeView === 'apo' && (
                <ApoView
                  theme={theme}
                  Icons={Icons}
                  apoYear={apoState.apoYear}
                  changeApoYear={apoState.changeApoYear}
                  apoSearch={apoState.apoSearch}
                  setApoSearch={apoState.setApoSearch}
                  apoTab={apoTab}
                  amkLoading={apoState.amkLoading}
                  amkMessages={apoState.amkMessages}
                  recallLoading={apoState.recallLoading}
                  recallMessages={apoState.recallMessages}
                  lavLoading={apoState.lavLoading}
                  lavAusgaben={apoState.lavAusgaben}
                  rhbLoading={apoState.rhbLoading}
                  rhbMessages={apoState.rhbMessages}
                  filterApoItems={apoState.filterApoItems}
                  groupByMonth={apoState.groupByMonth}
                  monthNames={apoState.monthNames}
                  currentStaff={currentStaff}
                  readMessageIds={apoState.readMessageIds}
                  setSelectedApoMessage={apoState.setSelectedApoMessage}
                  markAsRead={apoState.markAsRead}
                  loadDokumentationen={apoState.loadDokumentationen}
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
                  {/* Rechnungen content is large - keeping inline for now */}
                  {rechnungenTab === 'neu' ? (
                    paperlessLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <div className={theme.textMuted}>Paperless Rechnungen Ansicht</div>
                    )
                  ) : (
                    <div className={theme.textMuted}>Alte Rechnungen Ansicht</div>
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

        {/* Modals */}
        <PharmacyModal
          theme={theme}
          Icons={Icons}
          editingPharmacy={editingPharmacy}
          editForm={editForm}
          editLoading={editLoading}
          editMessage={editMessage}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
          onEditInput={handleEditInput}
        />

        <StaffModal
          theme={theme}
          Icons={Icons}
          editingStaff={editingStaff}
          staffForm={staffForm}
          staffSaveLoading={staffSaveLoading}
          staffSaveMessage={staffSaveMessage}
          staffInviteLoading={staffInviteLoading}
          staffInviteMessage={staffInviteMessage}
          staffAvatarPreview={staffAvatarPreview}
          staffAvatarFile={staffAvatarFile}
          currentStaff={currentStaff}
          pharmacies={pharmacies}
          session={session}
          onClose={closeStaffModal}
          onSubmit={handleStaffSubmit}
          onStaffInput={handleStaffInput}
          onAvatarChange={handleStaffAvatarChange}
          onLinkCurrentUser={linkCurrentUser}
          onSendInvite={handleSendInvite}
        />

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
              if (contactFormCardView === 'enhanced') {
                contactScanApi.setContactCardEnhancedFile(null)
                contactScanApi.setContactCardEnhancedPreview('')
                handleContactInput('businessCardUrlEnhanced', '')
                setContactFormCardView('original')
              } else {
                contactScanApi.setContactCardFile(null)
                contactScanApi.setContactCardPreview('')
                contactScanApi.setContactCardRotation(0)
                handleContactInput('businessCardUrl', '')
                setContactFormCardView('enhanced')
              }
            } else {
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

        <TaskCompleteModal
          task={completingTask}
          currentStaff={currentStaff}
          onConfirm={confirmTaskComplete}
          onCancel={cancelTaskComplete}
        />

        <ProjectFormModal
          editingProject={editingProject}
          projectForm={projectForm}
          projectSaving={projectSaving}
          projectSaveError={projectSaveError}
          handleProjectInput={handleProjectInput}
          saveProject={saveProject}
          closeProjectModal={closeProjectModal}
        />

        <EventModal
          theme={theme}
          Icons={Icons}
          editingEvent={editingEvent}
          eventForm={eventForm}
          setEventForm={setEventForm}
          eventSaving={eventSaving}
          eventError={eventError}
          canWriteCurrentCalendar={canWriteCurrentCalendar}
          onClose={closeEventModal}
          onCreate={createEvent}
          onUpdate={updateEvent}
          onDelete={deleteEvent}
          onOpenFaxPdfPopup={openFaxPdfPopup}
        />

        <CalendarModal
          theme={theme}
          Icons={Icons}
          editingCalendar={editingCalendar}
          calendarForm={calendarForm}
          setCalendarForm={setCalendarForm}
          calendarSaving={calendarSaving}
          onClose={closeCalendarModal}
          onCreate={createCalendar}
          onUpdate={updateCalendar}
        />

        <PermissionsModal
          theme={theme}
          Icons={Icons}
          permissionsModalOpen={permissionsModalOpen}
          setPermissionsModalOpen={setPermissionsModalOpen}
          calendarPermissions={calendarPermissions}
          permissionsLoading={permissionsLoading}
          staff={staff}
          selectedCalendarId={selectedCalendarId}
          onAddPermission={addCalendarPermission}
          onRemovePermission={removeCalendarPermission}
        />

        <WeatherModal
          theme={theme}
          Icons={Icons}
          weatherModalOpen={weatherModalOpen}
          closeWeatherModal={closeWeatherModal}
          weatherInput={weatherInput}
          setWeatherInput={setWeatherInput}
          setWeatherLocation={setWeatherLocation}
        />

        <BiowetterModal
          theme={theme}
          Icons={Icons}
          showBiowetterModal={showBiowetterModal}
          setShowBiowetterModal={setShowBiowetterModal}
          getBiowetterForecasts={getBiowetterForecasts}
          biowetterAiLoading={biowetterAiLoading}
          biowetterAiRecommendation={biowetterAiRecommendation}
          biowetterLastUpdate={biowetterLastUpdate}
        />

        <PhotoEditorModal
          theme={theme}
          Icons={Icons}
          photoEditorOpen={photoEditorOpen}
          selectedPhoto={selectedPhoto}
          photoImgRef={photoImgRef}
          crop={crop}
          setCrop={setCrop}
          setCompletedCrop={setCompletedCrop}
          brightness={brightness}
          setBrightness={setBrightness}
          contrast={contrast}
          setContrast={setContrast}
          photoSaving={photoSaving}
          closePhotoEditor={closePhotoEditor}
          saveEditedPhoto={saveEditedPhoto}
          photoOcrData={photoOcrData}
          ocrProcessing={ocrProcessing}
          runOcrForPhoto={runOcrForPhoto}
        />

        <ApoDetailModal
          theme={theme}
          Icons={Icons}
          selectedApoMessage={apoState.selectedApoMessage}
          setSelectedApoMessage={apoState.setSelectedApoMessage}
          existingDokumentationen={apoState.existingDokumentationen}
          onOpenDokumentationModal={() => {
            apoState.setDokumentationBemerkung('')
            apoState.setDokumentationSignature(null)
            apoState.setShowSignatureCanvas(false)
            apoState.setShowDokumentationModal(true)
          }}
          onDownloadAmkPdf={handleDownloadAmkPdf}
          onDownloadRecallPdf={handleDownloadRecallPdf}
          handlePznClick={apoState.handlePznClick}
          pznFotoUploading={apoState.pznFotoUploading}
          activePzn={apoState.activePzn}
          savedPznFotos={apoState.savedPznFotos}
          supabaseUrl={supabaseUrl}
        />

        <ApoDokumentationModal
          theme={theme}
          Icons={Icons}
          show={apoState.showDokumentationModal}
          onClose={() => apoState.setShowDokumentationModal(false)}
          selectedApoMessage={apoState.selectedApoMessage}
          existingDokumentationen={apoState.existingDokumentationen}
          dokumentationBemerkung={apoState.dokumentationBemerkung}
          setDokumentationBemerkung={apoState.setDokumentationBemerkung}
          dokumentationSignature={apoState.dokumentationSignature}
          setDokumentationSignature={apoState.setDokumentationSignature}
          showSignatureCanvas={apoState.showSignatureCanvas}
          setShowSignatureCanvas={apoState.setShowSignatureCanvas}
          dokumentationLoading={apoState.dokumentationLoading}
          saveDokumentation={apoState.saveDokumentation}
          savedPznFotos={apoState.savedPznFotos}
          supabaseUrl={supabaseUrl}
        />

        <PdfModal
          theme={theme}
          Icons={Icons}
          pdfModalOpen={pdfModalOpen}
          selectedPdf={selectedPdf}
          closePdfModal={closePdfModal}
        />

        <PaperlessPdfModal
          theme={theme}
          Icons={Icons}
          paperlessPdfModalOpen={paperlessPdfModalOpen}
          selectedPaperlessPdf={selectedPaperlessPdf}
          closePaperlessPdfModal={closePaperlessPdfModal}
        />

        <FaxPdfPopup
          theme={theme}
          Icons={Icons}
          faxPdfPopup={faxPdfPopup}
          setFaxPdfPopup={setFaxPdfPopup}
        />

        <FloatingAiChat theme={theme} currentStaff={currentStaff} staff={staff} />
      </div>
    </Suspense>
  )
}

export default DashboardLayout
