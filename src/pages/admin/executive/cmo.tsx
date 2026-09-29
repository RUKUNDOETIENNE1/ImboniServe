import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { RefreshCw, AlertCircle, Megaphone } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import GrowthPulse from '@/components/executive/GrowthPulse'
import CmoDailyBrief from '@/components/executive/CmoDailyBrief'
import CampaignPerformanceCenter from '@/components/executive/CampaignPerformanceCenter'
import AcquisitionFunnel from '@/components/executive/AcquisitionFunnel'
import FounderMarketingNetwork from '@/components/executive/FounderMarketingNetwork'
import RegionalGrowthIntelligence from '@/components/executive/RegionalGrowthIntelligence'
import MarketingOpportunityCenter from '@/components/executive/MarketingOpportunityCenter'
import BrandEngagementOverview from '@/components/executive/BrandEngagementOverview'
import MarketingAttentionCenter from '@/components/executive/MarketingAttentionCenter'
import AIMarketingAssistant from '@/components/executive/AIMarketingAssistant'
import { useCurrency } from '@/contexts/LocaleContext'
import type { GetServerSideProps } from 'next'

interface CmoData {
  growthScore: number
  dailySummary: any
  weeklySummary: any
  restaurantGrowth: any
  founderGrowth: any
  campaignMetrics: any
  acquisitionFunnel: any
  founderMarketing: any
  regionalGrowth: any
  brandEngagement: any
  opportunities: any[]
  attentionItems: any[]
  recommendations: any[]
  cacByPartnerType: any[]
  partnershipTypeLTV: any[]
  generatedAt: string
}

export default function CmoOperatingCenter() {
  const router = useRouter()
  const { currency } = useCurrency()
  const [data, setData] = useState<CmoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/executive/cmo')
      if (res.status === 403) {
        setError('You do not have permission to access the CMO Operating Center.')
        return
      }
      if (!res.ok) throw new Error('Failed to fetch CMO marketing intelligence')
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
    growthScore: data.growthScore,
    restaurantGrowth: {
      active: data.restaurantGrowth?.active || 0,
      new7d: data.restaurantGrowth?.new7d || 0,
      new30d: data.restaurantGrowth?.new30d || 0,
      growthRate7d: data.restaurantGrowth?.growthRate7d || '0',
      activationRate: data.restaurantGrowth?.activationRate || 0,
    },
    founderGrowth: {
      total: data.founderGrowth?.total || 0,
      active: data.founderGrowth?.active || 0,
      new7d: data.founderGrowth?.new7d || 0,
      growthRate7d: data.founderGrowth?.growthRate7d || '0',
    },
    campaignMomentum: {
      active: data.campaignMetrics?.active || 0,
      draft: data.campaignMetrics?.draft || 0,
      paused: data.campaignMetrics?.paused || 0,
    },
    conversionRate: data.acquisitionFunnel?.conversionRates?.overallConversion || '0',
    regionalExpansion: {
      byRegion: data.regionalGrowth?.byRegion || [],
    },
    acquisitionTrend: (data.restaurantGrowth?.new7d || 0) > (data.restaurantGrowth?.new30d || 0) / 4 ? 'ACCELERATING' : (data.restaurantGrowth?.new7d || 0) === 0 ? 'DECLINING' : 'STABLE',
    marketingHealth: data.growthScore >= 70 ? 'HEALTHY' : data.growthScore >= 40 ? 'WARNING' : 'CRITICAL',
    todaySummary: `Growth score: ${data.growthScore}/100. ${data.opportunities?.length || 0} opportunities, ${data.attentionItems?.length || 0} items need attention.`,
  } : null

  // Build brief data from API response
  const briefData = data ? {
    yesterday: [
      { label: 'New Businesses', value: (data.restaurantGrowth?.newYesterday || 0).toString() },
      { label: 'Revenue', value: `${Math.round((data.dailySummary?.revenue?.yesterday || 0)).toLocaleString()} ${currency}` },
      { label: 'Revenue Change', value: `${(data.dailySummary?.revenue?.changePercent || 0).toFixed(1)}%` },
    ],
    todayOpportunities: (data.opportunities || []).slice(0, 5).map((o: any) => ({ label: o.type, value: o.title })),
    growthAchievements: [
      ...(data.restaurantGrowth?.new7d > 0 ? [`${data.restaurantGrowth.new7d} new businesses in 7 days`] : []),
      ...(data.founderGrowth?.new7d > 0 ? [`${data.founderGrowth.new7d} new founder partners in 7 days`] : []),
      ...(data.campaignMetrics?.active > 0 ? [`${data.campaignMetrics.active} active campaigns running`] : []),
    ],
    campaignHighlights: (data.campaignMetrics?.topCampaigns || []).slice(0, 3).map((c: any) => `${c.name}: ${c.conversionRate}% conversion`),
    conversionTrends: [
      { label: 'Visitor → Lead', value: `${data.acquisitionFunnel?.conversionRates?.visitorToLead || '0'}%` },
      { label: 'Lead → Trial', value: `${data.acquisitionFunnel?.conversionRates?.leadToTrial || '0'}%` },
      { label: 'Overall', value: `${data.acquisitionFunnel?.conversionRates?.overallConversion || '0'}%` },
    ],
    risks: (data.attentionItems || []).filter((a: any) => a.severity === 'CRITICAL' || a.severity === 'HIGH').map((a: any) => a.title),
    recommendations: (data.recommendations || []).map((r: any) => r.answer),
    upcomingLaunches: (data.opportunities || []).filter((o: any) => o.type === 'LAUNCH').map((o: any) => o.title),
  } : null

  return (
    <AdminLayout title="CMO Operating Center">
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900">CMO Operating Center</h1>
              </div>
              <p className="text-sm text-slate-500 mt-1">{greeting}. Here is your growth intelligence command center.</p>
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

          {/* Section 1: Growth Pulse */}
          <GrowthPulse data={pulseData} loading={loading} onNavigate={handleNavigate} />

          {/* Section 2: CMO Daily Brief */}
          <CmoDailyBrief data={briefData} loading={loading} />

          {/* Section 3: Campaign Performance Center */}
          <CampaignPerformanceCenter
            data={data?.campaignMetrics || null}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 4: Acquisition Funnel */}
          <AcquisitionFunnel
            data={data?.acquisitionFunnel || null}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 5: Founder Marketing Network */}
          <FounderMarketingNetwork
            data={data?.founderMarketing || null}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 6: Regional Growth Intelligence */}
          <RegionalGrowthIntelligence
            data={data?.regionalGrowth || null}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 7: Marketing Opportunity Center */}
          <MarketingOpportunityCenter
            opportunities={data?.opportunities || []}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 8: Brand & Engagement Overview */}
          <BrandEngagementOverview
            data={data?.brandEngagement || null}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 9: Marketing Attention Center */}
          <MarketingAttentionCenter
            items={data?.attentionItems || []}
            loading={loading}
            onNavigate={handleNavigate}
          />

          {/* Section 10: AI Marketing Assistant */}
          <AIMarketingAssistant
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
  const allowed = ['CMO', 'ADMIN', 'EXECUTIVE']

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
