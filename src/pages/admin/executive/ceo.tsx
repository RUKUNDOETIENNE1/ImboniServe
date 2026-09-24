import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import AdminLayout from '@/components/AdminLayout'
import FocusCard, { BriefData } from '@/components/executive/FocusCard'
import DailyBrief, { DailyBriefData } from '@/components/executive/DailyBrief'
import HealthOverview, { HealthScoreData } from '@/components/executive/HealthOverview'
import KpiCard from '@/components/executive/KpiCard'
import GrowthSnapshot, { GrowthSnapshotData } from '@/components/executive/GrowthSnapshot'
import RevenueSnapshot, { RevenueSnapshotData } from '@/components/executive/RevenueSnapshot'
import FounderEcosystem, { FounderEcosystemData } from '@/components/executive/FounderEcosystem'
import RestaurantEcosystem, { RestaurantEcosystemData } from '@/components/executive/RestaurantEcosystem'
import AttentionCenter, { AttentionItem } from '@/components/executive/AttentionCenter'
import AIAssistant, { AIRecommendation } from '@/components/executive/AIAssistant'
import { useCurrency } from '@/contexts/LocaleContext'

interface CeoData {
  dailySummary: any
  weeklySummary: any
  latestSummary: any
  financialHealth: any
  financialPriorities: any[]
  topPartners: any[]
  campaignPerformance: any[]
  partnerTypeLTV: any[]
  commissionSummary: any[]
  totalCommissionLiability: any
  partnersRequiringAttention: any
  paymentHealth: string
  queueHealth: string
  reconciliationHealth: string
  subscriptionHealth: string
  activeBusinesses: number
  activePartners: number
  pendingApplications: number
  pendingPayouts: number
  expiringAgreements: any[]
  regionalPerformance: any[]
  attentionItems: AttentionItem[]
  healthScores: Record<string, HealthScoreData> & { overall?: { score: number; status: any } }
  recommendations: AIRecommendation[]
  generatedAt: string
}

export default function CeoOperatingCenter({ userName }: { userName: string }) {
  const router = useRouter()
  const { currency } = useCurrency()
  const [data, setData] = useState<CeoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/executive/ceo')
      if (!res.ok) {
        if (res.status === 403) {
          setError('You do not have permission to access the CEO Operating Center.')
          return
        }
        throw new Error(`Failed to load: ${res.status}`)
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CEO data')
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

  // Build Focus Card data
  const focusData: BriefData | null = data ? {
    greeting: `${greeting}, ${userName}`,
    yesterdaySummary: data.latestSummary
      ? data.latestSummary.revenue
      : 'Summary loading...',
    companyHealth: data.healthScores.overall
      ? `Overall health: ${data.healthScores.overall.score}/100 (${data.healthScores.overall.status})`
      : 'Health loading...',
    topPriorities: data.financialPriorities.slice(0, 3).map(p => p.title),
    criticalAlerts: data.attentionItems
      .filter(a => a.severity === 'CRITICAL')
      .slice(0, 3)
      .map(a => a.title),
    aiRecommendation: data.recommendations[0]?.answer || 'No recommendations at this time.',
  } : null

  // Build Daily Brief data
  const briefData: DailyBriefData | null = data ? {
    yesterday: [
      { label: 'Revenue', value: `${Math.round(data.dailySummary.revenue.yesterday / 100).toLocaleString()} ${currency}` },
      { label: 'Change', value: `${data.dailySummary.revenue.changePercent >= 0 ? '+' : ''}${data.dailySummary.revenue.changePercent.toFixed(1)}%` },
      { label: 'New Subscriptions', value: String(data.dailySummary.subscriptions.new) },
      { label: 'Failed Renewals', value: String(data.dailySummary.subscriptions.failedRenewals) },
    ],
    today: [
      { label: 'Pending Applications', value: String(data.pendingApplications) },
      { label: 'Pending Payouts', value: String(data.pendingPayouts) },
      { label: 'Expiring Agreements', value: String(data.expiringAgreements.length) },
    ],
    risks: data.latestSummary?.risks || [],
    opportunities: data.latestSummary?.opportunities || [],
    pendingApprovals: [
      { label: 'Applications', value: String(data.pendingApplications) },
      { label: 'Payouts', value: String(data.pendingPayouts) },
    ],
    founderActivity: [
      `${data.activePartners} active partners`,
      data.topPartners[0] ? `Top: ${data.topPartners[0].name || 'Unknown'}` : '',
    ].filter(Boolean),
    restaurantActivity: [
      `${data.activeBusinesses} active businesses`,
      data.dailySummary.branches.topPerformer ? `Top: ${data.dailySummary.branches.topPerformer.name}` : '',
    ].filter(Boolean),
    financialSummary: `MRR: ${Math.round(data.financialHealth.mrr.value / 100).toLocaleString()} ${currency}, ARR: ${Math.round(data.financialHealth.arr.value / 100).toLocaleString()} ${currency}`,
    strategicRecommendation: data.recommendations[0]?.suggestedActions[0] || 'Monitor operations and review priorities.',
  } : null

  // Build Growth Snapshot data
  const growthData: GrowthSnapshotData | null = data ? {
    revenueTrend: data.weeklySummary.revenue.trend,
    revenueChangePercent: data.weeklySummary.revenue.changePercent,
    newCustomers: data.weeklySummary.customers.newCustomers,
    churnedCustomers: data.weeklySummary.customers.churnedCustomers,
    netCustomerChange: data.weeklySummary.customers.netChange,
    newSubscriptions: data.weeklySummary.subscriptions.newSubscriptions,
    cancellations: data.weeklySummary.subscriptions.cancellations,
    churnRate: data.weeklySummary.subscriptions.churnRate,
    activeBusinesses: data.activeBusinesses,
    activePartners: data.activePartners,
    regionalPerformance: data.regionalPerformance,
  } : null

  // Build Revenue Snapshot data
  const revenueData: RevenueSnapshotData | null = data ? {
    mrr: data.financialHealth.mrr,
    arr: data.financialHealth.arr,
    gmv: data.financialHealth.gmv,
    revenueChurn: data.financialHealth.revenueChurn,
    netRevenueRetention: data.financialHealth.netRevenueRetention,
    revenueGrowth: data.financialHealth.revenueGrowth,
    totalCommissionLiability: { totalLiabilityCents: data.totalCommissionLiability.totalLiabilityCents, pendingCount: data.totalCommissionLiability.totalCommissionCount },
  } : null

  // Build Founder Ecosystem data
  const founderData: FounderEcosystemData | null = data ? {
    activePartners: data.activePartners,
    pendingApplications: data.pendingApplications,
    topPartners: data.topPartners,
    campaignPerformance: data.campaignPerformance,
    inactivePartners: data.partnersRequiringAttention?.suspended?.length || 0,
    commissionSummary: data.commissionSummary,
    totalCommissionLiability: { totalLiabilityCents: data.totalCommissionLiability.totalLiabilityCents, pendingCount: data.totalCommissionLiability.totalCommissionCount },
    expiringAgreements: data.expiringAgreements,
  } : null

  // Build Restaurant Ecosystem data
  const restaurantData: RestaurantEcosystemData | null = data ? {
    activeBusinesses: data.activeBusinesses,
    topPerformer: data.dailySummary.branches.topPerformer,
    bottomPerformer: data.dailySummary.branches.bottomPerformer,
    newSubscriptions: data.dailySummary.subscriptions.new,
    failedRenewals: data.dailySummary.subscriptions.failedRenewals,
    inGrace: data.dailySummary.subscriptions.inGrace,
    customerHealthDistribution: data.dailySummary.customers.healthDistribution,
    activeCustomers: data.dailySummary.customers.activeCount,
  } : null

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
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

        {/* 1. CEO Focus Card */}
        <FocusCard data={focusData} loading={loading} />

        {/* 2. Executive Daily Brief */}
        <DailyBrief data={briefData} loading={loading} />

        {/* 3. Company Health Overview */}
        <HealthOverview scores={data?.healthScores || {}} loading={loading} />

        {/* 4. Strategic KPI Center */}
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-3">Strategic KPI Center</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="MRR Growth"
              value={data ? `${data.financialHealth.mrr.changePercent >= 0 ? '+' : ''}${data.financialHealth.mrr.changePercent.toFixed(1)}%` : '—'}
              subValue={data ? `${Math.round(data.financialHealth.mrr.value / 100).toLocaleString()} ${currency}` : ''}
              trend={data?.financialHealth.mrr.changePercent > 0 ? 'UP' : data?.financialHealth.mrr.changePercent < 0 ? 'DOWN' : 'FLAT'}
              status={data?.financialHealth.mrr.status === 'GROWTH' ? 'HEALTHY' : data?.financialHealth.mrr.status === 'DECLINE' ? 'CRITICAL' : 'WARNING'}
              drillDownHref="/admin/revenue-analytics"
              onClick={() => handleNavigate('/admin/revenue-analytics')}
              explanation="Monthly recurring revenue growth rate"
            />
            <KpiCard
              label="Active Businesses"
              value={data ? String(data.activeBusinesses) : '—'}
              trend={data?.weeklySummary.revenue.trend === 'UP' ? 'UP' : 'FLAT'}
              status="HEALTHY"
              drillDownHref="/admin/restaurants"
              onClick={() => handleNavigate('/admin/restaurants')}
              explanation="Hospitality businesses currently active on platform"
            />
            <KpiCard
              label="Active Partners"
              value={data ? String(data.activePartners) : '—'}
              status="HEALTHY"
              drillDownHref="/admin/founder-partners"
              onClick={() => handleNavigate('/admin/founder-partners')}
              explanation="Founder partners with ACTIVE status"
            />
            <KpiCard
              label="Revenue (30d)"
              value={data ? `${Math.round(data.financialHealth.gmv.value / 100).toLocaleString()} ${currency}` : '—'}
              trend={data?.financialHealth.gmv.changePercent > 0 ? 'UP' : data?.financialHealth.gmv.changePercent < 0 ? 'DOWN' : 'FLAT'}
              trendValue={data ? `${data.financialHealth.gmv.changePercent >= 0 ? '+' : ''}${data.financialHealth.gmv.changePercent.toFixed(1)}%` : ''}
              status={data?.financialHealth.revenueGrowth.status === 'STRONG' ? 'HEALTHY' : data?.financialHealth.revenueGrowth.status === 'NEGATIVE' ? 'CRITICAL' : 'WARNING'}
              drillDownHref="/admin/revenue-operations"
              onClick={() => handleNavigate('/admin/revenue-operations')}
              explanation="Gross merchandise value (last 30 days)"
            />
          </div>
        </div>

        {/* 5 & 6. Growth and Revenue Snapshots */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GrowthSnapshot data={growthData} loading={loading} onNavigate={handleNavigate} />
          <RevenueSnapshot data={revenueData} loading={loading} onNavigate={handleNavigate} />
        </div>

        {/* 7 & 8. Ecosystems */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FounderEcosystem data={founderData} loading={loading} onNavigate={handleNavigate} />
          <RestaurantEcosystem data={restaurantData} loading={loading} onNavigate={handleNavigate} />
        </div>

        {/* 9. Attention Center */}
        <AttentionCenter items={data?.attentionItems || []} loading={loading} onNavigate={handleNavigate} />

        {/* 10. AI Executive Assistant */}
        <AIAssistant recommendations={data?.recommendations || []} loading={loading} onNavigate={handleNavigate} />

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
        destination: '/auth/signin?callbackUrl=/admin/executive/ceo',
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
      userName: (session.user as any).name || 'Executive',
    },
  }
}
