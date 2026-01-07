import { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'

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
    }
  }, [session])

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
                  </div>
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
