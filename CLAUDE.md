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

### Code-Organisation (Feature-Based)

**Wichtig:** Neue Komponenten und Logik werden nach Features organisiert, nicht nach Dateityp.

```
src/
├── features/           # Feature-Module (eine Funktion = ein Ordner)
│   ├── apo/           # Apotheken-Ansicht
│   ├── auth/          # Authentifizierung
│   ├── calendar/      # Kalender
│   ├── chat/          # Chat-Funktion
│   ├── contacts/      # Kontakte + Visitenkarten-Scan
│   │   └── scan/      # Sub-Feature für Scannen
│   ├── dashboard/     # Header, Sidebar, Home
│   ├── email/         # E-Mail (Compose, List, Detail, Hooks)
│   ├── photos/        # Fotos-Ansicht
│   ├── plan/          # Planansicht
│   └── settings/      # Einstellungen
├── shared/            # Geteilte, wiederverwendbare Komponenten
│   └── ui/            # UI-Bausteine (Icons, Badges, etc.)
├── lib/               # Externe Services (supabase.js)
└── App.jsx            # Nur Routing und Top-Level-State
```

**Regeln:**

1. **Ein Feature = Ein Ordner** mit eigenem `index.js` für Exports
2. **Komponenten, Hooks und Utils** eines Features bleiben zusammen
3. **Shared-Komponenten** nur für echte Wiederverwendung (≥2 Features)
4. **App.jsx bleibt schlank** - nur Imports, Routing, globaler State
5. **Neue Views** immer unter `src/features/<name>/` anlegen

**Beispiel neues Feature:**
```bash
src/features/invoices/
├── index.js              # export { InvoicesView, useInvoices }
├── InvoicesView.jsx      # Hauptkomponente
├── InvoiceDetail.jsx     # Detail-Ansicht
└── useInvoices.js        # Daten-Hook
```

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
id (uuid), name, street, postal_code, city, phone, owner, owner_role, website, email, fax, vat_id, trade_register, registry_court, bga_idf_number
```

Lokale Supabase Tabelle `staff` für Kollegium:
```text
id (uuid), pharmacy_id (uuid), first_name, last_name, street, postal_code, city, mobile, email, role, auth_user_id (uuid), is_admin (bool), avatar_url (text), employed_since (date)
```

Lokale Supabase Tabelle `contacts` für Geschäftskontakte:
```text
id (uuid), owner_id (uuid), first_name, last_name, company, position, email, phone, mobile, website, street, postal_code, city, country, contact_type, tags (jsonb), notes, shared (bool), business_card_url, business_card_url_enhanced, business_card_enhanced_confirmed (bool), status ('aktiv'|'inaktiv'), predecessor_id (uuid), transition_date (date)
```

**Vertreterwechsel-Logik:**
- `status`: 'aktiv' = aktueller Ansprechpartner, 'inaktiv' = ehemaliger Vertreter
- `predecessor_id`: Verweis auf Vorgänger-Kontakt bei gleicher Firma
- `transition_date`: Datum des Vertreterwechsels

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

#### Sidebar (fest)
- **Primary Sidebar:** Navy-Slate `#1E293B`
- **Secondary Sidebar:** Slate `#334155`

#### Primary (Accent)
- **Amber:** `#F59E0B` - CTA-Buttons, wichtige Aktionen
- **Amber Hover:** `#D97706`

#### Status-Farben
- **Success/Teal:** `#0D9488` (Hover: `#0F766E`)
- **Warning:** `#F59E0B` (Hover: `#D97706`)
- **Error Red:** `#E11D48` (Hover: `#BE123C`)

#### Hintergründe
- **App Background:** `#F8FAFC` (leicht bläuliches Weiß)
- **Cards/Panels:** `#FFFFFF`
- **Active/Hover:** `#FEF3C7` (helles Amber)

#### Text
- **Text Primary:** `#1E293B`
- **Text Secondary:** `#64748B`
- **Text Muted:** `#94A3B8`

#### Borders
- **Border (hell):** `#CBD5E1`
- **Divider (dunkel):** `#1E293B/20`

### Theme-Objekt (Light Mode)

Das Theme wird in `App.jsx` als Objekt definiert und via Template Literals angewendet:

```javascript
const theme = {
  // Backgrounds - Leicht bläuliches Weiß
  bgApp: 'bg-[#F8FAFC]',
  bg: 'bg-[#F8FAFC]',
  surface: 'bg-white',
  panel: 'bg-white',
  bgHover: 'hover:bg-[#FEF3C7]/30',
  bgCard: 'bg-white',

  // Text - Navy & Slate-Grau
  textPrimary: 'text-[#1E293B]',
  text: 'text-[#1E293B]',
  textSecondary: 'text-[#64748B]',
  textMuted: 'text-[#94A3B8]',

  // Borders
  border: 'border-[#CBD5E1]',
  divider: 'border-[#1E293B]/20',

  // Navigation - Amber aktiv
  navActive: 'bg-[#FEF3C7] text-[#1E293B] border border-[#F59E0B]/30',
  navHover: 'hover:bg-[#FEF3C7]/50 hover:text-[#1E293B]',

  // Amber (Primary) - CTA, wichtige Buttons
  accent: 'bg-[#F59E0B] hover:bg-[#D97706]',
  accentText: 'text-[#F59E0B]',
  primary: 'text-[#F59E0B]',
  primaryBg: 'bg-[#F59E0B]',
  primaryHover: 'hover:bg-[#D97706]',

  // Teal (Secondary)
  secondary: 'text-[#0D9488]',
  secondaryAccent: 'bg-[#0D9488] hover:bg-[#0F766E]',

  // Sidebar - Dunkles Navy-Slate
  sidebarBg: 'bg-[#1E293B]',
  sidebarHover: 'hover:bg-[#334155]',
  sidebarActive: 'border-[#F59E0B] bg-transparent',
  sidebarText: 'text-[#E2E8F0]',
  sidebarTextActive: 'text-[#E2E8F0]',

  // Secondary Sidebar
  secondarySidebarBg: 'bg-[#334155]',
  secondaryActive: 'border-l-4 border-[#F59E0B] bg-[#1E293B] text-[#FEF3C7]',

  // Inputs
  input: 'bg-white border-[#CBD5E1] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]',
  inputPlaceholder: 'placeholder-[#94A3B8]',

  // Shadows
  cardShadow: 'shadow-[0_4px_12px_rgba(30,41,59,0.08)]',
  cardHoverShadow: 'hover:shadow-[0_8px_20px_rgba(30,41,59,0.12)]',

  // Overlay
  overlay: 'bg-[#1E293B]/40',

  // Status Colors
  success: 'text-[#0D9488]',
  successBg: 'bg-[#0D9488] hover:bg-[#0F766E]',
  warning: 'text-[#F59E0B]',
  warningBg: 'bg-[#F59E0B] hover:bg-[#D97706]',
  danger: 'text-[#E11D48] hover:text-[#BE123C] hover:bg-[#FEE2E2]',
  dangerBg: 'bg-[#E11D48] hover:bg-[#BE123C]',
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

SVG-Icons als React-Komponenten in `src/shared/ui/Icons.jsx`:
- Import: `import { Icons } from './shared/ui'`
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
