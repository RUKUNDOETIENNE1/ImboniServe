/**
 * Hospitality Knowledge™ persistence repository.
 *
 * Durable knowledge storage built on the canonical KnowledgeEntry model.
 * Categories:
 *   hospitality_knowledge/knowledge
 *   hospitality_knowledge/relationship
 *   hospitality_knowledge/timeline
 *   hospitality_knowledge/conflict
 */

import { prisma } from '@/lib/prisma'
import type {
  KnowledgeConflict,
  KnowledgeEntity,
  KnowledgeRelationship,
  KnowledgeTimelineEntry,
} from './types'

const CATEGORY_KNOWLEDGE = 'hospitality_knowledge/knowledge'
const CATEGORY_RELATIONSHIP = 'hospitality_knowledge/relationship'
const CATEGORY_TIMELINE = 'hospitality_knowledge/timeline'
const CATEGORY_CONFLICT = 'hospitality_knowledge/conflict'

export interface KnowledgeState {
  knowledge: KnowledgeEntity[]
  relationships: KnowledgeRelationship[]
  timeline: KnowledgeTimelineEntry[]
  conflicts: KnowledgeConflict[]
}

export class HospitalityKnowledgeRepository {
  async loadState(businessId: string): Promise<KnowledgeState> {
    const rows = await prisma.knowledgeEntry.findMany({
      where: {
        businessId,
        category: {
          startsWith: 'hospitality_knowledge/',
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    const knowledge: KnowledgeEntity[] = []
    const relationships: KnowledgeRelationship[] = []
    const timeline: KnowledgeTimelineEntry[] = []
    const conflicts: KnowledgeConflict[] = []

    for (const row of rows) {
      const content = row.content as any
      if (row.category === CATEGORY_KNOWLEDGE) {
        knowledge.push(content as KnowledgeEntity)
      } else if (row.category === CATEGORY_RELATIONSHIP) {
        relationships.push(content as KnowledgeRelationship)
      } else if (row.category === CATEGORY_TIMELINE) {
        timeline.push(content as KnowledgeTimelineEntry)
      } else if (row.category === CATEGORY_CONFLICT) {
        conflicts.push(content as KnowledgeConflict)
      }
    }

    return {
      knowledge: knowledge.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      relationships: relationships.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      timeline: timeline.sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
      conflicts: conflicts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    }
  }

  async saveState(
    businessId: string,
    updates: {
      knowledge?: KnowledgeEntity[]
      relationships?: KnowledgeRelationship[]
      timeline?: KnowledgeTimelineEntry[]
      conflicts?: KnowledgeConflict[]
    }
  ): Promise<void> {
    const operations: Array<ReturnType<typeof prisma.knowledgeEntry.upsert>> = []

    if (updates.knowledge && updates.knowledge.length > 0) {
      for (const k of updates.knowledge) {
        operations.push(
          prisma.knowledgeEntry.upsert({
            where: { id: k.id },
            update: {
              confidence: k.confidenceScore,
              content: k as any,
              sources: {
                originModules: k.provenance.originModules,
                originEventIds: k.provenance.originEventIds,
              } as any,
              metadata: {
                status: k.status,
                category: k.category,
                version: k.version,
                fingerprint: k.fingerprint,
                firstObserved: k.firstObserved,
                lastValidated: k.lastValidated,
                updatedAt: k.updatedAt,
              } as any,
            },
            create: {
              id: k.id,
              businessId,
              category: CATEGORY_KNOWLEDGE,
              confidence: k.confidenceScore,
              content: k as any,
              sources: {
                originModules: k.provenance.originModules,
                originEventIds: k.provenance.originEventIds,
              } as any,
              metadata: {
                status: k.status,
                category: k.category,
                version: k.version,
                fingerprint: k.fingerprint,
                firstObserved: k.firstObserved,
                lastValidated: k.lastValidated,
                updatedAt: k.updatedAt,
              } as any,
            },
          })
        )
      }
    }

    if (updates.relationships && updates.relationships.length > 0) {
      for (const rel of updates.relationships) {
        operations.push(
          prisma.knowledgeEntry.upsert({
            where: { id: rel.id },
            update: {
              confidence: rel.confidence,
              content: rel as any,
              sources: {
                fromKnowledgeId: rel.fromKnowledgeId,
                toKnowledgeId: rel.toKnowledgeId,
              } as any,
              metadata: {
                relationshipType: rel.type,
                strength: rel.strength,
              } as any,
            },
            create: {
              id: rel.id,
              businessId,
              category: CATEGORY_RELATIONSHIP,
              confidence: rel.confidence,
              content: rel as any,
              sources: {
                fromKnowledgeId: rel.fromKnowledgeId,
                toKnowledgeId: rel.toKnowledgeId,
              } as any,
              metadata: {
                relationshipType: rel.type,
                strength: rel.strength,
              } as any,
            },
          })
        )
      }
    }

    if (updates.timeline && updates.timeline.length > 0) {
      for (const entry of updates.timeline) {
        operations.push(
          prisma.knowledgeEntry.upsert({
            where: { id: entry.id },
            update: {
              confidence: 1,
              content: entry as any,
              sources: {
                knowledgeId: entry.knowledgeId,
              } as any,
              metadata: {
                event: entry.event,
                timestamp: entry.timestamp,
              } as any,
            },
            create: {
              id: entry.id,
              businessId,
              category: CATEGORY_TIMELINE,
              confidence: 1,
              content: entry as any,
              sources: {
                knowledgeId: entry.knowledgeId,
              } as any,
              metadata: {
                event: entry.event,
                timestamp: entry.timestamp,
              } as any,
            },
          })
        )
      }
    }

    if (updates.conflicts && updates.conflicts.length > 0) {
      for (const conflict of updates.conflicts) {
        operations.push(
          prisma.knowledgeEntry.upsert({
            where: { id: conflict.id },
            update: {
              confidence: conflict.status === 'open' ? 0.3 : 0.7,
              content: conflict as any,
              sources: {
                knowledgeAId: conflict.knowledgeAId,
                knowledgeBId: conflict.knowledgeBId,
              } as any,
              metadata: {
                status: conflict.status,
                conflictType: conflict.conflictType,
              } as any,
            },
            create: {
              id: conflict.id,
              businessId,
              category: CATEGORY_CONFLICT,
              confidence: conflict.status === 'open' ? 0.3 : 0.7,
              content: conflict as any,
              sources: {
                knowledgeAId: conflict.knowledgeAId,
                knowledgeBId: conflict.knowledgeBId,
              } as any,
              metadata: {
                status: conflict.status,
                conflictType: conflict.conflictType,
              } as any,
            },
          })
        )
      }
    }

    // Batch transactional writes
    const batchSize = 25
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize)
      await prisma.$transaction(batch)
    }
  }

  async loadKnowledgeByIds(businessId: string, knowledgeIds: string[]): Promise<KnowledgeEntity[]> {
    if (knowledgeIds.length === 0) return []
    const rows = await prisma.knowledgeEntry.findMany({
      where: {
        businessId,
        category: CATEGORY_KNOWLEDGE,
        id: { in: knowledgeIds },
      },
    })
    return rows.map((row) => row.content as unknown as KnowledgeEntity)
  }

  async clearBusinessKnowledgeState(businessId: string): Promise<void> {
    await prisma.knowledgeEntry.deleteMany({
      where: {
        businessId,
        category: {
          startsWith: 'hospitality_knowledge/',
        },
      },
    })
  }
}
