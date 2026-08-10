import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import AdminLayout from '@/components/AdminLayout'
import IntelligencePulse, { IntelligencePulseData } from '@/components/executive/IntelligencePulse'
import CenterHealthRadar, { CenterHealthRadarData } from '@/components/executive/CenterHealthRadar'
import ExecutiveDecisions, { ExecutiveDecision } from '@/components/executive/ExecutiveDecisions'
import ExecutivePriorityQueue, { PriorityQueueItem } from '@/components/executive/ExecutivePriorityQueue'
import TrendExplanations, { TrendExplanation } from '@/components/executive/TrendExplanations'
import BusinessRisks, { BusinessRisk } from '@/components/executive/BusinessRisks'
import GrowthOpportunities, { GrowthOpportunity } from '@/components/executive/GrowthOpportunities'
import ExecutiveKeyMetrics, { ExecutiveKeyMetricsData } from '@/components/executive/ExecutiveKeyMetrics'
import CrossCenterEvidence, { CrossCenterEvidenceData } from '@/components/executive/CrossCenterEvidence'
import AIIntelligenceAssistant, { IntelligenceInsight } from '@/components/executive/AIIntelligenceAssistant'

interface IntelligenceData {
  overallScore: number
  overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL'
  centerScores: Record<string, { score: number; status: string; center: string }>
  executiveDecisions: ExecutiveDecision[]
  priorityQueue: PriorityQueueItem[]
  trendExplanations: TrendExplanation[]
  businessRisks: BusinessRisk[]
  growthOpportunities: GrowthOpportunity[]
  financialHealth: any
  operationalHealth: any
  subscriptionIntelligence: any
  customerHealthDistribution: any
  metrics: any
  generatedAt: string
}

const centerLinks: Record<string, string> = {
  'CFO': '/admin/executive/cfo',
  'COO': '/admin/executive/coo',
  'CMO': '/admin/executive/cmo',
  'Partnership Director': '/admin/executive/partnership-director',
  'Customer Success Director': '/admin/executive/customer-success-director',
}

export default function ExecutiveIntelligenceCenter({ userName }: { userName: string }) {
  const router = useRouter()
  const [data, setData] = useState<IntelligenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/executive/executive-intelligence')
      if (!res.ok) {
        if (res.status === 403) {
          setError('You do not have permission to access the Executive Intelligence Engine.')
          return
        }
        throw new Error(`Failed to load: ${res.status}`)
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Executive Intelligence data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleNavigate = (link: string) => router.push(link)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  // Shape Intelligence Pulse data
  const pulseData: IntelligencePulseData | null = data ? {
    overallScore: data.overallScore,
    overallStatus: data.overallStatus,
    centerScores: data.centerScores,
    topDecision: data.executiveDecisions[0]?.decision || 'No cross-center decisions at this time.',
    criticalItems: data.priorityQueue.filter(i => i.priority === 'CRITICAL').length,
    highItems: data.priorityQueue.filter(i => i.priority === 'HIGH').length,
    totalRisks: data.businessRisks.length,
    totalOpportunities: data.growthOpportunities.length,
  } : null

  // Shape Center Health Radar data
  const radarData: CenterHealthRadarData | null = data ? {
    centers: Object.entries(data.centerScores).map(([key, val]) => ({
      name: val.center,
      score: val.score,
      status: val.status as 'HEALTHY' | 'WARNING' | 'CRITICAL',
      link: centerLinks[val.center] || '/admin',
    })),
  } : null

  // Shape Key Metrics data
  const metricsData: ExecutiveKeyMetricsData | null = data ? {
    activeBusinesses: data.metrics.activeBusinesses,
    totalBusinesses: data.metrics.totalBusinesses,
    inactiveBusinesses: data.metrics.inactiveBusinesses,
    newBusinesses7d: data.metrics.newBusinesses7d,
    activeSubscriptions: data.metrics.activeSubscriptions,
    trialSubscriptions: data.metrics.trialSubscriptions,
    gracePeriodSubscriptions: data.metrics.gracePeriodSubscriptions,
    pastDueSubscriptions: data.metrics.pastDueSubscriptions,
    retentionRate: data.metrics.retentionRate,
    churnRate: data.metrics.churnRate,
    adoptionRate: data.metrics.adoptionRate,
    activePartners: data.metrics.activePartners,
    totalPartnerships: data.metrics.totalPartnerships,
    totalCustomers: data.metrics.totalCustomers,
    activeCustomers30d: data.metrics.activeCustomers30d,
    openSupportConversations: data.metrics.openSupportConversations,
    totalBranches: data.metrics.totalBranches,
    activeBranches: data.metrics.activeBranches,
    qrEnabledBusinesses: data.metrics.qrEnabledBusinesses,
    remoteOrderEnabledBusinesses: data.metrics.remoteOrderEnabledBusinesses,
  } : null

  // Shape Cross-Center Evidence data
  const evidenceData: CrossCenterEvidenceData | null = data ? {
    financialHealth: data.financialHealth,
    operationalHealth: data.operationalHealth,
  } : null

  // Shape AI Intelligence insights from executive decisions
  const intelligenceInsights: IntelligenceInsight[] | null = data ? data.executiveDecisions.map(d => ({
    question: d.decision.length > 80 ? d.decision.slice(0, 77) + '...' : d.decision,
    answer: d.reasoning,
    evidence: d.evidence,
    confidence: d.confidence,
    centers: d.centers,
    suggestedActions: d.suggestedActions,
  })) : null

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Executive Intelligence Engine</h1>
            <p className="text-sm text-slate-500 mt-1">{greeting}, {userName}. Unified decision intelligence across all executive centers.</p>
          </div>
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={fetchData}
              className="mt-3 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. Intelligence Pulse */}
        <IntelligencePulse data={pulseData} loading={loading} onNavigate={handleNavigate} />

        {/* 2. Center Health Radar */}
        <CenterHealthRadar data={radarData} loading={loading} onNavigate={handleNavigate} />

        {/* 3. Executive Decisions (Cross-Center AI Synthesis) */}
        <ExecutiveDecisions data={data?.executiveDecisions || null} loading={loading} onNavigate={handleNavigate} />

        {/* 4. Executive Priority Queue */}
        <ExecutivePriorityQueue data={data?.priorityQueue || null} loading={loading} onNavigate={handleNavigate} />

        {/* 5 & 6. Trends and Risks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendExplanations data={data?.trendExplanations || null} loading={loading} />
          <BusinessRisks data={data?.businessRisks || null} loading={loading} />
        </div>

        {/* 7. Growth Opportunities */}
        <GrowthOpportunities data={data?.growthOpportunities || null} loading={loading} />

        {/* 8. Key Metrics Dashboard */}
        <ExecutiveKeyMetrics data={metricsData} loading={loading} onNavigate={handleNavigate} />

        {/* 9. Cross-Center Evidence */}
        <CrossCenterEvidence data={evidenceData} loading={loading} onNavigate={handleNavigate} />

        {/* 10. AI Intelligence Assistant */}
        <AIIntelligenceAssistant data={intelligenceInsights} loading={loading} onNavigate={handleNavigate} />

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-4">
          {data && `Last updated: ${new Date(data.generatedAt).toLocaleString()}`}
        </div>
      </div>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)

  if (!session || !session.user) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/executive/executive-intelligence',
        permanent: false,
      },
    }
  }

  const roles = (session.user as any).roles || [(session.user as any).role]
  const allowed = ['CEO', 'ADMIN', 'EXECUTIVE']
  const hasAccess = roles?.some((r: string) => allowed.includes(r))

  if (!hasAccess) {
    return {
      redirect: {
        destination: '/admin',
        permanent: false,
      },
    }
  }

  return {
    props: {
      userName: session.user.name || session.user.email || 'Executive',
    },
  }
}
