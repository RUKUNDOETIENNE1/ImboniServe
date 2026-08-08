import { useCallback, useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Activity, AlertTriangle, CheckCircle, Layers, Shield, TrendingUp } from 'lucide-react'
import type { GetServerSideProps } from 'next'

interface ControlPlaneSnapshot {
  totalPlugins: number
  activePlugins: number
  disabledPlugins: number
  discoveredPlugins: number
  marketplaceCoverage: number
  governanceHealthScore: number
  lifecycleConsistencyScore: number
  qrMenuStatus: 'healthy' | 'degraded' | 'unknown'
  runtimeWarnings: string[]
  generatedAt: string
}

interface EcosystemSummary {
  totalPlugins: number
  healthyPlugins: number
  degradedPlugins: number
  criticalPlugins: number
  averageHealthScore: number
  topIssues: string[]
}

interface GovernanceEvent {
  id: string
  pluginId: string
  eventType: string
  timestamp: string
  metadata?: any
}

interface PluginEcosystemEntry {
  pluginId: string
  name: string
  version: string
  governanceState: {
    lifecycleState: string
    installCount: number
    enableCount: number
    disableCount: number
    lastStateChangeAt: string | null
  } | null
  healthIndicators: {
    hasAnomalies: boolean
    anomalyCount: number
    isStable: boolean
  }
}

interface SystemHealth {
  overallHealth: 'healthy' | 'degraded' | 'critical'
  score: number
  components: {
    pluginRuntime: 'healthy' | 'degraded' | 'critical'
    governanceLayer: 'healthy' | 'degraded' | 'critical'
    marketplaceLayer: 'healthy' | 'degraded' | 'critical'
  }
  issues: {
    severity: 'low' | 'medium' | 'high' | 'critical'
    component: string
    message: string
    detectedAt: string
  }[]
  recommendations: string[]
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  return { props: {} }
}

export default function ControlPlanePage() {
  const [snapshot, setSnapshot] = useState<ControlPlaneSnapshot | null>(null)
  const [health, setHealth] = useState<{ system: SystemHealth; ecosystem: EcosystemSummary } | null>(null)
  const [plugins, setPlugins] = useState<PluginEcosystemEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [snapshotRes, healthRes, pluginsRes] = await Promise.all([
        fetch('/api/die/control-plane/overview'),
        fetch('/api/die/control-plane/health'),
        fetch('/api/die/control-plane/plugins'),
      ])
      const snapshotData = await snapshotRes.json()
      const healthData = await healthRes.json()
      const pluginsData = await pluginsRes.json()
      setSnapshot(snapshotData)
      setHealth(healthData)
      setPlugins(pluginsData)
    } catch (err) {
      console.error('Failed to load control plane data', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const healthColor = (status: string) => {
    if (status === 'healthy') return 'text-green-600 bg-green-50'
    if (status === 'degraded') return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const healthIcon = (status: string) => {
    if (status === 'healthy') return <CheckCircle className="h-5 w-5" />
    if (status === 'degraded') return <AlertTriangle className="h-5 w-5" />
    return <AlertTriangle className="h-5 w-5" />
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-16">
        <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-slate-50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)]" />
          <div className="relative z-[1] px-8 py-12">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">DIE Control Plane</p>
            <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <h1 className="text-3xl font-semibold leading-tight text-white lg:text-4xl">
                  System Intelligence & Health Monitoring
                </h1>
                <p className="text-sm text-slate-200/80">
                  Real-time observability for the DIE Plugin Operating System. Monitor governance state, plugin
                  ecosystem health, and runtime integrity.
                </p>
              </div>
              {health && (
                <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 px-6 py-5 text-sm shadow-xl">
                  <p className="text-slate-200">System Health Score</p>
                  <p className="mt-1 text-3xl font-semibold text-white">{health.system.score}/100</p>
                  <p className={`mt-3 text-xs font-medium ${healthColor(health.system.overallHealth)}`}>
                    {health.system.overallHealth.toUpperCase()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading control plane data...
          </div>
        )}

        {!loading && snapshot && health && (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-slate-600" />
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Total Plugins</p>
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{snapshot.totalPlugins}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {snapshot.activePlugins} active · {snapshot.disabledPlugins} disabled
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-slate-600" />
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Governance Health</p>
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{snapshot.governanceHealthScore}/100</p>
                <p className="mt-2 text-xs text-slate-500">Lifecycle consistency: {snapshot.lifecycleConsistencyScore}/100</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-slate-600" />
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Marketplace Coverage</p>
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{snapshot.marketplaceCoverage}%</p>
                <p className="mt-2 text-xs text-slate-500">Plugins with complete metadata</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-slate-600" />
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">QR Menu Status</p>
                </div>
                <p className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${healthColor(snapshot.qrMenuStatus)}`}>
                  {healthIcon(snapshot.qrMenuStatus)}
                  {snapshot.qrMenuStatus.toUpperCase()}
                </p>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Plugin Runtime</h2>
                <p className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${healthColor(health.system.components.pluginRuntime)}`}>
                  {healthIcon(health.system.components.pluginRuntime)}
                  {health.system.components.pluginRuntime.toUpperCase()}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Governance Layer</h2>
                <p className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${healthColor(health.system.components.governanceLayer)}`}>
                  {healthIcon(health.system.components.governanceLayer)}
                  {health.system.components.governanceLayer.toUpperCase()}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Marketplace Layer</h2>
                <p className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${healthColor(health.system.components.marketplaceLayer)}`}>
                  {healthIcon(health.system.components.marketplaceLayer)}
                  {health.system.components.marketplaceLayer.toUpperCase()}
                </p>
              </div>
            </section>

            {snapshot.runtimeWarnings.length > 0 && (
              <section className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-yellow-900">Runtime Warnings</h2>
                <ul className="mt-4 space-y-2 text-sm text-yellow-800">
                  {snapshot.runtimeWarnings.map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {health.system.issues.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">System Issues</h2>
                <div className="mt-4 space-y-3">
                  {health.system.issues.map((issue, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">{issue.component}</span>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          issue.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          issue.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                          issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {issue.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{issue.message}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {health.system.recommendations.length > 0 && (
              <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-blue-900">Recommendations</h2>
                <ul className="mt-4 space-y-2 text-sm text-blue-800">
                  {health.system.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Governance Activity</h2>
              <p className="mt-2 text-sm text-slate-600">Recent lifecycle events and state changes</p>
              <div className="mt-4 space-y-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">Lifecycle Consistency</span>
                    <span className="text-sm font-semibold text-green-600">{snapshot.lifecycleConsistencyScore}/100</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">All plugins following proper lifecycle transitions</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">Governance Health</span>
                    <span className="text-sm font-semibold text-green-600">{snapshot.governanceHealthScore}/100</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Low anomaly count, stable state tracking</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Plugin Ecosystem</h2>
              <p className="mt-2 text-sm text-slate-600">Active plugins and their health status</p>
              <div className="mt-4 space-y-3">
                {plugins.slice(0, 5).map((plugin) => (
                  <div key={plugin.pluginId} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{plugin.name}</p>
                        <p className="text-xs text-slate-500">v{plugin.version}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-semibold ${
                          plugin.governanceState?.lifecycleState === 'ENABLED' ? 'text-green-600' :
                          plugin.governanceState?.lifecycleState === 'DISABLED' ? 'text-yellow-600' :
                          'text-slate-600'
                        }`}>
                          {plugin.governanceState?.lifecycleState || 'DISCOVERED'}
                        </p>
                        {plugin.healthIndicators.hasAnomalies && (
                          <p className="mt-1 text-xs text-red-600">{plugin.healthIndicators.anomalyCount} anomalies</p>
                        )}
                      </div>
                    </div>
                    {plugin.governanceState && (
                      <div className="mt-2 flex gap-4 text-xs text-slate-500">
                        <span>Installs: {plugin.governanceState.installCount}</span>
                        <span>Enables: {plugin.governanceState.enableCount}</span>
                        <span>Disables: {plugin.governanceState.disableCount}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">QR Menu Health</h2>
              <p className="mt-2 text-sm text-slate-600">Critical plugin status and metrics</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">Plugin Status</span>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      snapshot.qrMenuStatus === 'healthy' ? 'bg-green-100 text-green-700' :
                      snapshot.qrMenuStatus === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {healthIcon(snapshot.qrMenuStatus)}
                      {snapshot.qrMenuStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-900">Public Routes</p>
                  <p className="mt-1 text-xs text-slate-500">Menu rendering and QR code generation active</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-900">Dashboard Integration</p>
                  <p className="mt-1 text-xs text-slate-500">Management UI accessible at /dashboard/die/plugins/qr-menu</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Ecosystem Health Summary</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Healthy Plugins</p>
                  <p className="mt-2 text-2xl font-semibold text-green-600">{health.ecosystem.healthyPlugins}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Degraded Plugins</p>
                  <p className="mt-2 text-2xl font-semibold text-yellow-600">{health.ecosystem.degradedPlugins}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Critical Plugins</p>
                  <p className="mt-2 text-2xl font-semibold text-red-600">{health.ecosystem.criticalPlugins}</p>
                </div>
              </div>
              {health.ecosystem.topIssues.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-slate-700">Top Issues:</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    {health.ecosystem.topIssues.map((issue, idx) => (
                      <li key={idx}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
