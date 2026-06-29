/**
 * DIE Block 5B Validation Script
 * Validates Intelligence & Analytics Layer
 */

import { prisma } from '@/lib/prisma'
import { SupplierIntelligenceService } from '@/lib/die/analytics/supplier-intelligence.service'
import { ProductIntelligenceService } from '@/lib/die/analytics/product-intelligence.service'
import { CostIntelligenceService } from '@/lib/die/analytics/cost-intelligence.service'
import { ProcurementIntelligenceService } from '@/lib/die/analytics/procurement-intelligence.service'
import { OperationalIntelligenceService } from '@/lib/die/analytics/operational-intelligence.service'
import { ExecutiveIntelligenceService } from '@/lib/die/analytics/executive-intelligence.service'
import { getDateRange } from '@/lib/die/analytics/analytics-utils'

interface ValidationResult {
  test: string
  passed: boolean
  error?: string
  duration?: number
}

const results: ValidationResult[] = []

function logTest(name: string, passed: boolean, error?: string, duration?: number) {
  results.push({ test: name, passed, error, duration })
  const status = passed ? '✓' : '✗'
  const time = duration ? ` (${duration}ms)` : ''
  console.log(`${status} ${name}${time}`)
  if (error) console.error(`  Error: ${error}`)
}

async function validateSupplierIntelligence() {
  const start = Date.now()
  try {
    const business = await prisma.business.findFirst()
    if (!business) throw new Error('No business found')

    const report = await SupplierIntelligenceService.getSupplierIntelligence({
      businessId: business.id,
      dateRange: getDateRange('year'),
      limit: 5,
    })

    if (!report) throw new Error('No report generated')
    if (!report.summary) throw new Error('Missing summary')
    if (!Array.isArray(report.topSuppliers)) throw new Error('topSuppliers not an array')
    if (!Array.isArray(report.spendTrend)) throw new Error('spendTrend not an array')

    logTest('Supplier Intelligence Service', true, undefined, Date.now() - start)
  } catch (error: any) {
    logTest('Supplier Intelligence Service', false, error.message, Date.now() - start)
  }
}

async function validateProductIntelligence() {
  const start = Date.now()
  try {
    const business = await prisma.business.findFirst()
    if (!business) throw new Error('No business found')

    const report = await ProductIntelligenceService.getProductIntelligence({
      businessId: business.id,
      dateRange: getDateRange('year'),
      limit: 5,
    })

    if (!report) throw new Error('No report generated')
    if (!report.summary) throw new Error('Missing summary')
    if (!Array.isArray(report.topProducts)) throw new Error('topProducts not an array')

    logTest('Product Intelligence Service', true, undefined, Date.now() - start)
  } catch (error: any) {
    logTest('Product Intelligence Service', false, error.message, Date.now() - start)
  }
}

async function validateCostIntelligence() {
  const start = Date.now()
  try {
    const business = await prisma.business.findFirst()
    if (!business) throw new Error('No business found')

    const report = await CostIntelligenceService.getCostIntelligence({
      businessId: business.id,
      dateRange: getDateRange('year'),
      limit: 5,
    })

    if (!report) throw new Error('No report generated')
    if (!report.summary) throw new Error('Missing summary')
    if (!Array.isArray(report.costTrends)) throw new Error('costTrends not an array')

    logTest('Cost Intelligence Service', true, undefined, Date.now() - start)
  } catch (error: any) {
    logTest('Cost Intelligence Service', false, error.message, Date.now() - start)
  }
}

async function validateProcurementIntelligence() {
  const start = Date.now()
  try {
    const business = await prisma.business.findFirst()
    if (!business) throw new Error('No business found')

    const report = await ProcurementIntelligenceService.getProcurementIntelligence({
      businessId: business.id,
      dateRange: getDateRange('month'),
    })

    if (!report) throw new Error('No report generated')
    if (!report.metrics) throw new Error('Missing metrics')
    if (!report.summary) throw new Error('Missing summary')

    logTest('Procurement Intelligence Service', true, undefined, Date.now() - start)
  } catch (error: any) {
    logTest('Procurement Intelligence Service', false, error.message, Date.now() - start)
  }
}

async function validateOperationalIntelligence() {
  const start = Date.now()
  try {
    const business = await prisma.business.findFirst()
    if (!business) throw new Error('No business found')

    const report = await OperationalIntelligenceService.getOperationalIntelligence({
      businessId: business.id,
      dateRange: getDateRange('month'),
    })

    if (!report) throw new Error('No report generated')
    if (!report.metrics) throw new Error('Missing metrics')
    if (!report.workerPerformance) throw new Error('Missing workerPerformance')
    if (!report.queuePerformance) throw new Error('Missing queuePerformance')

    logTest('Operational Intelligence Service', true, undefined, Date.now() - start)
  } catch (error: any) {
    logTest('Operational Intelligence Service', false, error.message, Date.now() - start)
  }
}

async function validateExecutiveIntelligence() {
  const start = Date.now()
  try {
    const business = await prisma.business.findFirst()
    if (!business) throw new Error('No business found')

    const report = await ExecutiveIntelligenceService.getExecutiveIntelligence({
      businessId: business.id,
      dateRange: getDateRange('year'),
    })

    if (!report) throw new Error('No report generated')
    if (typeof report.totalSpend !== 'number') throw new Error('totalSpend not a number')
    if (!report.kpis) throw new Error('Missing kpis')
    if (!report.charts) throw new Error('Missing charts')
    if (!Array.isArray(report.alerts)) throw new Error('alerts not an array')

    logTest('Executive Intelligence Service', true, undefined, Date.now() - start)
  } catch (error: any) {
    logTest('Executive Intelligence Service', false, error.message, Date.now() - start)
  }
}

async function validateBusinessIsolation() {
  const start = Date.now()
  try {
    const businesses = await prisma.business.findMany({ take: 2 })
    if (businesses.length < 2) {
      logTest('Business Isolation (skipped - need 2+ businesses)', true, undefined, Date.now() - start)
      return
    }

    const [biz1, biz2] = businesses

    const report1 = await SupplierIntelligenceService.getSupplierIntelligence({
      businessId: biz1.id,
      dateRange: getDateRange('month'),
      limit: 5,
    })

    const report2 = await SupplierIntelligenceService.getSupplierIntelligence({
      businessId: biz2.id,
      dateRange: getDateRange('month'),
      limit: 5,
    })

    // Verify no cross-contamination
    const biz1SupplierIds = new Set(report1.topSuppliers.map((s) => s.supplierId))
    const biz2SupplierIds = new Set(report2.topSuppliers.map((s) => s.supplierId))

    const overlap = [...biz1SupplierIds].filter((id) => biz2SupplierIds.has(id))
    if (overlap.length > 0) {
      throw new Error(`Business isolation violated: ${overlap.length} shared supplier IDs`)
    }

    logTest('Business Isolation', true, undefined, Date.now() - start)
  } catch (error: any) {
    logTest('Business Isolation', false, error.message, Date.now() - start)
  }
}

async function validatePerformance() {
  const start = Date.now()
  try {
    const business = await prisma.business.findFirst()
    if (!business) throw new Error('No business found')

    const execStart = Date.now()
    await ExecutiveIntelligenceService.getExecutiveIntelligence({
      businessId: business.id,
      dateRange: getDateRange('year'),
    })
    const execDuration = Date.now() - execStart

    if (execDuration > 5000) {
      throw new Error(`Executive intelligence took ${execDuration}ms (target: <5000ms)`)
    }

    logTest('Performance - Executive Intelligence <5s', true, undefined, Date.now() - start)
  } catch (error: any) {
    logTest('Performance - Executive Intelligence <5s', false, error.message, Date.now() - start)
  }
}

async function validateAPIRoutes() {
  const start = Date.now()
  try {
    const routes = [
      '/api/die/analytics/executive',
      '/api/die/analytics/suppliers',
      '/api/die/analytics/products',
      '/api/die/analytics/costs',
      '/api/die/analytics/procurement',
      '/api/die/analytics/operations',
    ]

    // Just verify files exist
    const fs = require('fs')
    const path = require('path')

    for (const route of routes) {
      const filePath = path.join(process.cwd(), 'src/pages', route + '.ts')
      if (!fs.existsSync(filePath)) {
        throw new Error(`API route file missing: ${filePath}`)
      }
    }

    logTest('API Routes Exist', true, undefined, Date.now() - start)
  } catch (error: any) {
    logTest('API Routes Exist', false, error.message, Date.now() - start)
  }
}

async function validateServiceFiles() {
  const start = Date.now()
  try {
    const services = [
      'supplier-intelligence.service.ts',
      'product-intelligence.service.ts',
      'cost-intelligence.service.ts',
      'procurement-intelligence.service.ts',
      'operational-intelligence.service.ts',
      'executive-intelligence.service.ts',
      'analytics-types.ts',
      'analytics-utils.ts',
    ]

    const fs = require('fs')
    const path = require('path')

    for (const service of services) {
      const filePath = path.join(process.cwd(), 'src/lib/die/analytics', service)
      if (!fs.existsSync(filePath)) {
        throw new Error(`Service file missing: ${filePath}`)
      }
    }

    logTest('Service Files Exist', true, undefined, Date.now() - start)
  } catch (error: any) {
    logTest('Service Files Exist', false, error.message, Date.now() - start)
  }
}

async function main() {
  console.log('\n=== DIE Block 5B Validation ===\n')

  await validateServiceFiles()
  await validateAPIRoutes()
  await validateSupplierIntelligence()
  await validateProductIntelligence()
  await validateCostIntelligence()
  await validateProcurementIntelligence()
  await validateOperationalIntelligence()
  await validateExecutiveIntelligence()
  await validateBusinessIsolation()
  await validatePerformance()

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const total = results.length

  console.log(`\n=== Summary ===`)
  console.log(`Total: ${total}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`)

  if (failed > 0) {
    console.log('\n❌ Validation FAILED')
    process.exit(1)
  } else {
    console.log('\n✅ Validation PASSED')
    process.exit(0)
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
