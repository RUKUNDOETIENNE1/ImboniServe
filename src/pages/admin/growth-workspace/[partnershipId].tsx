import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import AdminLayout from '@/components/AdminLayout'
import {
  ArrowLeft, Loader2, RefreshCw, Building2, Users, TrendingUp,
  DollarSign, Megaphone, Tag, Activity, Bell, Clock, FileText,
  Search, Plus,
} from 'lucide-react'
import MetricCard from '@/components/partnerships/MetricCard'
import StatusBadge from '@/components/partnerships/StatusBadge'
import RiskIndicator from '@/components/partnerships/RiskIndicator'
import Timeline from '@/components/partnerships/Timeline'
import AuditTimeline from '@/components/partnerships/AuditTimeline'
import ConversionFunnel from '@/components/partnerships/ConversionFunnel'
import CampaignPerformanceCard from '@/components/partnerships/CampaignPerformanceCard'
import FounderCodePerformanceCard from '@/components/partnerships/FounderCodePerformanceCard'
import GrowthTrendChart from '@/components/partnerships/GrowthTrendChart'
import OpportunityCenter from '@/components/partnerships/OpportunityCenter'
import RegionalPerformanceWidget from '@/components/partnerships/RegionalPerformanceWidget'
import CampaignComparisonTable from '@/components/partnerships/CampaignComparisonTable'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  const roles = (session?.user as any)?.roles || []
  const allowed = ['ADMIN', 'PARTNERSHIP_MANAGER', 'MARKETING_MANAGER', 'GROWTH_TEAM', 'SALES_LEADERSHIP', 'OPERATIONS_MANAGER', 'SUPPORT', 'LEGAL', 'EXECUTIVE']
  if (!session?.user || !roles.some((r: string) => allowed.includes(r))) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }
  return { props: { partnershipId: ctx.params?.partnershipId, userRoles: roles } }
}

interface Props {
  partnershipId: string
  userRoles: string[]
}

export default function GrowthWorkspace({ partnershipId, userRoles }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'timeline' | 'audit' | 'notifications'>('timeline')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const canManage = userRoles.some((r) => ['ADMIN', 'PARTNERSHIP_MANAGER', 'MARKETING_MANAGER', 'GROWTH_TEAM'].includes(r))

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/growth-workspace/${partnershipId}`)
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed to load growth workspace')
        return
      }
      const result = await res.json()
      setData(result)
    } catch {
      setError('Failed to load growth workspace')
    } finally {
      setLoading(false)
    }
  }, [partnershipId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAction = async (action: string, extraData?: Record<string, unknown>) => {
    setActing(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/growth-workspace/${partnershipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraData }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || `Failed to ${action}`)
      } else {
        await loadData()
      }
    } catch {
      setError(`Failed to ${action}`)
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Growth Workspace">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading growth workspace...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error && !data) {
    return (
      <AdminLayout title="Growth Workspace">
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-sm text-red-700 mb-3">{error}</p>
            <button
              onClick={() => router.push('/admin/founder-partners')}
              className="text-sm text-emerald-600 hover:underline"
            >
              Back to Founder Partners
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const { partnership, performance, campaigns, codes, analytics, funnel, opportunities, healthScore, riskProfile, regionalPerformance, notifications, timeline, auditRecords } = data

  const filteredCampaigns = campaigns?.filter((c: any) => {
    const matchesSearch = !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  const filteredCodes = codes?.filter((c: any) => {
    const matchesSearch = !searchQuery || c.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  return (
    <AdminLayout title={`Growth: ${partnership?.name || 'Partner'}`}>
      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <a
              href={`/admin/partnership-activation/${partnershipId}`}
              className="inline-flex items-center gap-2 text-sm text-purple-600 hover:underline"
            >
              Activation Workspace
            </a>
          </div>
          <button
            onClick={() => loadData()}
            disabled={acting}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${acting ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Section 1: Partner Performance Summary */}
        <div>
          <SectionHeader icon={Activity} title="Partner Performance Summary" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard label="Businesses Referred" value={performance.totalBusinessesReferred} icon={Building2} accent="blue" />
            <MetricCard label="Active Trials" value={performance.activeTrials} icon={Clock} accent="amber" />
            <MetricCard label="Active Subscribers" value={performance.activeSubscribers} icon={Users} accent="green" />
            <MetricCard
              label="Conversion %"
              value={`${performance.conversionRate.toFixed(1)}%`}
              icon={TrendingUp}
              accent={performance.conversionRate >= 15 ? 'green' : 'amber'}
            />
            <MetricCard
              label="MRR Generated"
              value={`${(performance.monthlyRecurringRevenueCents / 100).toLocaleString()} RWF`}
              icon={DollarSign}
              accent="green"
            />
            <MetricCard
              label="Total Revenue"
              value={`${(performance.totalRevenueCents / 100).toLocaleString()} RWF`}
              icon={DollarSign}
              accent="purple"
            />
            <MetricCard
              label="Commission Earned"
              value={`${(performance.totalCommissionCents / 100).toLocaleString()} RWF`}
              icon={DollarSign}
              accent="blue"
            />
            <MetricCard label="Active Campaigns" value={performance.activeCampaigns} icon={Megaphone} accent="green" />
            <MetricCard label="Active Codes" value={performance.activeCodes} icon={Tag} accent="amber" />
            <MetricCard label="Health Score" value={`${performance.healthScore} (${performance.healthGrade})`} icon={Activity} accent={performance.healthScore >= 70 ? 'green' : 'amber'} />
          </div>
        </div>

        {/* Section: Growth Trend + Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <GrowthTrendChart
              trend={performance.growthTrend}
              healthScore={performance.healthScore}
              grade={performance.healthGrade}
              signups={performance.totalBusinessesReferred}
              conversions={performance.activeSubscribers}
              revenueCents={performance.totalRevenueCents}
            />
          </div>
          <RiskIndicator
            riskLevel={riskProfile?.riskLevel}
            riskScore={riskProfile?.riskScore}
            flags={riskProfile?.flags || []}
          />
        </div>

        {/* Section 6: Opportunity Center */}
        <OpportunityCenter
          opportunities={opportunities || []}
          onAction={canManage ? (action) => {
            if (action === 'renewCampaign' || action === 'duplicateCampaign' || action === 'generateCode') {
              handleAction(action)
            }
          } : undefined}
        />

        {/* Search & Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search campaigns, codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Search campaigns and codes"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </div>

        {/* Section 2: Campaign Operations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionHeader icon={Megaphone} title="Campaign Operations" />
            {canManage && (
              <button
                onClick={() => handleAction('createCampaign', { name: 'New Growth Campaign', channel: 'founder_referral' })}
                disabled={acting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                New Campaign
              </button>
            )}
          </div>
          {filteredCampaigns.length === 0 ? (
            <EmptyState message="No campaigns found. Create one to start tracking growth." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCampaigns.map((campaign: any) => (
                <CampaignPerformanceCard
                  key={campaign.id}
                  campaign={campaign}
                  canManage={canManage}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Founder Code Operations */}
        <div>
          <SectionHeader icon={Tag} title="Founder Code Operations" />
          {filteredCodes.length === 0 ? (
            <EmptyState message="No founder codes found. Generate one to enable referrals." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCodes.map((code: any) => (
                <FounderCodePerformanceCard
                  key={code.id}
                  code={code}
                  canManage={canManage}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Campaign Analytics — Comparison Table */}
        <CampaignComparisonTable
          campaigns={campaigns || []}
          bestCampaignId={analytics?.bestCampaign?.id}
          worstCampaignId={analytics?.worstCampaign?.id}
        />

        {/* Section 5: Growth Funnel + Regional Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ConversionFunnel stages={funnel || []} />
          <RegionalPerformanceWidget
            data={regionalPerformance || []}
            currentRegion={partnership?.region}
          />
        </div>

        {/* Section 7-9: Notifications, Timeline, Audit */}
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} icon={Clock} label="Timeline" />
            <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={FileText} label="Audit Trail" />
            <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} icon={Bell} label="Notifications" />
          </div>

          <div className="p-6">
            {activeTab === 'timeline' && (
              <Timeline entries={timeline || []} emptyMessage="No growth events yet" />
            )}
            {activeTab === 'audit' && (
              <AuditTimeline entries={auditRecords || []} />
            )}
            {activeTab === 'notifications' && (
              <div className="space-y-2">
                {notifications && notifications.length > 0 ? (
                  notifications.map((n: any) => (
                    <div key={n.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <Bell className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{formatEventType(n.type)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(n.timestamp).toLocaleString()}
                          {n.triggeredBy && ` · by ${n.triggeredBy}`}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">No notifications yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-slate-500" />
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 text-sm font-medium transition flex items-center gap-2 ${
        active
          ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-8 text-center">
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  )
}

function formatEventType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ')
}
