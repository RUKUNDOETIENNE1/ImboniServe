/**
 * Hospitality Knowledge™ Discovery Engine.
 *
 * Implements the explicit Knowledge Formation Pipeline:
 *
 *   Heart Pulse Events
 *        ↓
 *   Hospitality Memory
 *        ↓
 *   Memory Clustering       ← group related memories
 *        ↓
 *   Pattern Detection       ← extract patterns from clusters
 *        ↓
 *   Evidence Evaluation     ← assess evidence quality
 *        ↓
 *   Candidate Knowledge     ← form knowledge candidates
 *        ↓
 *   Knowledge Validation    ← validate against rules
 *        ↓
 *   Established Knowledge   ← promote to established
 *        ↓
 *   Knowledge Graph         ← integrate into graph
 *
 * Every stage is recorded in provenance.formationPipeline for full auditability.
 */

import type { HospitalityMemoryEntity } from '@/lib/hospitality-memory/types'
import type {
  KnowledgeCandidate,
  KnowledgeCategory,
  KnowledgeFormationStage,
  KnowledgePattern,
  MemoryCluster,
} from './types'
import { hashId, nowIso, textSimilarity, uniqueStrings, dayOfWeek, timeOfDay, daysBetween } from './utils'

// ============================================================================
// Stage 1: Memory Ingestion
// ============================================================================

export interface IngestionResult {
  memories: HospitalityMemoryEntity[]
  stage: KnowledgeFormationStage
}

/**
 * Stage 1: Memory Ingestion
 * Load and filter memories eligible for knowledge formation.
 * Only confirmed/business_rule/historical/reconfirmed memories are eligible.
 */
export function ingestMemories(
  businessId: string,
  allMemories: HospitalityMemoryEntity[]
): IngestionResult {
  const eligible = allMemories.filter((m) =>
    !['archived', 'retired', 'conflict_review'].includes(m.status)
  )

  const stage: KnowledgeFormationStage = {
    stage: 'memory_ingestion',
    timestamp: nowIso(),
    inputCount: allMemories.length,
    outputCount: eligible.length,
    description: `Filtered ${allMemories.length} memories to ${eligible.length} eligible (excluded: archived/retired/conflict_review)`,
    metadata: {
      filteredStatuses: ['archived', 'retired', 'conflict_review'],
    },
  }

  return { memories: eligible, stage }
}

// ============================================================================
// Stage 2: Memory Clustering
// ============================================================================

export interface ClusteringResult {
  clusters: MemoryCluster[]
  stage: KnowledgeFormationStage
}

/**
 * Stage 2: Memory Clustering
 * Group related memories by category and thematic similarity.
 */
export function clusterMemories(
  businessId: string,
  memories: HospitalityMemoryEntity[]
): ClusteringResult {
  const clusters: MemoryCluster[] = []
  const assigned = new Set<string>()

  // First pass: group by category
  const byCategory = new Map<KnowledgeCategory, HospitalityMemoryEntity[]>()
  for (const memory of memories) {
    const category = (memory.category as KnowledgeCategory) || 'operational'
    if (!byCategory.has(category)) byCategory.set(category, [])
    byCategory.get(category)!.push(memory)
  }

  // Second pass: within each category, cluster by title/topic similarity
  for (const [category, categoryMemories] of byCategory.entries()) {
    const localClusters: MemoryCluster[] = []

    for (const memory of categoryMemories) {
      if (assigned.has(memory.id)) continue

      // Start a new cluster with this memory
      const clusterMemories: HospitalityMemoryEntity[] = [memory]
      assigned.add(memory.id)

      // Find similar memories
      for (const other of categoryMemories) {
        if (assigned.has(other.id)) continue
        const similarity = textSimilarity(memory.title + ' ' + memory.description, other.title + ' ' + other.description)
        if (similarity >= 0.25) {
          clusterMemories.push(other)
          assigned.add(other.id)
        }
      }

      const clusterKey = `${category}_${clusterMemories.map((m) => m.id).sort().join('_')}`
      const clusterTheme = deriveClusterTheme(clusterMemories)

      localClusters.push({
        id: hashId('hk_cluster', `${businessId}|${clusterKey}`),
        businessId,
        clusterKey,
        category,
        memoryIds: clusterMemories.map((m) => m.id),
        memories: clusterMemories,
        clusterTheme,
        coherenceScore: computeClusterCoherence(clusterMemories),
        size: clusterMemories.length,
        createdAt: nowIso(),
      })
    }

    // Merge small clusters (< 2 memories) into a "misc" cluster per category
    const small = localClusters.filter((c) => c.size < 2)
    const large = localClusters.filter((c) => c.size >= 2)
    if (small.length > 0) {
      const mergedMemories = small.flatMap((c) => c.memories)
      const clusterKey = `${category}_misc`
      large.push({
        id: hashId('hk_cluster', `${businessId}|${clusterKey}`),
        businessId,
        clusterKey,
        category,
        memoryIds: mergedMemories.map((m) => m.id),
        memories: mergedMemories,
        clusterTheme: `Miscellaneous ${category} observations`,
        coherenceScore: computeClusterCoherence(mergedMemories),
        size: mergedMemories.length,
        createdAt: nowIso(),
      })
    }
    clusters.push(...large)
  }

  const stage: KnowledgeFormationStage = {
    stage: 'memory_clustering',
    timestamp: nowIso(),
    inputCount: memories.length,
    outputCount: clusters.length,
    description: `Grouped ${memories.length} memories into ${clusters.length} clusters by category and thematic similarity`,
    metadata: {
      categories: Array.from(byCategory.keys()),
      averageClusterSize: clusters.length > 0 ? clusters.reduce((s, c) => s + c.size, 0) / clusters.length : 0,
    },
  }

  return { clusters, stage }
}

function deriveClusterTheme(memories: HospitalityMemoryEntity[]): string {
  if (memories.length === 0) return 'Empty cluster'
  if (memories.length === 1) return memories[0].title
  // Use most common significant words across titles
  const words = memories.flatMap((m) => (m.title + ' ' + m.description).toLowerCase().split(/\s+/))
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'])
  const freq = new Map<string, number>()
  for (const w of words) {
    if (w.length < 4 || stopWords.has(w)) continue
    freq.set(w, (freq.get(w) || 0) + 1)
  }
  const top = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4).map((e) => e[0])
  return top.length > 0 ? top.join(' / ') : memories[0].title
}

function computeClusterCoherence(memories: HospitalityMemoryEntity[]): number {
  if (memories.length < 2) return 0.5
  let totalSim = 0
  let pairs = 0
  for (let i = 0; i < memories.length; i++) {
    for (let j = i + 1; j < memories.length; j++) {
      totalSim += textSimilarity(
        memories[i].title + ' ' + memories[i].description,
        memories[j].title + ' ' + memories[j].description
      )
      pairs++
    }
  }
  return pairs > 0 ? totalSim / pairs : 0.5
}

// ============================================================================
// Stage 3: Pattern Detection
// ============================================================================

export interface PatternDetectionResult {
  patterns: KnowledgePattern[]
  stage: KnowledgeFormationStage
}

/**
 * Stage 3: Pattern Detection
 * Extract patterns from memory clusters.
 */
export function detectPatterns(
  businessId: string,
  clusters: MemoryCluster[]
): PatternDetectionResult {
  const patterns: KnowledgePattern[] = []

  for (const cluster of clusters) {
    // Single-memory clusters can still have patterns if the memory has many observations
    const totalObservations = cluster.memories.reduce(
      (s, m) => s + m.provenance.observationRefs.length, 0
    )
    if (cluster.size < 2 && totalObservations < 3) continue

    // Pattern type 1: Frequency — something happens repeatedly
    if (cluster.size >= 3 || totalObservations >= 5) {
      patterns.push({
        id: hashId('hk_pattern', `${cluster.id}|frequency`),
        clusterId: cluster.id,
        businessId,
        patternType: 'frequency',
        description: `${cluster.clusterTheme} observed ${cluster.size} times (${totalObservations} observations), indicating a recurring pattern`,
        supportingMemoryIds: cluster.memoryIds,
        strength: Math.min(1, Math.max(cluster.size, totalObservations / 3) / 8),
        confidence: Math.min(1, Math.max(cluster.size, totalObservations / 5) / 10) * cluster.coherenceScore,
        detectedAt: nowIso(),
        metadata: { clusterSize: cluster.size, totalObservations, coherence: cluster.coherenceScore },
      })
    }

    // Pattern type 2: Temporal — pattern at specific times/days
    const temporalPattern = detectTemporalPattern(businessId, cluster)
    if (temporalPattern) patterns.push(temporalPattern)

    // Pattern type 3: Correlation — memories share context
    const correlationPattern = detectCorrelationPattern(businessId, cluster)
    if (correlationPattern) patterns.push(correlationPattern)

    // Pattern type 4: Business rule — high-confidence memories with business_rule status
    const ruleMemories = cluster.memories.filter((m) => m.status === 'business_rule')
    if (ruleMemories.length >= 1) {
      patterns.push({
        id: hashId('hk_pattern', `${cluster.id}|business_rule`),
        clusterId: cluster.id,
        businessId,
        patternType: 'business_rule',
        description: `Business rule pattern: ${ruleMemories[0].title}`,
        supportingMemoryIds: ruleMemories.map((m) => m.id),
        strength: 0.9,
        confidence: 0.85,
        detectedAt: nowIso(),
        metadata: { ruleCount: ruleMemories.length },
      })
    }

    // Pattern type 5: Trend — increasing/decreasing confidence over time
    const trendPattern = detectTrendPattern(businessId, cluster)
    if (trendPattern) patterns.push(trendPattern)

    // Pattern type 6: Threshold — memories mention specific thresholds
    const thresholdPattern = detectThresholdPattern(businessId, cluster)
    if (thresholdPattern) patterns.push(thresholdPattern)
  }

  const stage: KnowledgeFormationStage = {
    stage: 'pattern_detection',
    timestamp: nowIso(),
    inputCount: clusters.length,
    outputCount: patterns.length,
    description: `Detected ${patterns.length} patterns across ${clusters.length} clusters`,
    metadata: {
      patternTypes: uniqueStrings(patterns.map((p) => p.patternType)),
    },
  }

  return { patterns, stage }
}

function detectTemporalPattern(businessId: string, cluster: MemoryCluster): KnowledgePattern | null {
  const dayCounts = new Map<string, number>()
  const timeCounts = new Map<string, number>()

  for (const memory of cluster.memories) {
    for (const ref of memory.provenance.observationRefs) {
      const day = dayOfWeek(ref.timestamp)
      const time = timeOfDay(ref.timestamp)
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1)
      timeCounts.set(time, (timeCounts.get(time) || 0) + 1)
    }
  }

  const topDay = Array.from(dayCounts.entries()).sort((a, b) => b[1] - a[1])[0]
  const topTime = Array.from(timeCounts.entries()).sort((a, b) => b[1] - a[1])[0]

  if (!topDay || !topTime) return null
  const totalObs = cluster.memories.reduce((s, m) => s + m.provenance.observationRefs.length, 0)
  if (totalObs < 3) return null

  const dayConcentration = topDay[1] / totalObs
  const timeConcentration = topTime[1] / totalObs

  if (dayConcentration < 0.4 && timeConcentration < 0.4) return null

  return {
    id: hashId('hk_pattern', `${cluster.id}|temporal|${topDay[0]}|${topTime[0]}`),
    clusterId: cluster.id,
    businessId,
    patternType: 'temporal',
    description: `${cluster.clusterTheme} concentrates on ${topDay[0]} during ${topTime[0]} (${Math.round(dayConcentration * 100)}% day, ${Math.round(timeConcentration * 100)}% time)`,
    supportingMemoryIds: cluster.memoryIds,
    strength: Math.max(dayConcentration, timeConcentration),
    confidence: (dayConcentration + timeConcentration) / 2 * cluster.coherenceScore,
    detectedAt: nowIso(),
    metadata: { topDay: topDay[0], topTime: topTime[0], dayConcentration, timeConcentration },
  }
}

function detectCorrelationPattern(businessId: string, cluster: MemoryCluster): KnowledgePattern | null {
  // Detect shared context tags across memories
  const tagCounts = new Map<string, number>()
  for (const memory of cluster.memories) {
    for (const ref of memory.provenance.observationRefs) {
      const tags = ref.context.tags || []
      for (const tag of tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      }
    }
  }

  const shared = Array.from(tagCounts.entries()).filter(([, count]) => count >= cluster.size * 0.5)
  if (shared.length === 0) return null

  return {
    id: hashId('hk_pattern', `${cluster.id}|correlation`),
    clusterId: cluster.id,
    businessId,
    patternType: 'correlation',
    description: `${cluster.clusterTheme} correlates with contexts: ${shared.map((s) => s[0]).join(', ')}`,
    supportingMemoryIds: cluster.memoryIds,
    strength: Math.min(1, shared.length / 3),
    confidence: cluster.coherenceScore * 0.8,
    detectedAt: nowIso(),
    metadata: { sharedContexts: shared.map((s) => s[0]) },
  }
}

function detectTrendPattern(businessId: string, cluster: MemoryCluster): KnowledgePattern | null {
  if (cluster.size < 3) return null
  // Sort memories by firstObserved
  const sorted = [...cluster.memories].sort((a, b) => a.firstObserved.localeCompare(b.firstObserved))
  const confidences = sorted.map((m) => m.confidenceScore)
  // Simple trend: compare first half vs second half average
  const mid = Math.floor(confidences.length / 2)
  const firstAvg = confidences.slice(0, mid).reduce((s, v) => s + v, 0) / Math.max(1, mid)
  const secondAvg = confidences.slice(mid).reduce((s, v) => s + v, 0) / Math.max(1, confidences.length - mid)
  const delta = secondAvg - firstAvg

  if (Math.abs(delta) < 0.1) return null

  return {
    id: hashId('hk_pattern', `${cluster.id}|trend`),
    clusterId: cluster.id,
    businessId,
    patternType: 'trend',
    description: `${cluster.clusterTheme} shows ${delta > 0 ? 'increasing' : 'decreasing'} confidence trend (Δ=${delta.toFixed(2)})`,
    supportingMemoryIds: cluster.memoryIds,
    strength: Math.min(1, Math.abs(delta) * 2),
    confidence: 0.7,
    detectedAt: nowIso(),
    metadata: { trendDirection: delta > 0 ? 'increasing' : 'decreasing', delta },
  }
}

function detectThresholdPattern(businessId: string, cluster: MemoryCluster): KnowledgePattern | null {
  // Look for numeric thresholds in memory titles/summaries
  const thresholdRegex = /(\d+(?:\.\d+)?)\s*(min|minutes|max|percent|%|x|times|staff|guests|orders)/i
  const thresholds: Array<{ value: number; unit: string; memoryId: string }> = []

  for (const memory of cluster.memories) {
    const text = `${memory.title} ${memory.description}`
    const match = text.match(thresholdRegex)
    if (match) {
      thresholds.push({ value: parseFloat(match[1]), unit: match[2].toLowerCase(), memoryId: memory.id })
    }
  }

  if (thresholds.length < 2) return null

  // Group by unit
  const byUnit = new Map<string, number[]>()
  for (const t of thresholds) {
    if (!byUnit.has(t.unit)) byUnit.set(t.unit, [])
    byUnit.get(t.unit)!.push(t.value)
  }

  for (const [unit, values] of byUnit.entries()) {
    if (values.length < 2) continue
    const avg = values.reduce((s, v) => s + v, 0) / values.length
    const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length
    const stdDev = Math.sqrt(variance)
    if (stdDev / avg < 0.2) {
      // Tight threshold — this is a pattern
      return {
        id: hashId('hk_pattern', `${cluster.id}|threshold|${unit}`),
        clusterId: cluster.id,
        businessId,
        patternType: 'threshold',
        description: `${cluster.clusterTheme} exhibits threshold around ${avg.toFixed(1)} ${unit} (σ=${stdDev.toFixed(2)})`,
        supportingMemoryIds: thresholds.filter((t) => t.unit === unit).map((t) => t.memoryId),
        strength: Math.min(1, 1 - stdDev / avg),
        confidence: 0.8,
        detectedAt: nowIso(),
        metadata: { threshold: avg, unit, stdDev },
      }
    }
  }

  return null
}

// ============================================================================
// Stage 4: Evidence Evaluation
// ============================================================================

export interface EvidenceEvaluationResult {
  evaluations: Array<{
    pattern: KnowledgePattern
    evidenceDiversity: number
    evidenceConsistency: number
    evidenceVolume: number
    memoryConfidence: number
    crossValidation: number
    supportingMemoryIds: string[]
    contradictingMemoryIds: string[]
    distinctTimeWindows: number
    distinctContexts: number
  }>
  stage: KnowledgeFormationStage
}

/**
 * Stage 4: Evidence Evaluation
 * Assess the quality and diversity of evidence behind each pattern.
 */
export function evaluateEvidence(
  businessId: string,
  patterns: KnowledgePattern[],
  memories: HospitalityMemoryEntity[]
): EvidenceEvaluationResult {
  const memoryMap = new Map<string, HospitalityMemoryEntity>()
  for (const m of memories) memoryMap.set(m.id, m)

  const evaluations = patterns.map((pattern) => {
    const supportingMemories = pattern.supportingMemoryIds
      .map((id) => memoryMap.get(id))
      .filter((m): m is HospitalityMemoryEntity => m !== undefined)

    // Find contradicting memories (same category, opposite polarity or conflict_review status)
    const contradictingMemories = memories.filter(
      (m) =>
        m.category === pattern.supportingMemoryIds
          .map((id) => memoryMap.get(id)?.category)
          .find(Boolean) &&
        !pattern.supportingMemoryIds.includes(m.id) &&
        (m.status === 'conflict_review' || m.contradictionCount > 0)
    )

    // Compute distinct time windows (by week)
    const timeWindows = new Set<string>()
    const contexts = new Set<string>()
    for (const memory of supportingMemories) {
      for (const ref of memory.provenance.observationRefs) {
        const date = new Date(ref.timestamp)
        const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`
        timeWindows.add(weekKey)
        contexts.add(`${dayOfWeek(ref.timestamp)}|${timeOfDay(ref.timestamp)}`)
        if (ref.context.outletId) {
          for (const outlet of ref.context.outletId) contexts.add(`outlet:${outlet}`)
        }
      }
    }

    const totalObs = supportingMemories.reduce(
      (s, m) => s + m.provenance.observationRefs.length,
      0
    )

    const avgMemoryConfidence =
      supportingMemories.length > 0
        ? supportingMemories.reduce((s, m) => s + m.confidenceScore, 0) / supportingMemories.length
        : 0

    return {
      pattern,
      evidenceDiversity: Math.min(1, supportingMemories.length / 5),
      evidenceConsistency: contradictingMemories.length === 0
        ? 1
        : supportingMemories.length / (supportingMemories.length + contradictingMemories.length),
      evidenceVolume: Math.min(1, totalObs / 20),
      memoryConfidence: avgMemoryConfidence,
      crossValidation: Math.min(1, (timeWindows.size / 4 + contexts.size / 3) / 2),
      supportingMemoryIds: supportingMemories.map((m) => m.id),
      contradictingMemoryIds: contradictingMemories.map((m) => m.id),
      distinctTimeWindows: timeWindows.size,
      distinctContexts: contexts.size,
    }
  })

  const stage: KnowledgeFormationStage = {
    stage: 'evidence_evaluation',
    timestamp: nowIso(),
    inputCount: patterns.length,
    outputCount: evaluations.length,
    description: `Evaluated evidence for ${patterns.length} patterns`,
    metadata: {
      averageDiversity: evaluations.reduce((s, e) => s + e.evidenceDiversity, 0) / Math.max(1, evaluations.length),
      averageConsistency: evaluations.reduce((s, e) => s + e.evidenceConsistency, 0) / Math.max(1, evaluations.length),
    },
  }

  return { evaluations, stage }
}

// ============================================================================
// Stage 5: Candidate Formation
// ============================================================================

export interface CandidateFormationResult {
  candidates: KnowledgeCandidate[]
  stage: KnowledgeFormationStage
}

/**
 * Stage 5: Candidate Formation
 * Transform evaluated patterns into knowledge candidates.
 */
export function formCandidates(
  businessId: string,
  evaluations: EvidenceEvaluationResult['evaluations'],
  clusters: MemoryCluster[] = []
): CandidateFormationResult {
  const clusterMap = new Map<string, MemoryCluster>()
  for (const c of clusters) clusterMap.set(c.id, c)
  const candidates: KnowledgeCandidate[] = []

  for (const evaluation of evaluations) {
    const pattern = evaluation.pattern
    // Only form candidates from patterns with sufficient evidence
    if (evaluation.evidenceDiversity < 0.1 && pattern.patternType !== 'business_rule') continue

    const title = deriveCandidateTitle(pattern)
    const statement = deriveCandidateStatement(pattern, evaluation)
    const summary = pattern.description
    const description = buildCandidateDescription(pattern, evaluation)

    const preliminaryConfidence =
      (evaluation.evidenceDiversity * 0.25 +
        evaluation.evidenceConsistency * 0.3 +
        evaluation.evidenceVolume * 0.15 +
        evaluation.memoryConfidence * 0.15 +
        evaluation.crossValidation * 0.15) *
      pattern.confidence

    const fingerprint = hashId('hk_fp', `${businessId}|${pattern.patternType}|${statement}`)

    candidates.push({
      id: hashId('hk_candidate', fingerprint),
      businessId,
      fingerprint,
      title,
      statement,
      summary,
      description,
      category: inferCategoryFromPattern(pattern, clusterMap.get(pattern.clusterId)?.category),
      patternIds: [pattern.id],
      supportingMemoryIds: evaluation.supportingMemoryIds,
      contradictingMemoryIds: evaluation.contradictingMemoryIds,
      evidenceDiversity: evaluation.evidenceDiversity,
      evidenceConsistency: evaluation.evidenceConsistency,
      evidenceVolume: evaluation.evidenceVolume,
      preliminaryConfidence,
      businessImpact: inferBusinessImpact(pattern, evaluation),
      impactLevel: inferImpactLevel(pattern, evaluation),
      tags: extractTags(pattern, evaluation),
      createdAt: nowIso(),
    })
  }

  const stage: KnowledgeFormationStage = {
    stage: 'candidate_formation',
    timestamp: nowIso(),
    inputCount: evaluations.length,
    outputCount: candidates.length,
    description: `Formed ${candidates.length} knowledge candidates from ${evaluations.length} evaluated patterns`,
    metadata: {
      categories: uniqueStrings(candidates.map((c) => c.category)),
    },
  }

  return { candidates, stage }
}

function deriveCandidateTitle(pattern: KnowledgePattern): string {
  const theme = pattern.description.split(',')[0]
  return theme.charAt(0).toUpperCase() + theme.slice(1)
}

function deriveCandidateStatement(
  pattern: KnowledgePattern,
  evaluation: EvidenceEvaluationResult['evaluations'][0]
): string {
  const supportCount = evaluation.supportingMemoryIds.length
  switch (pattern.patternType) {
    case 'frequency':
      return `Recurring pattern: ${pattern.description} (supported by ${supportCount} memories)`
    case 'temporal':
      return `Temporal pattern: ${pattern.description}`
    case 'correlation':
      return `Correlated factors: ${pattern.description}`
    case 'business_rule':
      return `Business rule: ${pattern.description}`
    case 'trend':
      return `Trend identified: ${pattern.description}`
    case 'threshold':
      return `Operational threshold: ${pattern.description}`
    default:
      return pattern.description
  }
}

function buildCandidateDescription(
  pattern: KnowledgePattern,
  evaluation: EvidenceEvaluationResult['evaluations'][0]
): string {
  return [
    `Pattern Type: ${pattern.patternType}`,
    `Description: ${pattern.description}`,
    `Evidence Diversity: ${(evaluation.evidenceDiversity * 100).toFixed(0)}% (${evaluation.supportingMemoryIds.length} memories)`,
    `Evidence Consistency: ${(evaluation.evidenceConsistency * 100).toFixed(0)}%`,
    `Evidence Volume: ${(evaluation.evidenceVolume * 100).toFixed(0)}% (${evaluation.distinctTimeWindows} time windows, ${evaluation.distinctContexts} contexts)`,
    `Cross-Validation: ${(evaluation.crossValidation * 100).toFixed(0)}%`,
    `Contradicting Evidence: ${evaluation.contradictingMemoryIds.length} memories`,
  ].join('\n')
}

function inferCategoryFromPattern(pattern: KnowledgePattern, clusterCategory?: KnowledgeCategory): KnowledgeCategory {
  // Category is inherited from the cluster, which inherits from memories
  return clusterCategory || 'operational'
}

function inferBusinessImpact(
  pattern: KnowledgePattern,
  evaluation: EvidenceEvaluationResult['evaluations'][0]
): string {
  if (pattern.patternType === 'business_rule') return 'Direct operational governance'
  if (pattern.patternType === 'threshold') return 'Operational efficiency threshold'
  if (pattern.patternType === 'temporal') return 'Staffing and resource planning'
  if (pattern.patternType === 'trend') return 'Strategic planning indicator'
  if (pattern.patternType === 'correlation') return 'Cross-functional insight'
  return 'Operational understanding'
}

function inferImpactLevel(
  pattern: KnowledgePattern,
  evaluation: EvidenceEvaluationResult['evaluations'][0]
): 'low' | 'medium' | 'high' | 'critical' {
  if (pattern.patternType === 'business_rule') return 'high'
  if (pattern.patternType === 'threshold') return 'high'
  if (evaluation.evidenceDiversity > 0.7 && evaluation.evidenceConsistency > 0.8) return 'high'
  if (evaluation.evidenceDiversity > 0.4) return 'medium'
  return 'low'
}

function extractTags(
  pattern: KnowledgePattern,
  evaluation: EvidenceEvaluationResult['evaluations'][0]
): string[] {
  const tags: string[] = [pattern.patternType]
  if (pattern.metadata?.topDay) tags.push(`day:${pattern.metadata.topDay}`)
  if (pattern.metadata?.topTime) tags.push(`time:${pattern.metadata.topTime}`)
  if (pattern.metadata?.trendDirection) tags.push(`trend:${pattern.metadata.trendDirection}`)
  if (pattern.metadata?.threshold) tags.push(`threshold:${pattern.metadata.threshold}`)
  return tags
}

// ============================================================================
// Full Pipeline Runner
// ============================================================================

export interface DiscoveryPipelineResult {
  clusters: MemoryCluster[]
  patterns: KnowledgePattern[]
  evaluations: EvidenceEvaluationResult['evaluations']
  candidates: KnowledgeCandidate[]
  stages: KnowledgeFormationStage[]
  stats: {
    memoriesIngested: number
    clustersFormed: number
    patternsDetected: number
    candidatesFormed: number
  }
}

/**
 * Run the full discovery pipeline from memories to candidates.
 * Stages 1-5 of the formation pipeline.
 */
export function runDiscoveryPipeline(
  businessId: string,
  memories: HospitalityMemoryEntity[]
): DiscoveryPipelineResult {
  const stages: KnowledgeFormationStage[] = []

  // Stage 1: Ingestion
  const ingestion = ingestMemories(businessId, memories)
  stages.push(ingestion.stage)

  // Stage 2: Clustering
  const clustering = clusterMemories(businessId, ingestion.memories)
  stages.push(clustering.stage)

  // Stage 3: Pattern Detection
  const patternDetection = detectPatterns(businessId, clustering.clusters)
  stages.push(patternDetection.stage)

  // Stage 4: Evidence Evaluation
  const evidenceEval = evaluateEvidence(businessId, patternDetection.patterns, ingestion.memories)
  stages.push(evidenceEval.stage)

  // Stage 5: Candidate Formation
  const candidateFormation = formCandidates(businessId, evidenceEval.evaluations, clustering.clusters)
  stages.push(candidateFormation.stage)

  return {
    clusters: clustering.clusters,
    patterns: patternDetection.patterns,
    evaluations: evidenceEval.evaluations,
    candidates: candidateFormation.candidates,
    stages,
    stats: {
      memoriesIngested: ingestion.memories.length,
      clustersFormed: clustering.clusters.length,
      patternsDetected: patternDetection.patterns.length,
      candidatesFormed: candidateFormation.candidates.length,
    },
  }
}
