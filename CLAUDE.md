# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Sprache

**Wichtig:** Verwende in allen deutschen Texten echte Umlaute (ä, ö, ü, ß) - nicht ae, oe, ue, ss.

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
- `editingPharmacy` / `editForm` - Popup für Anlegen/Bearbeiten
- Maximal 4 Apotheken pro Installation, Hinzufügen via + im Settings-Header
- `staff` - Kollegium (global, mit Apotheke verknüpft)
- `editingStaff` / `staffForm` - Popup für Kollegium
- `weatherLocation` - Ort für das Wetter-Widget (default: Apothekenort)
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

# Status prüfen
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

Lokale Supabase Tabelle `pharmacies` für die Apothekendaten:
```text
id (uuid), name, street, postal_code, city, phone, owner, owner_role, website, email, fax
```

Lokale Supabase Tabelle `staff` für Kollegium:
```text
id (uuid), pharmacy_id (uuid), first_name, last_name, street, postal_code, city, mobile, email, role, auth_user_id (uuid), is_admin (bool), avatar_url (text)
```

---

## Design System

### Pflichtanforderungen

1. **Light Mode Design** - Aktuell nur Light Mode implementiert (Dark Mode vorbereitet aber nicht aktiv)
2. **Responsive Design** - Mobile-First mit Tailwind Breakpoints (`sm:`, `md:`, `lg:`)
3. **Barrierefreiheit** - Buttons mit `title` Attribut, ausreichend Kontrast

### Typography

**Font Familie:** Inter (Google Fonts)
- Geladen via `index.html` mit preconnect für Performance
- Definiert in `src/index.css`: `--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif`
- Antialiased rendering via `antialiased` class auf body

**Font Weights:**
- `400` - Regular: Fließtext
- `500` - Medium: Labels, Buttons
- `600` - Semibold: Überschriften, Navigation

### Farbpalette

**Primär:** Blau (#4A90E2) - Buttons, Links, Akzente
**Sekundär:** Violett (#7B6CF6) - Sekundäre Elemente
**Hintergrund:** Light Gray (#F5F7FA) - App-Hintergrund
**Sidebar:** Dark Slate (#3c4255) - Primäre Navigation
**Danger:** Rot (#EF4444) - Fehler, Löschen

### Theme-Objekt (Light Mode)

Das Theme wird in `App.jsx` als Objekt definiert und via Template Literals angewendet:

```javascript
const theme = {
  // Backgrounds
  bgApp: 'bg-[#F5F7FA]',           // App-Hintergrund
  bg: 'bg-[#F5F7FA]',              // Allgemeiner Hintergrund
  surface: 'bg-white',              // Karten, Panels
  panel: 'bg-white',                // Formulare
  bgHover: 'hover:bg-[#F5F7FA]',   // Hover-Zustand
  bgCard: 'bg-white',               // Karten

  // Text
  textPrimary: 'text-[#1F2937]',   // Haupttext (Dark Gray)
  text: 'text-[#1F2937]',          // Alias
  textSecondary: 'text-[#6B7280]', // Labels, Untertitel
  textMuted: 'text-[#9CA3AF]',     // Placeholders, deaktiviert

  // Borders
  border: 'border-[#E5E7EB]',      // Standard-Rahmen

  // Navigation (Content Area)
  navActive: 'bg-[#EEF4FD] text-[#1F2937] border border-[#D6E6FB]',
  navHover: 'hover:bg-[#F5F7FA] hover:text-[#1F2937]',

  // Accent (Blau)
  accent: 'bg-[#4A90E2] hover:bg-[#6AA9F0]',
  accentText: 'text-[#4A90E2]',
  primary: 'text-[#4A90E2]',
  primaryBg: 'bg-[#4A90E2]',
  primaryHover: 'hover:bg-[#6AA9F0]',

  // Secondary (Violett)
  secondary: 'text-[#7B6CF6]',

  // Sidebar (Schmal, nur Icons)
  sidebarBg: 'bg-[#3c4255]',
  sidebarHover: 'hover:bg-[#4a5066]',
  sidebarActive: 'border-l-[3px] border-white bg-transparent',  // Heller Rand links
  sidebarText: 'text-[#E5E7EB]',       // Helle Icons
  sidebarTextActive: 'text-[#E5E7EB]',

  // Secondary Sidebar (Dunkel)
  secondarySidebarBg: 'bg-[#4f5469]',
  secondaryActive: 'border-l-4 border-[#4A90E2] bg-[#3c4255] text-[#E5E7EB]',
  // Secondary Nav Items: text-[#E5E7EB], hover:bg-[#3c4255] hover:text-white

  // Inputs
  input: 'bg-white border-[#E5E7EB] focus:border-[#4A90E2] focus:ring-1 focus:ring-[#4A90E2]',
  inputPlaceholder: 'placeholder-[#9CA3AF]',

  // Shadows
  cardShadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.05)]',
  cardHoverShadow: 'hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]',

  // Overlay
  overlay: 'bg-[#1F2937]/30',

  // Danger
  danger: 'text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEE2E2]',
}
```

Anwendung via Template Literals: `className={theme.bg}` oder `className={\`${theme.surface} ${theme.border}\`}`

### Spacing & Radii

**Border Radius:**
- `rounded-xl` (12px) - Inputs, Karten, Error-Boxen
- `rounded-2xl` (16px) - Große Karten
- `rounded-lg` (8px) - Buttons, Navigation Items
- `rounded-full` - Badges, Avatare

**Padding:**
- Header: `px-4 lg:px-6 py-3`
- Buttons: `px-3 py-2.5` bis `px-4 py-2.5`
- Inputs: `px-3 py-2` bis `px-4 py-2.5`
- Badges: `px-2 py-1` oder `px-1.5 py-0.5`

### Shadows

```javascript
// Karten (subtil)
cardShadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.05)]'

// Karten Hover
cardHoverShadow: 'hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]'
```

### Icons

SVG-Icons als React-Komponenten in `App.jsx`:
- Größe: `w-5 h-5` (Standard) / `w-6 h-6` (Menu)
- Stil: Outline mit `strokeWidth={2}`
- Verfügbar: Sun, Moon, Home, Chart, Settings, Logout, Menu, X, Photo, Pill, Calendar, Chat, etc.

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

### Custom Scrollbar

Definiert in `index.css`:
```css
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
```

### Input Styling

```javascript
// Inputs mit Focus-Ring (Blau)
input: 'bg-white border-[#E5E7EB] focus:border-[#4A90E2] focus:ring-1 focus:ring-[#4A90E2]'
```

---

## Deployment

- Dev server binds to `0.0.0.0:5173`
- Configured for domain `mtthy.kaeee.de`
- Caddy reverse proxy handles HTTPS and routes `/supabase/*` to local Supabase instance
