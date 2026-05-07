#!/usr/bin/env node

/**
 * Apply Payment Health Indexes to Database
 * 
 * This script applies performance indexes for payment transactions
 * using the Prisma client connection.
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const indexes = [
  {
    name: 'PaymentTransaction_updatedAt_idx',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS "PaymentTransaction_updatedAt_idx" ON "PaymentTransaction"("updatedAt")',
    description: 'Index for payment sweeper/cron jobs'
  },
  {
    name: 'CheckoutEvent_paymentId_idx',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS "CheckoutEvent_paymentId_idx" ON "CheckoutEvent"("paymentId")',
    description: 'Index for admin metrics/event lookups'
  },
  {
    name: 'CheckoutEvent_eventType_createdAt_idx',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS "CheckoutEvent_eventType_createdAt_idx" ON "CheckoutEvent"("eventType", "createdAt")',
    description: 'Index for time-bounded event scans'
  }
]

async function applyIndexes() {
  console.log('🔧 Applying Payment Health Indexes...\n')

  for (const index of indexes) {
    try {
      console.log(`📊 Creating index: ${index.name}`)
      console.log(`   ${index.description}`)
      
      // Note: CONCURRENTLY cannot be used in a transaction, so we use raw query
      await prisma.$executeRawUnsafe(index.sql)
      
      console.log(`   ✅ Success!\n`)
    } catch (error) {
      // Check if index already exists
      if (error.message?.includes('already exists')) {
        console.log(`   ℹ️  Index already exists\n`)
      } else {
        console.error(`   ❌ Error: ${error.message}\n`)
        throw error
      }
    }
  }

  console.log('🔍 Verifying indexes...\n')

  const result = await prisma.$queryRaw`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename IN ('PaymentTransaction', 'CheckoutEvent')
      AND indexname IN (
        'PaymentTransaction_updatedAt_idx',
        'CheckoutEvent_paymentId_idx',
        'CheckoutEvent_eventType_createdAt_idx'
      )
    ORDER BY indexname
  `

  console.log('📋 Applied Indexes:')
  console.table(result)

  if (result.length === 3) {
    console.log('\n✅ All 3 indexes successfully applied!')
    console.log('🚀 Database is ready for production deployment.\n')
  } else {
    console.log(`\n⚠️  Warning: Expected 3 indexes, found ${result.length}`)
    console.log('   Please check the output above for errors.\n')
  }
}

async function main() {
  try {
    await applyIndexes()
  } catch (error) {
    console.error('\n❌ Failed to apply indexes:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
