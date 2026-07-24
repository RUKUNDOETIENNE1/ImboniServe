/**
 * Operational Skill Registry — utility helpers.
 */

import { createHash } from 'crypto'

export function hashId(prefix: string, content: string): string {
  return `${prefix}_${createHash('sha256').update(content).digest('hex').slice(0, 16)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((s, v) => s + v, 0) / values.length
}

export function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

export function semanticVersionCompare(a: string, b: string): number {
  const partsA = a.split('.').map(Number)
  const partsB = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const va = partsA[i] || 0
    const vb = partsB[i] || 0
    if (va > vb) return 1
    if (va < vb) return -1
  }
  return 0
}

export function isProductionEligible(status: string): boolean {
  return status === 'validated' || status === 'production'
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2)
}

export function textContainsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((k) => lower.includes(k.toLowerCase()))
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
