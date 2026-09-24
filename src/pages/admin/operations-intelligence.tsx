import { useState, useEffect, useCallback } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]'
import AdminLayout from '@/components/AdminLayout'
import InvestigationSearch, { SearchResult } from '@/components/partnerships/InvestigationSearch'
import OperationsTimeline from '@/components/partnerships/OperationsTimeline'
import AttributionGraph from '@/components/partnerships/AttributionGraph'
import JourneyExplorer from '@/components/partnerships/JourneyExplorer'
import FinancialTrace from '@/components/partnerships/FinancialTrace'
import CampaignIntelligence from '@/components/partnerships/CampaignIntelligence'
import AuditExplorer from '@/components/partnerships/AuditExplorer'
import ExceptionPanel, { OpsException } from '@/components/partnerships/ExceptionPanel'
import ResolutionPanel from '@/components/partnerships/ResolutionPanel'
import SystemHealthWidget from '@/components/partnerships/SystemHealthWidget'
import { Loader2, AlertCircle, RefreshCw, Search, Activity, GitBranch, Link2, Megaphone, History, AlertTriangle, Wrench, Heart } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface OperationsData {
  searchResults: { query: string; results: SearchResult[]; total: number } | null
  timeline: { items: any[]; total: number; page: number; limit: number }
  attributions: any[]
  campaigns: any[]
  audit: { items: any[]; total: number; page: number; limit: number }
  exceptions: OpsException[]
  health: { signals: any[]; overallScore: number; overallStatus: string }
  financialTrace: any
  customerJourney: any
  canResolve: boolean
}

interface Props {
  canResolve: boolean
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-slate-400" />
      <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
    </div>
  )
}

export default function OperationsIntelligenceWorkspace({ canResolve }: Props) {
  const { showToast } = useToast()
  const [data, setData] = useState<OperationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [selectedEntityType, setSelectedEntityType] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'timeline' | 'audit'>('timeline')

  const loadData = useCallback(async (opts?: { page?: number; search?: string; entityId?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (opts?.page) params.set('page', String(opts.page))
      if (opts?.search) params.set('query', opts.search)
      if (opts?.entityId) {
        params.set('entityId', opts.entityId)
        params.set('entityType', 'business')
      }
      params.set('limit', '50')

      const res = await fetch(`/api/admin/operations-intelligence?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load operations intelligence data')
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    const params = new URLSearchParams({ query, limit: '50' })
    const res = await fetch(`/api/admin/operations-intelligence?${params.toString()}`)
    if (!res.ok) return null
    const json = await res.json()
    setData(json)
    return json.searchResults
  }, [])

  const handleResultClick = useCallback((result: SearchResult) => {
    setSelectedEntityId(result.id)
    setSelectedEntityType(result.type)
    loadData({ entityId: result.id })
  }, [loadData])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    loadData({ page: newPage, entityId: selectedEntityId ?? undefined })
  }, [loadData, selectedEntityId])

  const handleResolutionAction = useCallback(async (action: string, payload?: any) => {
    try {
      const res = await fetch('/api/admin/operations-intelligence', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      })
      if (!res.ok) {
        const err = await res.json()
        showToast('error', `Action failed: ${err.error || 'Unknown error'}`)
        return
      }
      // Reload data after successful action
      loadData({ entityId: selectedEntityId ?? undefined })
    } catch (err: any) {
      showToast('error', `Action failed: ${err.message}`)
    }
  }, [loadData, selectedEntityId, showToast])

  const handleExceptionAction = useCallback((action: string, exception: OpsException) => {
    if (exception.affectedEntities && exception.affectedEntities.length > 0) {
      handleResolutionAction(action, { campaignId: exception.affectedEntities[0] })
    } else {
      handleResolutionAction(action)
    }
  }, [handleResolutionAction])

  if (loading && !data) {
    return (
      <AdminLayout title="Operations Intelligence">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
          <span className="ml-2 text-sm text-slate-500">Loading operations intelligence...</span>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="Operations Intelligence">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button
            onClick={() => loadData()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Operations Intelligence">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Operations Intelligence Center</h1>
            <p className="text-sm text-slate-500">Investigate, explain, and resolve every operational event.</p>
          </div>
          <button
            onClick={() => loadData({ entityId: selectedEntityId ?? undefined })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Section 1: Universal Investigation Search */}
        <div>
          <SectionHeader icon={Search} title="Universal Investigation Search" />
          <InvestigationSearch onSearch={handleSearch} onResultClick={handleResultClick} />
        </div>

        {/* Section 9: System Health Signals (early visibility) */}
        {data?.health && (
          <div>
            <SectionHeader icon={Heart} title="System Health Signals" />
            <SystemHealthWidget
              signals={data.health.signals}
              overallScore={data.health.overallScore}
              overallStatus={data.health.overallStatus as any}
            />
          </div>
        )}

        {/* Section 8: Exception Investigation */}
        {data?.exceptions && (
          <div>
            <SectionHeader icon={AlertTriangle} title="Exception Investigation" />
            <ExceptionPanel
              exceptions={data.exceptions}
              onAction={handleExceptionAction}
              canResolve={canResolve}
            />
          </div>
        )}

        {/* Entity-specific sections: Journey + Financial Trace + Attribution */}
        {selectedEntityId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 4: Customer Journey Explorer */}
            <div>
              <SectionHeader icon={Activity} title="Customer Journey Explorer" />
              <JourneyExplorer journey={data?.customerJourney ?? null} />
            </div>

            {/* Section 5: Financial Trace */}
            <div>
              <SectionHeader icon={Link2} title="Financial Trace" />
              <FinancialTrace trace={data?.financialTrace ?? null} />
            </div>
          </div>
        )}

        {/* Section 3: Attribution Explorer */}
        <div>
          <SectionHeader icon={GitBranch} title="Attribution Explorer" />
          <AttributionGraph entries={data?.attributions ?? []} />
        </div>

        {/* Section 6: Campaign Intelligence */}
        <div>
          <SectionHeader icon={Megaphone} title="Campaign Intelligence" />
          <CampaignIntelligence campaigns={data?.campaigns ?? []} />
        </div>

        {/* Section 2 & 7: Operations Timeline + Audit Center (tabbed) */}
        <div>
          <div className="flex items-center gap-4 mb-3 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1.5 pb-2 text-sm font-medium border-b-2 transition ${
                activeTab === 'timeline' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Activity className="w-4 h-4" /> Operations Timeline
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1.5 pb-2 text-sm font-medium border-b-2 transition ${
                activeTab === 'audit' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <History className="w-4 h-4" /> Audit Center
            </button>
          </div>

          {activeTab === 'timeline' && data?.timeline && (
            <OperationsTimeline
              entries={data.timeline.items}
              total={data.timeline.total}
              page={data.timeline.page}
              limit={data.timeline.limit}
              onPageChange={handlePageChange}
            />
          )}

          {activeTab === 'audit' && data?.audit && (
            <AuditExplorer
              entries={data.audit.items}
              total={data.audit.total}
              page={data.audit.page}
              limit={data.audit.limit}
              onPageChange={handlePageChange}
            />
          )}
        </div>

        {/* Section 10: Resolution Center */}
        <div>
          <SectionHeader icon={Wrench} title="Resolution Center" />
          <ResolutionPanel
            onAction={handleResolutionAction}
            canResolve={canResolve}
            selectedEntityId={selectedEntityId}
          />
        </div>
      </div>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session?.user?.email) {
    return { redirect: { destination: '/auth/signin', permanent: false } }
  }

  const { prisma } = await import('@/lib/prisma')
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })

  const allowedRoles = ['ADMIN', 'FINANCE', 'CFO', 'PARTNERSHIP_MANAGER', 'OPERATIONS_MANAGER', 'CEO', 'SUPPORT', 'LEGAL', 'EXECUTIVE', 'MARKETING', 'SALES']
  if (!user?.roles?.some((r: string) => allowedRoles.includes(r))) {
    return { redirect: { destination: '/admin', permanent: false } }
  }

  const actionRoles = ['ADMIN', 'FINANCE', 'CFO', 'OPERATIONS_MANAGER', 'SUPPORT']
  const canResolve = user.roles?.some((r: string) => actionRoles.includes(r)) ?? false

  return { props: { canResolve } }
}
