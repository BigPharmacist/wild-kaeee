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

### State Management

All state via React hooks in `App.jsx`:
- `session` - Supabase auth session
- `darkMode` - Theme toggle (true = dark)
- `sidebarWidth` - Resizable sidebar (64-320px range)
- `mobileMenuOpen` - Mobile navigation state

### Theme System

Dynamic theme object switches all colors:
```javascript
const theme = darkMode ? { bg: 'bg-slate-950', ... } : { bg: 'bg-slate-50', ... }
```
Apply via template literals: `className={theme.bg}`

### Supabase Integration

Client initialized in `src/lib/supabase.js`. Requires environment variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Design System

### Pflichtanforderungen

1. **Hell- und Dunkelmodus** - Jede UI-Komponente muss beide Themes via `theme`-Objekt unterstuetzen
2. **Responsive Design** - Mobile-First mit Tailwind Breakpoints (`sm:`, `md:`, `lg:`)
3. **Barrierefreiheit** - Buttons mit `title` Attribut, ausreichend Kontrast

### Typography

**Font Familie:** Inter (Google Fonts)
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

**Basis:** Slate (neutral, modern, professionell)
**Akzent:** Violet (freundlich, modern)
**Danger:** Rose (Fehler, Warnungen, Logout)

#### Dark Mode (Standard)
```javascript
// Backgrounds
bg: 'bg-slate-950'           // #020617 - Haupthintergrund
bgSecondary: 'bg-slate-900'  // #0f172a - Karten, Header, Sidebar
bgTertiary: 'bg-slate-800'   // #1e293b - Hover States, Inputs

// Borders
border: 'border-slate-800'   // #1e293b - Subtile Trennlinien
borderLight: 'border-slate-700' // #334155 - Staerkere Trennlinien

// Text
text: 'text-slate-50'        // #f8fafc - Primaertext
textSecondary: 'text-slate-300' // #cbd5e1 - Labels
textMuted: 'text-slate-400'  // #94a3b8 - Placeholders, Icons

// Accent
accent: 'bg-violet-600'      // #7c3aed - Primaere Buttons
accentText: 'text-violet-400' // #a78bfa - Links, aktive Nav

// Navigation (aktiv)
navActive: 'bg-violet-600/20 text-violet-400'

// Danger
danger: 'text-rose-400'      // #fb7185 - Fehler, Logout
```

#### Light Mode
```javascript
// Backgrounds
bg: 'bg-slate-50'            // #f8fafc - Haupthintergrund
bgSecondary: 'bg-white'      // #ffffff - Karten, Header, Sidebar
bgTertiary: 'bg-slate-100'   // #f1f5f9 - Hover States

// Borders
border: 'border-slate-200'   // #e2e8f0 - Subtile Trennlinien
borderLight: 'border-slate-300' // #cbd5e1 - Staerkere Trennlinien

// Text
text: 'text-slate-900'       // #0f172a - Primaertext
textSecondary: 'text-slate-600' // #475569 - Labels
textMuted: 'text-slate-500'  // #64748b - Placeholders, Icons

// Accent
accent: 'bg-violet-600'      // #7c3aed - Primaere Buttons (hover: violet-700)
accentText: 'text-violet-600' // #7c3aed - Links, aktive Nav

// Navigation (aktiv)
navActive: 'bg-violet-100 text-violet-700'

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
cardShadow: 'shadow-2xl shadow-slate-950/50'

// Light Mode
cardShadow: 'shadow-xl shadow-slate-200/50'
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
  transition-property: background-color, border-color;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

Button/Link Transitions: `transition-colors` fuer Hover-Effekte

### Input Styling

```javascript
// Inputs haben Focus-Ring
input: 'bg-slate-800 border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
```

---

## Deployment

- Dev server binds to `0.0.0.0:5173`
- Configured for domain `mtthy.kaeee.de`
- Caddy reverse proxy handles HTTPS and routes `/supabase/*` to local Supabase instance
