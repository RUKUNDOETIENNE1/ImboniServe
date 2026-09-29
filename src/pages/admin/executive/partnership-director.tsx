import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { RefreshCw, AlertCircle, Network } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import PartnershipPulse from '@/components/executive/PartnershipPulse'
import PartnershipDailyBrief from '@/components/executive/PartnershipDailyBrief'
import PartnershipPipeline from '@/components/executive/PartnershipPipeline'
import PartnerPortfolio from '@/components/executive/PartnerPortfolio'
import AgreementCenter from '@/components/executive/AgreementCenter'
import CampaignIntelligence from '@/components/executive/CampaignIntelligence'
import PartnerPerformance from '@/components/executive/PartnerPerformance'
import CommissionPayoutOverview from '@/components/executive/CommissionPayoutOverview'
import PartnershipOpportunityCenter from '@/components/executive/PartnershipOpportunityCenter'
import PartnershipAttentionCenter from '@/components/executive/PartnershipAttentionCenter'
import AIPartnershipAssistant from '@/components/executive/AIPartnershipAssistant'
import { useCurrency } from '@/contexts/LocaleContext'
import type { GetServerSideProps } from 'next'

interface PartnershipDirectorData {
  partnershipHealthScore: number
  dailySummary: any
  weeklySummary: any
  pipeline: any
  partnersByType: any[]
  partnersByRegion: any[]
  partnersByStatus: any[]
  topPartnersBySignups: any[]
  topPartnersByConversions: any[]
  topPartnersByRevenue: any[]
  campaignPerformance: any[]
  regionalPerformance: any[]
  partnershipTypeLTV: any[]
  cacByPartnerType: any[]
  commissionSummary: any
  totalCommissionLiability: any
  pendingPayouts: any[]
  recentPayouts: any[]
  paidPayouts30d: any
  failedPayouts: number
  activeBusinesses: number
  totalBusinesses: number
  newBusinesses7d: number
  newBusinesses30d: number
  totalPartnerships: number
  activePartnerships: number
  suspendedPartnerships: number
  prospectPartnerships: number
  appliedPartnerships: number
  onboardedPartnerships: number
  terminatedPartnerships: number
  pendingApplications: number
  underReviewApplications: number
  approvedApplications: number
  rejectedApplications: number
  activeCampaigns: number
  draftCampaigns: number
  pausedCampaigns: number
  completedCampaigns: number
  activeCodes: number
  totalCodes: number
  exhaustedCodes: number
  expiredCodes: number
  activeAgreements: number
  draftAgreements: number
  expiredAgreements: number
  terminatedAgreements: number
  pendingSignatures: number
  expiringAgreements: any[]
  healthScores: any[]
  riskProfiles: any[]
  partnersRequiringAttention: any
  attentionItems: any[]
  recommendations: any[]
  opportunities: any[]
  generatedAt: string
}

export default function PartnershipDirectorOperatingCenter() {
  const router = useRouter()
  const { currency } = useCurrency()
  const [data, setData] = useState<PartnershipDirectorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/executive/partnership-director')
      if (res.status === 403) {
        setError('You do not have permission to access the Partnership Director Operating Center.')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch partnership intelligence')
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
    partnershipHealthScore: data.partnershipHealthScore,
    totalPartners: data.totalPartnerships,
    activePartners: data.activePartnerships,
    newApplications: data.pendingApplications + data.underReviewApplications,
    pendingApprovals: data.pendingApplications,
    activeCampaigns: data.activeCampaigns,
    activeCodes: data.activeCodes,
    relationshipHealth: data.partnershipHealthScore >= 70 ? 'HEALTHY' : data.partnershipHealthScore >= 40 ? 'WARNING' : 'CRITICAL',
    todaySummary: `Partnership health: ${data.partnershipHealthScore}/100. ${data.activePartnerships} active partners, ${data.pendingApplications} pending applications, ${data.activeCampaigns} active campaigns, ${data.attentionItems?.length || 0} items need attention.`,
  } : null

  // Build brief data from API response
  const briefData = data ? {
    yesterday: [
      { label: 'Active Partners', value: data.activePartnerships.toString() },
      { label: 'New Businesses (7d)', value: data.newBusinesses7d.toString() },
      { label: 'Active Campaigns', value: data.activeCampaigns.toString() },
    ],
    todayPriorities: [
      { label: 'Pending Applications', value: data.pendingApplications.toString() },
      { label: 'Pending Payouts', value: (data.pendingPayouts?.length || 0).toString() },
      { label: 'Expiring Agreements', value: (data.expiringAgreements?.length || 0).toString() },
    ],
    newApplications: [
      { label: 'Submitted', value: data.pendingApplications.toString() },
      { label: 'Under Review', value: data.underReviewApplications.toString() },
      { label: 'Approved', value: data.approvedApplications.toString() },
    ],
    upcomingRenewals: (data.expiringAgreements || []).slice(0, 3).map((a: any) => ({
      label: a.partnership?.name || 'Unknown',
      value: a.expiresAt ? new Date(a.expiresAt).toLocaleDateString() : 'N/A',
    })),
    campaignHighlights: (data.campaignPerformance || []).slice(0, 3).map((c: any) =>
      `${c.name}: ${c.conversions} conversions at ${c.conversionRate.toFixed(1)}%`
    ),
    commissionHighlights: [
      `Liability: ${Math.round((data.totalCommissionLiability?.totalLiabilityCents || 0) / 100).toLocaleString()} ${currency}`,
      `Paid (30d): ${Math.round((data.paidPayouts30d?.totalCents || 0) / 100).toLocaleString()} ${currency}`,
      `Pending payouts: ${data.pendingPayouts?.length || 0}`,
    ],
    risks: (data.attentionItems || []).filter((a: any) => a.severity === 'CRITICAL' || a.severity === 'HIGH').map((a: any) => a.title),
    recommendations: (data.recommendations || []).slice(0, 3).map((r: any) => r.answer),
  } : null

  return (
    <AdminLayout title="Partnership Director Operating Center">
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Network className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900">Partnership Director Operating Center</h1>
              </div>
              <p className="text-sm text-slate-500 mt-1">{greeting}. Here is your partnership ecosystem command center.</p>
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

          {/* Section 1: Partnership Pulse */}
          <PartnershipPulse data={pulseData} loading={loading} onNavigate={handleNavigate} />

          {/* Section 2: Partnership Daily Brief */}
          <PartnershipDailyBrief data={briefData} loading={loading} />

          {/* Section 3: Partnership Pipeline */}
          <PartnershipPipeline data={data?.pipeline || null} loading={loading} onNavigate={handleNavigate} />

          {/* Section 4: Partner Portfolio */}
          <PartnerPortfolio
            data={data ? {
              partnersByType: data.partnersByType,
              partnersByRegion: data.partnersByRegion,
              partnersByStatus: data.partnersByStatus,
              healthScores: data.healthScores,
            } : null}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 5: Agreement Center */}
          <AgreementCenter
            data={data ? {
              activeAgreements: data.activeAgreements,
              draftAgreements: data.draftAgreements,
              expiredAgreements: data.expiredAgreements,
              terminatedAgreements: data.terminatedAgreements,
              pendingSignatures: data.pendingSignatures,
              expiringAgreements: data.expiringAgreements,
            } : null}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 6: Campaign Intelligence */}
          <CampaignIntelligence
            data={data ? {
              campaignPerformance: data.campaignPerformance,
              activeCampaigns: data.activeCampaigns,
              draftCampaigns: data.draftCampaigns,
              pausedCampaigns: data.pausedCampaigns,
              completedCampaigns: data.completedCampaigns,
              activeCodes: data.activeCodes,
              totalCodes: data.totalCodes,
              exhaustedCodes: data.exhaustedCodes,
              expiredCodes: data.expiredCodes,
              regionalPerformance: data.regionalPerformance,
            } : null}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 7: Partner Performance */}
          <PartnerPerformance
            data={data ? {
              topPartnersBySignups: data.topPartnersBySignups,
              topPartnersByConversions: data.topPartnersByConversions,
              topPartnersByRevenue: data.topPartnersByRevenue,
              partnershipTypeLTV: data.partnershipTypeLTV,
              cacByPartnerType: data.cacByPartnerType,
            } : null}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 8: Commission & Payout Overview */}
          <CommissionPayoutOverview
            data={data ? {
              commissionSummary: data.commissionSummary,
              totalCommissionLiability: data.totalCommissionLiability,
              pendingPayouts: data.pendingPayouts,
              recentPayouts: data.recentPayouts,
              paidPayouts30d: data.paidPayouts30d,
              failedPayouts: data.failedPayouts,
            } : null}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 9: Partnership Opportunities */}
          <PartnershipOpportunityCenter
            opportunities={data?.opportunities || []}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 10: Partnership Attention Center */}
          <PartnershipAttentionCenter
            items={data?.attentionItems || []}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 11: AI Partnership Assistant */}
          <AIPartnershipAssistant
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
        destination: '/auth/signin?callbackUrl=/admin/executive/partnership-director',
        permanent: false,
      },
    }
  }

  const userRoles = (session.user as any).roles || [(session.user as any).role]
  const allowed = ['PARTNERSHIP_DIRECTOR', 'ADMIN', 'PARTNERSHIP_MANAGER', 'EXECUTIVE']

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
