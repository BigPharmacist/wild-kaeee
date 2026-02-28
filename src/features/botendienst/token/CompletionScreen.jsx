import {
  Trophy,
  Money,
  ChatText,
  Car,
  Check,
  CircleNotch,
  CheckCircle,
  SignOut,
  Clock,
} from '@phosphor-icons/react'

export function CompletionScreen({
  stats,
  completionNotes,
  setCompletionNotes,
  vehicleIssues,
  setVehicleIssues,
  onSubmit,
  submitting,
  submitted,
  shiftEnded,
  endingShift,
  onEndShift,
  workingTime,
  onBack,
  formatCurrency,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Erfolgsmeldung */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Trophy size={40} className="text-green-600" weight="fill" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tour geschafft!
          </h1>
          <p className="text-gray-600">
            Sie haben alle {stats.totalStops} Stops erfolgreich abgeschlossen.
          </p>
        </div>

        {/* Zusammenfassung */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Zusammenfassung</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.completedStops}</p>
              <p className="text-sm text-gray-500">Zustellungen</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.totalPackages}</p>
              <p className="text-sm text-gray-500">Pakete</p>
            </div>
          </div>

          {/* Kassierter Betrag */}
          {stats.collectedCash > 0 && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Money size={24} className="text-green-600" />
                  <span className="font-medium text-green-800">Abzurechnen</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.collectedCash)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Formular - nur wenn noch nicht abgesendet */}
        {!submitted ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Feedback zur Tour</h2>

            {/* Allgemeiner Kommentar */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <ChatText size={18} />
                Kommentar
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="z.B. Kunde hat sich beschwert, besondere Vorkommnisse..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
              />
            </div>

            {/* Probleme mit dem Auto */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Car size={18} />
                Probleme mit dem Fahrzeug
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={vehicleIssues}
                onChange={(e) => setVehicleIssues(e.target.value)}
                placeholder="z.B. Kontrollleuchte leuchtet, Reifen platt, Kratzer am Fahrzeug..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
              />
            </div>

            {/* Absenden Button */}
            <button
              onClick={onSubmit}
              disabled={submitting}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium text-white transition-all ${
                submitting
                  ? 'bg-green-400 cursor-wait'
                  : 'bg-green-500 hover:bg-green-600 active:scale-98'
              }`}
            >
              {submitting ? (
                <>
                  <CircleNotch size={20} className="animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Check size={20} weight="bold" />
                  Tour abschließen
                </>
              )}
            </button>

            {/* Zurück zu Stops */}
            <button
              onClick={onBack}
              className="w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100"
            >
              Zurück zur Übersicht
            </button>
          </div>
        ) : (
          /* Bestätigung nach Absenden */
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" weight="fill" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Vielen Dank!
            </h2>
            <p className="text-gray-600">
              Ihre Rückmeldung wurde gespeichert.
            </p>
            {stats.collectedCash > 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="font-medium text-green-800">
                  Bitte {formatCurrency(stats.collectedCash)} in der Apotheke abgeben.
                </p>
              </div>
            )}

            {/* Feierabend Section */}
            {!shiftEnded ? (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-3">
                  Wenn Sie fertig sind, bestätigen Sie hier Ihren Feierabend:
                </p>
                <button
                  onClick={onEndShift}
                  disabled={endingShift}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium text-white transition-all ${
                    endingShift
                      ? 'bg-red-400 cursor-wait'
                      : 'bg-red-500 hover:bg-red-700 active:scale-98'
                  }`}
                >
                  {endingShift ? (
                    <>
                      <CircleNotch size={20} className="animate-spin" />
                      Wird gespeichert...
                    </>
                  ) : (
                    <>
                      <SignOut size={20} weight="bold" />
                      Feierabend
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Arbeitszeit-Zusammenfassung */
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Clock size={20} className="text-red-700" />
                    <span className="font-semibold text-red-800">Arbeitszeit</span>
                  </div>
                  {workingTime && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Beginn:</span>
                        <span className="font-medium">
                          {workingTime.start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Ende:</span>
                        <span className="font-medium">
                          {workingTime.end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                        </span>
                      </div>
                      <div className="pt-2 border-t border-red-200 flex justify-between">
                        <span className="font-medium text-red-800">Dauer:</span>
                        <span className="font-bold text-red-800">
                          {workingTime.hours}h {workingTime.minutes}min
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Gute Heimfahrt!
                </p>
              </div>
            )}

            <button
              onClick={onBack}
              className="mt-6 w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 border border-gray-200"
            >
              Zurück zur Übersicht
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
