import { ArrowRight, AlertCircle } from 'lucide-react'
import KpiCard from './KpiCard'

export interface SupportOpsData {
  openTickets: number
  pendingTickets: number
  resolvedTickets: number
  highPriority: number
  unassigned: number
  assigned: number
  resolvedYesterday: number
  slaCompliance: number
  workload: number
}

interface Props {
  data: SupportOpsData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function SupportOperations({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Support operations data unavailable.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Support Operations</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard
          label="Open Tickets"
          value={data.openTickets.toString()}
          status={data.openTickets > 20 ? 'CRITICAL' : data.openTickets > 10 ? 'WARNING' : 'HEALTHY'}
          drillDownHref="/admin/support"
          onClick={() => onNavigate?.('/admin/support')}
        />
        <KpiCard
          label="Pending"
          value={data.pendingTickets.toString()}
          drillDownHref="/admin/support"
          onClick={() => onNavigate?.('/admin/support')}
        />
        <KpiCard
          label="High Priority"
          value={data.highPriority.toString()}
          status={data.highPriority > 0 ? 'WARNING' : 'HEALTHY'}
          drillDownHref="/admin/support"
          onClick={() => onNavigate?.('/admin/support')}
        />
        <KpiCard
          label="SLA Compliance"
          value={`${data.slaCompliance}%`}
          status={data.slaCompliance >= 90 ? 'HEALTHY' : data.slaCompliance >= 70 ? 'WARNING' : 'CRITICAL'}
          drillDownHref="/admin/support"
          onClick={() => onNavigate?.('/admin/support')}
        />
      </div>

      {/* Unassigned alert */}
      {data.unassigned > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-3">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">{data.unassigned} unassigned support conversations</p>
            <p className="text-xs text-amber-700">Customers may experience delayed responses</p>
          </div>
        </div>
      )}

      {/* Workload distribution */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Assigned</p>
          <p className="text-lg font-bold text-slate-900">{data.assigned}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Unassigned</p>
          <p className="text-lg font-bold text-amber-600">{data.unassigned}</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Resolved Yesterday</p>
          <p className="text-lg font-bold text-emerald-600">{data.resolvedYesterday}</p>
        </div>
      </div>

      <button
        onClick={() => onNavigate?.('/admin/support')}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
      >
        <span>View Support Center</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
