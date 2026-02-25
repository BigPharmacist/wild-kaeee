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

// Stable color map: uses stored color_index, falls back to index-based assignment
const colorMap = new Map()

export function buildStaffColorMap(profiles) {
  colorMap.clear()
  const active = profiles.filter(p => p.active)
  // Profiles with a stored color_index use it directly
  // Profiles without one get assigned from remaining colors
  const usedIndices = new Set()
  const withColor = []
  const withoutColor = []

  for (const p of active) {
    if (p.color_index != null && p.color_index >= 0 && p.color_index < staffColors.length) {
      colorMap.set(p.staff_id, staffColors[p.color_index])
      usedIndices.add(p.color_index)
      withColor.push(p)
    } else {
      withoutColor.push(p)
    }
  }

  // Assign remaining profiles to unused colors (fallback)
  let fallbackIdx = 0
  for (const p of withoutColor.sort((a, b) => a.staff_id.localeCompare(b.staff_id))) {
    while (usedIndices.has(fallbackIdx) && fallbackIdx < staffColors.length) fallbackIdx++
    colorMap.set(p.staff_id, staffColors[fallbackIdx % staffColors.length])
    usedIndices.add(fallbackIdx)
    fallbackIdx++
  }
}

export function getStaffColor(staffId) {
  return colorMap.get(staffId) || staffColors[0]
}

// Returns the index into staffColors[] for a given staff member
const colorIndexMap = new Map()

export function buildStaffColorIndexMap(profiles) {
  colorIndexMap.clear()
  const active = profiles.filter(p => p.active)
  const usedIndices = new Set()
  const withoutColor = []

  for (const p of active) {
    if (p.color_index != null && p.color_index >= 0 && p.color_index < staffColors.length) {
      colorIndexMap.set(p.staff_id, p.color_index)
      usedIndices.add(p.color_index)
    } else {
      withoutColor.push(p)
    }
  }

  let fallbackIdx = 0
  for (const p of withoutColor.sort((a, b) => a.staff_id.localeCompare(b.staff_id))) {
    while (usedIndices.has(fallbackIdx) && fallbackIdx < staffColors.length) fallbackIdx++
    colorIndexMap.set(p.staff_id, fallbackIdx % staffColors.length)
    usedIndices.add(fallbackIdx)
    fallbackIdx++
  }
}

export function getStaffColorIndex(staffId) {
  return colorIndexMap.get(staffId) ?? 0
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
