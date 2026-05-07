// Quick test to verify migration
const { PrismaClient } = require('@prisma/client')

async function testMigration() {
  const prisma = new PrismaClient()
  
  console.log('========================================')
  console.log('Testing Migration Status')
  console.log('========================================\n')
  
  try {
    // Test 1: Check if SupplierRecommendationLog table exists
    console.log('Test 1: Checking SupplierRecommendationLog table...')
    try {
      await prisma.supplierRecommendationLog.findMany({ take: 1 })
      console.log('✓ SupplierRecommendationLog table EXISTS\n')
    } catch (error) {
      console.log('✗ SupplierRecommendationLog table MISSING')
      console.log('Error:', error.message, '\n')
    }
    
    // Test 2: Check if SupplierPerformanceCache table exists
    console.log('Test 2: Checking SupplierPerformanceCache table...')
    try {
      await prisma.supplierPerformanceCache.findMany({ take: 1 })
      console.log('✓ SupplierPerformanceCache table EXISTS\n')
    } catch (error) {
      console.log('✗ SupplierPerformanceCache table MISSING')
      console.log('Error:', error.message, '\n')
    }
    
    console.log('========================================')
    console.log('Migration Status Summary')
    console.log('========================================\n')
    
    console.log('If both tables exist: ✓ Migration SUCCESSFUL')
    console.log('If tables missing: Run "npx prisma db push --accept-data-loss" again\n')
    
  } catch (error) {
    console.error('Database connection error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testMigration()
