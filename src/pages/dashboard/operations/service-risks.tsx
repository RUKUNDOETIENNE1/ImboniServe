/**
 * Service Risks Dashboard
 *
 * Real-time view of active service promise risks (warnings and breaches).
 * Auto-refreshes every 30 seconds.
 */

import { useState, useEffect, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import DashboardLayout from '@/components/DashboardLayout'
import { useTranslation } from '@/lib/i18n'
import {
  AlertTriangle, AlertOctagon, CheckCircle, XCircle, Clock,
  RefreshCw, TrendingUp, Activity, Zap
} from 'lucide-react'

const ALLOWED_ROLES = new Set(['OWNER', 'MANAGER', 'ADMIN', 'SUPERVISOR', 'CHEF', 'KITCHEN_STAFF'])

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)

  if (!session?.user) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const roles: string[] = (session.user as any).roles || []
  if (!roles.some(r => ALLOWED_ROLES.has(r))) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }

  return {
    props: {
      businessId: (session.user as any).businessId || '',
      timezone: (session.user as any).timezone || 'Africa/Kigali',
    },
  }
}

interface ServiceRisksPageProps {
  businessId: string
  timezone: string
}

interface ActiveRisk {
  id: string
  saleId: string
  orderNumber: string
  promiseType: string
  state: 'WARNING' | 'CRITICAL'
  elapsedMinutes: number
  warningAfterMinutes: number
  breachAfterMinutes: number
  expectedAt: string
  startedAt: string
}

interface RiskStats {
  active: number
  today: {
    total: number
    fulfilled: number
    failed: number
    recovered: number
    onTimeRate: number
  }
}

export default function ServiceRisksPage({ businessId, timezone }: ServiceRisksPageProps) {
  const { t } = useTranslation()
  const [risks, setRisks] = useState<ActiveRisk[]>([])
  const [stats, setStats] = useState<RiskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    try {
      const [risksRes, statsRes] = await Promise.all([
        fetch('/api/service-risks'),
        fetch('/api/service-risks/stats'),
      ])

      if (!risksRes.ok || !statsRes.ok) throw new Error('Failed to fetch data')

      const risksData = await risksRes.json()
      const statsData = await statsRes.json()

      setRisks(risksData.risks || [])
      setStats(statsData)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load service risks')
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const criticalRisks = risks.filter((r) => r.state === 'CRITICAL')
  const warningRisks = risks.filter((r) => r.state === 'WARNING')

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Risks</h1>
            <p className="text-sm text-gray-500 mt-1">
              Active service promise monitoring • Last updated {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Activity className="h-5 w-5 text-blue-600" />}
            label="Active Promises"
            value={stats?.active ?? '—'}
            color="bg-blue-50 border-blue-200"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
            label="On-Time Rate Today"
            value={stats ? `${stats.today.onTimeRate}%` : '—'}
            color="bg-emerald-50 border-emerald-200"
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5 text-green-600" />}
            label="Fulfilled Today"
            value={stats?.today.fulfilled ?? '—'}
            color="bg-green-50 border-green-200"
          />
          <StatCard
            icon={<XCircle className="h-5 w-5 text-red-600" />}
            label="Failed Today"
            value={stats?.today.failed ?? '—'}
            color="bg-red-50 border-red-200"
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading service risks...</span>
          </div>
        )}

        {/* No Risks */}
        {!loading && risks.length === 0 && !error && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center">
            <CheckCircle className="mx-auto h-10 w-10 text-emerald-600" />
            <h3 className="mt-2 text-lg font-semibold text-emerald-900">All Clear</h3>
            <p className="mt-1 text-sm text-emerald-700">
              No active service risks. All orders are on track.
            </p>
          </div>
        )}

        {/* Critical Risks */}
        {!loading && criticalRisks.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-red-900">
              <AlertOctagon className="h-5 w-5 text-red-600" />
              Critical ({criticalRisks.length})
            </h2>
            <div className="space-y-3">
              {criticalRisks.map((risk) => (
                <RiskCard key={risk.id} risk={risk} />
              ))}
            </div>
          </div>
        )}

        {/* Warning Risks */}
        {!loading && warningRisks.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-900">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Warnings ({warningRisks.length})
            </h2>
            <div className="space-y-3">
              {warningRisks.map((risk) => (
                <RiskCard key={risk.id} risk={risk} />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className={`rounded-lg border p-4 ${color}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function RiskCard({ risk }: { risk: ActiveRisk }) {
  const isCritical = risk.state === 'CRITICAL'
  const bgColor = isCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
  const textColor = isCritical ? 'text-red-700' : 'text-amber-700'
  const icon = isCritical ? (
    <AlertOctagon className="h-5 w-5 text-red-600" />
  ) : (
    <AlertTriangle className="h-5 w-5 text-amber-600" />
  )

  const elapsed = risk.elapsedMinutes
  const breachIn = risk.breachAfterMinutes - elapsed

  return (
    <div className={`rounded-lg border p-4 ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className={`font-semibold ${textColor}`}>
              Order #{risk.orderNumber}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {risk.promiseType.replace(/_/g, ' ').toLowerCase()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${textColor}`}>
            {elapsed}m
          </p>
          <p className="text-xs text-gray-500">
            {isCritical
              ? `Breached ${Math.abs(breachIn)}m ago`
              : `${breachIn}m to breach`}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Warning at {risk.warningAfterMinutes}m
        </span>
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Breach at {risk.breachAfterMinutes}m
        </span>
      </div>
    </div>
  )
}
