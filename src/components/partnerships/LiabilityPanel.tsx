import { AlertTriangle, Clock } from 'lucide-react'

interface AgingBucket {
  bucket: string
  totalCents: number
  count: number
}

interface LiabilityPanelProps {
  totalCents: number
  commissionCount: number
  topLiabilities: Array<{ partnershipId: string; totalCents: number; commissionCount: number }>
  aging: AgingBucket[]
}

function formatCurrency(cents: number): string {
  if (cents >= 10000000) return `${(cents / 10000000).toFixed(1)}M RWF`
  if (cents >= 100000) return `${(cents / 100000).toFixed(1)}K RWF`
  return `${(cents / 100).toLocaleString()} RWF`
}

export default function LiabilityPanel({
  totalCents,
  commissionCount,
  topLiabilities,
  aging,
}: LiabilityPanelProps) {
  const maxAging = Math.max(...aging.map((a) => a.totalCents), 1)

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Liability Center</h3>
          <p className="text-xs text-slate-500">
            {commissionCount} outstanding commission{commissionCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Total liability */}
      <div className="p-3 bg-red-50 rounded-lg mb-4">
        <p className="text-xs text-red-600">Outstanding Liability</p>
        <p className="text-2xl font-bold text-red-700">{formatCurrency(totalCents)}</p>
      </div>

      {/* Aging buckets */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium text-slate-600 mb-2">Aging Analysis</p>
        {aging.map((a) => (
          <div key={a.bucket} role="listitem">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600">{a.bucket}</span>
              <span className="font-medium text-slate-700">{formatCurrency(a.totalCents)}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  a.bucket === '90+ Days' ? 'bg-red-500'
                  : a.bucket === '61-90 Days' ? 'bg-amber-500'
                  : a.bucket === '31-60 Days' ? 'bg-blue-400'
                  : 'bg-green-400'
                }`}
                style={{ width: `${(a.totalCents / maxAging) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{a.count} commission{a.count !== 1 ? 's' : ''}</p>
          </div>
        ))}
      </div>

      {/* Top liabilities */}
      {topLiabilities.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-600 mb-2">Top Liabilities by Partner</p>
          <div className="space-y-1.5" role="list" aria-label="Top liabilities">
            {topLiabilities.slice(0, 5).map((liab, idx) => (
              <div key={liab.partnershipId} className="flex items-center justify-between text-xs" role="listitem">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-400 flex-shrink-0">#{idx + 1}</span>
                  <span className="font-mono text-slate-600 truncate">{liab.partnershipId.slice(-12)}</span>
                </div>
                <span className="font-medium text-slate-700 flex-shrink-0">{formatCurrency(liab.totalCents)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
