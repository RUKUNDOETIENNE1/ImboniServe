import { z } from 'zod'

export const createSaleSchema = z.object({
  businessId: z.string().cuid(),
  items: z.array(z.object({
    menuItemId: z.string().cuid(),
    quantity: z.number().int().positive(),
    unitPriceCents: z.number().int().positive(),
  })).min(1),
  paymentMethod: z.enum(['CASH', 'MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'WEB', 'BANK_TRANSFER', 'OTHER']),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
  // Optional client contact & consent for Smart Dining Slip™
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional(),
  clientConsentedWhatsApp: z.boolean().optional(),
  consentCollectedBy: z.string().optional(),
})

export const updateSaleSchema = z.object({
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
  isPaid: z.boolean().optional(),
})

export const cancelSaleSchema = z.object({
  reason: z.string().min(3).max(500),
  cancelledBy: z.string().optional(),
})

export const salesQuerySchema = z.object({
  businessId: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  paymentMethod: z.enum(['CASH', 'MTN_MOBILE_MONEY', 'AIRTEL_MONEY', 'WEB', 'BANK_TRANSFER', 'OTHER']).optional(),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']).optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
})

export type CreateSaleInput = z.infer<typeof createSaleSchema>
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>
export type SalesQueryInput = z.infer<typeof salesQuerySchema>
export type CancelSaleInput = z.infer<typeof cancelSaleSchema>
