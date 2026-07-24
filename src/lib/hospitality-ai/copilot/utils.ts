/**
 * Hospitality AI Copilot™ — utility helpers.
 *
 * Shared helpers used across all Copilot engines.
 * Helpers never bypass the certified architecture.
 */

import { createHash } from 'crypto'
import type {
  IntentType,
  OperationalDomain,
  ExpertiseProfile,
  ReasoningStrategy,
  UserRole,
  ShiftType,
} from './types'

// ============================================================================
// Identity & Time
// ============================================================================

export function hashId(prefix: string, content: string): string {
  const safeContent = content == null ? '' : String(content)
  return `${prefix}_${createHash('sha256').update(safeContent).digest('hex').slice(0, 16)}`
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

// ============================================================================
// Text Processing
// ============================================================================

export function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((t) => t.length > 2)
}

export function textContainsAny(text: string, keywords: string[]): boolean {
  const lower = normalize(text)
  return keywords.some((k) => lower.includes(normalize(k)))
}

export function textContainsAll(text: string, keywords: string[]): boolean {
  const lower = normalize(text)
  return keywords.every((k) => lower.includes(normalize(k)))
}

export function countKeywordMatches(text: string, keywords: string[]): number {
  const lower = normalize(text)
  return keywords.filter((k) => lower.includes(normalize(k))).length
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

// ============================================================================
// Time Helpers
// ============================================================================

export function dayOfWeek(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long' })
}

export function timeOfDay(iso: string): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date(iso).getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

export function season(iso: string): 'dry' | 'wet' | 'holiday' | 'festive' | 'unknown' {
  const date = new Date(iso)
  const month = date.getMonth()  // 0..11
  // Rwanda-style seasons: dry (Jun-Sep, Dec-Feb), wet (Mar-May, Oct-Nov)
  if (month === 11 || month === 0) return 'festive'
  if ([5, 6, 7, 8].includes(month)) return 'dry'
  if ([2, 3, 4, 9, 10].includes(month)) return 'wet'
  return 'dry'
}

export function shiftFromHour(iso: string): ShiftType {
  const hour = new Date(iso).getHours()
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 14) return 'lunch'
  if (hour >= 14 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'dinner'
  if (hour >= 21 && hour < 24) return 'evening'
  return 'night'
}

// ============================================================================
// Confidence Helpers
// ============================================================================

export function confidenceLevel(score: number): 'low' | 'medium' | 'high' | 'very_high' | 'certain' {
  if (score >= 0.95) return 'certain'
  if (score >= 0.85) return 'very_high'
  if (score >= 0.7) return 'high'
  if (score >= 0.5) return 'medium'
  return 'low'
}

export function severityFromScore(score: number): 'info' | 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 0.9) return 'critical'
  if (score >= 0.75) return 'high'
  if (score >= 0.5) return 'medium'
  if (score >= 0.25) return 'low'
  return 'info'
}

export function priorityFromScore(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 0.9) return 'critical'
  if (score >= 0.75) return 'high'
  if (score >= 0.5) return 'medium'
  return 'low'
}

// ============================================================================
// Determinism Proof
// ============================================================================

export function determinismProof(inputs: Record<string, unknown>): string {
  const stable = JSON.stringify(inputs, Object.keys(inputs).sort())
  return createHash('sha256').update(stable).digest('hex').slice(0, 16)
}

// ============================================================================
// Type Guards
// ============================================================================

export function isIntentType(value: string): value is IntentType {
  return [
    'information_request', 'explanation', 'root_cause_analysis',
    'recommendation_request', 'prediction_request', 'risk_assessment',
    'planning', 'optimization', 'comparison', 'status_check',
    'trend_analysis', 'decision_support', 'problem_diagnosis',
    'operational_review', 'learning_training', 'unknown_intent',
  ].includes(value)
}

export function isOperationalDomain(value: string): value is OperationalDomain {
  return [
    'kitchen', 'service', 'reservations', 'inventory', 'finance',
    'revenue', 'customers', 'staff', 'management', 'marketing',
    'suppliers', 'operations', 'cross_domain',
  ].includes(value)
}

export function isExpertiseProfile(value: string): value is ExpertiseProfile {
  return [
    'executive_advisor', 'kitchen_advisor', 'service_advisor',
    'inventory_advisor', 'revenue_advisor', 'staff_performance_advisor',
    'customer_experience_advisor', 'operational_excellence_advisor',
  ].includes(value)
}

export function isReasoningStrategy(value: string): value is ReasoningStrategy {
  return [
    'cause_and_effect', 'constraint_optimization', 'temporal_reasoning',
    'risk_evaluation', 'multi_factor_reasoning', 'comparative_reasoning',
    'scenario_reasoning', 'evidence_based_recommendation',
    'diagnostic_reasoning', 'summary_synthesis',
  ].includes(value)
}

export function isUserRole(value: string): value is UserRole {
  return [
    'owner', 'general_manager', 'kitchen_manager', 'service_manager',
    'floor_manager', 'inventory_manager', 'shift_lead', 'server',
    'cook', 'host', 'bartender', 'analyst', 'executive', 'unknown',
  ].includes(value)
}
