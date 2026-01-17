import { useState, useRef, useEffect } from 'react'

const SidebarNav = ({
  theme,
  mobileNavOpen,
  setMobileNavOpen,
  navItems,
  miscNavItem,
  activeView,
  setActiveView,
  secondaryNavMap,
  getActiveSecondaryId,
  handleSecondarySelect,
  unreadCounts,
  Icons,
  UnreadBadge,
  currentStaff,
  session,
  handleSignOut,
}) => {
  const [showLogoutMenu, setShowLogoutMenu] = useState(false)
  const logoutMenuRef = useRef(null)

  // Schließe Menü bei Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (logoutMenuRef.current && !logoutMenuRef.current.contains(event.target)) {
        setShowLogoutMenu(false)
      }
    }
    if (showLogoutMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showLogoutMenu])

  return (
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
              const totalChatUnread = item.id === 'chat' && unreadCounts.chat
                ? Object.values(unreadCounts.chat).reduce((sum, n) => sum + n, 0)
                : 0
              const hasUnread = totalApoUnread > 0 || totalPostUnread > 0 || totalChatUnread > 0
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
                    {hasUnread && (
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
                  {totalChatUnread > 0 && (
                    <span className="text-xs text-red-400">({totalChatUnread})</span>
                  )}
                </button>
              )
            })}
            {/* Sonstiges in Mobile-Nav */}
            <button
              type="button"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm font-medium transition-colors ${
                activeView === miscNavItem.id ? 'bg-[#4F5469] text-white' : 'text-[#E5E7EB] hover:bg-[#4F5469]'
              }`}
              onClick={() => setActiveView(miscNavItem.id)}
            >
              <miscNavItem.icon />
              <span className="flex-1">{miscNavItem.label}</span>
            </button>
          </nav>

          <nav className="p-2 space-y-1 flex-1">
            {(secondaryNavMap[activeView] || []).map((item) => {
              const isActive = getActiveSecondaryId() === item.id
              const badgeCount = activeView === 'apo'
                ? unreadCounts[item.id] || 0
                : activeView === 'post'
                  ? (item.id === 'fax' ? unreadCounts.fax : item.id === 'email' ? unreadCounts.email : 0) || 0
                  : activeView === 'chat' && unreadCounts.chat
                    ? (item.id === 'group' ? unreadCounts.chat.group : unreadCounts.chat[item.id]) || 0
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

          {/* Avatar mit Logout für Mobile */}
          <div className="p-4 border-t border-[#4F5469]">
            <div className="flex items-center gap-3">
              {currentStaff?.avatar_url ? (
                <img
                  src={currentStaff.avatar_url}
                  alt={session?.user?.email}
                  className="h-10 w-10 rounded-full object-cover border-2 border-[#4F5469]"
                />
              ) : (
                <div className="h-10 w-10 rounded-full border-2 border-[#4F5469] flex items-center justify-center text-sm text-[#E5E7EB] bg-[#4F5469]">
                  {session?.user?.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {currentStaff?.first_name && (
                  <p className="text-sm font-medium text-[#E5E7EB] truncate">
                    {currentStaff.first_name} {currentStaff.last_name || ''}
                  </p>
                )}
                <p className="text-xs text-[#7697A0] truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileNavOpen(false)
                handleSignOut()
              }}
              className="mt-3 w-full px-3 py-2 text-left text-sm text-[#E5533D] flex items-center gap-2 rounded-[6px] hover:bg-[#4F5469] transition-colors"
            >
              <Icons.Logout />
              Abmelden
            </button>
          </div>
        </div>
      </div>
    </aside>

    <aside className={`hidden lg:flex flex-shrink-0 ${theme.sidebarBg} w-12 min-w-[3rem] max-w-[3rem] overflow-visible`}>
      <div className="h-full flex flex-col">
        <nav className="py-3 space-y-1 flex flex-col items-center flex-1 pl-1">
          {navItems.map((item) => {
            const totalApoUnread = item.id === 'apo' ? unreadCounts.amk + unreadCounts.recall + unreadCounts.lav : 0
            const totalPostUnread = item.id === 'post' ? (unreadCounts.fax || 0) + (unreadCounts.email || 0) : 0
            const totalChatUnread = item.id === 'chat' && unreadCounts.chat
              ? Object.values(unreadCounts.chat).reduce((sum, n) => sum + n, 0)
              : 0
            const hasUnread = totalApoUnread > 0 || totalPostUnread > 0 || totalChatUnread > 0
            return (
              <div key={item.id} className="relative group">
                {activeView === item.id && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-[#FD8916] rounded-r" />
                )}
                <button
                  type="button"
                  className={`w-10 h-10 flex items-center justify-center mx-auto rounded-[6px] transition-colors ${theme.sidebarText} ${
                    activeView === item.id ? theme.sidebarActive : theme.sidebarHover
                  }`}
                  onClick={() => {
                    setActiveView(item.id)
                  }}
                >
                  <item.icon />
                  {hasUnread && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#3C4255]" />
                  )}
                </button>
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#173B61] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {item.label}{totalApoUnread > 0 && ` (${totalApoUnread})`}{totalPostUnread > 0 && ` (${totalPostUnread})`}{totalChatUnread > 0 && ` (${totalChatUnread})`}
                </span>
              </div>
            )
          })}
        </nav>

        {/* Sonstiges-Icon */}
        <div className="py-2 flex justify-center border-t border-[#4F5469] pl-1">
          <div className="relative group">
            {activeView === miscNavItem.id && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-[#FD8916] rounded-r" />
            )}
            <button
              type="button"
              className={`w-10 h-10 flex items-center justify-center mx-auto rounded-[6px] transition-colors ${theme.sidebarText} ${
                activeView === miscNavItem.id ? theme.sidebarActive : theme.sidebarHover
              }`}
              onClick={() => setActiveView(miscNavItem.id)}
            >
              <miscNavItem.icon />
            </button>
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#173B61] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {miscNavItem.label}
            </span>
          </div>
        </div>

        {/* Avatar mit Logout-Dropdown */}
        <div className="py-3 flex justify-center border-t border-[#4F5469] pl-1" ref={logoutMenuRef}>
          <div className="relative group">
            <button
              onClick={() => setShowLogoutMenu(!showLogoutMenu)}
              className="w-10 h-10 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-[#4C8BF5]"
              title={currentStaff?.first_name ? `${currentStaff.first_name} ${currentStaff.last_name || ''}` : session?.user?.email}
            >
              {currentStaff?.avatar_url ? (
                <img
                  src={currentStaff.avatar_url}
                  alt={session?.user?.email}
                  className={`h-9 w-9 rounded-full object-cover border-2 ${showLogoutMenu ? 'border-[#4C8BF5]' : 'border-[#4F5469]'} transition-colors`}
                />
              ) : (
                <div className={`h-9 w-9 rounded-full border-2 ${showLogoutMenu ? 'border-[#4C8BF5]' : 'border-[#4F5469]'} flex items-center justify-center text-xs text-[#E5E7EB] bg-[#4F5469] transition-colors`}>
                  {session?.user?.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </button>

            {/* Tooltip */}
            {!showLogoutMenu && (
              <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#173B61] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {currentStaff?.first_name ? `${currentStaff.first_name} ${currentStaff.last_name || ''}` : session?.user?.email}
              </span>
            )}

            {/* Dropdown-Menü */}
            {showLogoutMenu && (
              <div className="absolute left-full ml-2 bottom-0 w-56 rounded-lg bg-white border border-[#E5E7EB] shadow-lg py-1 z-50">
                <div className="px-4 py-3 border-b border-[#E5E7EB]">
                  {currentStaff?.first_name && (
                    <p className="text-sm font-medium text-[#1F2937]">
                      {currentStaff.first_name} {currentStaff.last_name || ''}
                    </p>
                  )}
                  <p className="text-xs text-[#B5B9C8] truncate">
                    {session?.user?.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowLogoutMenu(false)
                    handleSignOut()
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-[#E5533D] hover:text-[#C94431] flex items-center gap-2 hover:bg-[#FDE8E5] transition-colors"
                >
                  <Icons.Logout />
                  Abmelden
                </button>
              </div>
            )}
          </div>
        </div>
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
          <p className="text-xs uppercase tracking-[0.08em] text-[#7697A0]">
            Navigation
          </p>
          <h2 className="text-sm font-semibold text-[#E5E7EB] mt-1">
            {navItems.find((item) => item.id === activeView)?.label || 'Kontext'}
          </h2>
        </div>
        <nav className="p-2 overflow-y-auto space-y-1">
          {(secondaryNavMap[activeView] || []).map((item) => {
            const isActive = getActiveSecondaryId() === item.id
            const badgeCount = activeView === 'apo'
              ? unreadCounts[item.id] || 0
              : activeView === 'post'
                ? (item.id === 'fax' ? unreadCounts.fax : item.id === 'email' ? unreadCounts.email : 0) || 0
                : activeView === 'chat' && unreadCounts.chat
                  ? (item.id === 'group' ? unreadCounts.chat.group : unreadCounts.chat[item.id]) || 0
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
}

export default SidebarNav
