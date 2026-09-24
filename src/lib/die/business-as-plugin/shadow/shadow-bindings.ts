import type {
  GovernanceIntegrationContract,
  MarketplaceIntegrationContract,
  IntelligenceIntegrationContract,
  ObservabilityIntegrationContract,
  DomainAdapterBindings,
} from '@/lib/die/business-as-plugin/conversion/contracts'
import { shadowObservability } from './shadow-observability'

// Read-only shadow bindings: do NOT persist; just keep ephemeral metrics and feed

const governance: GovernanceIntegrationContract = {
  async recordLifecycle(event) {
    // Shadow-only: log for visibility; no persistence
    console.info('[Shadow][Governance]', event)
  },
}

const marketplace: MarketplaceIntegrationContract = {
  async recordUsage(signals) {
    // Shadow-only: log for visibility; no persistence
    console.info('[Shadow][Marketplace]', signals)
  },
}

const intelligence: IntelligenceIntegrationContract = {
  async recordMetrics(metrics) {
    // Shadow-only: log for visibility; no persistence
    console.info('[Shadow][Intelligence]', metrics)
  },
}

const observability: ObservabilityIntegrationContract = {
  async emitFeed(signal) {
    // Map domain-origin feed to unified source: use 'intelligence-core' to avoid adding new source types
    const source = 'intelligence-core' as const
    shadowObservability.emit(source, signal.code, signal.message, signal.severity, {
      ...signal.data,
      pluginId: signal.pluginId,
      sourceTag: signal.pluginId,
    })
  },
}

export const shadowBindings: DomainAdapterBindings = {
  governance,
  marketplace,
  intelligence,
  observability,
}
