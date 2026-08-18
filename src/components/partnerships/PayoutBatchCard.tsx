import { Wallet, Users, CheckCircle, XCircle, RefreshCw, Download } from 'lucide-react'
import StatusBadge from './StatusBadge'

interface PayoutBatchCardProps {
  payout: {
    id: string
    partnership: { id: string; name: string; email?: string; phone?: string }
    amountCents: number
    currency: string
    method: string
    status: string
    createdAt: string
    approvedAt?: string | null
    paidAt?: string | null
    referenceId?: string | null
    recipientPhone?: string | null
    commissionCount?: number
  }
  canManage?: boolean
  onAction?: (action: string, data?: Record<string, unknown>) => void
}

function formatCurrency(cents: number, currency = 'RWF'): string {
  if (cents >= 10000000) return `${(cents / 10000000).toFixed(1)}M ${currency}`
  if (cents >= 100000) return `${(cents / 100000).toFixed(1)}K ${currency}`
  return `${(cents / 100).toLocaleString()} ${currency}`
}

function formatMethod(method: string): string {
  return method.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

export default function PayoutBatchCard({
  payout,
  canManage,
  onAction,
}: PayoutBatchCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate">{payout.partnership.name}</p>
            <p className="text-xs text-slate-500">{formatMethod(payout.method)}</p>
          </div>
        </div>
        <StatusBadge status={payout.status} size="sm" />
      </div>

      {/* Amount and details */}
      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">Amount</p>
          <p className="font-bold text-slate-700">{formatCurrency(payout.amountCents, payout.currency)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Commissions</p>
          <p className="font-bold text-slate-700">{payout.commissionCount ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Created</p>
          <p className="text-xs font-medium text-slate-600">{new Date(payout.createdAt).toLocaleDateString()}</p>
        </div>
        {payout.paidAt && (
          <div>
            <p className="text-xs text-slate-500">Paid</p>
            <p className="text-xs font-medium text-slate-600">{new Date(payout.paidAt).toLocaleDateString()}</p>
          </div>
        )}
        {payout.referenceId && (
          <div className="col-span-2">
            <p className="text-xs text-slate-500">Reference</p>
            <p className="text-xs font-mono font-medium text-slate-600">{payout.referenceId}</p>
          </div>
        )}
        {payout.recipientPhone && (
          <div>
            <p className="text-xs text-slate-500">Recipient</p>
            <p className="text-xs font-medium text-slate-600">{payout.recipientPhone}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {canManage && onAction && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {payout.status === 'PENDING' && (
            <>
              <button
                onClick={() => onAction('approvePayout', { payoutId: payout.id })}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition"
              >
                <CheckCircle className="w-3 h-3" />
                Approve
              </button>
              <button
                onClick={() => onAction('rejectPayout', { payoutId: payout.id, reason: 'Manual rejection' })}
                className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition"
              >
                <XCircle className="w-3 h-3" />
                Reject
              </button>
            </>
          )}
          {payout.status === 'APPROVED' && (
            <>
              <button
                onClick={() => onAction('processPayout', { payoutId: payout.id })}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition"
              >
                <RefreshCw className="w-3 h-3" />
                Process
              </button>
              <button
                onClick={() => onAction('rejectPayout', { payoutId: payout.id, reason: 'Manual rejection' })}
                className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition"
              >
                <XCircle className="w-3 h-3" />
                Reject
              </button>
            </>
          )}
          {payout.status === 'PROCESSING' && (
            <>
              <button
                onClick={() => onAction('markPayoutPaid', { payoutId: payout.id })}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition"
              >
                <CheckCircle className="w-3 h-3" />
                Mark Paid
              </button>
              <button
                onClick={() => onAction('markPayoutFailed', { payoutId: payout.id, failureReason: 'Processing failed' })}
                className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition"
              >
                <XCircle className="w-3 h-3" />
                Mark Failed
              </button>
            </>
          )}
          {payout.status === 'FAILED' && (
            <button
              onClick={() => onAction('retryFailedPayout', { payoutId: payout.id })}
              className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium hover:bg-amber-200 transition"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
          {payout.status === 'PAID' && (
            <button
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium hover:bg-slate-200 transition"
              aria-label={`Export payout ${payout.id}`}
            >
              <Download className="w-3 h-3" />
              Export
            </button>
          )}
        </div>
      )}
    </div>
  )
}
