import { governanceEngine } from '@/lib/die/governance/governance-engine.service'
import { pluginRunner } from '@/lib/die/plugins/runtime/plugin-runner'
import { listMarketplacePlugins } from '@/lib/die/plugins/marketplace/registry'
import type { SystemCorrelationReport } from './types'
import { shadowObservability } from '@/lib/die/business-as-plugin/shadow/shadow-observability'
import type { BusinessInsight } from '@/lib/die/business-intelligence/reasoning-engine'

export class CorrelationEngineService {
  /**
   * Generate system-wide correlation report
   * Detects patterns, inefficiencies, and optimization opportunities
   */
  async generateReport(): Promise<SystemCorrelationReport> {
    const [hotspots, inefficiencies, riskSignals, optimizationCandidates] = await Promise.all([
      this.detectHotspots(),
      this.detectInefficiencies(),
      this.detectRiskSignals(),
      this.detectOptimizationCandidates(),
    ])

    return {
      hotspots,
      inefficiencies,
      riskSignals,
      optimizationCandidates,
    }
  }

  /**
   * Detect system hotspots (high activity + issues)
   */
  private async detectHotspots(): Promise<
    Array<{
      pluginId: string
      reason: string
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    }>
  > {
    const allStates = governanceEngine.getAllStates()
    const recentEvents = governanceEngine.getRecentAuditEvents(100)
    const hotspots: Array<{ pluginId: string; reason: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }> =
      []

    const anomalyCounts: Record<string, number> = {}
    for (const event of recentEvents) {
      if (event.eventType === 'ANOMALY_DETECTED') {
        anomalyCounts[event.pluginId] = (anomalyCounts[event.pluginId] || 0) + 1
      }
    }

    for (const state of allStates) {
      const anomalyCount = anomalyCounts[state.pluginId] || 0

      if (anomalyCount > 10) {
        hotspots.push({
          pluginId: state.pluginId,
          reason: `Critical anomaly count: ${anomalyCount} anomalies detected`,
          severity: 'CRITICAL',
        })
      } else if (anomalyCount > 5) {
        hotspots.push({
          pluginId: state.pluginId,
          reason: `High anomaly count: ${anomalyCount} anomalies detected`,
          severity: 'HIGH',
        })
      }

      if (state.enableCount > state.installCount + 3) {
        hotspots.push({
          pluginId: state.pluginId,
          reason: `Lifecycle inconsistency: ${state.enableCount} enables vs ${state.installCount} installs`,
          severity: 'MEDIUM',
        })
      }

      const totalOps = state.installCount + state.enableCount + state.disableCount
      if (totalOps > 100) {
        hotspots.push({
          pluginId: state.pluginId,
          reason: `High lifecycle churn: ${totalOps} total operations`,
          severity: 'MEDIUM',
        })
      }
    }

    return hotspots
  }

  /**
   * Detect system inefficiencies
   */
  private async detectInefficiencies(): Promise<
    Array<{
      area: string
      description: string
      impact: 'LOW' | 'MEDIUM' | 'HIGH'
    }>
  > {
    const inefficiencies: Array<{ area: string; description: string; impact: 'LOW' | 'MEDIUM' | 'HIGH' }> = []
    const allStates = governanceEngine.getAllStates()
    const marketplacePlugins = listMarketplacePlugins()

    const unusedPlugins = allStates.filter(
      (s) => s.lifecycleState === 'INSTALLED' && s.enableCount === 0
    ).length

    if (unusedPlugins > 0) {
      inefficiencies.push({
        area: 'Plugin Utilization',
        description: `${unusedPlugins} plugin(s) installed but never enabled`,
        impact: unusedPlugins > 5 ? 'MEDIUM' : 'LOW',
      })
    }

    const lowMarketplaceCoverage = marketplacePlugins.filter((p) => !p.category || !p.pricingModel).length
    if (lowMarketplaceCoverage > 0) {
      inefficiencies.push({
        area: 'Marketplace Metadata',
        description: `${lowMarketplaceCoverage} plugin(s) missing complete marketplace metadata`,
        impact: lowMarketplaceCoverage > 10 ? 'MEDIUM' : 'LOW',
      })
    }

    const highChurnPlugins = allStates.filter((s) => s.enableCount > 10 && s.disableCount > 10).length
    if (highChurnPlugins > 0) {
      inefficiencies.push({
        area: 'Plugin Stability',
        description: `${highChurnPlugins} plugin(s) with high enable/disable churn`,
        impact: 'MEDIUM',
      })
    }

    return inefficiencies
  }

  /**
   * Detect risk signals
   */
  private async detectRiskSignals(): Promise<
    Array<{
      signal: string
      affectedPlugins: string[]
      recommendation: string
    }>
  > {
    const riskSignals: Array<{ signal: string; affectedPlugins: string[]; recommendation: string }> = []
    const allStates = governanceEngine.getAllStates()
    const recentEvents = governanceEngine.getRecentAuditEvents(100)

    const anomalyCounts: Record<string, number> = {}
    for (const event of recentEvents) {
      if (event.eventType === 'ANOMALY_DETECTED') {
        anomalyCounts[event.pluginId] = (anomalyCounts[event.pluginId] || 0) + 1
      }
    }

    const highAnomalyPlugins = Object.entries(anomalyCounts)
      .filter(([, count]) => count > 5)
      .map(([id]) => id)

    if (highAnomalyPlugins.length > 0) {
      riskSignals.push({
        signal: 'High Anomaly Rate Detected',
        affectedPlugins: highAnomalyPlugins,
        recommendation: 'Review governance logs and investigate lifecycle inconsistencies',
      })
    }

    const inconsistentPlugins = allStates
      .filter((s) => s.enableCount > s.installCount + 2)
      .map((s) => s.pluginId)

    if (inconsistentPlugins.length > 0) {
      riskSignals.push({
        signal: 'Lifecycle State Inconsistency',
        affectedPlugins: inconsistentPlugins,
        recommendation: 'Verify plugin installation flow and state management',
      })
    }

    // Shadow-mode cross-domain correlations (read-only)
    try {
      const feed = shadowObservability.list(200)
      const byCode = (code: string) => feed.filter((i) => i.code === code)
      const bySource = (pluginId: string) => feed.filter((i) => (i.data as any)?.sourceTag === pluginId)

      // Inventory Shortage Correlation
      const invShortage = feed.filter(
        (i) => (i.data as any)?.sourceTag === 'inventory' && (
          i.code === 'INVENTORY_STOCK_LOW' || i.code === 'INVENTORY_STOCK_OUT' || i.code === 'INVENTORY_THRESHOLD_BREACH'
        )
      )
      if (invShortage.length > 5) {
        riskSignals.push({
          signal: 'Inventory Shortage Pressure',
          affectedPlugins: ['inventory', 'procurement', 'suppliers'],
          recommendation: 'Review reorder points, check open POs, and assess supplier responsiveness',
        })
      }

      // Procurement Delay Correlation
      const procurementDelays = byCode('PROCUREMENT_DELAY_DETECTED')
      if (procurementDelays.length > 0 && invShortage.length > 0) {
        riskSignals.push({
          signal: 'Delayed Replenishment After Shortages',
          affectedPlugins: ['procurement', 'suppliers', 'inventory'],
          recommendation: 'Investigate procurement cycle times and delivery SLAs',
        })
      }

      // Inventory ↔ Delivery: shortages correlating with delivery delays
      const deliveryDelayed = byCode('DELIVERY_DELAYED')
      if (deliveryDelayed.length > 0 && invShortage.length > 0) {
        riskSignals.push({
          signal: 'Stock Shortages Likely Causing Delivery Delays',
          affectedPlugins: ['inventory', 'delivery'],
          recommendation: 'Increase safety stock or pace kitchen prep for delivery orders',
        })
      }

      // Procurement ↔ Delivery: supplier delays impacting delivery fulfillment
      if (procurementDelays.length > 0 && deliveryDelayed.length > 0) {
        riskSignals.push({
          signal: 'Supplier/Procurement Delays Impacting Delivery Fulfillment',
          affectedPlugins: ['procurement', 'suppliers', 'delivery'],
          recommendation: 'Tighten SLAs with suppliers or diversify sourcing for faster delivery readiness',
        })
      }

      // KDS ↔ Delivery: kitchen backlog leading to delivery lateness
      const kdsBacklog = byCode('KDS_BACKLOG_ALERT')
      if (kdsBacklog.length > 0 && deliveryDelayed.length > 0) {
        riskSignals.push({
          signal: 'Kitchen Backlog Likely Causing Delivery Lateness',
          affectedPlugins: ['kds', 'delivery'],
          recommendation: 'Load-balance stations or adjust batching to improve courier pickup on-time',
        })
      }

      // Reservations ↔ Delivery: demand spikes impacting delivery volume
      const reservationCreated = byCode('RESERVATION_CREATED')
      if (reservationCreated.length > 10 && deliveryDelayed.length > 0) {
        riskSignals.push({
          signal: 'Reservation Demand Spike Impacts Delivery',
          affectedPlugins: ['reservations', 'delivery'],
          recommendation: 'Staff for peak periods and pre-position couriers near store',
        })
      }

      // Supplier Reliability Correlation
      const supplierDelayed = byCode('SUPPLIER_DELIVERY_DELAYED')
      const supplierFailed = byCode('SUPPLIER_DELIVERY_FAILED')
      if (supplierDelayed.length + supplierFailed.length > 3) {
        riskSignals.push({
          signal: 'Supplier Reliability Risk',
          affectedPlugins: ['suppliers'],
          recommendation: 'Identify frequently delayed/failed suppliers and adjust allocations',
        })
      }

      // Inventory Recovery Correlation - compute simple average replenishment time
      const invLow = feed.filter((i) => i.code === 'INVENTORY_STOCK_LOW' || i.code === 'INVENTORY_STOCK_OUT')
      const invRestocked = byCode('INVENTORY_RESTOCKED')
      const parseTs = (s: string) => new Date(s).getTime()
      const pairs: number[] = []
      for (const low of invLow) {
        const itemId = (low.data as any)?.inventoryItemId
        const lowTs = parseTs(low.timestamp)
        const restock = invRestocked.find((r) => (r.data as any)?.inventoryItemId === itemId && parseTs(r.timestamp) > lowTs)
        if (restock) {
          pairs.push(parseTs(restock.timestamp) - lowTs)
        }
      }
      if (pairs.length > 0) {
        const avgMs = Math.round(pairs.reduce((a, b) => a + b, 0) / pairs.length)
        const hours = (avgMs / (1000 * 60 * 60)).toFixed(1)
        // Surface as inefficiency insight for now
        // eslint-disable-next-line no-unused-expressions
        ;(this as any)._recoveryInsight = { avgMs, hours, samples: pairs.length }
      }

      // ================================
      // Dining Sessions & Slips Correlations
      // ================================
      const sessionStarted = byCode('SESSION_STARTED')
      const longSessions = byCode('LONG_DURATION_SESSION')
      const paymentExceptions = byCode('PAYMENT_EXCEPTION')
      if (paymentExceptions.length > 3) {
        riskSignals.push({
          signal: 'Payment Exceptions Spiking in Dining Sessions',
          affectedPlugins: ['dining-slips', 'payments'],
          recommendation: 'Review PSP reliability and webhook validation; verify tip/total calculations',
        })
      }
      if (longSessions.length > 5) {
        riskSignals.push({
          signal: 'Table Turnover Risk from Long Sessions',
          affectedPlugins: ['dining-slips', 'table-management'],
          recommendation: 'Consider prompts for bill settlement or waiter check-ins during peaks',
        })
      }

      // ================================
      // Campaigns/Marketing Correlations
      // ================================
      const highConv = byCode('CAMPAIGN_DELIVERABILITY_STRONG')
      const lowConv = byCode('CAMPAIGN_DELIVERABILITY_WEAK')
      const campaignCompleted = byCode('CAMPAIGN_COMPLETED')
      if ((highConv.length > 0 || campaignCompleted.length > 0) && sessionStarted.length > 10) {
        riskSignals.push({
          signal: 'Campaign Likely Driving In-Store Demand Spike',
          affectedPlugins: ['campaigns', 'reservations', 'dining-slips', 'kds'],
          recommendation: 'Staff for surge, pre-stage ingredients, and throttle send windows if needed',
        })
      }
      if (lowConv.length > 0) {
        riskSignals.push({
          signal: 'Low Marketing ROI detected',
          affectedPlugins: ['campaigns'],
          recommendation: 'Refine audience segment and message; test incentives and timing',
        })
      }
    } catch {}

    return riskSignals
  }

  /**
   * Detect optimization candidates
   */
  private async detectOptimizationCandidates(): Promise<
    Array<{
      pluginId: string
      opportunity: string
      potentialImpact: string
    }>
  > {
    const candidates: Array<{ pluginId: string; opportunity: string; potentialImpact: string }> = []
    const allStates = governanceEngine.getAllStates()
    const plugins = pluginRunner.list()

    for (const state of allStates) {
      if (state.lifecycleState === 'INSTALLED' && state.enableCount === 0) {
        const plugin = plugins.find((p) => p.id === state.pluginId)
        if (plugin) {
          candidates.push({
            pluginId: state.pluginId,
            opportunity: 'Unused plugin - consider enabling or removing',
            potentialImpact: 'Reduce system clutter, improve clarity',
          })
        }
      }

      if (state.enableCount > 20 && state.disableCount > 20) {
        candidates.push({
          pluginId: state.pluginId,
          opportunity: 'High churn - investigate stability or usage pattern',
          potentialImpact: 'Improve plugin stability and user experience',
        })
      }
    }

    // Add read-only recovery cycle metric if available from shadow buffer computation
    const insight = (this as any)._recoveryInsight as { hours: string; samples: number } | undefined
    if (insight) {
      candidates.push({
        pluginId: 'procurement',
        opportunity: `Observed average replenishment time ~${insight.hours}h across ${insight.samples} sequence(s)`,
        potentialImpact: 'Optimize reorder points and supplier SLAs to reduce cycle time',
      })
    }

    return candidates
  }
}

export const correlationEngine = new CorrelationEngineService()
