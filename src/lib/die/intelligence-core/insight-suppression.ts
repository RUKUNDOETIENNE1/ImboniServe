import type { BusinessInsight } from '@/lib/die/business-intelligence/reasoning-engine'

export interface SuppressedState {
  key: string
  firstDetectedAt: number
  lastObservedAt: number
  occurrences: number
}

const store = new Map<string, SuppressedState>()
const SUPPRESS_MS = 5 * 60 * 1000 // 5 minutes

function makeKey(i: BusinessInsight): string {
  return [i.type, i.severity, i.affectedDomains?.join(',') || ''].join('#')
}

export function suppressAndMerge(insights: BusinessInsight[]): { insights: BusinessInsight[]; state: SuppressedState[] } {
  const out: BusinessInsight[] = []
  const now = Date.now()
  for (const i of insights) {
    const k = makeKey(i)
    const st = store.get(k)
    if (!st) {
      store.set(k, { key: k, firstDetectedAt: now, lastObservedAt: now, occurrences: 1 })
      out.push(i)
      continue
    }
    // duplicate within window -> merge by bumping occurrences and lastObservedAt
    if (now - st.lastObservedAt < SUPPRESS_MS) {
      st.lastObservedAt = now
      st.occurrences += 1
      // annotate ongoing status without changing base fields
      ;(i as any).ongoing = true
      ;(i as any).occurrences = st.occurrences
      ;(i as any).durationMinutes = Math.round((st.lastObservedAt - st.firstDetectedAt) / 60000)
      out.push(i)
    } else {
      // window expired, treat as new occurrence cycle
      store.set(k, { key: k, firstDetectedAt: now, lastObservedAt: now, occurrences: 1 })
      out.push(i)
    }
  }
  return { insights: out, state: Array.from(store.values()) }
}
