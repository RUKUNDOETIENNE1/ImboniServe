import { PrismaClient } from '@prisma/client'

/**
 * BigInt JSON serialization patch
 *
 * Prisma returns BigInt for BigInt columns (e.g., Business.storageUsedBytes).
 * JSON.stringify() cannot serialize BigInt by default, causing 500 errors on
 * any API endpoint that includes a BigInt-bearing relation in its response.
 *
 * This patch at the Prisma import boundary (loaded by every API route that
 * uses the database) converts BigInt to its string representation for JSON
 * serialization. This is the correct JSON representation since JSON has no
 * BigInt type, and is the standard Prisma community solution.
 *
 * Affected fields: Business.storageUsedBytes, PaymentTransaction.webhookTimestamp,
 * DailyMetrics.totalRevenueCents.
 */
;(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

declare global {
  var prisma: PrismaClient | undefined
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
