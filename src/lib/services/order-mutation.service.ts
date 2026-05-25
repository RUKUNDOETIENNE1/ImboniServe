/**
 * Order Mutation Service
 * Handles real-world order changes without data loss
 * Reality Gap Fix: Priority 1
 * 
 * RULES:
 * - NEVER delete items
 * - NEVER overwrite silently
 * - ALWAYS append new versions
 * - Stations see "what changed, not just current state"
 */

import { prisma } from '@/lib/prisma'
import type { MutationType } from '@prisma/client'

export interface MutationInput {
  saleId: string
  originalItemId?: string // If modifying existing item
  menuItemId: string
  quantity: number
  unitPriceCents: number
  instructions?: any
  mutationType: MutationType
  actorId?: string
}

export interface MutationResult {
  newItem: any
  replacedItem?: any
  mutationType: MutationType
  itemVersion: number
}

export class OrderMutationService {
  /**
   * Create new item (standard creation)
   */
  static async createItem(input: Omit<MutationInput, 'mutationType'>): Promise<MutationResult> {
    const newItem = await prisma.saleItem.create({
      data: {
        saleId: input.saleId,
        menuItemId: input.menuItemId,
        quantity: input.quantity,
        unitPriceCents: input.unitPriceCents,
        totalPriceCents: input.unitPriceCents * input.quantity,
        instructions: input.instructions,
        itemVersion: 1,
        mutationType: 'CREATED',
      },
      include: {
        menuItem: true,
      },
    })

    return {
      newItem,
      mutationType: 'CREATED',
      itemVersion: 1,
    }
  }

  /**
   * Modify existing item (creates new version, marks old as replaced)
   */
  static async modifyItem(input: MutationInput): Promise<MutationResult> {
    if (!input.originalItemId) {
      throw new Error('originalItemId required for modification')
    }

    // Get original item
    const originalItem = await prisma.saleItem.findUnique({
      where: { id: input.originalItemId },
      include: { menuItem: true },
    })

    if (!originalItem) {
      throw new Error('Original item not found')
    }

    // Create new version
    const newVersion = originalItem.itemVersion + 1

    const newItem = await prisma.saleItem.create({
      data: {
        saleId: input.saleId,
        menuItemId: input.menuItemId,
        quantity: input.quantity,
        unitPriceCents: input.unitPriceCents,
        totalPriceCents: input.unitPriceCents * input.quantity,
        instructions: input.instructions,
        parentItemId: input.originalItemId,
        itemVersion: newVersion,
        mutationType: 'MODIFIED',
        // Inherit station assignment if same item
        stationId: originalItem.menuItemId === input.menuItemId ? originalItem.stationId : null,
      },
      include: {
        menuItem: true,
      },
    })

    // Mark original as replaced
    await prisma.saleItem.update({
      where: { id: input.originalItemId },
      data: {
        replacedBy: newItem.id,
        mutationType: 'REPLACED',
      },
    })

    return {
      newItem,
      replacedItem: originalItem,
      mutationType: 'MODIFIED',
      itemVersion: newVersion,
    }
  }

  /**
   * Cancel item (marks as cancelled, never deletes)
   */
  static async cancelItem(itemId: string, actorId?: string): Promise<MutationResult> {
    const item = await prisma.saleItem.findUnique({
      where: { id: itemId },
      include: { menuItem: true },
    })

    if (!item) {
      throw new Error('Item not found')
    }

    // Update to cancelled
    const cancelledItem = await prisma.saleItem.update({
      where: { id: itemId },
      data: {
        mutationType: 'CANCELLED',
        itemStatus: 'CANCELED',
      },
      include: {
        menuItem: true,
      },
    })

    return {
      newItem: cancelledItem,
      mutationType: 'CANCELLED',
      itemVersion: item.itemVersion,
    }
  }

  /**
   * Get item history (all versions)
   */
  static async getItemHistory(itemId: string): Promise<any[]> {
    // Find root item
    const item = await prisma.saleItem.findUnique({
      where: { id: itemId },
      select: { parentItemId: true },
    })

    if (!item) return []

    const rootId = item.parentItemId || itemId

    // Get all versions
    const versions = await prisma.saleItem.findMany({
      where: {
        OR: [
          { id: rootId },
          { parentItemId: rootId },
        ],
      },
      include: {
        menuItem: true,
      },
      orderBy: {
        itemVersion: 'asc',
      },
    })

    return versions
  }

  /**
   * Get active items for sale (excludes replaced/cancelled)
   */
  static async getActiveItems(saleId: string): Promise<any[]> {
    const items = await prisma.saleItem.findMany({
      where: {
        saleId,
        mutationType: {
          notIn: ['REPLACED', 'CANCELLED'],
        },
      },
      include: {
        menuItem: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return items
  }

  /**
   * Get mutation summary for order
   */
  static async getMutationSummary(saleId: string): Promise<{
    total: number
    created: number
    modified: number
    cancelled: number
    activeCount: number
  }> {
    const allItems = await prisma.saleItem.findMany({
      where: { saleId },
      select: { mutationType: true },
    })

    const summary = {
      total: allItems.length,
      created: allItems.filter((i) => i.mutationType === 'CREATED').length,
      modified: allItems.filter((i) => i.mutationType === 'MODIFIED').length,
      cancelled: allItems.filter((i) => i.mutationType === 'CANCELLED').length,
      activeCount: allItems.filter((i) => !['REPLACED', 'CANCELLED'].includes(i.mutationType)).length,
    }

    return summary
  }

  /**
   * Detect if item was changed mid-preparation
   */
  static async detectMidFlowChange(itemId: string): Promise<{
    wasChanged: boolean
    changeType?: 'modified' | 'cancelled'
    newItemId?: string
    atStage?: string
  }> {
    const item = await prisma.saleItem.findUnique({
      where: { id: itemId },
      select: {
        mutationType: true,
        replacedBy: true,
        itemStatus: true,
      },
    })

    if (!item) {
      return { wasChanged: false }
    }

    if (item.mutationType === 'REPLACED' && item.replacedBy) {
      return {
        wasChanged: true,
        changeType: 'modified',
        newItemId: item.replacedBy,
        atStage: item.itemStatus || 'NEW',
      }
    }

    if (item.mutationType === 'CANCELLED') {
      return {
        wasChanged: true,
        changeType: 'cancelled',
        atStage: item.itemStatus || 'NEW',
      }
    }

    return { wasChanged: false }
  }
}
