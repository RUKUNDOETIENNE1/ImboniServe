import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { RefreshCw, AlertCircle, Heart } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import CustomerSuccessPulse from '@/components/executive/CustomerSuccessPulse'
import CustomerSuccessDailyBrief from '@/components/executive/CustomerSuccessDailyBrief'
import CustomerJourneyIntelligence from '@/components/executive/CustomerJourneyIntelligence'
import CustomerHealthCenter from '@/components/executive/CustomerHealthCenter'
import AdoptionIntelligence from '@/components/executive/AdoptionIntelligence'
import CustomerEngagementCenter from '@/components/executive/CustomerEngagementCenter'
import RetentionExpansionCenter from '@/components/executive/RetentionExpansionCenter'
import SuccessOpportunityCenter from '@/components/executive/SuccessOpportunityCenter'
import CustomerAttentionCenter from '@/components/executive/CustomerAttentionCenter'
import AICustomerSuccessAssistant from '@/components/executive/AICustomerSuccessAssistant'
import type { GetServerSideProps } from 'next'

interface CustomerSuccessData {
  customerSuccessHealthScore: number
  retentionRate: number
  churnRate: number
  adoptionRate: number
  activationRate: number
  dailySummary: any
  weeklySummary: any
  customerHealthDistribution: any
  subscriptionIntelligence: any
  journey: any
  activeBusinesses: number
  totalBusinesses: number
  inactiveBusinesses: number
  newBusinesses7d: number
  newBusinesses30d: number
  newActivations7d: number
  newActivations30d: number
  trialBusinesses: number
  trialExpiringSoon: any[]
  activeSubscriptions: number
  trialSubscriptions: number
  gracePeriodSubscriptions: number
  pastDueSubscriptions: number
  cancelledSubscriptions30d: number
  subscriptionsRenewingSoon: any[]
  totalBranches: number
  activeBranches: number
  totalCustomers: number
  activeCustomers30d: number
  activeCustomers7d: number
  newCustomers7d: number
  newCustomers30d: number
  dormantCustomers90d: number
  businessesByType: any[]
  businessesByCity: any[]
  businessesByPlan: any[]
  topBusinessesByRevenue: any[]
  topBusinessesByCustomers: any[]
  topBusinessesByActivity: any[]
  lowActivityBusinesses: number
  noRecentActivityBusinesses: number
  openSupportConversations: number
  highPrioritySupport: number
  recentSupportConversations: any[]
  totalUsers: number
  activeUsers7d: number
  activeUsers30d: number
  renewalsNext30d: number
  expansionCandidates: any[]
  qrEnabledBusinesses: number
  remoteOrderEnabledBusinesses: number
  businessesWithRecentSales: number
  totalSales7d: number
  totalSales30d: number
  attentionItems: any[]
  recommendations: any[]
  opportunities: any[]
  generatedAt: string
}

export default function CustomerSuccessDirectorOperatingCenter() {
  const router = useRouter()
  const [data, setData] = useState<CustomerSuccessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/executive/customer-success-director')
      if (res.status === 403) {
        setError('You do not have permission to access the Customer Success Director Operating Center.')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch customer success intelligence')
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

  // Build pulse data from API response
  const pulseData = data ? {
    customerSuccessHealthScore: data.customerSuccessHealthScore,
    activeBusinesses: data.activeBusinesses,
    newActivations: data.newActivations7d,
    businessesAtRisk: data.lowActivityBusinesses + data.noRecentActivityBusinesses,
    healthyBusinesses: data.activeBusinesses - data.lowActivityBusinesses - data.noRecentActivityBusinesses > 0
      ? data.activeBusinesses - data.lowActivityBusinesses - data.noRecentActivityBusinesses
      : 0,
    retentionRate: data.retentionRate,
    expansionOpportunities: data.expansionCandidates.length,
    todaySummary: `Customer success health: ${data.customerSuccessHealthScore}/100. ${data.activeBusinesses} active hospitality businesses, ${data.trialBusinesses} in trial, ${data.activeCustomers30d} active customers, ${data.attentionItems?.length || 0} items need attention.`,
  } : null

  // Build brief data from API response
  const briefData = data ? {
    yesterday: [
      { label: 'Active Businesses', value: data.activeBusinesses.toString() },
      { label: 'Active Customers (30d)', value: data.activeCustomers30d.toString() },
      { label: 'Sales (7d)', value: data.totalSales7d.toString() },
    ],
    todayPriorities: [
      { label: 'Trials Expiring', value: (data.trialExpiringSoon?.length || 0).toString() },
      { label: 'Grace Period Subs', value: data.gracePeriodSubscriptions.toString() },
      { label: 'High-Priority Support', value: data.highPrioritySupport.toString() },
    ],
    newActivations: [
      { label: 'New Businesses (7d)', value: data.newBusinesses7d.toString() },
      { label: 'New Businesses (30d)', value: data.newBusinesses30d.toString() },
      { label: 'New Activations (7d)', value: data.newActivations7d.toString() },
    ],
    customersRequiringAttention: [
      { label: 'Low Activity Businesses', value: data.lowActivityBusinesses.toString() },
      { label: 'No Activity (60d+)', value: data.noRecentActivityBusinesses.toString() },
      { label: 'Dormant Customers (90d+)', value: data.dormantCustomers90d.toString() },
    ],
    successHighlights: [
      data.newBusinesses7d > 0 ? `${data.newBusinesses7d} new businesses in last 7 days` : '',
      data.activeSubscriptions > 0 ? `${data.activeSubscriptions} active subscriptions` : '',
      data.expansionCandidates.length > 0 ? `${data.expansionCandidates.length} expansion candidates identified` : '',
      data.retentionRate >= 90 ? `Strong retention at ${data.retentionRate}%` : '',
    ].filter(Boolean),
    retentionRisks: [
      data.gracePeriodSubscriptions > 0 ? `${data.gracePeriodSubscriptions} subscriptions in grace period` : '',
      data.pastDueSubscriptions > 0 ? `${data.pastDueSubscriptions} past due subscriptions` : '',
      data.cancelledSubscriptions30d > 0 ? `${data.cancelledSubscriptions30d} cancellations in 30 days` : '',
      data.noRecentActivityBusinesses > 0 ? `${data.noRecentActivityBusinesses} businesses with no activity (60d+)` : '',
    ].filter(Boolean),
    recommendations: (data.recommendations || []).slice(0, 3).map((r: any) => r.answer),
  } : null

  // Build health center data
  const healthCenterData = data ? {
    overallHealthScore: data.customerSuccessHealthScore,
    healthDistribution: {
      excellent: data.customerHealthDistribution?.excellent || 0,
      healthy: data.customerHealthDistribution?.healthy || 0,
      atRisk: data.customerHealthDistribution?.atRisk || 0,
      critical: data.customerHealthDistribution?.critical || 0,
    },
    highRiskBusinesses: data.lowActivityBusinesses + data.noRecentActivityBusinesses,
    improvingBusinesses: data.newActivations30d,
    decliningBusinesses: data.noRecentActivityBusinesses,
    healthTrends: [
      { label: 'Customer Activity (30d)', value: `${data.activeCustomers30d}`, trend: data.newCustomers7d > 0 ? 'UP' as const : 'FLAT' as const },
      { label: 'Business Adoption', value: `${data.adoptionRate}%`, trend: data.businessesWithRecentSales > data.totalBusinesses * 0.5 ? 'UP' as const : 'FLAT' as const },
      { label: 'Retention', value: `${data.retentionRate}%`, trend: data.cancelledSubscriptions30d === 0 ? 'UP' as const : data.cancelledSubscriptions30d > 3 ? 'DOWN' as const : 'FLAT' as const },
      { label: 'Dormant Customers', value: `${data.dormantCustomers90d}`, trend: data.dormantCustomers90d > data.totalCustomers * 0.3 ? 'DOWN' as const : 'FLAT' as const },
    ],
  } : null

  // Build adoption data
  const adoptionData = data ? {
    adoptionRate: data.adoptionRate,
    businessesWithRecentSales: data.businessesWithRecentSales,
    totalBusinesses: data.totalBusinesses,
    qrEnabledBusinesses: data.qrEnabledBusinesses,
    remoteOrderEnabledBusinesses: data.remoteOrderEnabledBusinesses,
    activeBranches: data.activeBranches,
    totalBranches: data.totalBranches,
    activeUsers7d: data.activeUsers7d,
    activeUsers30d: data.activeUsers30d,
    totalUsers: data.totalUsers,
    totalSales7d: data.totalSales7d,
    totalSales30d: data.totalSales30d,
    underutilizedFeatures: [
      { label: 'QR In-Venue Ordering', count: data.totalBusinesses - data.qrEnabledBusinesses, link: '/admin/restaurants' },
      { label: 'Remote Ordering', count: data.totalBusinesses - data.remoteOrderEnabledBusinesses, link: '/admin/restaurants' },
    ].filter((f) => f.count > 0),
  } : null

  // Build engagement data
  const engagementData = data ? {
    totalCustomers: data.totalCustomers,
    activeCustomers30d: data.activeCustomers30d,
    activeCustomers7d: data.activeCustomers7d,
    newCustomers7d: data.newCustomers7d,
    newCustomers30d: data.newCustomers30d,
    dormantCustomers90d: data.dormantCustomers90d,
    openSupportConversations: data.openSupportConversations,
    highPrioritySupport: data.highPrioritySupport,
    recentSupportConversations: data.recentSupportConversations || [],
    totalUsers: data.totalUsers,
    activeUsers7d: data.activeUsers7d,
  } : null

  // Build retention/expansion data
  const retentionData = data ? {
    retentionRate: data.retentionRate,
    churnRate: data.churnRate,
    activeSubscriptions: data.activeSubscriptions,
    trialSubscriptions: data.trialSubscriptions,
    gracePeriodSubscriptions: data.gracePeriodSubscriptions,
    pastDueSubscriptions: data.pastDueSubscriptions,
    cancelledSubscriptions30d: data.cancelledSubscriptions30d,
    renewalsNext30d: data.renewalsNext30d,
    subscriptionsRenewingSoon: data.subscriptionsRenewingSoon || [],
    expansionCandidates: data.expansionCandidates || [],
  } : null

  return (
    <AdminLayout title="Customer Success Director Operating Center">
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-rose-600" />
                <h1 className="text-2xl font-bold text-slate-900">Customer Success Director Operating Center</h1>
              </div>
              <p className="text-sm text-slate-500 mt-1">{greeting}. Here is your customer success command center.</p>
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

          {/* Section 1: Customer Success Pulse */}
          <CustomerSuccessPulse data={pulseData} loading={loading} onNavigate={handleNavigate} />

          {/* Section 2: Customer Success Daily Brief */}
          <CustomerSuccessDailyBrief data={briefData} loading={loading} />

          {/* Section 3: Customer Journey Intelligence */}
          <CustomerJourneyIntelligence data={data?.journey || null} loading={loading} onNavigate={handleNavigate} />

          {/* Section 4: Customer Health Center */}
          <CustomerHealthCenter data={healthCenterData} loading={loading} onNavigate={handleNavigate} />

          {/* Section 5: Adoption Intelligence */}
          <AdoptionIntelligence data={adoptionData} loading={loading} onNavigate={handleNavigate} />

          {/* Section 6: Customer Engagement Center */}
          <CustomerEngagementCenter data={engagementData} loading={loading} onNavigate={handleNavigate} />

          {/* Section 7: Retention & Expansion Center */}
          <RetentionExpansionCenter data={retentionData} loading={loading} onNavigate={handleNavigate} />

          {/* Section 8: Success Opportunity Center */}
          <SuccessOpportunityCenter
            data={data ? { opportunities: data.opportunities } : null}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 9: Customer Attention Center */}
          <CustomerAttentionCenter
            data={data ? { items: data.attentionItems } : null}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 10: AI Customer Success Assistant */}
          <AICustomerSuccessAssistant
            data={data ? { recommendations: data.recommendations } : null}
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
        destination: '/auth/signin?callbackUrl=/admin/executive/customer-success-director',
        permanent: false,
      },
    }
  }

  const userRoles = (session.user as any).roles || [(session.user as any).role]
  const allowed = ['CUSTOMER_SUCCESS_DIRECTOR', 'ADMIN', 'CUSTOMER_SUCCESS_MANAGER', 'EXECUTIVE']

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
