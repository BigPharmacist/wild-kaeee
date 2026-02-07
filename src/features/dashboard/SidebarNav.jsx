import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Plus, FolderPlus } from '@phosphor-icons/react'
import { useTheme, useAuth, useStaff, useNavigation } from '../../context'
import { useUnreadCounts } from '../../context/UnreadCountsContext'
import { useSecondaryNav } from '../../context/SecondaryNavContext'
import { Icons, UnreadBadge } from '../../shared/ui'
import { navItems, miscNavItem, createSecondaryNavMap } from './config/navigation'

/**
 * SidebarNav - Self-sufficient sidebar component
 * Pulls theme, navigation, auth, staff, unread counts from contexts
 * Dynamic secondary nav data from SecondaryNavContext
 */
const SidebarNav = function SidebarNav() {
  const { theme } = useTheme()
  const { session, handleSignOut } = useAuth()
  const { currentStaff, staff } = useStaff()
  const { activeView, setActiveView, mobileNavOpen, setMobileNavOpen, getActiveSecondaryId, handleSecondarySelect: navHandleSecondarySelect, chatTab, planungTab, dokumenteTab } = useNavigation()
  const { unreadCounts } = useUnreadCounts()
  const { dynamicNavData, secondarySelectOverride, sidebarCallbacks } = useSecondaryNav()

  const navigate = useNavigate()
  const { onAddTask, onAddProject } = sidebarCallbacks
  const handleSecondarySelectFn = secondarySelectOverride || navHandleSecondarySelect

  // Routes for migrated features
  const migratedRoutes = {
    dashboard: '/',
    tasks: '/tasks',
    chat: '/chat/group',
    botendienst: '/botendienst',
    dokumente: '/dokumente',
    pharma: '/apo',
    planung: '/calendar',
    post: '/post',
    misc: '/misc',
    settings: '/settings',
  }

  const secondaryNavMap = useMemo(() => createSecondaryNavMap({
    projects: dynamicNavData.projects,
    staff,
    session,
    currentStaff,
  }), [currentStaff?.is_admin, staff, session?.user?.id, dynamicNavData.projects])

  const [showLogoutMenu, setShowLogoutMenu] = useState(false)
  const [mobileSecondaryView, setMobileSecondaryView] = useState(null)
  const logoutMenuRef = useRef(null)

  useEffect(() => {
    if (!mobileNavOpen) {
      const timer = setTimeout(() => setMobileSecondaryView(null), 300)
      return () => clearTimeout(timer)
    }
  }, [mobileNavOpen])

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

  const handlePrimaryActivate = (id) => {
    if (id === 'planung') {
      setActiveView('planung')
      const routes = { calendar: '/calendar', notdienstplanung: '/calendar/notdienst', timeline: '/plan' }
      navigate({ to: routes[planungTab] || '/calendar' })
      return
    }
    if (id === 'dokumente') {
      setActiveView('dokumente')
      const routes = { rechnungen: '/rechnungen', archiv: '/archiv' }
      navigate({ to: routes[dokumenteTab] || '/dokumente' })
      return
    }
    setActiveView(id)
    if (id === 'chat') {
      // Chat tab-dependent navigation
      if (chatTab && chatTab !== 'group') {
        navigate({ to: `/chat/dm/${chatTab}` })
      } else {
        navigate({ to: '/chat/group' })
      }
    } else if (migratedRoutes[id]) {
      navigate({ to: migratedRoutes[id] })
    }
  }

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
        lg:hidden overflow-hidden
      `}
    >
      <div
        className="h-full flex transition-transform duration-300 ease-out"
        style={{
          width: '200%',
          transform: mobileSecondaryView ? 'translateX(-50%)' : 'translateX(0)',
        }}
      >
        {/* Panel 1: Primäre Navigation */}
        <div className="w-1/2 h-full flex flex-col">
          <div className="px-4 pt-4 pb-3 border-b border-[#1E293B] flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.08em] text-[#64748B]">Navigation</p>
              <h2 className="text-sm font-semibold text-[#E5E7EB] mt-1">Menü</h2>
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="p-2 rounded-[6px] text-[#E5E7EB] hover:bg-[#334155]"
              title="Menü schließen"
            >
              <Icons.X />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <nav className="p-2 space-y-0.5">
              {navItems.map((item) => {
                const totalApoUnread = item.id === 'pharma' ? unreadCounts.amk + unreadCounts.recall + unreadCounts.lav + (unreadCounts.rhb || 0) : 0
                const totalPostUnread = item.id === 'post' ? (unreadCounts.fax || 0) + (unreadCounts.email || 0) + (unreadCounts.gesund || 0) : 0
                const totalChatUnread = item.id === 'chat' && unreadCounts.chat
                  ? Object.values(unreadCounts.chat).reduce((sum, n) => sum + n, 0)
                  : 0
                const hasUnread = totalApoUnread > 0 || totalPostUnread > 0 || totalChatUnread > 0
                const isActive = activeView === item.id
                const hasSecondary = secondaryNavMap[item.id]?.length > 0

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm font-medium transition-colors ${
                      isActive ? 'bg-[#334155] text-white' : 'text-[#E5E7EB] hover:bg-[#334155]'
                    }`}
                    onClick={() => {
                      if (hasSecondary) {
                        handlePrimaryActivate(item.id)
                        setMobileSecondaryView(item.id)
                      } else {
                        handlePrimaryActivate(item.id)
                        setMobileNavOpen(false)
                      }
                    }}
                  >
                    <div className="relative">
                      <item.icon />
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF6500] rounded-full pointer-events-none" />
                      )}
                    </div>
                    <span className="flex-1 text-left">{item.label}</span>
                    {totalApoUnread > 0 && (
                      <span className="text-xs text-[#FF8533]">({totalApoUnread})</span>
                    )}
                    {totalPostUnread > 0 && (
                      <span className="text-xs text-[#FF8533]">({totalPostUnread})</span>
                    )}
                    {totalChatUnread > 0 && (
                      <span className="text-xs text-[#FF8533]">({totalChatUnread})</span>
                    )}
                    {hasSecondary && (
                      <Icons.ChevronRight />
                    )}
                  </button>
                )
              })}

              {/* Sonstiges */}
              <button
                type="button"
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-sm font-medium transition-colors ${
                  activeView === miscNavItem.id ? 'bg-[#334155] text-white' : 'text-[#E5E7EB] hover:bg-[#334155]'
                }`}
                onClick={() => {
                  const hasSecondary = secondaryNavMap[miscNavItem.id]?.length > 0
                  handlePrimaryActivate(miscNavItem.id)
                  if (hasSecondary) {
                    setMobileSecondaryView(miscNavItem.id)
                  } else {
                    setMobileNavOpen(false)
                  }
                }}
              >
                <miscNavItem.icon />
                <span className="flex-1 text-left">{miscNavItem.label}</span>
                {secondaryNavMap[miscNavItem.id]?.length > 0 && (
                  <Icons.ChevronRight />
                )}
              </button>
            </nav>
          </div>

          {/* Avatar mit Logout für Mobile - Panel 1 */}
          <div className="p-4 border-t border-[#334155]">
            <div className="flex items-center gap-3">
              {currentStaff?.avatar_url ? (
                <img
                  src={currentStaff.avatar_url}
                  alt={session?.user?.email}
                  className="h-10 w-10 rounded-full object-cover border-2 border-[#334155]"
                />
              ) : (
                <div className="h-10 w-10 rounded-full border-2 border-[#334155] flex items-center justify-center text-sm text-[#E5E7EB] bg-[#334155]">
                  {session?.user?.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {currentStaff?.first_name && (
                  <p className="text-sm font-medium text-[#E5E7EB] truncate">
                    {currentStaff.first_name} {currentStaff.last_name || ''}
                  </p>
                )}
                <p className="text-xs text-[#64748B] truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileNavOpen(false)
                handleSignOut()
              }}
              className="mt-3 w-full px-3 py-2 text-left text-sm text-[#E5533D] flex items-center gap-2 rounded-[6px] hover:bg-[#334155] transition-colors"
            >
              <Icons.Logout />
              Abmelden
            </button>
          </div>
        </div>

        {/* Panel 2: Sekundäre Navigation */}
        <div className="w-1/2 h-full flex flex-col bg-[#334155]">
          <div className="px-4 pt-4 pb-3 border-b border-[#1E293B] flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSecondaryView(null)}
              className="p-2 -ml-2 rounded-[6px] text-[#E5E7EB] hover:bg-[#1E293B]"
              title="Zurück"
            >
              <Icons.ChevronLeft />
            </button>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.08em] text-[#64748B]">
                {navItems.find((item) => item.id === mobileSecondaryView)?.label ||
                  (mobileSecondaryView === miscNavItem.id ? miscNavItem.label : '')}
              </p>
              <h2 className="text-sm font-semibold text-[#E5E7EB] mt-0.5">Auswählen</h2>
            </div>
            {mobileSecondaryView === 'tasks' && (
              <div className="flex items-center gap-1">
                {onAddProject && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddProject()
                      setMobileNavOpen(false)
                    }}
                    className="p-2 rounded-[6px] text-[#E5E7EB] hover:bg-[#1E293B]"
                    title="Neues Projekt"
                  >
                    <FolderPlus size={20} weight="bold" />
                  </button>
                )}
                {onAddTask && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddTask()
                      setMobileNavOpen(false)
                    }}
                    className="p-2 rounded-[6px] text-[#E5E7EB] hover:bg-[#1E293B]"
                    title="Neue Aufgabe"
                  >
                    <Plus size={20} weight="bold" />
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="p-2 rounded-[6px] text-[#E5E7EB] hover:bg-[#1E293B]"
              title="Menü schließen"
            >
              <Icons.X />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <nav className="p-2 space-y-0.5">
              {(secondaryNavMap[mobileSecondaryView] || []).map((subItem, idx) => {
                if (subItem.id === 'divider') {
                  return (
                    <div key={`divider-${idx}`} className="border-t border-[#5E647A] my-2" />
                  )
                }

                const isSubActive = getActiveSecondaryId() === subItem.id
                const badgeCount = mobileSecondaryView === 'pharma'
                  ? unreadCounts[subItem.id] || 0
                  : mobileSecondaryView === 'post'
                    ? (subItem.id === 'fax' ? unreadCounts.fax : subItem.id === 'email' ? unreadCounts.email : subItem.id === 'gesund' ? unreadCounts.gesund : 0) || 0
                    : mobileSecondaryView === 'chat' && unreadCounts.chat
                      ? (subItem.id === 'group' ? unreadCounts.chat.group : unreadCounts.chat[subItem.id]) || 0
                      : 0

                return (
                  <button
                    key={subItem.id}
                    type="button"
                    className={`w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-[6px] text-sm transition-colors overflow-hidden ${
                      isSubActive
                        ? 'bg-[#1E293B] text-[#FEF3C7] font-medium'
                        : 'text-[#E5E7EB] hover:bg-[#1E293B]/50 hover:text-white'
                    }`}
                    onClick={() => {
                      handleSecondarySelectFn(subItem.id)
                      if (subItem.route) navigate({ to: subItem.route })
                      setMobileNavOpen(false)
                    }}
                  >
                    {subItem.color && (
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: subItem.color }}
                      />
                    )}
                    <span className="flex-1 min-w-0 truncate">{subItem.label}</span>
                    <UnreadBadge count={badgeCount} />
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </aside>

    <aside data-sidebar="primary" className={`hidden lg:flex flex-shrink-0 ${theme.sidebarBg} w-14 min-w-[3.5rem] max-w-[3.5rem] overflow-visible h-full relative z-[45] pointer-events-auto`}>
      <div className="h-full flex flex-col">
        <nav className="py-2 space-y-0 flex flex-col items-center flex-1 pl-1">
          {navItems.map((item) => {
            const totalApoUnread = item.id === 'pharma' ? unreadCounts.amk + unreadCounts.recall + unreadCounts.lav + (unreadCounts.rhb || 0) : 0
            const totalPostUnread = item.id === 'post' ? (unreadCounts.fax || 0) + (unreadCounts.email || 0) + (unreadCounts.gesund || 0) : 0
            const totalChatUnread = item.id === 'chat' && unreadCounts.chat
              ? Object.values(unreadCounts.chat).reduce((sum, n) => sum + n, 0)
              : 0
            const hasUnread = totalApoUnread > 0 || totalPostUnread > 0 || totalChatUnread > 0
            return (
              <div key={item.id} className="relative w-full flex justify-center">
                {activeView === item.id && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-[#F59E0B] rounded-r pointer-events-none z-10" />
                )}
                <button
                  type="button"
                  className={`w-12 flex flex-col items-center justify-center gap-0.5 py-1.5 mx-auto rounded-[6px] transition-colors relative ${theme.sidebarText} ${
                    activeView === item.id ? theme.sidebarActive : theme.sidebarHover
                  }`}
                  onClick={() => handlePrimaryActivate(item.id)}
                  title={`${item.label}${totalApoUnread > 0 ? ` (${totalApoUnread})` : ''}${totalPostUnread > 0 ? ` (${totalPostUnread})` : ''}${totalChatUnread > 0 ? ` (${totalChatUnread})` : ''}`}
                >
                  <span className="pointer-events-none relative">
                    <item.icon />
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF6500] rounded-full border-2 border-[#1E293B] pointer-events-none" />
                    )}
                  </span>
                  <span className="text-[9px] leading-tight truncate w-full text-center pointer-events-none">{item.shortLabel}</span>
                </button>
              </div>
            )
          })}
        </nav>

        {/* Sonstiges-Icon */}
        <div className="py-2 flex justify-center border-t border-[#334155] pl-1">
          <div className="relative">
            {activeView === miscNavItem.id && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-[#F59E0B] rounded-r pointer-events-none z-10" />
            )}
            <button
              type="button"
              className={`w-12 flex flex-col items-center justify-center gap-0.5 py-1.5 mx-auto rounded-[6px] transition-colors relative ${theme.sidebarText} ${
                activeView === miscNavItem.id ? theme.sidebarActive : theme.sidebarHover
              }`}
              onClick={() => handlePrimaryActivate(miscNavItem.id)}
              title={miscNavItem.label}
            >
              <span className="pointer-events-none"><miscNavItem.icon /></span>
              <span className="text-[9px] leading-tight truncate w-full text-center pointer-events-none">{miscNavItem.shortLabel}</span>
            </button>
          </div>
        </div>

        {/* Avatar mit Logout-Dropdown */}
        <div className="py-3 flex justify-center border-t border-[#334155] pl-1" ref={logoutMenuRef}>
          <div className="relative">
            <button
              onClick={() => setShowLogoutMenu(!showLogoutMenu)}
              className="w-10 h-10 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-[#4C8BF5]"
              title={currentStaff?.first_name ? `${currentStaff.first_name} ${currentStaff.last_name || ''}` : session?.user?.email}
            >
              {currentStaff?.avatar_url ? (
                <img
                  src={currentStaff.avatar_url}
                  alt={session?.user?.email}
                  className={`h-9 w-9 rounded-full object-cover border-2 ${showLogoutMenu ? 'border-[#4C8BF5]' : 'border-[#334155]'} transition-colors pointer-events-none`}
                />
              ) : (
                <div className={`h-9 w-9 rounded-full border-2 ${showLogoutMenu ? 'border-[#4C8BF5]' : 'border-[#334155]'} flex items-center justify-center text-xs text-[#E5E7EB] bg-[#334155] transition-colors pointer-events-none`}>
                  {session?.user?.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </button>

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
                  className="w-full px-4 py-2 text-left text-sm text-[#FF6500] hover:text-[#E65A00] flex items-center gap-2 hover:bg-[#FFF5EB] transition-colors"
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
        ${theme.secondarySidebarBg} border-r ${theme.border} flex-shrink-0 relative z-[40] pointer-events-auto
        hidden lg:flex
        w-48 h-full overflow-hidden
      `}
    >
      <div className="h-full flex flex-col w-full overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-[#1E293B]">
          <p className="text-xs uppercase tracking-[0.08em] text-[#64748B]">
            Navigation
          </p>
          <div className="flex items-center justify-between mt-1">
            <h2 className="text-sm font-semibold text-[#E5E7EB]">
              {navItems.find((item) => item.id === activeView)?.label || 'Kontext'}
            </h2>
            {activeView === 'tasks' && (
              <div className="flex items-center gap-1">
                {onAddProject && (
                  <button
                    type="button"
                    onClick={onAddProject}
                    className="p-1 rounded hover:bg-[#1E293B] text-[#E5E7EB] hover:text-white transition-colors"
                    title="Neues Projekt"
                  >
                    <FolderPlus size={18} weight="bold" />
                  </button>
                )}
                {onAddTask && (
                  <button
                    type="button"
                    onClick={onAddTask}
                    className="p-1 rounded hover:bg-[#1E293B] text-[#E5E7EB] hover:text-white transition-colors"
                    title="Neue Aufgabe"
                  >
                    <Plus size={18} weight="bold" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <nav className="p-2 overflow-y-auto space-y-1">
          {(secondaryNavMap[activeView] || []).map((item, idx) => {
            if (item.id === 'divider') {
              return (
                <div key={`divider-${idx}`} className="border-t border-[#5E647A] my-2" />
              )
            }

            const isActive = getActiveSecondaryId() === item.id
            const badgeCount = activeView === 'pharma'
              ? unreadCounts[item.id] || 0
              : activeView === 'post'
                ? (item.id === 'fax' ? unreadCounts.fax : item.id === 'email' ? unreadCounts.email : item.id === 'gesund' ? unreadCounts.gesund : 0) || 0
                : activeView === 'chat' && unreadCounts.chat
                  ? (item.id === 'group' ? unreadCounts.chat.group : unreadCounts.chat[item.id]) || 0
                  : 0
            return (
              <button
                key={item.id}
                type="button"
                className={`w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-[6px] text-sm font-medium border-l-4 transition-colors overflow-hidden ${
                  isActive
                    ? theme.secondaryActive
                    : 'border-transparent text-[#E5E7EB] hover:bg-[#1E293B] hover:text-white'
                }`}
                title={item.label}
                onClick={() => {
                  handleSecondarySelectFn(item.id)
                  if (item.route) navigate({ to: item.route })
                }}
              >
                {item.color && (
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                <span className="flex-1 min-w-0 truncate">{item.label}</span>
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
