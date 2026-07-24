/**
 * Hospitality Knowledge™ utility helpers.
 */

import { createHash } from 'crypto'

export function hashId(prefix: string, content: string): string {
  return `${prefix}_${createHash('sha256').update(content).digest('hex').slice(0, 16)}`
}

export function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0
  const avg = average(values)
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export function timeOfDay(iso: string): string {
  const hour = new Date(iso).getHours()
  if (hour < 6) return 'early_morning'
  if (hour < 11) return 'morning'
  if (hour < 14) return 'lunch'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

export function dayOfWeek(iso: string): string {
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
    new Date(iso).getDay()
  ]
}

export function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  return Math.max(0, (end - start) / (1000 * 60 * 60 * 24))
}

export function daysSince(iso: string): number {
  return daysBetween(iso, nowIso())
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2)
}

export function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a)
  const setB = new Set(b)
  const intersection = new Set([...setA].filter((x) => setB.has(x)))
  const union = new Set([...setA, ...setB])
  if (union.size === 0) return 0
  return intersection.size / union.size
}

export function textSimilarity(a: string, b: string): number {
  return jaccardSimilarity(tokenize(a), tokenize(b))
}
