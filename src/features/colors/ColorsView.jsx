const notificationSounds = [
  { name: 'Slick', url: 'https://proxy.notificationsounds.com/soft-subtle-ringtones/slick-notification/download/file-sounds-1329-slick.mp3', duration: '2s' },
  { name: 'Come Here', url: 'https://proxy.notificationsounds.com/notification-sounds/come-here-notification/download/file-sounds-1332-come-here.mp3', duration: '1s' },
  { name: 'So Proud', url: 'https://proxy.notificationsounds.com/notification-sounds/so-proud-notification/download/file-sounds-1228-so-proud.mp3', duration: '3s' },
  { name: 'Relax', url: 'https://proxy.notificationsounds.com/message-tones/relax-message-tone/download/file-sounds-1217-relax.mp3', duration: '4s' },
  { name: 'Jokingly', url: 'https://proxy.notificationsounds.com/notification-sounds/jokingly-notification/download/file-sounds-1337-jokingly.mp3', duration: '1s' },
  { name: 'Involved', url: 'https://proxy.notificationsounds.com/notification-sounds/involved-notification/download/file-sounds-1331-involved.mp3', duration: '2s' },
  { name: 'Checked Off', url: 'https://proxy.notificationsounds.com/notification-sounds/message-tone-checked-off/download/file-sounds-1335-checked-off.mp3', duration: '2s' },
  { name: 'No Problem', url: 'https://proxy.notificationsounds.com/free-jingles-and-logos/no-problem-notification-sound/download/file-sounds-1236-no-problem.mp3', duration: '2s' },
  { name: 'You would be glad', url: 'https://proxy.notificationsounds.com/notification-sounds/ringtone-you-would-be-glad-to-know/download/file-sounds-1350-you-would-be-glad.mp3', duration: '5s' },
  { name: 'Smile', url: 'https://proxy.notificationsounds.com/free-jingles-and-logos/smile-ringtone/download/file-sounds-1325-smile.mp3', duration: '2s' },
]

const playSound = (url) => {
  const audio = new Audio(url)
  audio.play().catch(err => console.error('Audio playback failed:', err))
}

const ColorsView = ({ theme }) => {
  const colorSections = [
    {
      title: 'Action Blue (Primary)',
      colors: [
        { name: 'primaryBg', label: 'Primary Button', className: theme.primaryBg },
        { name: 'accentText', label: 'Primary Text', className: theme.accentText },
        { name: 'accent', label: 'Accent (mit Hover)', className: theme.accent },
      ]
    },
    {
      title: 'Teal (Secondary)',
      colors: [
        { name: 'secondary', label: 'Secondary Text', className: theme.secondary },
        { name: 'secondaryAccent', label: 'Secondary Button', className: theme.secondaryAccent },
      ]
    },
    {
      title: 'Status-Farben',
      colors: [
        { name: 'success', label: 'Success Text', className: theme.success },
        { name: 'successBg', label: 'Success Button', className: theme.successBg },
        { name: 'warning', label: 'Warning Text', className: theme.warning },
        { name: 'warningBg', label: 'Warning Button', className: theme.warningBg },
        { name: 'danger', label: 'Danger Text', className: theme.danger },
        { name: 'dangerBg', label: 'Danger Button', className: theme.dangerBg },
      ]
    },
    {
      title: 'Text',
      colors: [
        { name: 'textPrimary', label: 'Primary Text', className: theme.textPrimary },
        { name: 'textSecondary', label: 'Secondary Text', className: theme.textSecondary },
        { name: 'textMuted', label: 'Muted Text', className: theme.textMuted },
      ]
    },
    {
      title: 'Hintergründe',
      colors: [
        { name: 'bgApp', label: 'App Background', className: theme.bgApp },
        { name: 'surface', label: 'Surface/Panel', className: theme.surface },
        { name: 'bgCard', label: 'Card Background', className: theme.bgCard },
      ]
    },
    {
      title: 'Sidebar',
      colors: [
        { name: 'sidebarBg', label: 'Primary Sidebar', className: theme.sidebarBg },
        { name: 'secondarySidebarBg', label: 'Secondary Sidebar', className: theme.secondarySidebarBg },
      ]
    },
  ]

  return (
    <>
      <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Farbenmuster</h2>
      <p className={`text-sm ${theme.textMuted} mb-8`}>
        Übersicht aller Farben aus dem Theme-Objekt. Änderungen am Theme werden hier automatisch angezeigt.
      </p>

      {/* Buttons */}
      <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow} mb-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>Buttons</h3>
        <div className="flex flex-wrap gap-3">
          <button className={`px-4 py-2 rounded-xl text-white font-medium text-sm ${theme.accent}`}>
            Primary
          </button>
          <button className={`px-4 py-2 rounded-xl text-white font-medium text-sm ${theme.secondaryAccent}`}>
            Secondary
          </button>
          <button className={`px-4 py-2 rounded-xl text-white font-medium text-sm ${theme.successBg}`}>
            Success
          </button>
          <button className={`px-4 py-2 rounded-xl text-white font-medium text-sm ${theme.warningBg}`}>
            Warning
          </button>
          <button className={`px-4 py-2 rounded-xl text-white font-medium text-sm ${theme.dangerBg}`}>
            Danger
          </button>
          <button className={`px-4 py-2 rounded-xl border font-medium text-sm ${theme.border} ${theme.text} ${theme.bgHover}`}>
            Outline
          </button>
        </div>
      </div>

      {/* Text Styles */}
      <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow} mb-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>Text-Stile</h3>
        <div className="space-y-3">
          <p className={`text-lg font-semibold ${theme.textPrimary}`}>Primary Text - Überschriften und wichtige Inhalte</p>
          <p className={`text-sm ${theme.textSecondary}`}>Secondary Text - Labels und Untertitel</p>
          <p className={`text-sm ${theme.textMuted}`}>Muted Text - Placeholders und deaktivierte Elemente</p>
          <p className={`text-sm ${theme.accentText}`}>Accent Text - Links und Aktionen</p>
          <p className={`text-sm ${theme.secondary}`}>Secondary Accent - Teal Highlights</p>
          <p className={`text-sm ${theme.success}`}>Success Text - Erfolgsmeldungen</p>
          <p className={`text-sm ${theme.warning}`}>Warning Text - Warnungen</p>
          <p className={`text-sm ${theme.danger}`}>Danger Text - Fehler und kritische Aktionen</p>
        </div>
      </div>

      {/* Cards */}
      <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow} mb-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>Cards</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className={`${theme.panel} rounded-xl p-4 border ${theme.border} ${theme.cardShadow} ${theme.cardHoverShadow} transition-all`}>
            <h4 className={`font-semibold ${theme.text}`}>Standard Card</h4>
            <p className={`text-sm ${theme.textMuted} mt-1`}>Mit Hover-Effekt</p>
          </div>
          <div className={`${theme.panel} rounded-xl p-4 border-l-4 border-l-[#F59E0B] border ${theme.border} ${theme.cardShadow}`}>
            <h4 className={`font-semibold ${theme.text}`}>Orange Card</h4>
            <p className={`text-sm ${theme.textMuted} mt-1`}>Mit Orange Rand</p>
          </div>
          <div className={`${theme.panel} rounded-xl p-4 border-l-4 border-l-[#0D9488] border ${theme.border} ${theme.cardShadow}`}>
            <h4 className={`font-semibold ${theme.text}`}>Teal Card</h4>
            <p className={`text-sm ${theme.textMuted} mt-1`}>Mit Teal Rand</p>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow} mb-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>Inputs</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>Text Input</label>
            <input
              type="text"
              placeholder="Placeholder..."
              className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none ${theme.text} text-sm`}
            />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>Select</label>
            <select className={`w-full px-3 py-2 ${theme.input} border rounded-xl outline-none ${theme.text} text-sm`}>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation States */}
      <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow} mb-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>Navigation</h3>
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-2 rounded-lg text-sm font-medium ${theme.navActive}`}>
            Aktiv
          </span>
          <span className={`px-3 py-2 rounded-lg text-sm font-medium ${theme.text} ${theme.navHover}`}>
            Hover
          </span>
          <span className={`px-3 py-2 rounded-lg text-sm font-medium border-l-4 border-l-[#F59E0B] ${theme.sidebarBg} text-white`}>
            Sidebar Active
          </span>
        </div>
      </div>

      {/* Badges */}
      <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow} mb-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>Badges</h3>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs uppercase tracking-wide px-2 py-1 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/20">
            Orange
          </span>
          <span className="text-xs uppercase tracking-wide px-2 py-1 rounded-full bg-[#0D9488]/15 text-[#0D9488] border border-[#0D9488]/20">
            Teal
          </span>
          <span className="text-xs uppercase tracking-wide px-2 py-1 rounded-full bg-[#1E293B]/15 text-[#1E293B] border border-[#1E293B]/20">
            Navy
          </span>
          <span className="text-xs uppercase tracking-wide px-2 py-1 rounded-full bg-[#FEF3C7] text-[#1E293B] border border-[#F59E0B]/20">
            Creme
          </span>
          <span className="text-xs uppercase tracking-wide px-2 py-1 rounded-full bg-[#FF6500]/15 text-[#FF6500] border border-[#FF6500]/20">
            Error
          </span>
        </div>
      </div>


      {/* Notification Sounds */}
      <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow} mb-6`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>Fax-Benachrichtigungstöne</h3>
        <p className={`text-sm ${theme.textMuted} mb-4`}>
          Klicke auf einen Sound, um ihn zu testen. Diese können als Benachrichtigungston für neue Faxe verwendet werden.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notificationSounds.map((sound, index) => (
            <button
              key={sound.name}
              onClick={() => playSound(sound.url)}
              className={`flex items-center gap-3 p-3 rounded-xl border ${theme.border} bg-white hover:bg-gray-50 transition-all text-left cursor-pointer`}
            >
              <div className={`w-10 h-10 rounded-full ${theme.primaryBg} flex items-center justify-center text-white flex-shrink-0`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
              <div className="min-w-0">
                <div className={`font-medium text-sm ${theme.text} truncate`}>{index + 1}. {sound.name}</div>
                <div className={`text-xs ${theme.textMuted}`}>{sound.duration}</div>
              </div>
            </button>
          ))}
        </div>
        <p className={`text-xs ${theme.textMuted} mt-4`}>
          Sounds von <a href="https://notificationsounds.com" target="_blank" rel="noopener noreferrer" className={theme.accentText}>notificationsounds.com</a> (Creative Commons)
        </p>
      </div>

      {/* Color Swatches */}
      <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme.text}`}>Farbpalette</h3>
        <div className="space-y-6">
          {colorSections.map((section) => (
            <div key={section.title}>
              <h4 className={`text-sm font-medium mb-2 ${theme.textSecondary}`}>{section.title}</h4>
              <div className="flex flex-wrap gap-2">
                {section.colors.map((color) => (
                  <div
                    key={color.name}
                    className={`w-24 h-16 rounded-lg ${color.className} flex items-end justify-center pb-1 border ${theme.border}`}
                  >
                    <span className="text-[10px] font-medium drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
                      {color.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Hex Values Reference */}
          <div className={`mt-6 pt-6 border-t ${theme.border}`}>
            <h4 className={`text-sm font-medium mb-3 ${theme.textSecondary}`}>Hex-Referenz</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#1E293B]" />
                <span className={theme.textMuted}>#1E293B Sidebar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#334155]" />
                <span className={theme.textMuted}>#334155 Secondary Sidebar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#64748B]" />
                <span className={theme.textMuted}>#64748B Blau-Grau</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#F59E0B]" />
                <span className={theme.textMuted}>#F59E0B Orange (Primary)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#FEF3C7]" />
                <span className={theme.textMuted}>#FEF3C7 Creme-Gelb</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#FF6500]" />
                <span className={theme.textMuted}>#FF6500 Error Orange</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#1E293B]" />
                <span className={theme.textMuted}>#1E293B Navy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-[#0D9488]" />
                <span className={theme.textMuted}>#0D9488 Teal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ColorsView
