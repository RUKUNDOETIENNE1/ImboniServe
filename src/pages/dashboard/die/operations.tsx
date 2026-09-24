import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import DashboardLayout from '@/components/DashboardLayout'
import { useToast } from '@/components/ui/Toast'
import ConfirmModal from '@/components/ConfirmModal'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Database,
  Loader2,
  Play,
  RefreshCw,
  RotateCcw,
  Server,
  Shield,
  Terminal,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown'

type OperationsHealth = {
  status: HealthStatus
  redis: { status: string; error?: string }
  lastHeartbeat: string | null
  recentActivity: {
    documentsProcessed: number
    anomaliesDetected: number
    recentStages: string[]
  }
}

type QueueSnapshot = {
  extraction: { waiting: number; active: number; completed: number; failed: number }
  intelligence: { waiting: number; active: number; completed: number; failed: number }
  dlq: { extract: number; intelligence: number }
  timestamp: number
}

type FailedJobRow = {
  id: string
  queue: 'extract' | 'intelligence'
  failedReason: string
  document: { id: string; type: string; supplier?: string } | null
}

type StuckDocRow = {
  documentId: string
  lifecycleState: string
  updatedAt: string
  ageMinutes: number
  reason: string
  repairCheckpoint: string
  supplier: string
  currentStatus: string
}

type ConsistencySummary = {
  documentsChecked: number
  issuesFound: number
  bySeverity: { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number }
  repairCandidates: number
}

type LiveEvent = {
  id: string
  type: string
  level: string
  message: string
  timestamp: string
}

type OperationsMetrics = {
  lifecycleDistribution: Record<string, number>
  throughput: {
    docsPerHour: number
    avgProcessingTimeMinutes: number | null
    queueLatencyMinutes: number | null
  }
  repairMetrics: {
    repairedToday: number
    replayedToday: number
    failedRepairsToday: number
  }
  anomalyMetrics: {
    open: number
    acknowledged: number
    resolved: number
  }
}

function StatusCard({
  title,
  status,
  icon: Icon,
  details,
}: {
  title: string
  status: HealthStatus | string
  icon: any
  details?: string
}) {
  const color =
    status === 'healthy'
      ? 'bg-green-100 text-green-700 border-green-200'
      : status === 'critical'
        ? 'bg-red-100 text-red-700 border-red-200'
        : status === 'warning'
          ? 'bg-amber-100 text-amber-700 border-amber-200'
          : 'bg-slate-100 text-slate-600 border-slate-200'

  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/60 rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-lg font-bold capitalize">{String(status)}</p>
        </div>
      </div>
      {details && <p className="text-xs mt-2 opacity-70">{details}</p>}
    </div>
  )
}

function QueueCard({
  title,
  snapshot,
}: {
  title: string
  snapshot: { waiting: number; active: number; completed: number; failed: number }
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
          <Zap className="w-4 h-4 text-imboni-blue" />
          {title}
        </h4>
        <span className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600">Active: {snapshot.active}</span>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="p-2 bg-blue-50 rounded-lg">
          <p className="text-lg font-bold text-blue-700">{snapshot.waiting}</p>
          <p className="text-xs text-blue-600">Waiting</p>
        </div>
        <div className="p-2 bg-amber-50 rounded-lg">
          <p className="text-lg font-bold text-amber-700">{snapshot.active}</p>
          <p className="text-xs text-amber-600">Active</p>
        </div>
        <div className="p-2 bg-green-50 rounded-lg">
          <p className="text-lg font-bold text-green-700">{snapshot.completed}</p>
          <p className="text-xs text-green-600">Done</p>
        </div>
        <div className="p-2 bg-red-50 rounded-lg">
          <p className="text-lg font-bold text-red-700">{snapshot.failed}</p>
          <p className="text-xs text-red-600">Failed</p>
        </div>
      </div>
    </div>
  )
}

function EventBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    UPLOAD: 'bg-blue-100 text-blue-700',
    OCR: 'bg-purple-100 text-purple-700',
    EXTRACTION: 'bg-purple-100 text-purple-700',
    INTELLIGENCE: 'bg-violet-100 text-violet-700',
    MATCHING: 'bg-indigo-100 text-indigo-700',
    RECONCILIATION: 'bg-cyan-100 text-cyan-700',
    ANOMALY: 'bg-red-100 text-red-700',
    APPROVAL: 'bg-green-100 text-green-700',
    APPLY: 'bg-emerald-100 text-emerald-700',
    REPLAY: 'bg-amber-100 text-amber-700',
    REPAIR: 'bg-orange-100 text-orange-700',
  }
  const color = colors[type] || 'bg-slate-100 text-slate-600'
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{type}</span>
}

export default function DIEOperationsDashboard() {
  const { success, error: showError } = useToast()

  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState<OperationsHealth | null>(null)
  const [queues, setQueues] = useState<QueueSnapshot | null>(null)
  const [failedJobs, setFailedJobs] = useState<FailedJobRow[]>([])
  const [stuckDocs, setStuckDocs] = useState<StuckDocRow[]>([])
  const [consistency, setConsistency] = useState<ConsistencySummary | null>(null)
  const [metrics, setMetrics] = useState<OperationsMetrics | null>(null)
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [sseConnected, setSseConnected] = useState(false)

  const [actionLoading, setActionLoading] = useState<string>('')
  const [confirmRepairDocId, setConfirmRepairDocId] = useState<string | null>(null)
  const [confirmReplayDocId, setConfirmReplayDocId] = useState<string | null>(null)
  const [replayStage, setReplayStage] = useState<'EXTRACTED' | 'INTELLIGENCE_DONE'>('EXTRACTED')

  const eventsRef = useRef<HTMLDivElement | null>(null)
  const queuesRef = useRef<QueueSnapshot | null>(null)

  const derivedWorkerStatus: HealthStatus = useMemo(() => {
    if (!health) return 'unknown'
    return health.status || 'unknown'
  }, [health])

  const derivedRedisStatus: HealthStatus = useMemo(() => {
    const s = health?.redis?.status
    if (!s) return 'unknown'
    return s === 'healthy' ? 'healthy' : 'critical'
  }, [health])

  const fetchHealth = useCallback(async () => {
    const res = await fetch('/api/die/operations/health')
    if (!res.ok) throw new Error((await res.json())?.error || 'Health fetch failed')
    const json = await res.json()
    setHealth(json.data)
  }, [])

  const fetchQueues = useCallback(async () => {
    const res = await fetch('/api/die/operations/queues')
    if (!res.ok) throw new Error((await res.json())?.error || 'Queue fetch failed')
    const json = await res.json()
    setQueues(json.data)
    queuesRef.current = json.data
  }, [])

  const fetchFailedJobs = useCallback(async () => {
    const res = await fetch('/api/die/operations/failed-jobs')
    if (!res.ok) throw new Error((await res.json())?.error || 'Failed jobs fetch failed')
    const json = await res.json()
    setFailedJobs(json.data?.jobs || [])
  }, [])

  const fetchStuckDocs = useCallback(async () => {
    const res = await fetch('/api/die/operations/stuck-documents')
    if (!res.ok) throw new Error((await res.json())?.error || 'Stuck docs fetch failed')
    const json = await res.json()
    setStuckDocs(json.data?.documents || [])
  }, [])

  const fetchConsistency = useCallback(async () => {
    const res = await fetch('/api/die/operations/consistency')
    if (!res.ok) throw new Error((await res.json())?.error || 'Consistency fetch failed')
    const json = await res.json()
    setConsistency(json.data?.summary || null)
  }, [])

  const fetchMetrics = useCallback(async () => {
    const res = await fetch('/api/die/operations/metrics')
    if (!res.ok) throw new Error((await res.json())?.error || 'Metrics fetch failed')
    const json = await res.json()
    setMetrics(json.data)
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([fetchHealth(), fetchQueues(), fetchFailedJobs(), fetchStuckDocs(), fetchConsistency(), fetchMetrics()])
    } catch (e: any) {
      showError(e?.message || 'Failed to load operations dashboard')
    } finally {
      setLoading(false)
    }
  }, [fetchHealth, fetchQueues, fetchFailedJobs, fetchStuckDocs, fetchConsistency, fetchMetrics])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  // Polling fallback (SSE may be blocked by proxy)
  useEffect(() => {
    if (sseConnected) return
    const id = setInterval(() => {
      void fetchQueues().catch(() => {})
      void fetchFailedJobs().catch(() => {})
      void fetchHealth().catch(() => {})
      void fetchMetrics().catch(() => {})
    }, 5000)
    return () => clearInterval(id)
  }, [fetchQueues, fetchFailedJobs, fetchHealth, fetchMetrics, sseConnected])

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}m`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  const retryFailedJob = async (jobId: string, queue: FailedJobRow['queue']) => {
    setActionLoading(`retry:${jobId}`)
    try {
      const res = await fetch('/api/die/operations/failed-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, queue }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Retry failed')
      success('Retry triggered')
      await Promise.all([fetchFailedJobs(), fetchQueues(), fetchHealth()])
    } catch (e: any) {
      showError(e?.message || 'Retry failed')
    } finally {
      setActionLoading('')
    }
  }

  const repairDocument = async (documentId: string) => {
    setActionLoading(`repair:${documentId}`)
    try {
      const res = await fetch('/api/die/operations/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Repair failed')
      success('Repair triggered')
      await Promise.all([fetchStuckDocs(), fetchConsistency(), fetchHealth()])
    } catch (e: any) {
      showError(e?.message || 'Repair failed')
    } finally {
      setActionLoading('')
    }
  }

  const replayDocument = async (documentId: string) => {
    setActionLoading(`replay:${documentId}`)
    try {
      const res = await fetch('/api/die/operations/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, stage: replayStage, fullReplay: replayStage === 'EXTRACTED' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Replay failed')
      success('Replay triggered')
      await Promise.all([fetchStuckDocs(), fetchConsistency(), fetchHealth()])
    } catch (e: any) {
      showError(e?.message || 'Replay failed')
    } finally {
      setActionLoading('')
    }
  }

  useEffect(() => {
    let es: EventSource | null = null
    try {
      es = new EventSource('/api/die/events/stream')
      es.onopen = () => setSseConnected(true)
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          const current = queuesRef.current

          if (data?.queues && typeof data.queues === 'object') {
            const next: QueueSnapshot = {
              extraction: {
                waiting: data.queues.extraction?.waiting ?? current?.extraction.waiting ?? 0,
                active: data.queues.extraction?.active ?? current?.extraction.active ?? 0,
                completed: data.queues.extraction?.completed ?? current?.extraction.completed ?? 0,
                failed: data.queues.extraction?.failed ?? current?.extraction.failed ?? 0,
              },
              intelligence: {
                waiting: data.queues.intelligence?.waiting ?? current?.intelligence.waiting ?? 0,
                active: data.queues.intelligence?.active ?? current?.intelligence.active ?? 0,
                completed: data.queues.intelligence?.completed ?? current?.intelligence.completed ?? 0,
                failed: data.queues.intelligence?.failed ?? current?.intelligence.failed ?? 0,
              },
              dlq: current?.dlq || { extract: 0, intelligence: 0 },
              timestamp: data.ts ?? Date.now(),
            }
            queuesRef.current = next
            setQueues(next)
          }

          if (Array.isArray(data?.recentEvents)) {
            setEvents(data.recentEvents)
          }

          if (data?.opsMetrics) {
            setMetrics(data.opsMetrics)
          }
        } catch {
          // ignore
        }
      }
      es.onerror = () => {
        setSseConnected(false)
        es?.close()
      }
    } catch {
      // ignore
    }

    return () => {
      es?.close()
    }
  }, [])

  useEffect(() => {
    if (!eventsRef.current) return
    // keep pinned to top; newest-first. no auto-scroll needed.
  }, [events])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/die" className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Terminal className="w-6 h-6" /> DIE Operations
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Operational monitoring, queue health, and repair controls
                {sseConnected && (
                  <span className="ml-2 text-green-600 inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => void loadAll()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-imboni-blue/90 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading && !health && !queues ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-slate-400" />
            <p className="text-sm text-slate-500 mt-3">Loading operations dashboard…</p>
          </div>
        ) : (
          <>
            {/* SYSTEM HEALTH */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatusCard
                title="System Status"
                status={derivedWorkerStatus}
                icon={derivedWorkerStatus === 'healthy' ? CheckCircle : derivedWorkerStatus === 'critical' ? XCircle : AlertCircle}
                details={health?.lastHeartbeat ? `Last heartbeat: ${new Date(health.lastHeartbeat).toLocaleTimeString()}` : 'No heartbeat detected'}
              />
              <StatusCard
                title="Redis Status"
                status={derivedRedisStatus}
                icon={Database}
                details={health?.redis?.error}
              />
              <StatusCard
                title="SSE Connection"
                status={sseConnected ? 'healthy' : 'warning'}
                icon={Server}
                details={sseConnected ? 'Connected to live events stream' : 'Disconnected (polling fallback active)'}
              />
            </div>

            {/* OPERATIONAL METRICS */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Server className="w-5 h-5" /> Operational Metrics
              </h2>

              {metrics ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Lifecycle Distribution</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {['OCR_PROCESSING', 'EXTRACTED', 'REVIEW', 'APPROVED', 'APPLIED', 'FAILED'].map((k) => (
                        <div key={k} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                          <span className="text-slate-600">{k.replaceAll('_', ' ')}</span>
                          <span className="font-semibold text-slate-800">{metrics.lifecycleDistribution[k] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Worker Throughput</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">Docs / hour</p>
                        <p className="text-xl font-bold text-slate-800">{metrics.throughput.docsPerHour}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">Avg proc time</p>
                        <p className="text-xl font-bold text-slate-800">{metrics.throughput.avgProcessingTimeMinutes ?? '—'}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">Queue latency</p>
                        <p className="text-xl font-bold text-slate-800">{metrics.throughput.queueLatencyMinutes ?? '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Repair Metrics (Today)</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-700">Repaired</p>
                        <p className="text-xl font-bold text-green-800">{metrics.repairMetrics.repairedToday}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-xs text-amber-700">Replayed</p>
                        <p className="text-xl font-bold text-amber-800">{metrics.repairMetrics.replayedToday}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="text-xs text-red-700">Failed repairs</p>
                        <p className="text-xl font-bold text-red-800">{metrics.repairMetrics.failedRepairsToday}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Anomaly Metrics</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="text-xs text-red-700">Open</p>
                        <p className="text-xl font-bold text-red-800">{metrics.anomalyMetrics.open}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-xs text-amber-700">Acknowledged</p>
                        <p className="text-xl font-bold text-amber-800">{metrics.anomalyMetrics.acknowledged}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-700">Resolved</p>
                        <p className="text-xl font-bold text-green-800">{metrics.anomalyMetrics.resolved}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                </div>
              )}
            </div>

            {/* QUEUE HEALTH */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5" /> Queue Health
              </h2>

              {queues ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <QueueCard title="Extraction Queue" snapshot={queues.extraction} />
                  <QueueCard title="Intelligence Queue" snapshot={queues.intelligence} />
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                </div>
              )}

              {queues && (queues.dlq.extract > 0 || queues.dlq.intelligence > 0) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Dead Letter Queues</p>
                      <p className="text-sm text-red-600">Extract: {queues.dlq.extract} · Intelligence: {queues.dlq.intelligence}</p>
                    </div>
                  </div>
                  <a href="#failed-jobs" className="text-sm font-medium text-red-700 hover:text-red-800">
                    View Jobs →
                  </a>
                </div>
              )}
            </div>

            {/* FAILED JOBS */}
            <div id="failed-jobs" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <XCircle className="w-5 h-5" /> Failed Jobs
                </h2>
                <span className="text-sm text-slate-500">{failedJobs.length} jobs</span>
              </div>

              {failedJobs.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-medium">No failed jobs</p>
                  <p className="text-sm text-green-600">All queues are processing normally</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Job ID</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Queue</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Document</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Error</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {failedJobs.slice(0, 25).map((job) => (
                        <tr key={job.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{job.id.slice(0, 12)}…</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${job.queue === 'extract' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                              {job.queue}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {job.document ? (
                              <Link href={`/dashboard/die/review/${job.document.id}`} className="text-imboni-blue hover:underline">
                                {job.document.type}
                              </Link>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-red-600 text-xs max-w-xs truncate" title={job.failedReason}>
                            {job.failedReason}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => void retryFailedJob(job.id, job.queue)}
                              disabled={actionLoading === `retry:${job.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-imboni-blue rounded-lg hover:bg-imboni-blue/90 disabled:opacity-50"
                            >
                              {actionLoading === `retry:${job.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                              Retry
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* STUCK DOCUMENTS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Stuck Documents
                </h2>
                <span className="text-sm text-slate-500">{stuckDocs.length} candidates</span>
              </div>

              {stuckDocs.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-medium">No stuck documents</p>
                  <p className="text-sm text-green-600">No repair candidates detected</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Document</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Supplier</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Lifecycle</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Age</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Issue</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stuckDocs.slice(0, 25).map((doc) => (
                        <tr key={doc.documentId} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <Link href={`/dashboard/die/review/${doc.documentId}`} className="font-medium text-imboni-blue hover:underline">
                              {doc.documentId.slice(0, 10)}…
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{doc.supplier}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                              {doc.lifecycleState}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-amber-600 font-medium">{formatDuration(doc.ageMinutes)}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate" title={doc.reason}>
                            {doc.reason}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setConfirmRepairDocId(doc.documentId)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100"
                              >
                                <Wrench className="w-3 h-3" /> Repair
                              </button>
                              <button
                                onClick={() => setConfirmReplayDocId(doc.documentId)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                              >
                                <Play className="w-3 h-3" /> Replay
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* CONSISTENCY */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5" /> Consistency Health
              </h2>

              {consistency ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Documents Checked</p>
                    <p className="text-2xl font-bold text-slate-800">{consistency.documentsChecked}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Issues Found</p>
                    <p className="text-2xl font-bold text-amber-600">{consistency.issuesFound}</p>
                  </div>
                  <div className={`rounded-xl border p-4 ${consistency.repairCandidates > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                    <p className={`text-sm ${consistency.repairCandidates > 0 ? 'text-red-600' : 'text-slate-500'}`}>Repair Candidates</p>
                    <p className={`text-2xl font-bold ${consistency.repairCandidates > 0 ? 'text-red-700' : 'text-slate-800'}`}>{consistency.repairCandidates}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <p className="text-sm text-slate-500">Severity Distribution</p>
                    <div className="flex gap-2 mt-1 text-xs">
                      <span className="text-slate-600">L:{consistency.bySeverity.LOW}</span>
                      <span className="text-amber-600">M:{consistency.bySeverity.MEDIUM}</span>
                      <span className="text-orange-600">H:{consistency.bySeverity.HIGH}</span>
                      <span className="text-red-600">C:{consistency.bySeverity.CRITICAL}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
                </div>
              )}
            </div>

            {/* LIVE EVENTS */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Terminal className="w-5 h-5" /> Live Events
              </h2>

              <div ref={eventsRef} className="bg-white rounded-xl border border-slate-200 h-80 overflow-y-auto">
                {events.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent events</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {events.map((event) => (
                      <div key={event.id} className="p-3 hover:bg-slate-50 flex items-start gap-3">
                        <EventBadge type={event.type} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">{event.message}</p>
                          <p className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleTimeString()}</p>
                        </div>
                        {event.level === 'error' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <ConfirmModal
              isOpen={Boolean(confirmRepairDocId)}
              onClose={() => setConfirmRepairDocId(null)}
              onConfirm={() => {
                if (confirmRepairDocId) void repairDocument(confirmRepairDocId)
              }}
              title="Repair Document"
              message="This will attempt to repair the document lifecycle and may replay processing stages. Continue?"
              confirmText="Repair"
              cancelText="Cancel"
              type="warning"
            />

            <ConfirmModal
              isOpen={Boolean(confirmReplayDocId)}
              onClose={() => setConfirmReplayDocId(null)}
              onConfirm={() => {
                if (confirmReplayDocId) void replayDocument(confirmReplayDocId)
              }}
              title="Replay Document"
              message="This will re-run processing stages for the document. Continue?"
              confirmText="Replay"
              cancelText="Cancel"
              type="info"
            />

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-600 mb-2">Replay stage</p>
              <select
                value={replayStage}
                onChange={(e) => setReplayStage(e.target.value as any)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2"
              >
                <option value="EXTRACTED">Full Replay (from extraction)</option>
                <option value="INTELLIGENCE_DONE">Replay from intelligence</option>
              </select>
            </div>

            {confirmRepairDocId && actionLoading === `repair:${confirmRepairDocId}` && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400">Repair in progress…</p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
