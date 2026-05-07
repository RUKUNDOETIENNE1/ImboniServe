/**
 * Validation schemas for public API endpoints
 * Uses Zod for runtime type validation and security
 */

import { z } from 'zod'

// Common validators
export const cuidSchema = z.string().cuid()
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
export const emailSchema = z.string().email('Invalid email format')

/**
 * Public Menu Validation
 */
export const getMenuSchema = z.object({
  businessId: cuidSchema,
})

/**
 * OTP Request Validation
 */
export const otpRequestSchema = z.object({
  phone: phoneSchema,
  businessId: cuidSchema,
})

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6, 'OTP code must be 6 digits').regex(/^\d{6}$/, 'OTP must be numeric'),
  businessId: cuidSchema,
})

/**
 * Order Token Validation
 */
export const orderTokenSchema = z.object({
  businessId: cuidSchema,
  tableId: cuidSchema.optional(),
  source: z.enum(['QR_IN_VENUE', 'QR_REMOTE', 'WAITER_POS', 'PHONE']),
})

/**
 * Draft Order Validation
 */
export const draftOrderItemSchema = z.object({
  menuItemId: cuidSchema,
  quantity: z.number().int().positive().max(100, 'Quantity cannot exceed 100'),
  instructions: z.string().max(500, 'Instructions too long').optional(),
  instructionTags: z.array(z.string()).max(10).optional(),
})

export const draftOrderSchema = z.object({
  businessId: cuidSchema,
  tableId: cuidSchema.optional(),
  items: z.array(draftOrderItemSchema).min(1, 'Order must have at least one item').max(50, 'Too many items'),
  customerName: z.string().min(1).max(100).optional(),
  customerPhone: phoneSchema.optional(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
})

/**
 * Confirm Order Validation
 */
export const confirmOrderSchema = z.object({
  orderId: cuidSchema,
  paymentMethod: z.enum(['CASH', 'MOBILE_MONEY', 'CARD', 'BANK_TRANSFER']),
  customerPhone: phoneSchema.optional(),
  customerEmail: emailSchema.optional(),
})

/**
 * Order Status Validation
 */
export const orderStatusSchema = z.object({
  orderId: cuidSchema,
})

/**
 * QR Code Validation
 */
export const qrValidationSchema = z.object({
  token: z.string().min(10).max(500),
  businessId: cuidSchema.optional(),
  tableId: cuidSchema.optional(),
})

/**
 * Reservation Validation (if applicable)
 */
export const reservationSchema = z.object({
  businessId: cuidSchema,
  customerName: z.string().min(2).max(100),
  customerPhone: phoneSchema,
  customerEmail: emailSchema.optional(),
  partySize: z.number().int().positive().max(50),
  reservationDate: z.string().datetime(),
  notes: z.string().max(500).optional(),
})

/**
 * Feedback/Review Validation
 */
export const feedbackSchema = z.object({
  businessId: cuidSchema,
  orderId: cuidSchema.optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  customerName: z.string().max(100).optional(),
})

/**
 * Helper function to validate request body
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  return schema.parse(body)
}

/**
 * Helper function to validate query parameters
 */
export function validateQuery<T>(schema: z.ZodSchema<T>, query: unknown): T {
  return schema.parse(query)
}
