import { CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react'

interface ReconciliationData {
  revenue: { totalCents: number }
  commissionsPaid: { totalCents: number; count: number }
  payoutsPaid: { totalCents: number; count: number }
  approvedUnpaid: number
  voided: number
  clawedBack: number
  balance: number
  mismatches: Array<{ type: string; severity: 'warning' | 'error'; description: string; recommendation: string }>
  status: 'CLEAN' | 'WARNINGS' | 'ERRORS'
}

function formatCurrency(cents: number): string {
  if (cents >= 10000000) return `${(cents / 10000000).toFixed(1)}M RWF`
  if (cents >= 100000) return `${(cents / 100000).toFixed(1)}K RWF`
  return `${(cents / 100).toLocaleString()} RWF`
}

export default function ReconciliationPanel({ data }: { data: ReconciliationData }) {
  const statusConfig = {
    CLEAN: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'All Clear' },
    WARNINGS: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Warnings' },
    ERRORS: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Errors Detected' },
  }

  const cfg = statusConfig[data.status]
  const StatusIcon = cfg.icon

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800">Reconciliation Center</h3>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border}`}>
          <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
          <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
        </div>
      </div>

      {/* Flow: Revenue → Commissions → Payouts → Balance */}
      <div className="space-y-2 mb-4" role="list" aria-label="Reconciliation flow">
        <ReconRow label="Total Revenue" value={formatCurrency(data.revenue.totalCents)} />
        <ReconRow label="Commissions Paid" value={formatCurrency(data.commissionsPaid.totalCents)} subtext={`${data.commissionsPaid.count} commissions`} />
        <ReconRow label="Payouts Paid" value={formatCurrency(data.payoutsPaid.totalCents)} subtext={`${data.payoutsPaid.count} payouts`} />
        <ReconRow
          label="Balance (Commission - Payout)"
          value={formatCurrency(data.balance)}
          valueClass={data.balance === 0 ? 'text-slate-700' : Math.abs(data.balance) > 100 ? 'text-amber-600' : 'text-slate-700'}
        />
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div className="p-2 bg-amber-50 rounded text-center">
          <p className="text-amber-600 font-bold">{data.approvedUnpaid}</p>
          <p className="text-slate-500">Unpaid Approved</p>
        </div>
        <div className="p-2 bg-slate-50 rounded text-center">
          <p className="text-slate-600 font-bold">{data.voided}</p>
          <p className="text-slate-500">Voided</p>
        </div>
        <div className="p-2 bg-red-50 rounded text-center">
          <p className="text-red-600 font-bold">{data.clawedBack}</p>
          <p className="text-slate-500">Clawed Back</p>
        </div>
      </div>

      {/* Mismatches */}
      {data.mismatches.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-600 mb-2">Detected Issues ({data.mismatches.length})</p>
          <div className="space-y-2" role="list" aria-label="Reconciliation mismatches">
            {data.mismatches.map((m) => {
              const Icon = m.severity === 'error' ? XCircle : AlertTriangle
              const color = m.severity === 'error' ? 'text-red-600' : 'text-amber-600'
              const bg = m.severity === 'error' ? 'bg-red-50' : 'bg-amber-50'
              const border = m.severity === 'error' ? 'border-red-200' : 'border-amber-200'

              return (
                <div key={m.type} className={`p-3 rounded-lg border ${bg} ${border}`} role="listitem">
                  <div className="flex items-start gap-2">
                    <Icon className={`w-4 h-4 ${color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700">{m.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{m.description}</p>
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
                        <ArrowRight className="w-3 h-3" />
                        <span>{m.recommendation}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {data.mismatches.length === 0 && (
        <div className="text-center py-3">
          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <p className="text-xs text-slate-500">All reconciliations pass.</p>
        </div>
      )}
    </div>
  )
}

function ReconRow({ label, value, subtext, valueClass }: { label: string; value: string; subtext?: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg" role="listitem">
      <div>
        <span className="text-xs text-slate-500">{label}</span>
        {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
      </div>
      <span className={`text-sm font-bold ${valueClass ?? 'text-slate-700'}`}>{value}</span>
    </div>
  )
}
