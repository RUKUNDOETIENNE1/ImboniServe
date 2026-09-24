import { Users, CheckSquare, Search, TrendingUp, Zap } from 'lucide-react'

export interface CapacityData {
  supportWorkload: number
  pendingApprovals: number
  openInvestigations: number
  dailyThroughput: number
  assignedSupport: number
  unassignedSupport: number
  expansionReadiness: boolean
}

interface Props {
  data: CapacityData | null
  loading?: boolean
}

export default function CapacityCenter({ data, loading }: Props) {
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
        <h3 className="text-base font-bold text-slate-900 mb-2">Capacity Center</h3>
        <p className="text-sm text-slate-400">No capacity data available.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-bold text-slate-900 mb-4">Capacity Center</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <CapacityCard
          icon={<Users className="w-5 h-5 text-blue-500" />}
          label="Support Workload"
          value={data.supportWorkload}
          subValue={`${data.assignedSupport} assigned`}
        />
        <CapacityCard
          icon={<CheckSquare className="w-5 h-5 text-amber-500" />}
          label="Pending Approvals"
          value={data.pendingApprovals}
          subValue="Awaiting review"
        />
        <CapacityCard
          icon={<Search className="w-5 h-5 text-red-500" />}
          label="Open Investigations"
          value={data.openInvestigations}
          subValue="Suspended partners"
        />
        <CapacityCard
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
          label="Daily Throughput"
          value={data.dailyThroughput}
          subValue="New entities today"
        />
      </div>

      {/* Expansion Readiness */}
      <div className={`rounded-xl border p-4 ${data.expansionReadiness ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center gap-3">
          <Zap className={`w-5 h-5 ${data.expansionReadiness ? 'text-emerald-500' : 'text-amber-500'}`} />
          <div>
            <p className="text-sm font-medium text-slate-900">Expansion Readiness</p>
            <p className="text-xs text-slate-600">
              {data.expansionReadiness
                ? 'Operations are running efficiently. Ready to scale.'
                : 'Resolve operational issues before scaling.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CapacityCard({ icon, label, value, subValue }: { icon: React.ReactNode; label: string; value: number; subValue: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs text-slate-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{subValue}</p>
    </div>
  )
}
