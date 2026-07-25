/**
 * Menu AI Service — Backward Compatibility Delegate
 *
 * This service has been consolidated into SmartMenuBuilderService.
 * All methods now delegate to the canonical service.
 *
 * This file is preserved for backward compatibility with any code that
 * imports from menu-ai.service.ts. New code should import SmartMenuBuilderService
 * directly from smart-menu-builder.service.ts.
 *
 * @deprecated Use SmartMenuBuilderService instead.
 */

import { SmartMenuBuilderService } from './smart-menu-builder.service'

/**
 * @deprecated Use SmartMenuBuilderService instead.
 */
export class MenuAIService {
  /**
   * @deprecated Use SmartMenuBuilderService.processDocument()
   */
  static async processDocument(sourceDocumentId: string): Promise<void> {
    return SmartMenuBuilderService.processDocument(sourceDocumentId)
  }

  /**
   * @deprecated Use SmartMenuBuilderService.publishCandidate()
   */
  static async publishCandidate(candidateId: string, reviewedBy: string): Promise<void> {
    return SmartMenuBuilderService.publishCandidate(candidateId, reviewedBy)
  }

  /**
   * @deprecated Use SmartMenuBuilderService.rejectCandidate()
   */
  static async rejectCandidate(candidateId: string, reviewedBy: string): Promise<void> {
    return SmartMenuBuilderService.rejectCandidate(candidateId, reviewedBy)
  }

  /**
   * @deprecated Use SmartMenuBuilderService.getCandidates()
   */
  static async getCandidates(businessId: string, status = 'PENDING') {
    return SmartMenuBuilderService.getCandidates(businessId, status)
  }
}
