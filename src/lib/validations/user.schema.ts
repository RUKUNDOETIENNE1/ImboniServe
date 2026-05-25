import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(10),
  role: z.enum(['OWNER', 'CASHIER', 'KITCHEN_MANAGER', 'ADMIN']),
  businessId: z.string().cuid().optional(),
  whatsappEnabled: z.boolean().default(false),
  whatsappNumber: z.string().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().min(10).optional(),
  role: z.enum(['OWNER', 'CASHIER', 'KITCHEN_MANAGER', 'ADMIN']).optional(),
  whatsappEnabled: z.boolean().optional(),
  whatsappNumber: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const signupSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(10),
  businessName: z.string().min(1).max(255),
  city: z.string().default('Kigali'),
  planCode: z.enum(['STARTER', 'ESSENTIALS', 'PROFESSIONAL', 'GROWTH', 'BUSINESS', 'ENTERPRISE']).default('ESSENTIALS'),
  businessType: z.enum(['RESTAURANT', 'HOTEL', 'CAFE', 'BAR', 'SUPPLIER', 'AFFILIATE']).default('RESTAURANT'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type SignupInput = z.infer<typeof signupSchema>
