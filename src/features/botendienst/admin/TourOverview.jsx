import { useState, useEffect } from 'react'
import { Plus, CalendarBlank, User, Package, Money, Play, Eye, Trash, Clock, CircleNotch } from '@phosphor-icons/react'

export function TourOverview({
  theme,
  tours,
  toursLoading,
  actionLoading,
  staff,
  onCreateTour,
  onSelectTour,
  onStartTour,
  onDeleteTour,
  getTourStats,
}) {
  const [filter, setFilter] = useState('active') // 'all', 'draft', 'active', 'completed'

  const filteredTours = tours.filter(tour => {
    if (filter === 'all') return true
    if (filter === 'active') return ['draft', 'active'].includes(tour.status)
    return tour.status === filter
  })

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  const statusLabels = {
    draft: 'Entwurf',
    active: 'Aktiv',
    completed: 'Abgeschlossen',
    cancelled: 'Abgebrochen',
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-semibold ${theme.textPrimary}`}>Touren-Übersicht</h1>
          <p className={`text-sm ${theme.textMuted}`}>
            {filteredTours.length} Tour{filteredTours.length !== 1 ? 'en' : ''}
          </p>
        </div>
        <button
          onClick={onCreateTour}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium ${theme.accent} text-white`}
        >
          <Plus size={18} weight="bold" />
          Neue Tour
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'active', label: 'Aktive' },
          { id: 'draft', label: 'Entwürfe' },
          { id: 'completed', label: 'Abgeschlossen' },
          { id: 'all', label: 'Alle' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.id
                ? 'bg-[#F59E0B] text-white'
                : `${theme.surface} ${theme.textSecondary} hover:bg-gray-100`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tours Grid */}
      {toursLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]" />
        </div>
      ) : filteredTours.length === 0 ? (
        <div className={`text-center py-12 ${theme.surface} ${theme.border} border rounded-xl`}>
          <Package size={48} className={`mx-auto ${theme.textMuted} mb-3`} />
          <p className={theme.textMuted}>Keine Touren gefunden</p>
          <button
            onClick={onCreateTour}
            className="mt-4 text-sm text-[#F59E0B] hover:underline"
          >
            Erste Tour erstellen
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTours.map(tour => {
            const stats = getTourStats(tour)
            const driver = tour.driver

            return (
              <div
                key={tour.id}
                className={`${theme.surface} ${theme.border} border rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer`}
                onClick={() => onSelectTour(tour)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className={`font-semibold ${theme.textPrimary}`}>
                      {tour.name || 'Unbenannte Tour'}
                    </h3>
                    <div className={`flex items-center gap-1.5 text-sm ${theme.textMuted}`}>
                      <CalendarBlank size={14} />
                      {formatDate(tour.date)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[tour.status]}`}>
                    {statusLabels[tour.status]}
                  </span>
                </div>

                {/* Driver */}
                {driver && (
                  <div className={`flex items-center gap-2 mb-3 text-sm ${theme.textSecondary}`}>
                    <User size={14} />
                    {driver.first_name} {driver.last_name}
                  </div>
                )}

                {/* Stats */}
                {stats && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className={`text-center p-2 rounded-lg ${theme.bg}`}>
                      <p className={`text-lg font-semibold ${theme.textPrimary}`}>
                        {tour.status === 'draft' ? (
                          stats.totalStops
                        ) : (
                          <>{stats.completedStops} / {stats.totalStops}</>
                        )}
                      </p>
                      <p className={`text-xs ${theme.textMuted}`}>
                        {tour.status === 'draft' ? 'Stops' : 'geliefert'}
                      </p>
                    </div>
                    <div className={`text-center p-2 rounded-lg ${theme.bg}`}>
                      <p className={`text-lg font-semibold ${theme.textPrimary}`}>
                        {stats.totalPackages}
                      </p>
                      <p className={`text-xs ${theme.textMuted}`}>Pakete</p>
                    </div>
                    <div className={`text-center p-2 rounded-lg ${theme.bg}`}>
                      <p className={`text-lg font-semibold text-green-600`}>
                        {formatCurrency(stats.totalCash)}
                      </p>
                      <p className={`text-xs ${theme.textMuted}`}>Kassieren</p>
                    </div>
                  </div>
                )}

                {/* Progress Bar (for active tours) */}
                {tour.status === 'active' && stats && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className={theme.textMuted}>Fortschritt</span>
                      <span className={theme.textPrimary}>{stats.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${stats.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectTour(tour)
                    }}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${theme.textSecondary} hover:bg-gray-100`}
                  >
                    <Eye size={16} />
                    Details
                  </button>

                  {tour.status === 'draft' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onStartTour(tour.id)
                        }}
                        disabled={actionLoading === 'starting'}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          actionLoading === 'starting'
                            ? 'bg-green-50 text-green-400 cursor-wait'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 active:scale-95'
                        }`}
                      >
                        {actionLoading === 'starting' ? (
                          <CircleNotch size={16} className="animate-spin" />
                        ) : (
                          <Play size={16} weight="fill" />
                        )}
                        {actionLoading === 'starting' ? 'Startet...' : 'Starten'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Tour wirklich löschen?')) {
                            onDeleteTour(tour.id)
                          }
                        }}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-100"
                        title="Löschen"
                      >
                        <Trash size={16} />
                      </button>
                    </>
                  )}
                </div>

                {/* Timestamps */}
                {tour.started_at && (
                  <div className={`mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs ${theme.textMuted}`}>
                    <Clock size={12} />
                    Gestartet: {new Date(tour.started_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
