import { CheckCircle, XCircle, Edit, Eye, Clock } from 'lucide-react'
import StatusBadge from './StatusBadge'

interface CommissionLifecycleCardProps {
  commission: {
    id: string
    partnership: { id: string; name: string; partnerType?: string; region?: string }
    businessId: string
    type: string
    status: string
    amountCents: number
    currency: string
    ratePercent: number
    periodMonth?: number | null
    description?: string | null
    createdAt: string
    payout?: { id: string; status: string; paidAt?: string | null; method?: string } | null
    campaign?: { id: string; name: string } | null
    code?: { id: string; code: string } | null
    clawbackReason?: string | null
    clawbackDate?: string | null
  }
  canManage?: boolean
  onAction?: (action: string, data?: Record<string, unknown>) => void
}

function formatCurrency(cents: number, currency = 'RWF'): string {
  if (cents >= 10000000) return `${(cents / 10000000).toFixed(1)}M ${currency}`
  if (cents >= 100000) return `${(cents / 100000).toFixed(1)}K ${currency}`
  return `${(cents / 100).toLocaleString()} ${currency}`
}

function formatType(type: string): string {
  return type.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

export default function CommissionLifecycleCard({
  commission,
  canManage,
  onAction,
}: CommissionLifecycleCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-800 truncate">
              {commission.partnership.name}
            </h4>
            <StatusBadge status={commission.status} size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatType(commission.type)} · {formatCurrency(commission.amountCents, commission.currency)}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-slate-700">
            {formatCurrency(commission.amountCents, commission.currency)}
          </p>
          <p className="text-xs text-slate-500">{commission.ratePercent}% rate</p>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
        <div>
          <span className="text-slate-400">Period:</span>{' '}
          <span className="font-medium">{commission.periodMonth ?? '—'}</span>
        </div>
        <div>
          <span className="text-slate-400">Created:</span>{' '}
          <span className="font-medium">{new Date(commission.createdAt).toLocaleDateString()}</span>
        </div>
        {commission.campaign && (
          <div className="col-span-2">
            <span className="text-slate-400">Campaign:</span>{' '}
            <span className="font-medium">{commission.campaign.name}</span>
          </div>
        )}
        {commission.code && (
          <div>
            <span className="text-slate-400">Code:</span>{' '}
            <span className="font-mono font-medium">{commission.code.code}</span>
          </div>
        )}
        {commission.payout && (
          <div>
            <span className="text-slate-400">Payout:</span>{' '}
            <span className="font-medium">{commission.payout.status}</span>
          </div>
        )}
      </div>

      {/* Clawback info */}
      {commission.clawbackReason && (
        <div className="mb-3 p-2 bg-red-50 rounded-lg">
          <p className="text-xs text-red-700">
            <strong>Clawed back:</strong> {commission.clawbackReason}
          </p>
        </div>
      )}

      {/* Actions */}
      {canManage && onAction && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {commission.status === 'PENDING' && (
            <>
              <button
                onClick={() => onAction('validateCommission', { commissionId: commission.id })}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition"
              >
                <CheckCircle className="w-3 h-3" />
                Validate
              </button>
              <button
                onClick={() => onAction('voidCommission', { commissionId: commission.id, reason: 'Manual void' })}
                className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition"
              >
                <XCircle className="w-3 h-3" />
                Void
              </button>
            </>
          )}
          {commission.status === 'VALIDATED' && (
            <>
              <button
                onClick={() => onAction('approveCommission', { commissionId: commission.id })}
                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition"
              >
                <CheckCircle className="w-3 h-3" />
                Approve
              </button>
              <button
                onClick={() => onAction('voidCommission', { commissionId: commission.id, reason: 'Manual void' })}
                className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition"
              >
                <XCircle className="w-3 h-3" />
                Void
              </button>
            </>
          )}
          {(commission.status === 'PENDING' || commission.status === 'VALIDATED' || commission.status === 'APPROVED') && (
            <button
              onClick={() => onAction('adjustCommission', { commissionId: commission.id, newAmountCents: commission.amountCents, reason: 'Manual adjustment' })}
              className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium hover:bg-amber-200 transition"
            >
              <Edit className="w-3 h-3" />
              Adjust
            </button>
          )}
          {commission.status === 'PAID' && (
            <button
              onClick={() => onAction('clawbackCommission', { commissionId: commission.id, reason: 'Manual clawback' })}
              className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition"
            >
              <XCircle className="w-3 h-3" />
              Clawback
            </button>
          )}
          <button
            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium hover:bg-slate-200 transition"
            aria-label={`View source for commission ${commission.id}`}
          >
            <Eye className="w-3 h-3" />
            Source
          </button>
        </div>
      )}
    </div>
  )
}
