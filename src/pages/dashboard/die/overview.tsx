import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import { useToast } from '@/components/ui/Toast'
import {
  ArrowLeft,
  BarChart2,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Zap,
} from 'lucide-react'

const DIEVolumeChart = dynamic<{ data: { day: string; docs: number }[] }>(
  () => import('@/components/die/DIEVolumeChart'),
  { ssr: false },
)
const DIETrendChart = dynamic<{ data: any[]; xKey: string; yKey: string; color: string }>(
  () => import('@/components/die/DIETrendChart'),
  { ssr: false },
)

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

type OverviewData = {
  kpis: {
    documentsProcessedToday: number
    approvalRate: number
    anomalyRate: number
    reconciliationSuccessRate: number
    avgProcessingTimeMinutes: number | null
  }
  charts: {
    dailyVolume: Array<{ day: string; docs: number }>
    anomalyTrends: Array<{ day: string; anomalies: number }>
    approvalTrends: Array<{ day: string; approvals: number }>
    processingTimeTrends: Array<{ day: string; minutes: number | null }>
  }
}

type OperationsHealth = {
  status: string
  redis: { status: string; error?: string }
  lastHeartbeat: string | null
}

type QueueSnapshot = {
  extraction: { waiting: number; active: number; completed: number; failed: number }
  intelligence: { waiting: number; active: number; completed: number; failed: number }
  dlq: { extract: number; intelligence: number }
}

function StatCard({ title, value, icon: Icon, color, sub }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <div className={`p-2 rounded-xl ${color}`}><Icon className="w-4 h-4" /></div>
      </div>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function DIEOverview() {
  const { error: showError } = useToast()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<OverviewData | null>(null)
  const [health, setHealth] = useState<OperationsHealth | null>(null)
  const [queues, setQueues] = useState<QueueSnapshot | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [o, h, q] = await Promise.all([
        fetch('/api/die/overview/metrics').then((r) => r.json()),
        fetch('/api/die/operations/health').then((r) => r.json()),
        fetch('/api/die/operations/queues').then((r) => r.json()),
      ])

      setData(o.data)
      setHealth(h.data)
      setQueues(q.data)
    } catch (e: any) {
      showError(e?.message || 'Failed to load overview')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const queueHealthy = useMemo(() => {
    if (!queues) return null
    return queues.dlq.extract + queues.dlq.intelligence === 0
  }, [queues])

  if (loading && !data) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue" /></div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/die" className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-6 h-6" /> Executive Overview
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">High-level DIE monitoring</p>
            </div>
          </div>

          <button
            onClick={() => void fetchAll()}
            className="flex items-center gap-2 px-4 py-2 bg-imboni-blue text-white rounded-lg hover:bg-imboni-blue/90"
          >
            <Activity className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            title="Processed Today"
            value={data?.kpis.documentsProcessedToday ?? 0}
            icon={Zap}
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            title="Approval Rate"
            value={`${data?.kpis.approvalRate ?? 0}%`}
            icon={CheckCircle}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            title="Anomaly Rate"
            value={`${data?.kpis.anomalyRate ?? 0}%`}
            icon={AlertTriangle}
            color="bg-red-100 text-red-600"
          />
          <StatCard
            title="Reconciliation Success"
            value={`${data?.kpis.reconciliationSuccessRate ?? 0}%`}
            icon={Server}
            color="bg-emerald-100 text-emerald-700"
          />
          <StatCard
            title="Avg Processing Time"
            value={data?.kpis.avgProcessingTimeMinutes ?? '—'}
            sub={data?.kpis.avgProcessingTimeMinutes != null ? 'minutes' : ''}
            icon={Clock}
            color="bg-amber-100 text-amber-600"
          />
        </div>

        {/* Health */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Worker Health</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Status: {health?.status || 'unknown'}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Last heartbeat: {health?.lastHeartbeat ? new Date(health.lastHeartbeat).toLocaleString() : '—'}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Queue Health</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              DLQ: {queues ? `${queues.dlq.extract + queues.dlq.intelligence}` : '—'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {queueHealthy === null ? '—' : queueHealthy ? 'Healthy' : 'Attention required'}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Daily Volume</h2>
            <div className="h-48">
              <DIEVolumeChart data={data?.charts.dailyVolume || []} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Anomaly Trends</h2>
            <div className="h-48">
              <DIETrendChart data={data?.charts.anomalyTrends || []} xKey="day" yKey="anomalies" color="#E76F51" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Approval Trends</h2>
            <div className="h-48">
              <DIETrendChart data={data?.charts.approvalTrends || []} xKey="day" yKey="approvals" color="#10b981" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Processing Time Trends</h2>
            <div className="h-48">
              <DIETrendChart data={(data?.charts.processingTimeTrends || []).map((d) => ({ ...d, minutes: d.minutes ?? 0 }))} xKey="day" yKey="minutes" color="#1B2D65" />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
