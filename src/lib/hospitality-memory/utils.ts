import { createHash } from 'crypto'

export function hashId(prefix: string, value: string): string {
  const digest = createHash('sha256').update(value).digest('hex').slice(0, 24)
  return `${prefix}_${digest}`
}

export function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export function dayOfWeekFromIso(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long' })
}

export function timeOfDayFromIso(iso: string): string {
  const hour = new Date(iso).getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

export function seasonFromIso(iso: string): string {
  const month = new Date(iso).getUTCMonth() + 1
  if (month === 12 || month <= 2) return 'summer'
  if (month <= 5) return 'autumn'
  if (month <= 8) return 'winter'
  return 'spring'
}

export function percentage(part: number, total: number): number {
  if (total <= 0) return 0
  return (part / total) * 100
}
