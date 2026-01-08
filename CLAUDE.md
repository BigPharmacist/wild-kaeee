# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start dev server (Vite HMR on port 5173)
npm run build    # Production build to dist/
npm run lint     # ESLint validation
npm run preview  # Preview production build
```

## Tech Stack

- **React 19** with Vite 7
- **Tailwind CSS 4** for styling
- **Supabase** for authentication and backend
- **ESLint** with flat config (ES2020, JSX)

## Architecture

### Application Structure

Single-page app with two main views:
1. **Login Screen** - Centered form, no registration (admin-only user creation)
2. **Dashboard** - Header + resizable sidebar + main content area
3. **Settings** - Unterpunkt "Apotheken" zum Erfassen und Anzeigen von Apotheken

### State Management

All state via React hooks in `App.jsx`:
- `session` - Supabase auth session
- `darkMode` - Theme toggle (true = dark)
- `sidebarWidth` - Resizable sidebar (64-320px range)
- `mobileMenuOpen` - Mobile navigation state
- `activeView` - Dashboard/Statistiken/Einstellungen
- `settingsTab` - Unterbereich in Einstellungen (z.B. Apotheken)
- `pharmacies` - Geladene Apotheken aus Supabase
- `editingPharmacy` / `editForm` - Popup fuer Anlegen/Bearbeiten
- Maximal 4 Apotheken pro Installation, Hinzufuegen via + im Settings-Header
- `staff` - Kollegium (global, mit Apotheke verknuepft)
- `editingStaff` / `staffForm` - Popup fuer Kollegium
- `weatherLocation` - Ort fuer das Wetter-Widget (default: Apothekenort)
- `weatherData` - Open-Meteo Wetterdaten (aktuell + 5-Tage-Vorschau)

### Theme System

Dynamic theme object switches all colors:
```javascript
const theme = darkMode ? { bg: 'bg-zinc-950', ... } : { bg: 'bg-zinc-50', ... }
```
Apply via template literals: `className={theme.bg}`

### Supabase Integration (Self-Hosted)

**WICHTIG:** Dieses Projekt nutzt eine self-hosted Supabase-Instanz, NICHT Supabase Cloud.

#### Architektur

```
Browser → mtthy.kaeee.de → Caddy → localhost:5173 (Vite)
                              ↘ /supabase/* → localhost:8000 (Kong/Supabase API)
```

#### Pfade

| Komponente | Pfad |
|------------|------|
| Supabase Docker | `/home/matthias/supabase/docker/` |
| Supabase .env | `/home/matthias/supabase/docker/.env` |
| Caddyfile | `/home/matthias/Caddyfile` |
| App .env | `/home/matthias/Kaeee/.env` |

#### Supabase starten/stoppen

```bash
cd /home/matthias/supabase/docker

# Starten
docker compose up -d

# Stoppen
docker compose down

# Status pruefen
docker compose ps

# Logs anzeigen
docker compose logs -f
```

#### Environment Variables (App)

In `/home/matthias/Kaeee/.env`:
```
VITE_SUPABASE_URL=https://mtthy.kaeee.de/supabase
VITE_SUPABASE_ANON_KEY=<aus /home/matthias/supabase/docker/.env>
```

Der `ANON_KEY` in beiden .env-Dateien muss identisch sein.

#### Client

Initialisiert in `src/lib/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### Data Model

Lokale Supabase Tabelle `pharmacies` fuer die Apothekendaten:
```text
id (uuid), name, street, postal_code, city, phone, owner, owner_role, website, email, fax
```

Lokale Supabase Tabelle `staff` fuer Kollegium:
```text
id (uuid), pharmacy_id (uuid), first_name, last_name, street, postal_code, city, mobile, email, role, auth_user_id (uuid), is_admin (bool), avatar_url (text)
```

---

## Design System

### Pflichtanforderungen

1. **Hell- und Dunkelmodus** - Jede UI-Komponente muss beide Themes via `theme`-Objekt unterstuetzen
2. **Responsive Design** - Mobile-First mit Tailwind Breakpoints (`sm:`, `md:`, `lg:`)
3. **Barrierefreiheit** - Buttons mit `title` Attribut, ausreichend Kontrast

### Typography

**Font Familie:** Sora (Google Fonts)
- Geladen via `index.html` mit preconnect fuer Performance
- Fallback: `ui-sans-serif, system-ui, sans-serif`
- Antialiased rendering via `antialiased` class auf body

**Font Weights:**
- `400` - Regular: Fliesstext
- `500` - Medium: Labels, Buttons
- `600` - Semibold: Ueberschriften, Navigation
- `700` - Bold: Nur fuer besondere Hervorhebungen

**Tracking:**
- `tracking-tight` fuer Ueberschriften (h1, h2, h3)
- Standard tracking fuer Fliesstext

### Farbpalette

**Basis:** Zinc (graphit, minimalistisch)
**Akzent:** Emerald (klar, modern)
**Highlight:** Amber (nur als dezenter Hintergrundverlauf)
**Danger:** Rose (Fehler, Warnungen, Logout)

#### Dark Mode (Standard)
```javascript
// Backgrounds
bg: 'bg-zinc-950'            // #09090b - Haupthintergrund
bgPattern: 'radial-gradient(...)' // Subtile Akzentflaechen (emerald/amber)
surface: 'bg-zinc-900/65'    // Header, Sidebar (glasig)
panel: 'bg-zinc-900/80'      // Karten, Formulare

// Borders
border: 'border-zinc-800/80' // #27272a - Subtile Trennlinien
borderLight: 'border-zinc-700/80' // #3f3f46 - Staerkere Trennlinien

// Text
text: 'text-zinc-50'         // #fafafa - Primaertext
textSecondary: 'text-zinc-300' // #d4d4d8 - Labels
textMuted: 'text-zinc-400'   // #a1a1aa - Placeholders, Icons

// Accent
accent: 'bg-emerald-500'     // #10b981 - Primaere Buttons
accentText: 'text-emerald-400' // #34d399 - Links, aktive Nav

// Navigation (aktiv)
navActive: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'

// Danger
danger: 'text-rose-400'      // #fb7185 - Fehler, Logout
```

#### Light Mode
```javascript
// Backgrounds
bg: 'bg-zinc-50'             // #fafafa - Haupthintergrund
bgPattern: 'radial-gradient(...)' // Subtile Akzentflaechen (emerald/amber)
surface: 'bg-white/80'       // Header, Sidebar (glasig)
panel: 'bg-white'            // Karten, Formulare

// Borders
border: 'border-zinc-200'    // #e4e4e7 - Subtile Trennlinien
borderLight: 'border-zinc-300' // #d4d4d8 - Staerkere Trennlinien

// Text
text: 'text-zinc-900'        // #18181b - Primaertext
textSecondary: 'text-zinc-600' // #52525b - Labels
textMuted: 'text-zinc-500'   // #71717a - Placeholders, Icons

// Accent
accent: 'bg-emerald-600'     // #059669 - Primaere Buttons (hover: emerald-700)
accentText: 'text-emerald-700' // #047857 - Links, aktive Nav

// Navigation (aktiv)
navActive: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'

// Danger
danger: 'text-rose-600'      // #e11d48 - Fehler, Logout
```

### Spacing & Radii

**Border Radius:**
- `rounded-xl` (12px) - Inputs, kleine Karten
- `rounded-2xl` (16px) - Grosse Karten, Login-Box
- `rounded-lg` (8px) - Buttons, Navigation Items

**Padding:**
- Cards: `p-6` (mobile) / `p-8` (desktop)
- Header: `px-4 lg:px-6 py-3`
- Buttons: `px-4 py-2.5`
- Inputs: `px-4 py-2.5`

### Shadows

```javascript
// Dark Mode
cardShadow: 'shadow-[0_30px_60px_-35px_rgba(0,0,0,0.8)]'

// Light Mode
cardShadow: 'shadow-[0_20px_50px_-30px_rgba(24,24,27,0.35)]'
```

### Icons

SVG-Icons als React-Komponenten in `App.jsx`:
- Groesse: `w-5 h-5` (Standard) / `w-6 h-6` (Menu)
- Stil: Outline mit `strokeWidth={2}`
- Verfuegbar: Sun, Moon, Home, Chart, Settings, Logout, Menu, X

### Responsive Breakpoints

Mobile-First Ansatz mit Tailwind Breakpoints:
- **Default:** Mobile (< 640px)
- **sm:** >= 640px
- **md:** >= 768px
- **lg:** >= 1024px (Sidebar wechselt von Overlay zu permanent)

**Mobile Besonderheiten:**
- Hamburger Menu Button (`lg:hidden`)
- Sidebar als Overlay mit Backdrop
- User-Email versteckt (`hidden sm:block`)
- Resize Handle versteckt (`hidden lg:block`)

### Transitions

Globale Transitions in `index.css`:
```css
* {
  transition-property: background-color, border-color, color, box-shadow;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

Button/Link Transitions: `transition-colors` fuer Hover-Effekte

### Input Styling

```javascript
// Inputs haben Focus-Ring
input: 'bg-zinc-900/60 border-zinc-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400'
```

---

## Deployment

- Dev server binds to `0.0.0.0:5173`
- Configured for domain `mtthy.kaeee.de`
- Caddy reverse proxy handles HTTPS and routes `/supabase/*` to local Supabase instance
