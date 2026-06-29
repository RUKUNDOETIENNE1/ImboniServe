export const DIE_PLUGIN_EVENTS = {
  DOCUMENT_UPLOADED: 'document.uploaded',
  OCR_COMPLETED: 'ocr.completed',
  EXTRACTION_COMPLETED: 'extraction.completed',
  RECONCILIATION_COMPLETED: 'reconciliation.completed',
  ANOMALY_DETECTED: 'anomaly.detected',
  REVIEW_APPROVED: 'review.approved',
  MENU_UPLOADED: 'menu.uploaded',
  IMAGE_DETECTED: 'image.detected',
} as const

export type DIEPluginEventType = typeof DIE_PLUGIN_EVENTS[keyof typeof DIE_PLUGIN_EVENTS]

export interface DIEPluginEventPayload {
  [DIE_PLUGIN_EVENTS.DOCUMENT_UPLOADED]: {
    businessId: string
    scanJobId: string
    documentId: string
    documentType: string
    mimeType?: string
    userId?: string | null
  }
  [DIE_PLUGIN_EVENTS.OCR_COMPLETED]: {
    businessId: string
    scanJobId: string
    documentId: string
    durationMs: number
    userId?: string | null
  }
  [DIE_PLUGIN_EVENTS.EXTRACTION_COMPLETED]: {
    businessId: string
    scanJobId: string
    documentId: string
    provider: string
    fieldsExtracted: number
    linesExtracted: number
    userId?: string | null
  }
  [DIE_PLUGIN_EVENTS.RECONCILIATION_COMPLETED]: {
    businessId: string
    documentId: string
    matchType: string
    success: boolean
    confidence: number
    scanJobId?: string
  }
  [DIE_PLUGIN_EVENTS.ANOMALY_DETECTED]: {
    businessId: string
    documentId: string
    alertTypes: string[]
    alertsCreated: number
  }
  [DIE_PLUGIN_EVENTS.REVIEW_APPROVED]: {
    businessId: string
    documentId: string
    approvedByUserId: string
    approvedAt: string
  }
  [DIE_PLUGIN_EVENTS.MENU_UPLOADED]: {
    documentId?: string
    businessId: string
    fileKey: string
    mimeType: string
    uploadedBy?: string
  }
  [DIE_PLUGIN_EVENTS.IMAGE_DETECTED]: {
    documentId?: string
    businessId: string
    fileKey: string
    mimeType: string
  }
}
