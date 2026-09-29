import { Tag, Users, TrendingUp, DollarSign, Clock, Copy } from 'lucide-react'
import StatusBadge from './StatusBadge'

interface FounderCodePerformanceCardProps {
  code: {
    id: string
    code: string
    status: string
    trialDays: number
    redemptionCount: number
    remaining: number | null
    maxRedemptions?: number | null
    expiresAt?: string | null
    label?: string | null
    campaign?: { id: string; name: string } | null
    redemptionTotal: number
  }
  canManage?: boolean
  onAction?: (action: string, data?: Record<string, unknown>) => void
}

export default function FounderCodePerformanceCard({
  code,
  canManage,
  onAction,
}: FounderCodePerformanceCardProps) {
  const isExpiringSoon = code.expiresAt
    ? Math.ceil((new Date(code.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 14
    : false

  const isLowCapacity = code.remaining !== null && code.remaining <= 5 && code.remaining > 0

  return (
    <div className={`bg-white rounded-xl border p-4 ${
      isExpiringSoon || isLowCapacity ? 'border-amber-200' : 'border-slate-200/60'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Tag className="w-4 h-4 text-orange-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-mono font-bold text-slate-700 truncate">{code.code}</p>
            {code.label && <p className="text-xs text-slate-500 truncate">{code.label}</p>}
          </div>
        </div>
        <StatusBadge status={code.status} size="sm" />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Referred</p>
            <p className="font-semibold text-slate-700">{code.redemptionCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Trial</p>
            <p className="font-semibold text-slate-700">{code.trialDays}d</p>
          </div>
        </div>
        {code.remaining !== null && (
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Remaining</p>
              <p className={`font-semibold ${code.remaining <= 5 ? 'text-amber-600' : 'text-slate-700'}`}>
                {code.remaining}
              </p>
            </div>
          </div>
        )}
        {code.campaign && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Campaign</p>
              <p className="font-medium text-slate-700 truncate">{code.campaign.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Expiration warning */}
      {code.expiresAt && isExpiringSoon && code.status === 'ACTIVE' && (
        <div className="mb-3 p-2 bg-amber-50 rounded-lg">
          <p className="text-xs text-amber-700">
            Expires in {Math.ceil((new Date(code.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
          </p>
        </div>
      )}

      {/* Capacity bar */}
      {code.maxRedemptions && (
        <div className="mb-3">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                (code.remaining ?? 0) <= 5 ? 'bg-amber-400' : 'bg-green-400'
              }`}
              style={{ width: `${Math.min((code.redemptionCount / code.maxRedemptions) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {code.redemptionCount} / {code.maxRedemptions} used
          </p>
        </div>
      )}

      {/* Actions */}
      {canManage && onAction && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              navigator.clipboard.writeText(code.code)
            }}
            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium hover:bg-slate-200 transition"
            aria-label={`Copy code ${code.code}`}
          >
            <Copy className="w-3 h-3" />
            Copy
          </button>
          {code.status === 'ACTIVE' && (
            <button
              onClick={() => onAction('updateCodeStatus', { codeId: code.id, status: 'PAUSED' })}
              className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium hover:bg-amber-200 transition"
            >
              Pause
            </button>
          )}
          {code.status === 'PAUSED' && (
            <button
              onClick={() => onAction('updateCodeStatus', { codeId: code.id, status: 'ACTIVE' })}
              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition"
            >
              Resume
            </button>
          )}
          {code.status !== 'REVOKED' && (
            <button
              onClick={() => onAction('updateCodeStatus', { codeId: code.id, status: 'REVOKED' })}
              className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition"
            >
              Revoke
            </button>
          )}
        </div>
      )}
    </div>
  )
}
