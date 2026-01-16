const SidebarNav = ({
  theme,
  mobileNavOpen,
  setMobileNavOpen,
  navItems,
  activeView,
  setActiveView,
  secondaryNavMap,
  getActiveSecondaryId,
  handleSecondarySelect,
  unreadCounts,
  Icons,
  UnreadBadge,
}) => (
  <>
    {mobileNavOpen && (
      <div
        className={`fixed inset-0 ${theme.overlay} z-40 lg:hidden`}
        onClick={() => setMobileNavOpen(false)}
      />
    )}

    <aside
      className={`
        mobile-nav-drawer
        ${theme.sidebarBg} text-white fixed inset-y-0 left-0 z-50 w-[85%] max-w-[320px]
        transform ${mobileNavOpen ? 'translate-x-0 duration-200' : '-translate-x-full duration-700'} transition-transform ease-out
        lg:hidden
      `}
    >
      <div className="h-full flex flex-col">
        <div className="px-4 pt-4 pb-3 border-b border-[#3C4255] flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-[#7697A0]">Navigation</p>
            <h2 className="text-sm font-semibold text-[#E5E7EB] mt-1">
              {navItems.find((item) => item.id === activeView)?.label || 'Menü'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="p-2 rounded-[6px] text-[#E5E7EB] hover:bg-[#4F5469]"
            title="Menü schließen"
          >
            <Icons.X />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="p-2 space-y-1 border-b border-[#3C4255]">
            {navItems.map((item) => {
              const totalApoUnread = item.id === 'apo' ? unreadCounts.amk + unreadCounts.recall + unreadCounts.lav : 0
              const totalPostUnread = item.id === 'post' ? (unreadCounts.fax || 0) + (unreadCounts.email || 0) : 0
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm font-medium transition-colors ${
                    activeView === item.id ? 'bg-[#4F5469] text-white' : 'text-[#E5E7EB] hover:bg-[#4F5469]'
                  }`}
                  onClick={() => setActiveView(item.id)}
                >
                  <div className="relative">
                    <item.icon />
                    {(totalApoUnread > 0 || totalPostUnread > 0) && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {totalApoUnread > 0 && (
                    <span className="text-xs text-red-400">({totalApoUnread})</span>
                  )}
                  {totalPostUnread > 0 && (
                    <span className="text-xs text-red-400">({totalPostUnread})</span>
                  )}
                </button>
              )
            })}
          </nav>

          <nav className="p-2 space-y-1">
            {(secondaryNavMap[activeView] || []).map((item) => {
              const isActive = getActiveSecondaryId() === item.id
              const badgeCount = activeView === 'apo'
                ? unreadCounts[item.id] || 0
                : activeView === 'post'
                  ? (item.id === 'fax' ? unreadCounts.fax : item.id === 'email' ? unreadCounts.email : 0) || 0
                  : 0
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full flex items-center text-left px-3 py-2.5 rounded-[6px] text-sm font-medium border-l-4 transition-colors ${
                    isActive
                      ? theme.secondaryActive
                      : 'border-transparent text-[#E5E7EB] hover:bg-[#4F5469] hover:text-white'
                  }`}
                  onClick={() => {
                    handleSecondarySelect(item.id)
                    setMobileNavOpen(false)
                  }}
                >
                  <span>{item.label}</span>
                  <UnreadBadge count={badgeCount} />
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </aside>

    <aside className={`hidden lg:flex flex-shrink-0 ${theme.sidebarBg} w-16 min-w-[4rem] max-w-[4rem] overflow-visible`}>
      <div className="h-full flex flex-col">
        <nav className="py-3 space-y-1 flex flex-col items-center">
          {navItems.map((item) => {
            const totalApoUnread = item.id === 'apo' ? unreadCounts.amk + unreadCounts.recall + unreadCounts.lav : 0
            const totalPostUnread = item.id === 'post' ? (unreadCounts.fax || 0) + (unreadCounts.email || 0) : 0
            return (
              <div key={item.id} className="relative group">
                <button
                  type="button"
                  className={`w-10 h-10 flex items-center justify-center mx-auto rounded-[6px] border-l-[3px] border-transparent box-border transition-colors ${theme.sidebarText} ${
                    activeView === item.id ? theme.sidebarActive : theme.sidebarHover
                  }`}
                  onClick={() => {
                    setActiveView(item.id)
                  }}
                >
                  <item.icon />
                  {(totalApoUnread > 0 || totalPostUnread > 0) && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#3C4255]" />
                  )}
                </button>
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#173B61] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {item.label}{totalApoUnread > 0 && ` (${totalApoUnread})`}{totalPostUnread > 0 && ` (${totalPostUnread})`}
                </span>
              </div>
            )
          })}
        </nav>
      </div>
    </aside>

    <aside
      className={`
        ${theme.secondarySidebarBg} border-r ${theme.border} flex-shrink-0 z-40
        hidden lg:flex lg:relative inset-y-0 left-0 top-0
        w-48
      `}
    >
      <div className="h-full flex flex-col">
        <div className="px-4 pt-4 pb-3 border-b border-[#3C4255]">
          <p className="text-xs uppercase tracking-[0.08em] text-[#7697A0]">Navigation</p>
          <h2 className="text-sm font-semibold text-[#E5E7EB] mt-1">
            {navItems.find((item) => item.id === activeView)?.label || 'Kontext'}
          </h2>
        </div>
        <nav className="p-2 space-y-1 overflow-y-auto">
          {(secondaryNavMap[activeView] || []).map((item) => {
            const isActive = getActiveSecondaryId() === item.id
            const badgeCount = activeView === 'apo'
              ? unreadCounts[item.id] || 0
              : activeView === 'post'
                ? (item.id === 'fax' ? unreadCounts.fax : item.id === 'email' ? unreadCounts.email : 0) || 0
                : 0
            return (
              <button
                key={item.id}
                type="button"
                className={`w-full flex items-center text-left px-3 py-2.5 rounded-[6px] text-sm font-medium border-l-4 transition-colors ${
                  isActive
                    ? theme.secondaryActive
                    : 'border-transparent text-[#E5E7EB] hover:bg-[#3C4255] hover:text-white'
                }`}
                title={item.label}
                onClick={() => {
                  handleSecondarySelect(item.id)
                }}
              >
                <span>{item.label}</span>
                <UnreadBadge count={badgeCount} />
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  </>
)

export default SidebarNav
