// Shared staff color system for Dienstplan views (WeekGrid + MonthTable)

export const staffColors = [
  // Kräftiges Rosa (MB-Stil)
  { bg: 'bg-[#A8637A]', text: 'text-white', dot: 'bg-[#945068]', ring: 'ring-[#A8637A]', barBg: 'bg-[#f2b8c6]' },
  // Salbeigrün (HB-Stil)
  { bg: 'bg-[#5A9660]', text: 'text-white', dot: 'bg-[#4A8350]', ring: 'ring-[#5A9660]', barBg: 'bg-[#a6e0b8]' },
  // Kräftiges Violett
  { bg: 'bg-[#7E6AAF]', text: 'text-white', dot: 'bg-[#6B579C]', ring: 'ring-[#7E6AAF]', barBg: 'bg-[#d4b0e3]' },
  // Warmes Bernstein (HB-Stil)
  { bg: 'bg-[#B08840]', text: 'text-white', dot: 'bg-[#9A7535]', ring: 'ring-[#B08840]', barBg: 'bg-[#fad6a6]' },
  // Stahlblau (KB-Stil)
  { bg: 'bg-[#5B82A8]', text: 'text-white', dot: 'bg-[#4A6F94]', ring: 'ring-[#5B82A8]', barBg: 'bg-[#addbef]' },
  // Kräftiges Teal
  { bg: 'bg-[#4A9298]', text: 'text-white', dot: 'bg-[#3A8085]', ring: 'ring-[#4A9298]', barBg: 'bg-[#a8e5e2]' },
  // Kräftiges Terrakotta
  { bg: 'bg-[#B07848]', text: 'text-white', dot: 'bg-[#9A6638]', ring: 'ring-[#B07848]', barBg: 'bg-[#e8c9a0]' },
  // Kräftiges Lavendel
  { bg: 'bg-[#9468A8]', text: 'text-white', dot: 'bg-[#805594]', ring: 'ring-[#9468A8]', barBg: 'bg-[#c9b8e8]' },
]

// Stable color map: built once from sorted staff_ids, each gets a unique color
const colorMap = new Map()

export function buildStaffColorMap(profiles) {
  colorMap.clear()
  const active = profiles.filter(p => p.active)
  const sorted = [...active].sort((a, b) => a.staff_id.localeCompare(b.staff_id))
  sorted.forEach((p, i) => {
    colorMap.set(p.staff_id, staffColors[i % staffColors.length])
  })
}

export function getStaffColor(staffId) {
  return colorMap.get(staffId) || staffColors[0]
}

export function getStaffInitials(profile) {
  const first = profile.staff?.first_name || ''
  const last = profile.staff?.last_name || ''
  return ((first[0] || '') + (last[0] || '')).toUpperCase() || '?'
}

export function toLocalDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
