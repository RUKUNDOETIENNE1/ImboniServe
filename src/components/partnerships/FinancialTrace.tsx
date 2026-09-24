import { Link2, ArrowRight, FileText, DollarSign, Wallet, History } from 'lucide-react'

interface FinancialTraceData {
  ledger: Array<{
    id: string
    eventType: string
    domain: string
    amountCents: number
    currency: string
    netAmountCents?: number | null
    gateway?: string | null
    invoiceNumber?: string | null
    occurredAt: string
  }>
  commissions: Array<{
    id: string
    partnership: { id: string; name: string }
    type: string
    status: string
    amountCents: number
    currency: string
    ratePercent: number
    createdAt: string
    payout: { id: string; status: string; paidAt?: string | null } | null
  }>
  payouts: Array<{
    id: string
    partnership: { id: string; name: string }
    amountCents: number
    currency: string
    method: string
    status: string
    createdAt: string
    paidAt?: string | null
    commissionCount: number
  }>
  audit: Array<{
    id: string
    action: string
    actorId?: string | null
    createdAt: string
  }>
}

interface FinancialTraceProps {
  trace: FinancialTraceData | null
}

function formatCurrency(cents: number): string {
  return `${(cents / 100).toLocaleString()} RWF`
}

function formatType(type: string): string {
  return type.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

export default function FinancialTrace({ trace }: FinancialTraceProps) {
  if (!trace) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Financial Trace</h3>
        </div>
        <p className="text-sm text-slate-400">Search for an entity to trace its financial flow.</p>
      </div>
    )
  }

  const totalRevenue = trace.ledger.reduce((s, e) => s + e.amountCents, 0)
  const totalCommission = trace.commissions.reduce((s, c) => s + c.amountCents, 0)
  const totalPayout = trace.payouts.reduce((s, p) => s + p.amountCents, 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-800">Financial Trace</h3>
      </div>

      {/* Flow: Revenue → Commission → Payout → Audit */}
      <div className="flex items-center gap-2 mb-4 text-xs">
        <FlowStep icon={DollarSign} label="Revenue" value={formatCurrency(totalRevenue)} count={trace.ledger.length} color="text-green-600 bg-green-50" />
        <ArrowRight className="w-3 h-3 text-slate-300" />
        <FlowStep icon={FileText} label="Commission" value={formatCurrency(totalCommission)} count={trace.commissions.length} color="text-blue-600 bg-blue-50" />
        <ArrowRight className="w-3 h-3 text-slate-300" />
        <FlowStep icon={Wallet} label="Payout" value={formatCurrency(totalPayout)} count={trace.payouts.length} color="text-purple-600 bg-purple-50" />
        <ArrowRight className="w-3 h-3 text-slate-300" />
        <FlowStep icon={History} label="Audit" value="" count={trace.audit.length} color="text-slate-600 bg-slate-50" />
      </div>

      {/* Ledger entries */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-600 mb-2">Revenue (FinancialLedgerEntry)</p>
        {trace.ledger.length === 0 ? (
          <p className="text-xs text-slate-400">No ledger entries.</p>
        ) : (
          <div className="space-y-1" role="list" aria-label="Ledger entries">
            {trace.ledger.slice(0, 10).map((e) => (
              <div key={e.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded" role="listitem">
                <div className="min-w-0">
                  <span className="font-medium text-slate-700">{formatType(e.eventType)}</span>
                  {e.invoiceNumber && <span className="text-slate-400 ml-2 font-mono">{e.invoiceNumber}</span>}
                </div>
                <span className="font-medium text-slate-700 flex-shrink-0">{formatCurrency(e.amountCents)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commissions */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-600 mb-2">Commissions</p>
        {trace.commissions.length === 0 ? (
          <p className="text-xs text-slate-400">No commissions.</p>
        ) : (
          <div className="space-y-1" role="list" aria-label="Commissions">
            {trace.commissions.slice(0, 10).map((c) => (
              <div key={c.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded" role="listitem">
                <div className="min-w-0">
                  <span className="font-medium text-slate-700">{c.partnership.name}</span>
                  <span className="text-slate-400 ml-2">{formatType(c.type)} · {c.status}</span>
                </div>
                <span className="font-medium text-slate-700 flex-shrink-0">{formatCurrency(c.amountCents)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payouts */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-600 mb-2">Payouts</p>
        {trace.payouts.length === 0 ? (
          <p className="text-xs text-slate-400">No payouts.</p>
        ) : (
          <div className="space-y-1" role="list" aria-label="Payouts">
            {trace.payouts.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded" role="listitem">
                <div className="min-w-0">
                  <span className="font-medium text-slate-700">{p.partnership.name}</span>
                  <span className="text-slate-400 ml-2">{formatType(p.method)} · {p.status}</span>
                </div>
                <span className="font-medium text-slate-700 flex-shrink-0">{formatCurrency(p.amountCents)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit */}
      {trace.audit.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-600 mb-2">Audit Records ({trace.audit.length})</p>
          <div className="space-y-1" role="list" aria-label="Audit records">
            {trace.audit.slice(0, 5).map((a) => (
              <div key={a.id} className="text-xs text-slate-500 p-1.5" role="listitem">
                <span className="font-medium">{formatType(a.action)}</span>
                {a.actorId && <span className="text-slate-400 ml-2">by {a.actorId.slice(-8)}</span>}
                <span className="text-slate-400 ml-2">{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FlowStep({ icon: Icon, label, value, count, color }: { icon: any; label: string; value: string; count: number; color: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${color}`}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      <div>
        <p className="font-medium">{label}</p>
        {value && <p className="text-xs">{value}</p>}
        <p className="text-xs opacity-75">{count} item{count !== 1 ? 's' : ''}</p>
      </div>
    </div>
  )
}
