import { Layers } from 'lucide-react'
import KpiCard from './KpiCard'
import type { HealthStatus } from './KpiCard'

export interface CrossCenterEvidenceData {
  financialHealth: {
    mrr: { value: number; changePercent: number; status: string }
    arr: { value: number }
    revenueChurn: { rate: number; status: string }
    netRevenueRetention: { rate: number; status: string }
    revenueGrowth: { status: string }
  }
  operationalHealth: {
    paymentHealth: string
    queueHealth: string
    reconciliationHealth: string
    subscriptionHealth: string
  }
}

interface Props {
  data: CrossCenterEvidenceData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

function toHealthStatus(status: string): HealthStatus {
  if (status === 'HEALTHY' || status === 'GROWTH' || status === 'STRONG') return 'HEALTHY'
  if (status === 'WARNING' || status === 'MODERATE' || status === 'STABLE') return 'WARNING'
  return 'CRITICAL'
}

export default function CrossCenterEvidence({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">Cross-Center Evidence</h3>
        </div>
        <p className="text-sm text-slate-400">Cross-center evidence unavailable. Data may still be loading.</p>
      </div>
    )
  }

  const { financialHealth, operationalHealth } = data

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-indigo-600" />
        <h3 className="text-base font-bold text-slate-900">Cross-Center Evidence</h3>
      </div>

      {/* Financial Health */}
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Financial Health</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="MRR"
          value={`${Math.round(financialHealth.mrr.value).toLocaleString()} RWF`}
          trend={financialHealth.mrr.changePercent >= 2 ? 'UP' : financialHealth.mrr.changePercent <= -2 ? 'DOWN' : 'FLAT'}
          trendValue={`${financialHealth.mrr.changePercent >= 0 ? '+' : ''}${financialHealth.mrr.changePercent.toFixed(1)}%`}
          status={toHealthStatus(financialHealth.mrr.status)}
          drillDownHref="/admin/revenue-analytics"
          onClick={() => onNavigate?.('/admin/revenue-analytics')}
        />
        <KpiCard
          label="ARR"
          value={`${Math.round(financialHealth.arr.value).toLocaleString()} RWF`}
          status={toHealthStatus(financialHealth.revenueGrowth.status)}
          drillDownHref="/admin/revenue-analytics"
          onClick={() => onNavigate?.('/admin/revenue-analytics')}
        />
        <KpiCard
          label="Revenue Churn"
          value={`${financialHealth.revenueChurn.rate}%`}
          status={toHealthStatus(financialHealth.revenueChurn.status)}
        />
        <KpiCard
          label="Net Revenue Retention"
          value={`${financialHealth.netRevenueRetention.rate}%`}
          status={toHealthStatus(financialHealth.netRevenueRetention.status)}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 my-4" />

      {/* Operational Health */}
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Operational Health</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Payment Health"
          value={operationalHealth.paymentHealth}
          status={toHealthStatus(operationalHealth.paymentHealth)}
        />
        <KpiCard
          label="Queue Health"
          value={operationalHealth.queueHealth}
          status={toHealthStatus(operationalHealth.queueHealth)}
        />
        <KpiCard
          label="Reconciliation"
          value={operationalHealth.reconciliationHealth}
          status={toHealthStatus(operationalHealth.reconciliationHealth)}
        />
        <KpiCard
          label="Subscription Health"
          value={operationalHealth.subscriptionHealth}
          status={toHealthStatus(operationalHealth.subscriptionHealth)}
        />
      </div>
    </div>
  )
}
