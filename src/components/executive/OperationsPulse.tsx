import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertCircle, Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import KpiCard from './KpiCard'

export interface OperationsPulseData {
  operationsScore: number
  paymentHealth: string
  queueHealth: string
  reconciliationHealth: string
  subscriptionHealth: string
  restaurantsWaitingOnboarding: number
  founderActivationsPending: number
  supportQueue: number
  criticalIncidents: number
  averageResponseTime: string
  operationalCapacity: string
  todaySummary: string
}

interface Props {
  data: OperationsPulseData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function OperationsPulse({ data, loading, onNavigate }: Props) {
  const [expanded, setExpanded] = useState(true)

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4" />
        <div className="h-4 w-full bg-slate-100 rounded mb-2" />
        <div className="h-4 w-3/4 bg-slate-100 rounded" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Operations pulse unavailable. Data may still be loading.</p>
      </div>
    )
  }

  const scoreColor = data.operationsScore >= 80 ? 'text-emerald-600' : data.operationsScore >= 50 ? 'text-amber-600' : 'text-red-600'
  const scoreBg = data.operationsScore >= 80 ? 'bg-emerald-50 border-emerald-200' : data.operationsScore >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
  const scoreIcon = data.operationsScore >= 80 ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : data.operationsScore >= 50 ? <AlertTriangle className="w-6 h-6 text-amber-500" /> : <XCircle className="w-6 h-6 text-red-500" />

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4"
        aria-label={expanded ? 'Collapse operations pulse' : 'Expand operations pulse'}
      >
        <div>
          <h2 className="text-lg font-bold text-slate-900">Operations Pulse</h2>
          <p className="text-xs text-slate-500 mt-0.5">Operational Command Center</p>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="space-y-4">
          {/* Operations Score */}
          <div className={`rounded-xl border p-4 ${scoreBg}`}>
            <div className="flex items-center gap-3">
              {scoreIcon}
              <div>
                <p className="text-xs text-slate-500">Overall Operations Score</p>
                <p className={`text-2xl font-bold ${scoreColor}`}>{data.operationsScore}/100</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-2">{data.todaySummary}</p>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label="Platform Health"
              value={data.queueHealth}
              status={data.queueHealth === 'HEALTHY' ? 'HEALTHY' : data.queueHealth === 'WARNING' ? 'WARNING' : 'CRITICAL'}
              drillDownHref="/admin/operations-intelligence"
              onClick={() => onNavigate?.('/admin/operations-intelligence')}
            />
            <KpiCard
              label="Businesses Waiting"
              value={data.restaurantsWaitingOnboarding.toString()}
              status={data.restaurantsWaitingOnboarding > 10 ? 'WARNING' : 'HEALTHY'}
              drillDownHref="/admin/restaurants"
              onClick={() => onNavigate?.('/admin/restaurants')}
            />
            <KpiCard
              label="Founder Activations Pending"
              value={data.founderActivationsPending.toString()}
              status={data.founderActivationsPending > 5 ? 'WARNING' : 'HEALTHY'}
              drillDownHref="/admin/partnership-applications"
              onClick={() => onNavigate?.('/admin/partnership-applications')}
            />
            <KpiCard
              label="Support Queue"
              value={data.supportQueue.toString()}
              status={data.supportQueue > 20 ? 'CRITICAL' : data.supportQueue > 10 ? 'WARNING' : 'HEALTHY'}
              drillDownHref="/admin/support"
              onClick={() => onNavigate?.('/admin/support')}
            />
            <KpiCard
              label="Critical Incidents"
              value={data.criticalIncidents.toString()}
              status={data.criticalIncidents > 0 ? 'CRITICAL' : 'HEALTHY'}
              drillDownHref="/admin/operations-intelligence"
              onClick={() => onNavigate?.('/admin/operations-intelligence')}
            />
            <KpiCard
              label="Avg Response Time"
              value={data.averageResponseTime}
              drillDownHref="/admin/support"
              onClick={() => onNavigate?.('/admin/support')}
            />
            <KpiCard
              label="Operational Capacity"
              value={data.operationalCapacity}
              drillDownHref="/admin/operations-intelligence"
              onClick={() => onNavigate?.('/admin/operations-intelligence')}
            />
            <KpiCard
              label="Payment Health"
              value={data.paymentHealth}
              status={data.paymentHealth === 'HEALTHY' ? 'HEALTHY' : data.paymentHealth === 'WARNING' ? 'WARNING' : 'CRITICAL'}
              drillDownHref="/admin/operations-intelligence"
              onClick={() => onNavigate?.('/admin/operations-intelligence')}
            />
          </div>
        </div>
      )}
    </div>
  )
}
