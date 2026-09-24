import type { CEOPredictionBatch } from './evaluation-engine'

export interface CeoPriorityAccuracy {
  batchesEvaluated: number
  top1Accuracy: number // 0..1
  top3Accuracy: number // 0..1
  top5Accuracy: number // 0..1
}

function rankInsightSet(items: Array<{ insightType: any; domain: string }>): { types: Set<string>; domains: Set<string> } {
  const types = new Set<string>()
  const domains = new Set<string>()
  for (const i of items) { types.add(String(i.insightType)); domains.add(i.domain) }
  return { types, domains }
}

export function computeCeoPriorityAccuracy(batches: CEOPredictionBatch[]): CeoPriorityAccuracy {
  const evaluated = batches.filter((b) => b.actualOrder && b.actualOrder.length > 0)
  let top1 = 0
  let top3 = 0
  let top5 = 0

  for (const b of evaluated) {
    const predicted = b.predictedOrder
    const actual = b.actualOrder!

    // Top-1 exact match by insightType or domain
    const p1 = predicted[0]
    const a1 = actual[0]
    if (p1 && a1 && (p1.insightType === a1.insightType || p1.domain === a1.domain)) top1 += 1

    // Top-3 set overlap by type/domain
    const pTop3 = predicted.slice(0, 3)
    const aTop3 = actual.slice(0, 3)
    const P3 = rankInsightSet(pTop3)
    const A3 = rankInsightSet(aTop3)
    const overlap3 = [...P3.types].some((t) => A3.types.has(t)) || [...P3.domains].some((d) => A3.domains.has(d))
    if (overlap3) top3 += 1

    // Top-5 set overlap by type/domain (use up to 5 or available)
    const pTop5 = predicted.slice(0, 5)
    const aTop5 = actual.slice(0, 5)
    const P5 = rankInsightSet(pTop5)
    const A5 = rankInsightSet(aTop5)
    const overlap5 = [...P5.types].some((t) => A5.types.has(t)) || [...P5.domains].some((d) => A5.domains.has(d))
    if (overlap5) top5 += 1
  }

  const n = evaluated.length || 1
  return {
    batchesEvaluated: evaluated.length,
    top1Accuracy: top1 / n,
    top3Accuracy: top3 / n,
    top5Accuracy: top5 / n,
  }
}
