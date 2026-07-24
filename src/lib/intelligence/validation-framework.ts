/**
 * Hospitality Intelligence Platform v1.0
 * Runtime Validation Framework
 * 
 * Provides reusable validation infrastructure for all intelligence modules.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Validation result
 */
export interface ValidationResult {
  passed: boolean
  message: string
  details?: any
}

/**
 * Intelligence Validator
 * 
 * Provides standardized validation for intelligence modules
 */
export class IntelligenceValidator<TService, TRequest, TResponse, TReport> {
  constructor(
    private moduleName: string,
    private createService: () => TService,
    private createDashboardBuilder?: () => any
  ) {}

  /**
   * Run complete validation suite
   */
  async validate(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []

    console.log(`\n=== ${this.moduleName.toUpperCase()} RUNTIME VALIDATION ===\n`)

    // Step 1: Business lookup
    results.push(await this.validateBusinessLookup())

    // Step 2: Service creation
    results.push(await this.validateServiceCreation())

    // Step 3: Report generation
    const reportResult = await this.validateReportGeneration()
    results.push(reportResult)

    // Step 4: Dashboard building (if builder provided)
    if (this.createDashboardBuilder && reportResult.details?.report) {
      results.push(await this.validateDashboardBuilding(reportResult.details.report))
    }

    // Step 5: Export
    if (reportResult.details?.report) {
      results.push(await this.validateExport(reportResult.details.report))
    }

    // Summary
    const passed = results.every(r => r.passed)
    const passedCount = results.filter(r => r.passed).length
    
    console.log(`\n${'='.repeat(50)}`)
    console.log(`Validation Results: ${passedCount}/${results.length} passed`)
    console.log(`Status: ${passed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
    console.log(`${'='.repeat(50)}\n`)

    return results
  }

  /**
   * Validate business lookup
   */
  private async validateBusinessLookup(): Promise<ValidationResult> {
    try {
      const business = await prisma.business.findFirst()
      
      if (!business) {
        console.log('❌ Business lookup failed: No business found\n')
        return {
          passed: false,
          message: 'No business found in database',
        }
      }

      console.log(`✅ Business: ${business.name}\n`)
      return {
        passed: true,
        message: 'Business lookup successful',
        details: { business },
      }
    } catch (error) {
      console.log(`❌ Business lookup failed: ${error}\n`)
      return {
        passed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Validate service creation
   */
  private async validateServiceCreation(): Promise<ValidationResult> {
    try {
      const service = this.createService()
      
      if (!service) {
        console.log('❌ Service creation failed\n')
        return {
          passed: false,
          message: 'Service creation returned null/undefined',
        }
      }

      console.log('✅ Service created\n')
      return {
        passed: true,
        message: 'Service creation successful',
        details: { service },
      }
    } catch (error) {
      console.log(`❌ Service creation failed: ${error}\n`)
      return {
        passed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Validate report generation
   */
  private async validateReportGeneration(): Promise<ValidationResult> {
    try {
      const business = await prisma.business.findFirst()
      if (!business) {
        return {
          passed: false,
          message: 'No business available for testing',
        }
      }

      const service = this.createService() as any
      const request = {
        businessId: business.id,
        selection: {
          period: 'last_7_days',
        },
      }

      console.log('Generating intelligence report...')
      const response = await service.generateReport(request)

      if (!response.success) {
        console.log(`❌ Report generation failed: ${response.error}\n`)
        return {
          passed: false,
          message: response.error || 'Report generation failed',
        }
      }

      const report = response.report
      console.log('✅ Report generated')
      console.log(`   Events analyzed: ${report.eventsAnalyzed ?? 0}`)
      
      // Module-specific metrics (defensive)
      if (report.metrics) {
        const metrics = report.metrics
        if (metrics.totalOrders !== undefined) {
          console.log(`   Total orders: ${metrics.totalOrders}`)
        }
        if (metrics.kitchenEfficiency !== undefined) {
          console.log(`   Kitchen efficiency: ${metrics.kitchenEfficiency.toFixed(1)}%`)
        }
        if (metrics.serviceQualityScore !== undefined) {
          console.log(`   Service quality: ${metrics.serviceQualityScore.toFixed(1)}`)
        }
      }
      
      console.log(`   Insights: ${report.insights?.length ?? 0}`)
      console.log(`   Confidence: ${(report.confidence ?? 0).toFixed(2)}\n`)

      return {
        passed: true,
        message: 'Report generation successful',
        details: { report, response },
      }
    } catch (error) {
      console.log(`❌ Report generation failed: ${error}\n`)
      return {
        passed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Validate dashboard building
   */
  private async validateDashboardBuilding(report: any): Promise<ValidationResult> {
    try {
      if (!this.createDashboardBuilder) {
        return {
          passed: true,
          message: 'Dashboard builder not provided (skipped)',
        }
      }

      console.log('Building dashboard...')
      const builder = this.createDashboardBuilder()
      const dashboard = builder.build(report)

      if (!dashboard) {
        console.log('❌ Dashboard building failed\n')
        return {
          passed: false,
          message: 'Dashboard building returned null/undefined',
        }
      }

      const sections = Object.keys(dashboard).length
      console.log('✅ Dashboard built')
      console.log(`   Sections: ${sections}\n`)

      return {
        passed: true,
        message: 'Dashboard building successful',
        details: { dashboard },
      }
    } catch (error) {
      console.log(`❌ Dashboard building failed: ${error}\n`)
      return {
        passed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Validate export functionality
   */
  private async validateExport(report: any): Promise<ValidationResult> {
    try {
      console.log('Testing export...')
      const json = JSON.stringify(report, null, 2)

      if (!json || json.length === 0) {
        console.log('❌ Export failed\n')
        return {
          passed: false,
          message: 'Export produced empty result',
        }
      }

      console.log('✅ Export successful')
      console.log(`   Size: ${(json.length / 1024).toFixed(2)} KB\n`)

      return {
        passed: true,
        message: 'Export successful',
        details: { size: json.length },
      }
    } catch (error) {
      console.log(`❌ Export failed: ${error}\n`)
      return {
        passed: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    await prisma.$disconnect()
  }
}

/**
 * Factory function to create validator
 */
export function createIntelligenceValidator<TService, TRequest, TResponse, TReport>(
  moduleName: string,
  createService: () => TService,
  createDashboardBuilder?: () => any
): IntelligenceValidator<TService, TRequest, TResponse, TReport> {
  return new IntelligenceValidator(moduleName, createService, createDashboardBuilder)
}
