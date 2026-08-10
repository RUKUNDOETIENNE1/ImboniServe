import { useState, useEffect, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import AdminLayout from '@/components/AdminLayout'
import {
  Loader2, RefreshCw, Search, DollarSign, TrendingUp, Wallet,
  AlertCircle, BarChart3, Users, Award, Clock, FileText, Plus,
} from 'lucide-react'
import RevenueSummaryCard from '@/components/partnerships/RevenueSummaryCard'
import CommissionLifecycleCard from '@/components/partnerships/CommissionLifecycleCard'
import PayoutBatchCard from '@/components/partnerships/PayoutBatchCard'
import LedgerTable from '@/components/partnerships/LedgerTable'
import LiabilityPanel from '@/components/partnerships/LiabilityPanel'
import ForecastChart from '@/components/partnerships/ForecastChart'
import ReconciliationPanel from '@/components/partnerships/ReconciliationPanel'
import FinancialTimeline from '@/components/partnerships/FinancialTimeline'
import ExceptionCenter from '@/components/partnerships/ExceptionCenter'
import RevenueTrendChart from '@/components/partnerships/RevenueTrendChart'
import AuditTimeline from '@/components/partnerships/AuditTimeline'
import DataFreshnessIndicator from '@/components/DataFreshnessIndicator'
import { useCurrency } from '@/contexts/LocaleContext'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  const roles = (session?.user as any)?.roles || []
  const allowed = ['ADMIN', 'FINANCE', 'CFO', 'PARTNERSHIP_MANAGER', 'OPERATIONS_MANAGER', 'CEO', 'SUPPORT', 'LEGAL', 'EXECUTIVE']
  if (!session?.user || !roles.some((r: string) => allowed.includes(r))) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }
  return { props: { userRoles: roles } }
}

interface Props {
  userRoles: string[]
}

function formatCurrency(cents: number, currency: string): string {
  return `${(cents / 100).toLocaleString()} ${currency}`
}

export default function RevenueOperationsWorkspace({ userRoles }: Props) {
  const { currency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'timeline' | 'audit'>('timeline')
  const [activeList, setActiveList] = useState<'commissions' | 'payouts' | 'ledger'>('commissions')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const canManage = userRoles.some((r) => ['ADMIN', 'FINANCE', 'CFO'].includes(r))

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '50')
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/admin/revenue-operations?${params}`)
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed to load revenue operations')
        return
      }
      const result = await res.json()
      setData(result)
      setLastUpdated(new Date())
    } catch {
      setError('Failed to load revenue operations')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAction = async (action: string, extraData?: Record<string, unknown>) => {
    setActing(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/revenue-operations', {
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
      <AdminLayout title="Revenue Operations">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading revenue operations...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error && !data) {
    return (
      <AdminLayout title="Revenue Operations">
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-sm text-red-700 mb-3">{error}</p>
            <button onClick={() => loadData()} className="text-sm text-emerald-600 hover:underline">
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const { summary, commissions, payouts, ledger, liability, forecast, reconciliation, timeline, audit, exceptions } = data

  return (
    <AdminLayout title="Revenue Operations">
      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-800">Revenue Operations Center</h1>
            <DataFreshnessIndicator lastUpdated={lastUpdated} loading={loading} />
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

        {/* Section 1: Revenue Summary */}
        <div>
          <SectionHeader icon={BarChart3} title="Revenue Summary" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <RevenueSummaryCard label="MRR (Founder Partners)" value={formatCurrency(summary.mrrCents, currency)} icon="trending-up" accent="green" />
            <RevenueSummaryCard label="Total Revenue" value={formatCurrency(summary.totalRevenueCents, currency)} icon="dollar" accent="blue" />
            <RevenueSummaryCard label="Commission Accrued" value={formatCurrency(summary.totalCommissionAccruedCents, currency)} icon="wallet" accent="purple" />
            <RevenueSummaryCard label="Total Approved" value={formatCurrency(summary.totalApprovedCents, currency)} icon="dollar" accent="blue" />
            <RevenueSummaryCard label="Total Paid" value={formatCurrency(summary.totalPaidCents, currency)} icon="dollar" accent="green" />
            <RevenueSummaryCard label="Outstanding Liability" value={formatCurrency(summary.outstandingLiabilityCents, currency)} icon="alert" accent="red" />
            <RevenueSummaryCard label="Pending Payouts" value={String(summary.pendingPayoutsCount)} icon="clock" accent="amber" />
            <RevenueSummaryCard label="Forecast Next Month" value={formatCurrency(summary.forecastNextMonthCents, currency)} icon="chart" accent="purple" />
            <RevenueSummaryCard label="Avg Revenue / Partner" value={formatCurrency(summary.avgRevenuePerPartnerCents, currency)} icon="users" accent="blue" />
            <RevenueSummaryCard
              label="Highest Revenue Partner"
              value={summary.highestRevenuePartner?.name ?? '—'}
              icon="award"
              accent="green"
            />
          </div>
        </div>

        {/* Revenue Trend + Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RevenueTrendChart trend={summary.revenueTrend} />
          <ForecastChart forecast={forecast} trend={summary.revenueTrend} />
        </div>

        {/* Exception Center */}
        <ExceptionCenter
          exceptions={exceptions || []}
          onAction={canManage ? (action) => handleAction(action) : undefined}
        />

        {/* Search & Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by partner, commission, payout..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="Search revenue operations"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="VALIDATED">Validated</option>
            <option value="APPROVED">Approved</option>
            <option value="PAID">Paid</option>
            <option value="VOID">Void</option>
            <option value="CLAWED_BACK">Clawed Back</option>
            <option value="PROCESSING">Processing</option>
            <option value="FAILED">Failed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* List toggle: Commissions | Payouts | Ledger */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          <ListTab active={activeList === 'commissions'} onClick={() => setActiveList('commissions')} label={`Commissions (${commissions.total})`} />
          <ListTab active={activeList === 'payouts'} onClick={() => setActiveList('payouts')} label={`Payouts (${payouts.total})`} />
          <ListTab active={activeList === 'ledger'} onClick={() => setActiveList('ledger')} label={`Ledger (${ledger.total})`} />
        </div>

        {/* Section 2: Commission Operations */}
        {activeList === 'commissions' && (
          <div>
            <SectionHeader icon={DollarSign} title="Commission Operations" />
            {commissions.items.length === 0 ? (
              <EmptyState message="No commissions found." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {commissions.items.map((c: any) => (
                  <CommissionLifecycleCard
                    key={c.id}
                    commission={c}
                    canManage={canManage}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 3: Payout Operations */}
        {activeList === 'payouts' && (
          <div>
            <SectionHeader icon={Wallet} title="Payout Operations" />
            {payouts.items.length === 0 ? (
              <EmptyState message="No payouts found." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {payouts.items.map((p: any) => (
                  <PayoutBatchCard
                    key={p.id}
                    payout={p}
                    canManage={canManage}
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 4: Revenue Ledger */}
        {activeList === 'ledger' && (
          <LedgerTable
            entries={ledger.items}
            total={ledger.total}
            page={ledger.page}
            limit={ledger.limit}
            onPageChange={setPage}
          />
        )}

        {/* Section 5: Liability Center + Section 7: Reconciliation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LiabilityPanel
            totalCents={liability.totalCents}
            commissionCount={liability.commissionCount}
            topLiabilities={liability.topLiabilities}
            aging={liability.aging}
          />
          <ReconciliationPanel data={reconciliation} />
        </div>

        {/* Section 8 & 9: Financial Timeline + Audit */}
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')} icon={Clock} label="Financial Timeline" />
            <TabButton active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon={FileText} label="Audit Trail" />
          </div>
          <div className="p-6">
            {activeTab === 'timeline' && (
              <FinancialTimeline entries={timeline || []} />
            )}
            {activeTab === 'audit' && (
              <AuditTimeline entries={audit || []} />
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
        active ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}

function ListTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
        active ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
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
