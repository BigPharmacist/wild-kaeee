import { Tray, Trash } from '@phosphor-icons/react'

export default function FaxSidebar({
  theme,
  selectedFolder,
  counts,
  onSelectFolder,
}) {
  const folders = [
    { id: 'eingang', label: 'Faxeingang', icon: Tray, count: counts.eingang },
    { id: 'papierkorb', label: 'Papierkorb', icon: Trash, count: counts.papierkorb },
  ]

  return (
    <div className={`w-48 flex-shrink-0 border-r ${theme.border} ${theme.bg} hidden md:flex flex-col`}>
      <div className="flex-1 overflow-y-auto p-2">
        {folders.map(folder => {
          const Icon = folder.icon
          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => onSelectFolder(folder.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                selectedFolder === folder.id
                  ? theme.navActive
                  : `${theme.text} ${theme.navHover}`
              }`}
            >
              <Icon size={18} className={theme.textMuted} />
              <span className="flex-1 truncate">{folder.label}</span>
              {folder.count > 0 && (
                <span className={`text-xs font-medium ${theme.accentText}`}>{folder.count}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
