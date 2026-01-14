const AuthView = ({
  authView,
  onAuthViewChange,
  email,
  setEmail,
  password,
  setPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  message,
  successMessage,
  handleSignIn,
  handleForgotPassword,
  handleResetPassword,
  theme,
}) => (
  <div className={`min-h-screen ${theme.bg} ${theme.text} flex items-center justify-center p-4 relative overflow-hidden`}>
    <div className={`${theme.panel} p-6 sm:p-8 rounded-2xl border ${theme.border} ${theme.cardShadow} max-w-sm w-full`}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <img src="/logo.png" alt="Kaeee" className="h-10" />
          <p className={`text-sm ${theme.textMuted}`}>
            {authView === 'login' && 'Willkommen zurück'}
            {authView === 'forgot' && 'Passwort zurücksetzen'}
            {authView === 'resetPassword' && 'Neues Passwort setzen'}
          </p>
        </div>
      </div>

      {authView === 'login' && (
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

          <button
            type="button"
            onClick={() => onAuthViewChange('forgot')}
            className={`w-full text-sm ${theme.accentText} hover:opacity-80`}
          >
            Passwort vergessen?
          </button>
        </form>
      )}

      {authView === 'forgot' && (
        <form onSubmit={handleForgotPassword} className="space-y-5">
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

          {message && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <p className="text-rose-400 text-sm">{message}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
              <p className="text-emerald-600 text-sm">{successMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            title="Link senden"
            className={`w-full ${theme.accent} text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Wird gesendet...' : 'Link senden'}
          </button>

          <button
            type="button"
            onClick={() => onAuthViewChange('login')}
            className={`w-full text-sm ${theme.accentText} hover:opacity-80`}
          >
            Zurück zum Login
          </button>
        </form>
      )}

      {authView === 'resetPassword' && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
              Neues Passwort
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
              Passwort bestätigen
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-2.5 ${theme.input} ${theme.inputPlaceholder} border rounded-xl outline-none transition-all ${theme.text}`}
              placeholder="••••••••"
            />
          </div>

          {message && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
              <p className="text-rose-400 text-sm">{message}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
              <p className="text-emerald-600 text-sm">{successMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            title="Passwort speichern"
            className={`w-full ${theme.accent} text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? 'Wird gespeichert...' : 'Passwort speichern'}
          </button>
        </form>
      )}
    </div>
  </div>
)

export default AuthView
