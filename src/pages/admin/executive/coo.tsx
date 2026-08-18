import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { RefreshCw, AlertCircle, Activity } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import OperationsPulse from '@/components/executive/OperationsPulse'
import CooDailyBrief from '@/components/executive/CooDailyBrief'
import OperationalHealthCenter from '@/components/executive/OperationalHealthCenter'
import RestaurantOperations from '@/components/executive/RestaurantOperations'
import FounderOperations from '@/components/executive/FounderOperations'
import SupportOperations from '@/components/executive/SupportOperations'
import WorkflowPerformance from '@/components/executive/WorkflowPerformance'
import CapacityCenter from '@/components/executive/CapacityCenter'
import OperationalAttentionCenter from '@/components/executive/OperationalAttentionCenter'
import AIOperationsAssistant from '@/components/executive/AIOperationsAssistant'
import { useCurrency } from '@/contexts/LocaleContext'
import type { GetServerSideProps } from 'next'

interface CooData {
  operationsScore: number
  dailySummary: any
  weeklySummary: any
  paymentHealth: string
  queueHealth: string
  reconciliationHealth: string
  subscriptionHealth: string
  operationalHealth: any[]
  restaurantOps: any
  founderOps: any
  supportOps: any
  workflows: any[]
  capacity: any
  attentionItems: any[]
  recommendations: any[]
  branchHealthScores: any[]
  customerHealthDistribution: any
  partnersRequiringAttention: any
  expiringAgreements: any[]
  generatedAt: string
}

export default function CooOperatingCenter() {
  const router = useRouter()
  const { currency } = useCurrency()
  const [data, setData] = useState<CooData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/executive/coo')
      if (res.status === 403) {
        setError('You do not have permission to access the COO Operating Center.')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch COO intelligence')
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleNavigate = (link: string) => {
    router.push(link)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  // Build brief data from API response
  const briefData = data ? {
    yesterday: [
      { label: 'Revenue', value: `${Math.round(data.dailySummary?.revenue?.yesterday || 0).toLocaleString()} ${currency}` },
      { label: 'Change', value: `${(data.dailySummary?.revenue?.changePercent || 0).toFixed(1)}%` },
      { label: 'New Businesses', value: (data.restaurantOps?.newYesterday || 0).toString() },
    ],
    todayWorkload: [
      { label: 'Pending Applications', value: (data.founderOps?.applications?.pending || 0).toString() },
      { label: 'Open Support', value: (data.supportOps?.openTickets || 0).toString() },
      { label: 'Pending Payouts', value: (data.capacity?.pendingApprovals || 0).toString() },
    ],
    achievements: [
      ...(data.supportOps?.resolvedYesterday > 0 ? [`${data.supportOps.resolvedYesterday} support conversations resolved`] : []),
      ...(data.restaurantOps?.newYesterday > 0 ? [`${data.restaurantOps.newYesterday} new businesses onboarded`] : []),
    ],
    pendingWork: [
      { label: 'Applications', value: (data.founderOps?.applications?.pending || 0).toString() },
      { label: 'Support Queue', value: (data.supportOps?.workload || 0).toString() },
      { label: 'Follow-ups', value: (data.restaurantOps?.followUpNeeded || 0).toString() },
    ],
    risks: (data.attentionItems || []).filter((a: any) => a.severity === 'CRITICAL' || a.severity === 'HIGH').map((a: any) => a.title),
    escalations: (data.partnersRequiringAttention?.suspended || []).map((p: any) => `Suspended: ${p.name || p.partnershipId}`),
    recommendations: (data.recommendations || []).map((r: any) => r.answer),
    resourceConstraints: data.capacity?.unassignedSupport > 0 ? [`${data.capacity.unassignedSupport} unassigned support conversations`] : [],
  } : null

  // Build pulse data from API response
  const pulseData = data ? {
    operationsScore: data.operationsScore,
    paymentHealth: data.paymentHealth,
    queueHealth: data.queueHealth,
    reconciliationHealth: data.reconciliationHealth,
    subscriptionHealth: data.subscriptionHealth,
    restaurantsWaitingOnboarding: data.restaurantOps?.inactiveBusinesses || 0,
    founderActivationsPending: data.founderOps?.applications?.pending || 0,
    supportQueue: data.supportOps?.openTickets || 0,
    criticalIncidents: (data.attentionItems || []).filter((a: any) => a.severity === 'CRITICAL').length,
    averageResponseTime: data.supportOps?.slaCompliance >= 90 ? '< 2h' : data.supportOps?.slaCompliance >= 70 ? '< 8h' : '> 8h',
    operationalCapacity: data.capacity?.expansionReadiness ? 'Ready' : 'Constrained',
    todaySummary: `Operations score: ${data.operationsScore}/100. ${data.attentionItems?.length || 0} items need attention.`,
  } : null

  return (
    <AdminLayout title="COO Operating Center">
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900">COO Operating Center</h1>
              </div>
              <p className="text-sm text-slate-500 mt-1">{greeting}. Here is your operational command center.</p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Error state */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">{error}</p>
              </div>
              {!error.includes('permission') && (
                <button onClick={fetchData} className="text-sm text-red-600 hover:text-red-700 font-medium">
                  Retry
                </button>
              )}
            </div>
          )}

          {/* Section 1: Operations Pulse */}
          <OperationsPulse data={pulseData} loading={loading} onNavigate={handleNavigate} />

          {/* Section 2: COO Daily Brief */}
          <CooDailyBrief data={briefData} loading={loading} />

          {/* Section 3: Operational Health Center */}
          <OperationalHealthCenter
            areas={data?.operationalHealth || []}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 4: Hospitality Business Operations */}
          <RestaurantOperations
            data={data?.restaurantOps || null}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 5: Founder Operations */}
          <FounderOperations
            data={data?.founderOps || null}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 6: Support Operations */}
          <SupportOperations
            data={data?.supportOps || null}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 7: Workflow Performance */}
          <WorkflowPerformance
            workflows={data?.workflows || []}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 8: Capacity Center */}
          <CapacityCenter data={data?.capacity || null} loading={loading} />

          {/* Section 9: Operational Attention Center */}
          <OperationalAttentionCenter
            items={data?.attentionItems || []}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 10: AI Operations Assistant */}
          <AIOperationsAssistant
            recommendations={data?.recommendations || []}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Footer */}
          {data?.generatedAt && (
            <p className="text-xs text-slate-400 text-center pt-4">
              Last updated: {new Date(data.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  const userRoles = (session.user as any).roles || [(session.user as any).role]
  const allowed = ['COO', 'ADMIN', 'OPERATIONS_MANAGER', 'EXECUTIVE']

  if (!userRoles.some((r: string) => allowed.includes(r))) {
    return {
      redirect: {
        destination: '/admin',
        permanent: false,
      },
    }
  }

  return { props: {} }
}
