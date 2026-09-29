import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import AdminLayout from '@/components/AdminLayout'
import FinancialFocusCard, { FinancialFocusData } from '@/components/executive/FinancialFocusCard'
import FinancialDailyBrief, { FinancialBriefData } from '@/components/executive/FinancialDailyBrief'
import FinancialIntegrityCenter, { IntegrityData } from '@/components/executive/FinancialIntegrityCenter'
import RevenueOverview, { RevenueOverviewData } from '@/components/executive/RevenueOverview'
import CashCollections, { CollectionsData } from '@/components/executive/CashCollections'
import LiabilityCenter, { LiabilityData } from '@/components/executive/LiabilityCenter'
import ForecastCenter, { ForecastData } from '@/components/executive/ForecastCenter'
import RevenueQualityCenter, { RevenueQualityData } from '@/components/executive/RevenueQualityCenter'
import FinancialAttentionCenter, { FinancialAttentionItem } from '@/components/executive/FinancialAttentionCenter'
import AIFinancialAssistant, { FinancialRecommendation } from '@/components/executive/AIFinancialAssistant'
import { useCurrency } from '@/contexts/LocaleContext'

interface CfoData {
  financialHealth: any
  financialOperations: any
  financialPriorities: any[]
  revenueIntelligence: any
  subscriptionIntelligence: any
  cfoInsights: any
  cfoNarratives: any
  cfoCorrelations: any[]
  collections: any
  liabilities: any
  revenueQuality: any
  forecast: any
  integrity: any
  commissionSummary: any[]
  totalCommissionLiability: any
  paymentHealth: string
  reconciliationHealth: string
  subscriptionHealth: string
  dailySummary: any
  pendingPayouts: number
  failedPayments: number
  attentionItems: FinancialAttentionItem[]
  recommendations: FinancialRecommendation[]
  generatedAt: string
}

export default function CfoOperatingCenter({ userName }: { userName: string }) {
  const router = useRouter()
  const { currency } = useCurrency()
  const [data, setData] = useState<CfoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/executive/cfo')
      if (!res.ok) {
        if (res.status === 403) {
          setError('You do not have permission to access the CFO Operating Center.')
          return
        }
        throw new Error(`Failed to load: ${res.status}`)
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CFO data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleNavigate = useCallback((link: string) => {
    router.push(link)
  }, [router])

  // ─── Transform API data into component props ───

  const focusData: FinancialFocusData | null = data ? {
    greeting: getGreeting(),
    revenueYesterday: data.financialHealth?.gmv?.value || 0,
    revenueYesterdayChange: data.financialHealth?.gmv?.changePercent || 0,
    collections: data.collections?.totalCollected30d || 0,
    cashPosition: data.financialHealth?.mrr?.value || 0,
    outstandingLiabilities: (data.totalCommissionLiability?.totalLiabilityCents || 0) / 100,
    integrityScore: data.integrity?.overallScore || 0,
    criticalAlerts: data.attentionItems
      .filter((a: FinancialAttentionItem) => a.severity === 'CRITICAL')
      .map((a: FinancialAttentionItem) => ({ title: a.title, description: a.description })),
    aiSummary: data.recommendations[0]?.answer || 'Financial analysis in progress.',
  } : null

  const briefData: FinancialBriefData | null = data ? {
    yesterday: [
      { label: 'Revenue', value: `${Math.round(data.financialHealth?.gmv?.value || 0).toLocaleString()} ${currency}` },
      { label: 'MRR', value: `${Math.round(data.financialHealth?.mrr?.value || 0).toLocaleString()} ${currency}` },
      { label: 'Change', value: `${data.financialHealth?.gmv?.changePercent >= 0 ? '+' : ''}${(data.financialHealth?.gmv?.changePercent || 0).toFixed(1)}%` },
    ],
    today: [
      { label: 'Pending Payouts', value: data.pendingPayouts?.toString() || '0' },
      { label: 'Failed Payments', value: data.failedPayments?.toString() || '0' },
      { label: 'Payment Health', value: data.paymentHealth || 'N/A' },
    ],
    collections: [
      { label: 'Collected (30d)', value: `${Math.round(data.collections?.totalCollected30d || 0).toLocaleString()} ${currency}` },
      { label: 'Failed Impact', value: `${Math.round(data.collections?.failedPaymentImpact || 0).toLocaleString()} ${currency}` },
      { label: 'Refunds', value: `${data.collections?.refundCount || 0} (${Math.round(data.collections?.refundAmount || 0).toLocaleString()} ${currency})` },
    ],
    forecast: [
      { label: 'Expected MRR', value: `${Math.round(data.forecast?.expectedMRR || 0).toLocaleString()} ${currency}` },
      { label: 'Growth Rate', value: `${(data.forecast?.revenueGrowthRate30d || 0).toFixed(1)}%` },
      { label: 'Confidence', value: `${data.forecast?.confidence || 0}%` },
    ],
    outstandingLiabilities: [
      { label: 'Commission', value: `${Math.round((data.totalCommissionLiability?.totalLiabilityCents || 0) / 100).toLocaleString()} ${currency}` },
      { label: 'Pending Payouts', value: data.pendingPayouts?.toString() || '0' },
      { label: 'Refunds', value: `${data.collections?.refundCount || 0}` },
    ],
    cashOutlook: data.cfoNarratives?.financialHealth?.narrative || 'Cash position stable.',
    pendingApprovals: [
      { label: 'Payouts', value: data.pendingPayouts?.toString() || '0' },
      { label: 'Commissions', value: (data.totalCommissionLiability?.totalCommissionCount || 0).toString() },
    ],
    risks: data.financialPriorities
      .filter((p: any) => p.level === 'CRITICAL' || p.level === 'HIGH')
      .slice(0, 3)
      .map((p: any) => p.title),
    recommendations: data.financialPriorities
      .filter((p: any) => p.level === 'LOW' || p.level === 'INFO')
      .slice(0, 2)
      .map((p: any) => p.action),
  } : null

  const integrityData: IntegrityData | null = data?.integrity ? {
    overallScore: data.integrity.overallScore,
    reconciliationRate: data.integrity.reconciliationRate,
    reconciliationStatus: data.integrity.reconciliationStatus,
    totalLedgerEntries: data.integrity.totalLedgerEntries,
    reconciledEntries: data.integrity.reconciledEntries,
    unreconciledEntries: data.integrity.unreconciledEntries,
    paymentSystemHealth: data.integrity.paymentSystemHealth,
    dataQualityScore: data.integrity.dataQualityScore,
    settlementDelayDays: data.integrity.settlementDelayDays,
    available: data.integrity.available,
  } : null

  const revenueOverviewData: RevenueOverviewData | null = data ? {
    mrr: data.financialHealth?.mrr?.value || 0,
    mrrChange: data.financialHealth?.mrr?.changePercent || 0,
    mrrStatus: data.financialHealth?.mrr?.status || 'STABLE',
    arr: data.financialHealth?.arr?.value || 0,
    arrChange: data.financialHealth?.arr?.changePercent || 0,
    gmv: data.financialHealth?.gmv?.value || 0,
    gmvChange: data.financialHealth?.gmv?.changePercent || 0,
    subscriptionRevenue: data.revenueQuality?.subscriptionRevenue || 0,
    marketplaceRevenue: data.revenueQuality?.marketplaceRevenue || 0,
    directSalesRevenue: data.revenueIntelligence?.bySource?.directSales || 0,
    growthRate30d: data.financialHealth?.revenueGrowth?.rate30d || 0,
    growthRate90d: data.financialHealth?.revenueGrowth?.rate90d || 0,
    growthStatus: data.financialHealth?.revenueGrowth?.status || 'WEAK',
    mrrTrend: data.financialHealth?.mrr?.trend || [],
    forecastVariance: (data.financialHealth?.revenueGrowth?.rate30d || 0) - (data.financialHealth?.revenueGrowth?.rate90d || 0),
  } : null

  const collectionsData: CollectionsData | null = data?.collections ? {
    totalCollected30d: data.collections.totalCollected30d,
    failedPayments: data.collections.failedPayments,
    failedPaymentImpact: data.collections.failedPaymentImpact,
    pendingPayouts: data.collections.pendingPayouts,
    refundAmount: data.collections.refundAmount,
    refundCount: data.collections.refundCount,
    retrySuccessRate: data.collections.retrySuccessRate,
    expectedInflow: data.collections.expectedInflow,
  } : null

  const liabilityData: LiabilityData | null = data?.liabilities ? {
    totalCommissionLiabilityCents: data.liabilities.totalCommissionLiabilityCents,
    commissionCount: data.liabilities.commissionCount,
    topLiabilities: data.liabilities.topLiabilities || [],
    pendingPayouts: data.liabilities.pendingPayouts,
    refundObligations: data.liabilities.refundObligations,
    refundCount: data.liabilities.refundCount,
  } : null

  const forecastData: ForecastData | null = data?.forecast ? {
    expectedMRR: data.forecast.expectedMRR,
    expectedARR: data.forecast.expectedARR,
    revenueGrowthRate30d: data.forecast.revenueGrowthRate30d,
    revenueGrowthRate90d: data.forecast.revenueGrowthRate90d,
    growthStatus: data.forecast.growthStatus,
    mrrTrend: data.forecast.mrrTrend || [],
    confidence: data.forecast.confidence,
  } : null

  const revenueQualityData: RevenueQualityData | null = data?.revenueQuality ? {
    bySource: data.revenueQuality.bySource,
    concentration: data.revenueQuality.concentration,
    topContributors: data.revenueQuality.topContributors || [],
    drivers: data.revenueQuality.drivers,
    segmentDistribution: data.revenueQuality.segmentDistribution,
    subscriptionRevenue: data.revenueQuality.subscriptionRevenue,
    marketplaceRevenue: data.revenueQuality.marketplaceRevenue,
  } : null

  return (
    <AdminLayout>
      <div className="px-4 py-6 md:px-6 md:py-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">CFO Operating Center</h1>
            <p className="text-sm text-slate-500 mt-1">Financial Command Center — Audit-ready, evidence-based, traceable</p>
          </div>
          {data && (
            <div className="text-xs text-slate-400">
              Last updated: {new Date(data.generatedAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchData}
              className="mt-2 text-sm text-red-600 underline hover:text-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. Financial Focus Card */}
        <FinancialFocusCard data={focusData} loading={loading} />

        {/* 2. Financial Daily Brief */}
        <FinancialDailyBrief data={briefData} loading={loading} />

        {/* 3. Financial Integrity Center */}
        <FinancialIntegrityCenter data={integrityData} loading={loading} onNavigate={handleNavigate} />

        {/* 4. Revenue Overview */}
        <RevenueOverview data={revenueOverviewData} loading={loading} onNavigate={handleNavigate} />

        {/* 5. Cash & Collections */}
        <CashCollections data={collectionsData} loading={loading} onNavigate={handleNavigate} />

        {/* 6. Liability Center */}
        <LiabilityCenter data={liabilityData} loading={loading} onNavigate={handleNavigate} />

        {/* 7. Forecast Center */}
        <ForecastCenter data={forecastData} loading={loading} onNavigate={handleNavigate} />

        {/* 8. Revenue Quality Center */}
        <RevenueQualityCenter data={revenueQualityData} loading={loading} onNavigate={handleNavigate} />

        {/* 9. Financial Attention Center */}
        <FinancialAttentionCenter items={data?.attentionItems || []} loading={loading} onNavigate={handleNavigate} />

        {/* 10. AI Financial Assistant */}
        <AIFinancialAssistant recommendations={data?.recommendations || []} loading={loading} onNavigate={handleNavigate} />
      </div>
    </AdminLayout>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)

  if (!session || !session.user) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/executive/cfo',
        permanent: false,
      },
    }
  }

  const roles = (session.user as any).roles || [(session.user as any).role]
  const allowed = ['CFO', 'ADMIN', 'FINANCE', 'EXECUTIVE']
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
      userName: (session.user as any).name || 'CFO',
    },
  }
}
