import { pluginRunner } from '@/lib/die/plugins/runtime/plugin-runner'
import { governanceEngine } from '@/lib/die/governance/governance-engine.service'
import { GovernanceStateService } from '@/lib/die/governance/governance-state.service'
import { intelligenceSnapshotBuilder } from '@/lib/die/intelligence-core/intelligence-snapshot.builder'
import { correlationEngine } from '@/lib/die/intelligence-core/correlation-engine.service'
import { controlPlaneIntelligenceAdapter } from '@/lib/die/control-plane/control-plane-intelligence.adapter'

async function clearCaches() {
  intelligenceSnapshotBuilder.clearCache()
}

async function buildOutputs(label: string) {
  await clearCaches()
  const snapshot = await intelligenceSnapshotBuilder.buildSnapshot()
  const correlation = await correlationEngine.generateReport()
  const enriched = await controlPlaneIntelligenceAdapter.getEnrichedSnapshot()
  return { label, snapshot, correlation, enriched }
}

async function setupHealthyScenario() {
  const plugins = pluginRunner.list()
  const ids = plugins.slice(0, 2).map((p) => p.id)
  for (const id of ids) {
    await governanceEngine.recordInstall(id, null)
    await governanceEngine.recordEnable(id, null)
  }
}

async function setupDegradedScenario() {
  const plugins = pluginRunner.list()
  const id = plugins[0]?.id
  if (!id) return
  // Introduce lifecycle inconsistency (enable without enough installs)
  for (let i = 0; i < 5; i++) {
    await governanceEngine.recordEnable(id, null)
  }
  // Append some anomaly events (memory-only via state service)
  const stateSvc = new GovernanceStateService()
  for (let i = 0; i < 5; i++) {
    stateSvc.appendAuditEvent({
      pluginId: id,
      businessId: null,
      eventType: 'ANOMALY_DETECTED',
      metadata: { anomalyType: 'TEST_INCONSISTENCY', details: 'Degraded scenario synthetic anomaly' },
    })
  }
}

async function setupAnomalyHeavyScenario() {
  const plugins = pluginRunner.list()
  const id = plugins[0]?.id
  if (!id) return
  // High churn
  for (let i = 0; i < 10; i++) {
    await governanceEngine.recordEnable(id, null)
    await governanceEngine.recordDisable(id, null)
  }
  // Many anomalies
  const stateSvc = new GovernanceStateService()
  for (let i = 0; i < 20; i++) {
    stateSvc.appendAuditEvent({
      pluginId: id,
      businessId: null,
      eventType: 'ANOMALY_DETECTED',
      metadata: { anomalyType: 'TEST_CLUSTER', details: 'Anomaly-heavy scenario synthetic anomaly' },
    })
  }
}

async function run() {
  console.log('=== DIE Intelligence Quality Review (memory-only) ===')
  const envMode = process.env.DIE_PERSISTENCE_MODE || 'hybrid'
  console.log('Persistence mode:', envMode)

  // Scenario 1: Healthy
  await setupHealthyScenario()
  const healthy = await buildOutputs('HEALTHY')

  // Scenario 2: Degraded
  await setupDegradedScenario()
  const degraded = await buildOutputs('DEGRADED')

  // Scenario 3: Anomaly-Heavy
  await setupAnomalyHeavyScenario()
  const risky = await buildOutputs('ANOMALY_HEAVY')

  const out = { healthy, degraded, risky }
  console.log(JSON.stringify(out, null, 2))
}

run().catch((e) => {
  console.error('Intelligence quality review failed', e)
  process.exit(1)
})
