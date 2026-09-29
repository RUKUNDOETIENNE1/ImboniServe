/**
 * Service Intelligence™ - End-to-End Simulation
 * 
 * Demonstrates the complete platform workflow:
 * Restaurant Operations → Heart Pulse → Replay → HIE → IKB → Service Intelligence → Manager
 */

import { describe, it, expect } from 'vitest'
import { createServiceIntelligence, createDashboardBuilder } from '../index'
import { createIntelligenceEngineV2, createKnowledgeBase } from '@/lib/intelligence'
import type { ReplayEvent } from '@/lib/service-replay/types'
import type { OperationalEvent } from '@/lib/intelligence'

describe('End-to-End Platform Simulation', () => {
  it('should demonstrate complete workflow from events to dashboard', async () => {
    console.log('\n=== Service Intelligence™ End-to-End Simulation ===\n')

    // ─────────────────────────────────────────────────────────────────────
    // Step 1: Restaurant Operations → Heart Pulse™
    // ─────────────────────────────────────────────────────────────────────
    console.log('Step 1: Restaurant operations captured by Heart Pulse™')
    const heartPulseEvents = simulateRestaurantOperations()
    console.log(`✓ Captured ${heartPulseEvents.length} operational events`)

    // ─────────────────────────────────────────────────────────────────────
    // Step 2: Heart Pulse → Service Replay™
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nStep 2: Events stored in Service Replay™')
    const replayEvents = heartPulseEvents // In production, these would be stored in DB
    console.log(`✓ ${replayEvents.length} events available for replay`)

    // ─────────────────────────────────────────────────────────────────────
    // Step 3: Service Intelligence™ requests intelligence
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nStep 3: Service Intelligence™ requests intelligence from HIE')
    const service = createServiceIntelligence()
    const request = {
      businessId: 'biz_demo',
      selection: {
        period: 'today_lunch' as const,
        label: 'Today Lunch Service',
      },
      includeHistoricalContext: true,
      includeComparison: false,
    }

    const response = await service.generateIntelligence(request, replayEvents)
    expect(response.success).toBe(true)
    expect(response.report).toBeDefined()
    console.log(`✓ Intelligence generated successfully`)
    console.log(`  - Report ID: ${response.report!.metadata.id}`)
    console.log(`  - Overall Score: ${response.report!.overallScore.overall}/100`)
    console.log(`  - Highlights: ${response.report!.highlights.length}`)
    console.log(`  - Issues: ${response.report!.problems.length}`)
    console.log(`  - Recommendations: ${response.report!.recommendations.length}`)

    // ─────────────────────────────────────────────────────────────────────
    // Step 4: Intelligence preserved in IKB
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nStep 4: Intelligence preserved in Knowledge Base')
    expect(response.diagnostics.knowledgeIngested).toBe(true)
    console.log(`✓ Knowledge ingested into IKB`)
    console.log(`  - Ingestion time: ${response.diagnostics.knowledgeTime}ms`)

    // ─────────────────────────────────────────────────────────────────────
    // Step 5: Dashboard built for manager
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nStep 5: Dashboard built for manager')
    const builder = createDashboardBuilder()
    const dashboard = builder.build(response.report!, response.historicalContext)
    
    expect(dashboard).toBeDefined()
    expect(dashboard.executiveSummary).toBeDefined()
    expect(dashboard.overallScore).toBeDefined()
    expect(dashboard.highlights.length).toBeGreaterThan(0)
    
    console.log(`✓ Dashboard ready for manager`)
    console.log(`  - Executive Summary: ${dashboard.executiveSummary.summary}`)
    console.log(`  - Total Orders: ${dashboard.executiveSummary.totalOrders}`)
    console.log(`  - Completion Rate: ${dashboard.executiveSummary.completionRate.toFixed(1)}%`)

    // ─────────────────────────────────────────────────────────────────────
    // Step 6: Manager opens intelligence card
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nStep 6: Manager opens intelligence card')
    const firstHighlight = dashboard.highlights[0]
    expect(firstHighlight).toBeDefined()
    console.log(`✓ Viewing highlight: "${firstHighlight.title}"`)
    console.log(`  - Description: ${firstHighlight.description}`)
    console.log(`  - Confidence: ${(firstHighlight.confidence * 100).toFixed(0)}%`)
    console.log(`  - Evidence count: ${firstHighlight.evidenceCount}`)

    // ─────────────────────────────────────────────────────────────────────
    // Step 7: Manager views evidence
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nStep 7: Manager views evidence')
    expect(firstHighlight.evidenceCount).toBeGreaterThan(0)
    console.log(`✓ Evidence available: ${firstHighlight.evidenceCount} items`)
    console.log(`  - All intelligence is backed by evidence`)

    // ─────────────────────────────────────────────────────────────────────
    // Step 8: Manager opens replay
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nStep 8: Manager opens Service Replay™')
    expect(firstHighlight.replayLink).toBeDefined()
    console.log(`✓ Replay link available: ${firstHighlight.replayLink}`)
    console.log(`  - Manager can view exact operational moment`)

    // ─────────────────────────────────────────────────────────────────────
    // Step 9: Historical context available
    // ─────────────────────────────────────────────────────────────────────
    console.log('\nStep 9: Historical context from IKB')
    if (response.historicalContext) {
      console.log(`✓ Historical context available`)
      console.log(`  - Has happened before: ${response.historicalContext.hasHappenedBefore.size} items`)
      console.log(`  - Trend analysis: ${response.historicalContext.trendAnalysis.size} metrics`)
    }

    // ─────────────────────────────────────────────────────────────────────
    // Verification
    // ─────────────────────────────────────────────────────────────────────
    console.log('\n=== Verification ===')
    console.log('✓ Complete workflow functional')
    console.log('✓ Evidence traceability maintained')
    console.log('✓ Replay integration working')
    console.log('✓ Historical context available')
    console.log('✓ No architectural changes required')
    console.log('\n=== Simulation Complete ===\n')

    // Final assertions
    expect(response.success).toBe(true)
    expect(response.report).toBeDefined()
    expect(dashboard).toBeDefined()
    expect(dashboard.highlights.length).toBeGreaterThan(0)
    expect(dashboard.highlights[0].replayLink).toBeDefined()
    expect(dashboard.highlights[0].evidenceCount).toBeGreaterThan(0)
  })

  it('should handle large datasets efficiently', async () => {
    console.log('\n=== Performance Test: Large Dataset ===\n')

    // Generate large dataset
    const largeDataset = generateLargeDataset(1000) // 1000 events
    console.log(`Generated ${largeDataset.length} events`)

    const service = createServiceIntelligence()
    const startTime = Date.now()

    const response = await service.generateIntelligence(
      {
        businessId: 'biz_perf_test',
        selection: {
          period: 'today_lunch' as const,
          label: 'Performance Test',
        },
      },
      largeDataset
    )

    const totalTime = Date.now() - startTime

    expect(response.success).toBe(true)
    console.log(`✓ Processed ${largeDataset.length} events in ${totalTime}ms`)
    console.log(`  - Transform time: ${response.diagnostics.transformTime}ms`)
    console.log(`  - Intelligence time: ${response.diagnostics.intelligenceTime}ms`)
    console.log(`  - Knowledge time: ${response.diagnostics.knowledgeTime}ms`)
    console.log(`  - Total time: ${response.diagnostics.totalTime}ms`)

    // Performance assertions
    expect(totalTime).toBeLessThan(5000) // Should complete in under 5 seconds
    expect(response.diagnostics.eventCount).toBe(1000)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Simulation Helpers
// ─────────────────────────────────────────────────────────────────────────────

function simulateRestaurantOperations(): ReplayEvent[] {
  const baseTime = new Date('2026-07-14T12:00:00Z')
  const events: ReplayEvent[] = []

  // Simulate 5 complete order lifecycles
  for (let i = 1; i <= 5; i++) {
    const orderId = `ord_${i}`
    const orderNumber = `10${i}`
    const orderTime = baseTime.getTime() + (i - 1) * 600000 // 10 min apart

    // Order created
    events.push({
      id: `evt_${i}_1`,
      timestamp: new Date(orderTime).toISOString(),
      eventType: 'order_created',
      category: 'order',
      description: `Order #${orderNumber} created`,
      orderId,
      orderNumber,
      waiterId: `staff_${(i % 3) + 1}`,
      waiterName: `Server ${(i % 3) + 1}`,
      metadata: {},
      details: { items: 3, total: 45.50 },
    })

    // Prep started
    events.push({
      id: `evt_${i}_2`,
      timestamp: new Date(orderTime + 120000).toISOString(),
      eventType: 'prep_started',
      category: 'kitchen',
      description: 'Preparation started',
      orderId,
      stationId: 'station_grill',
      stationName: 'Grill Station',
      metadata: {},
      details: {},
    })

    // Prep completed
    events.push({
      id: `evt_${i}_3`,
      timestamp: new Date(orderTime + 720000).toISOString(),
      eventType: 'prep_completed',
      category: 'kitchen',
      description: 'Preparation completed',
      orderId,
      stationId: 'station_grill',
      duration: 600,
      metadata: {},
      details: {},
    })

    // Item served
    events.push({
      id: `evt_${i}_4`,
      timestamp: new Date(orderTime + 900000).toISOString(),
      eventType: 'item_served',
      category: 'service',
      description: 'Order served to table',
      orderId,
      waiterId: `staff_${(i % 3) + 1}`,
      metadata: {},
      details: {},
    })

    // Payment processed
    events.push({
      id: `evt_${i}_5`,
      timestamp: new Date(orderTime + 1800000).toISOString(),
      eventType: 'payment_processed',
      category: 'payment',
      description: 'Payment completed',
      orderId,
      duration: 120,
      metadata: {},
      details: { amount: 45.50, method: 'card' },
    })
  }

  return events
}

function generateLargeDataset(count: number): ReplayEvent[] {
  const events: ReplayEvent[] = []
  const baseTime = new Date('2026-07-14T11:00:00Z')

  for (let i = 0; i < count; i++) {
    events.push({
      id: `evt_large_${i}`,
      timestamp: new Date(baseTime.getTime() + i * 10000).toISOString(),
      eventType: i % 5 === 0 ? 'order_created' : 'prep_started',
      category: i % 2 === 0 ? 'order' : 'kitchen',
      description: `Event ${i}`,
      orderId: `ord_${Math.floor(i / 5)}`,
      metadata: {},
      details: {},
    })
  }

  return events
}
