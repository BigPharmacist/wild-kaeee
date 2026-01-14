const DashboardHome = ({
  theme,
  openWeatherModal,
  weatherLoading,
  weatherError,
  weatherData,
  weatherLocation,
  weatherDescription,
  WeatherIcon,
  Icons,
  dashboardEventsLoading,
  dashboardEvents,
  setActiveView,
  photoUploading,
  latestPhoto,
}) => (
  <>
    <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">Dashboard</h2>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className={`${theme.panel} rounded-2xl p-5 border ${theme.border} ${theme.cardShadow}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-medium ${theme.text}`}>Wetter</h3>
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
          <p className={`text-sm ${theme.textMuted}`}>Wetterdaten werden geladen...</p>
        )}
        {!weatherLoading && weatherError && (
          <p className="text-rose-400 text-sm">{weatherError}</p>
        )}
        {!weatherLoading && !weatherError && weatherData && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className={`${theme.textSecondary} flex-shrink-0`}>
                <WeatherIcon code={weatherData.weatherCode} className="w-16 h-16" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-4xl font-semibold tracking-tight">
                  {Math.round(weatherData.temperature)}°C
                </p>
                <p className={`text-sm font-medium ${theme.primary}`}>
                  {weatherData.name || weatherLocation}
                </p>
                <p className={`text-sm ${theme.text}`}>
                  {weatherDescription(weatherData.weatherCode)}
                </p>
                <p className={`text-xs ${theme.textMuted}`}>
                  Gefühlt {Math.round(weatherData.feelsLike ?? weatherData.temperature)}°C
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <p className={theme.textSecondary}>
                Min {Math.round(weatherData.daily?.[0]?.min ?? 0)}°C · Max {Math.round(weatherData.daily?.[0]?.max ?? 0)}°C
              </p>
              <div className={`flex items-center gap-1 ${theme.textSecondary}`}>
                <Icons.Droplet className="w-4 h-4" />
                <span>{weatherData.daily?.[0]?.precipitationProbability ?? 0}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {weatherData.daily?.slice(0, 3).map((day, index) => {
                const dayLabel = index === 0 ? 'Heute' : index === 1 ? 'Morgen' : new Date(day.date).toLocaleDateString('de-DE', { weekday: 'short' })
                return (
                  <div key={day.date} className={`bg-[#FFEBB0] rounded-xl p-3 text-center`}>
                    <p className={`text-xs font-medium ${theme.textSecondary} mb-2`}>{dayLabel}</p>
                    <div className={`flex justify-center mb-2 ${theme.textSecondary}`}>
                      <WeatherIcon code={day.weatherCode ?? weatherData.weatherCode} className="w-8 h-8" />
                    </div>
                    <p className={`text-base font-semibold ${theme.text}`}>
                      {Math.round(day.max ?? 0)}°
                    </p>
                    <p className={`text-sm ${theme.textMuted}`}>
                      {Math.round(day.min ?? 0)}°
                    </p>
                    <div className={`flex items-center justify-center gap-1 mt-1 text-xs ${theme.textMuted}`}>
                      <Icons.Droplet className="w-3 h-3" />
                      <span>{day.precipitationProbability ?? 0}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {!weatherLoading && !weatherError && !weatherData && (
          <p className={theme.textMuted}>
            Kein Wetter verfügbar.
          </p>
        )}
      </div>

      <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow} flex flex-col gap-3`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-medium ${theme.text}`}>Termine</h3>
          <button
            type="button"
            onClick={() => setActiveView('calendar')}
            className={`text-xs ${theme.accentText} hover:underline`}
          >
            Kalender öffnen
          </button>
        </div>
        {dashboardEventsLoading && (
          <p className={`text-xs ${theme.textMuted}`}>Termine werden geladen...</p>
        )}
        {!dashboardEventsLoading && dashboardEvents.length === 0 && (
          <p className={theme.textMuted}>Keine kommenden Termine.</p>
        )}
        {!dashboardEventsLoading && dashboardEvents.length > 0 && (() => {
          const today = new Date()
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

          const endOfWeek = new Date(today)
          const daysUntilSunday = 7 - today.getDay()
          endOfWeek.setDate(today.getDate() + (today.getDay() === 0 ? 0 : daysUntilSunday))
          const endOfWeekStr = `${endOfWeek.getFullYear()}-${String(endOfWeek.getMonth() + 1).padStart(2, '0')}-${String(endOfWeek.getDate()).padStart(2, '0')}`

          const todayEvents = dashboardEvents.filter((e) => e.start_time.substring(0, 10) === todayStr)
          const weekEvents = dashboardEvents.filter((e) => {
            const eventDate = e.start_time.substring(0, 10)
            return eventDate > todayStr && eventDate <= endOfWeekStr && !e.calendarName.toLowerCase().includes('notdienst')
          })
          const futureEvents = dashboardEvents.filter((e) => {
            const eventDate = e.start_time.substring(0, 10)
            return eventDate > endOfWeekStr && !e.calendarName.toLowerCase().includes('notdienst')
          }).slice(0, 5)

          const formatTime = (dateStr) => {
            return new Date(dateStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
          }

          const formatDate = (dateStr) => {
            return new Date(dateStr).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
          }

          return (
            <div className="space-y-4 text-sm">
              <div>
                <p className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Heute</p>
                {todayEvents.length === 0 ? (
                  <p className={`text-xs ${theme.textMuted}`}>Keine Termine</p>
                ) : (
                  <div className="space-y-1.5">
                    {todayEvents.map((event) => (
                      <div key={event.id} className="flex items-center gap-2">
                        <div className="w-1 h-4 rounded" style={{ backgroundColor: event.calendarColor }} />
                        <span className={`text-xs ${theme.textMuted} w-10`}>
                          {event.all_day ? 'Ganz.' : formatTime(event.start_time)}
                        </span>
                        <span className={`text-xs ${theme.text} truncate`}>{event.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {weekEvents.length > 0 && (
                <div>
                  <p className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Diese Woche</p>
                  <div className="space-y-1.5">
                    {weekEvents.map((event) => (
                      <div key={event.id} className="flex items-center gap-2">
                        <div className="w-1 h-4 rounded" style={{ backgroundColor: event.calendarColor }} />
                        <span className={`text-xs ${theme.textMuted} w-16`}>{formatDate(event.start_time)}</span>
                        <span className={`text-xs ${theme.text} truncate`}>{event.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {futureEvents.length > 0 && (
                <div>
                  <p className={`text-xs font-medium mb-2 ${theme.textSecondary}`}>Demnächst</p>
                  <div className="space-y-1.5">
                    {futureEvents.map((event) => (
                      <div key={event.id} className="flex items-center gap-2">
                        <div className="w-1 h-4 rounded" style={{ backgroundColor: event.calendarColor }} />
                        <span className={`text-xs ${theme.textMuted} w-16`}>{formatDate(event.start_time)}</span>
                        <span className={`text-xs ${theme.text} truncate`}>{event.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      <div className={`${theme.panel} rounded-2xl p-4 border ${theme.border} ${theme.cardShadow} flex flex-col gap-3`}>
        <h3 className={`text-lg font-medium ${theme.text}`}>Letztes Foto</h3>
        {photoUploading && (
          <p className={`text-xs ${theme.textMuted}`}>Foto wird hochgeladen...</p>
        )}
        {!photoUploading && latestPhoto && (
          <div className="space-y-2">
            <img
              src={latestPhoto.url}
              alt="Letztes Foto"
              className="w-full h-40 object-cover rounded-xl"
            />
            <p className={`text-xs ${theme.textMuted}`}>
              {latestPhoto.createdAt
                ? new Date(latestPhoto.createdAt).toLocaleString('de-DE')
                : latestPhoto.name}
            </p>
          </div>
        )}
        {!photoUploading && !latestPhoto && (
          <p className={theme.textMuted}>
            Noch kein Foto vorhanden. Nutze das Kamera-Symbol oben.
          </p>
        )}
      </div>
    </div>
  </>
)

export default DashboardHome
