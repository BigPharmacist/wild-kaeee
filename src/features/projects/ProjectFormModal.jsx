import { X, CalendarBlank } from '@phosphor-icons/react'

// Predefined colors for projects
const PROJECT_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#64748b', // Slate
]

const ProjectFormModal = ({
  editingProject,
  projectForm,
  projectSaving,
  projectSaveError,
  handleProjectInput,
  saveProject,
  closeProjectModal,
}) => {
  if (!editingProject) return null

  const isNew = !editingProject.id

  return (
    <div
      className="fixed inset-0 z-50 bg-[#2d2d2d]/40 flex items-center justify-center p-4"
      onClick={closeProjectModal}
    >
      <div
        className="bg-white rounded-[0.65em] shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#ebebeb] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#5a5a5a]">
            {isNew ? 'Neues Projekt' : 'Projekt bearbeiten'}
          </h3>
          <button
            type="button"
            onClick={closeProjectModal}
            className="p-1 rounded hover:bg-[#f0f0f0] text-[#ccc] hover:text-[#5a5a5a]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Project name */}
          <div>
            <label className="block text-xs text-[#ccc] uppercase tracking-wide mb-1">
              Projektname <span className="text-[#ff0000]">*</span>
            </label>
            <input
              type="text"
              value={projectForm.name}
              onChange={(e) => handleProjectInput('name', e.target.value)}
              placeholder="z.B. Website Relaunch"
              className="w-full px-3 py-2 bg-[#f0f0f0] rounded-[0.65em] text-sm text-[#5a5a5a] placeholder:text-[#ccc] border-0 outline-none focus:ring-2 focus:ring-[#1976d2]"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-[#ccc] uppercase tracking-wide mb-1">
              Beschreibung
            </label>
            <textarea
              value={projectForm.description}
              onChange={(e) => handleProjectInput('description', e.target.value)}
              placeholder="Optionale Beschreibung..."
              rows={2}
              className="w-full px-3 py-2 bg-[#f0f0f0] rounded-[0.65em] text-sm text-[#5a5a5a] placeholder:text-[#ccc] border-0 outline-none focus:ring-2 focus:ring-[#1976d2] resize-none"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs text-[#ccc] uppercase tracking-wide mb-2">
              Farbe
            </label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleProjectInput('color', color)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    projectForm.color === color ? 'ring-2 ring-offset-2 ring-[#5a5a5a] scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs text-[#ccc] uppercase tracking-wide mb-1">
              Deadline
            </label>
            <div className="flex items-center bg-[#f0f0f0] rounded-[0.65em]">
              <input
                type="date"
                value={projectForm.deadline}
                onChange={(e) => handleProjectInput('deadline', e.target.value)}
                className="flex-1 h-[38px] px-3 bg-transparent rounded-[0.65em] text-sm text-[#5a5a5a] border-0 outline-none focus:ring-2 focus:ring-[#1976d2]"
              />
              {projectForm.deadline && (
                <button
                  type="button"
                  onClick={() => handleProjectInput('deadline', '')}
                  className="p-1 mr-1 text-[#ccc] hover:text-[#5a5a5a]"
                >
                  <X size={14} />
                </button>
              )}
              <CalendarBlank size={16} className="mr-3 text-[#ccc]" />
            </div>
          </div>

          {/* Preview */}
          <div className="pt-2 border-t border-[#ebebeb]">
            <label className="block text-xs text-[#ccc] uppercase tracking-wide mb-2">
              Vorschau
            </label>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: projectForm.color }}
              />
              <span className="text-sm font-medium text-[#5a5a5a]">
                {projectForm.name || 'Projektname'}
              </span>
            </div>
          </div>

          {/* Error message */}
          {projectSaveError && (
            <div className="bg-[#ff0000]/10 border border-[#ff0000]/20 rounded-[0.65em] px-3 py-2">
              <p className="text-[#ff0000] text-sm">{projectSaveError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex border-t border-[#ebebeb]">
          <button
            type="button"
            onClick={closeProjectModal}
            className="flex-1 px-4 py-3 text-sm font-medium text-[#5a5a5a] hover:bg-[#f0f0f0] transition-colors"
          >
            Abbrechen
          </button>
          <div className="w-px bg-[#ebebeb]" />
          <button
            type="button"
            onClick={saveProject}
            disabled={projectSaving || !projectForm.name.trim()}
            className="flex-1 px-4 py-3 text-sm font-medium text-[#1976d2] hover:bg-[#f0f0f0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {projectSaving ? 'Speichern...' : (isNew ? 'Erstellen' : 'Speichern')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectFormModal
