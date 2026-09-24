import type { NarrativeCategory, PredictionRecord } from './evaluation-engine'

export interface NarrativeAccuracy {
  category: NarrativeCategory
  evaluated: number
  correct: number
  score: number // 0..100
}

export interface NarrativeValidationReport {
  categories: NarrativeAccuracy[]
  overallScore: number // 0..100
}

/**
 * Narrative correctness is derived from the underlying insights that drive each
 * narrative category. If the insights that justified a narrative claim were
 * correct, the narrative claim was correct.
 */
export function computeNarrativeAccuracy(evaluated: PredictionRecord[]): NarrativeValidationReport {
  const cats: NarrativeCategory[] = ['Finance', 'Operations', 'Supply Chain', 'Customer']
  const map = new Map<NarrativeCategory, { evaluated: number; correct: number }>()
  for (const c of cats) map.set(c, { evaluated: 0, correct: 0 })

  for (const r of evaluated) {
    const cur = map.get(r.narrative)
    if (!cur) continue
    cur.evaluated += 1
    if (r.predictionCorrect) cur.correct += 1
  }

  const categories: NarrativeAccuracy[] = cats.map((c) => {
    const v = map.get(c)!
    return { category: c, evaluated: v.evaluated, correct: v.correct, score: v.evaluated ? Math.round((v.correct / v.evaluated) * 100) : 0 }
  })

  const populated = categories.filter((c) => c.evaluated > 0)
  const overallScore = populated.length
    ? Math.round(populated.reduce((s, c) => s + c.score, 0) / populated.length)
    : 0

  return { categories, overallScore }
}
