/**
 * Hospitality Memory™ persistence repository.
 *
 * Durable organizational memory built on top of canonical platform storage.
 */

import { prisma } from '@/lib/prisma'
import type {
  HospitalityMemoryConflict,
  HospitalityMemoryEntity,
  HospitalityMemoryRelationship,
  HospitalityMemoryTimelineEntry,
} from './types'

const CATEGORY_MEMORY = 'hospitality_memory/memory'
const CATEGORY_RELATIONSHIP = 'hospitality_memory/relationship'
const CATEGORY_TIMELINE = 'hospitality_memory/timeline'
const CATEGORY_CONFLICT = 'hospitality_memory/conflict'

export interface HospitalityMemoryState {
  memories: HospitalityMemoryEntity[]
  relationships: HospitalityMemoryRelationship[]
  timeline: HospitalityMemoryTimelineEntry[]
  conflicts: HospitalityMemoryConflict[]
}

function asIso(value: unknown): string {
  if (typeof value === 'string') return value
  return new Date(value as any).toISOString()
}

export class HospitalityMemoryRepository {
  async loadState(businessId: string): Promise<HospitalityMemoryState> {
    const rows = await prisma.knowledgeEntry.findMany({
      where: {
        businessId,
        category: {
          startsWith: 'hospitality_memory/',
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    const memories: HospitalityMemoryEntity[] = []
    const relationships: HospitalityMemoryRelationship[] = []
    const timeline: HospitalityMemoryTimelineEntry[] = []
    const conflicts: HospitalityMemoryConflict[] = []

    for (const row of rows) {
      const content = row.content as any
      if (row.category === CATEGORY_MEMORY) {
        memories.push(content as HospitalityMemoryEntity)
      } else if (row.category === CATEGORY_RELATIONSHIP) {
        relationships.push(content as HospitalityMemoryRelationship)
      } else if (row.category === CATEGORY_TIMELINE) {
        timeline.push(content as HospitalityMemoryTimelineEntry)
      } else if (row.category === CATEGORY_CONFLICT) {
        conflicts.push(content as HospitalityMemoryConflict)
      }
    }

    return {
      memories: memories.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)).reverse(),
      relationships: relationships.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)).reverse(),
      timeline: timeline.sort((a, b) => a.timestamp.localeCompare(b.timestamp)).reverse(),
      conflicts: conflicts.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt)).reverse(),
    }
  }

  async saveState(
    businessId: string,
    updates: {
      memories?: HospitalityMemoryEntity[]
      relationships?: HospitalityMemoryRelationship[]
      timeline?: HospitalityMemoryTimelineEntry[]
      conflicts?: HospitalityMemoryConflict[]
    }
  ): Promise<void> {
    const operations: Array<ReturnType<typeof prisma.knowledgeEntry.upsert>> = []

    if (updates.memories && updates.memories.length > 0) {
      for (const memory of updates.memories) {
        operations.push(
          prisma.knowledgeEntry.upsert({
            where: { id: memory.id },
            update: {
              confidence: memory.confidenceScore,
              content: memory as any,
              sources: {
                originModules: memory.provenance.originModules,
                originEventIds: memory.provenance.originEventIds,
              } as any,
              metadata: {
                status: memory.status,
                category: memory.category,
                version: memory.version,
                fingerprint: memory.fingerprint,
                firstObserved: memory.firstObserved,
                lastObserved: memory.lastObserved,
                updatedAt: memory.updatedAt,
              } as any,
            },
            create: {
              id: memory.id,
              businessId,
              category: CATEGORY_MEMORY,
              confidence: memory.confidenceScore,
              content: memory as any,
              sources: {
                originModules: memory.provenance.originModules,
                originEventIds: memory.provenance.originEventIds,
              } as any,
              metadata: {
                status: memory.status,
                category: memory.category,
                version: memory.version,
                fingerprint: memory.fingerprint,
                firstObserved: memory.firstObserved,
                lastObserved: memory.lastObserved,
                updatedAt: memory.updatedAt,
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
              confidence: rel.strength,
              content: rel as any,
              sources: {
                fromMemoryId: rel.fromMemoryId,
                toMemoryId: rel.toMemoryId,
              } as any,
              metadata: {
                relationshipType: rel.type,
                firstObserved: rel.firstObserved,
                lastObserved: rel.lastObserved,
              } as any,
            },
            create: {
              id: rel.id,
              businessId,
              category: CATEGORY_RELATIONSHIP,
              confidence: rel.strength,
              content: rel as any,
              sources: {
                fromMemoryId: rel.fromMemoryId,
                toMemoryId: rel.toMemoryId,
              } as any,
              metadata: {
                relationshipType: rel.type,
                firstObserved: rel.firstObserved,
                lastObserved: rel.lastObserved,
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
                memoryId: entry.memoryId,
                event: entry.event,
              } as any,
              metadata: {
                timestamp: asIso(entry.timestamp),
              } as any,
            },
            create: {
              id: entry.id,
              businessId,
              category: CATEGORY_TIMELINE,
              confidence: 1,
              content: entry as any,
              sources: {
                memoryId: entry.memoryId,
                event: entry.event,
              } as any,
              metadata: {
                timestamp: asIso(entry.timestamp),
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
              confidence: conflict.status === 'open' ? 0.4 : 0.8,
              content: conflict as any,
              sources: {
                memoryAId: conflict.memoryAId,
                memoryBId: conflict.memoryBId,
              } as any,
              metadata: {
                status: conflict.status,
              } as any,
            },
            create: {
              id: conflict.id,
              businessId,
              category: CATEGORY_CONFLICT,
              confidence: conflict.status === 'open' ? 0.4 : 0.8,
              content: conflict as any,
              sources: {
                memoryAId: conflict.memoryAId,
                memoryBId: conflict.memoryBId,
              } as any,
              metadata: {
                status: conflict.status,
              } as any,
            },
          })
        )
      }
    }

    // Execute in bounded transactional batches to avoid long interactive transactions.
    const batchSize = 25
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize)
      await prisma.$transaction(batch)
    }
  }

  async loadMemoriesByIds(businessId: string, memoryIds: string[]): Promise<HospitalityMemoryEntity[]> {
    if (memoryIds.length === 0) return []
    const rows = await prisma.knowledgeEntry.findMany({
      where: {
        businessId,
        category: CATEGORY_MEMORY,
        id: { in: memoryIds },
      },
    })
    return rows.map((row) => row.content as HospitalityMemoryEntity)
  }

  async clearBusinessMemoryState(businessId: string): Promise<void> {
    await prisma.knowledgeEntry.deleteMany({
      where: {
        businessId,
        category: {
          startsWith: 'hospitality_memory/',
        },
      },
    })
  }
}
