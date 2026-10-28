export const UNIVERSE_YEARS = 13_800_000_000
export const GALAXY_RADIUS_LY = 50_000
export const HOP_LY = 5
export const ORIGIN = { x: 0.32, y: -0.17 }

// This is a deliberately simple, isotropic wave model. Every 5 ly hop takes
// HOP_LY / speed years of travel, then the next wave waits delay years.
export function frontSpeed(speedFraction: number, delayYears: number) {
  return HOP_LY / (HOP_LY / speedFraction + delayYears)
}

export function spanYears(speedFraction: number, delayYears: number) {
  const farthestEdgeLy = (1 + Math.hypot(ORIGIN.x, ORIGIN.y)) * GALAXY_RADIUS_LY
  return farthestEdgeLy / frontSpeed(speedFraction, delayYears)
}

export function frontRadius(timeYears: number, speedFraction: number, delayYears: number) {
  return Math.max(0, timeYears * frontSpeed(speedFraction, delayYears) / GALAXY_RADIUS_LY)
}

export type Star = { x: number; y: number; size: number; hue: number; reach: number }

export function makeStars(count = 8000): Star[] {
  let seed = 143287
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0
    return (seed >>> 0) / 4294967296
  }
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    const arm = i % 4
    const r = Math.pow(random(), 0.78) * 0.97
    const angle = arm * Math.PI / 2 + r * 4.6 + (random() - 0.5) * (0.27 + r * 0.64)
    const core = random() < 0.19
    const x = core ? (random() + random() + random() - 1.5) * 0.22 : Math.cos(angle) * r
    const y = core ? (random() + random() + random() - 1.5) * 0.22 : Math.sin(angle) * r * 0.78
    const size = random() < 0.045 ? 1.3 + random() * 1.3 : 0.35 + random() * 0.75
    stars.push({ x, y, size, hue: random(), reach: Math.hypot(x - ORIGIN.x, y - ORIGIN.y) })
  }
  return stars
}

export const STARS = makeStars()

export function coverage(radius: number) {
  if (radius <= 0) return 0
  return STARS.filter(star => star.reach <= radius).length / STARS.length
}

export function formatYears(years: number) {
  const number = (n: number) => new Intl.NumberFormat('en', { maximumFractionDigits: n >= 10 ? 1 : 2 }).format(n)
  if (years >= 1_000_000_000) return `${number(years / 1_000_000_000)} billion years`
  if (years >= 1_000_000) return `${number(years / 1_000_000)} million years`
  if (years >= 1_000) return `${Math.round(years / 1_000).toLocaleString()} thousand years`
  return `${Math.round(years).toLocaleString()} years`
}

export function calendarDate(yearsAgo: number) {
  const progress = Math.min(364.999 / 365, 1 - yearsAgo / UNIVERSE_YEARS)
  const date = new Date(Date.UTC(2001, 0, 1) + progress * 365 * 86_400_000)
  return new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date)
}
