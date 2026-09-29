import { Shield, CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react'

export interface IntegrityData {
  overallScore: number
  reconciliationRate: number
  reconciliationStatus: string
  totalLedgerEntries: number
  reconciledEntries: number
  unreconciledEntries: number
  paymentSystemHealth: string
  dataQualityScore: number
  settlementDelayDays: number
  available: boolean
}

interface Props {
  data: IntegrityData | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

export default function FinancialIntegrityCenter({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 w-48 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 w-full bg-slate-100 rounded" />
          <div className="h-16 w-full bg-slate-100 rounded" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-400">Financial integrity data unavailable.</p>
      </div>
    )
  }

  const scoreColor = data.overallScore >= 80 ? 'text-emerald-600' : data.overallScore >= 50 ? 'text-amber-600' : 'text-red-600'
  const scoreBg = data.overallScore >= 80 ? 'bg-emerald-50 border-emerald-200' : data.overallScore >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
  const scoreIcon = data.overallScore >= 80 ? <CheckCircle className="w-6 h-6 text-emerald-500" /> : data.overallScore >= 50 ? <AlertTriangle className="w-6 h-6 text-amber-500" /> : <XCircle className="w-6 h-6 text-red-500" />

  const reconIcon = data.reconciliationStatus === 'HEALTHY' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : data.reconciliationStatus === 'WARNING' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <XCircle className="w-4 h-4 text-red-500" />

  const paymentIcon = data.paymentSystemHealth === 'HEALTHY' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : data.paymentSystemHealth === 'WARNING' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <XCircle className="w-4 h-4 text-red-500" />

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-slate-700" />
        <h3 className="text-base font-bold text-slate-900">Financial Integrity Center</h3>
      </div>

      {/* Overall score */}
      <div className={`rounded-xl border p-4 mb-4 ${scoreBg}`}>
        <div className="flex items-center gap-3">
          {scoreIcon}
          <div>
            <p className="text-xs text-slate-500">Financial Confidence Score</p>
            <p className={`text-2xl font-bold ${scoreColor}`}>{data.overallScore}/100</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-2">
          {data.overallScore >= 80
            ? 'All financial systems are operating with high integrity. Numbers can be trusted.'
            : data.overallScore >= 50
            ? 'Some integrity concerns detected. Review items below before relying on figures.'
            : 'Critical integrity issues. Financial numbers may not be fully reliable.'}
        </p>
      </div>

      {/* Integrity metrics */}
      <div className="space-y-3">
        <IntegrityRow
          icon={reconIcon}
          label="Reconciliation"
          value={`${data.reconciliationRate.toFixed(1)}%`}
          status={data.reconciliationStatus}
          detail={`${data.reconciledEntries.toLocaleString()} / ${data.totalLedgerEntries.toLocaleString()} entries`}
          onDrillDown={onNavigate}
          link="/admin/reconciliation"
        />

        <IntegrityRow
          icon={paymentIcon}
          label="Payment System"
          value={data.paymentSystemHealth}
          status={data.paymentSystemHealth}
          detail={data.totalLedgerEntries > 0 ? `${data.totalLedgerEntries.toLocaleString()} ledger entries (30d)` : 'No entries'}
          onDrillDown={onNavigate}
          link="/admin/operations-intelligence"
        />

        <IntegrityRow
          icon={<CheckCircle className="w-4 h-4 text-slate-400" />}
          label="Data Quality"
          value={`${data.dataQualityScore}%`}
          status={data.dataQualityScore >= 95 ? 'HEALTHY' : data.dataQualityScore >= 80 ? 'WARNING' : 'CRITICAL'}
          detail={`${data.unreconciledEntries.toLocaleString()} unreconciled entries`}
          onDrillDown={onNavigate}
          link="/admin/revenue-operations"
        />

        {!data.available && (
          <p className="text-xs text-slate-400 italic">
            Note: Detailed reconciliation metrics require schema updates. Basic health is available.
          </p>
        )}
      </div>
    </div>
  )
}

function IntegrityRow({
  icon,
  label,
  value,
  status,
  detail,
  onDrillDown,
  link,
}: {
  icon: React.ReactNode
  label: string
  value: string
  status: string
  detail: string
  onDrillDown?: (link: string) => void
  link: string
}) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
      onClick={() => onDrillDown?.(link)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onDrillDown?.(link) }}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-medium text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{detail}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-slate-900">{value}</span>
        <ArrowRight className="w-4 h-4 text-slate-400" />
      </div>
    </div>
  )
}
