import { GitBranch, Star, MousePointer, User } from 'lucide-react'

interface AttributionEntry {
  id: string
  partnership: { id: string; name: string; partnerType?: string; status?: string }
  businessId: string
  code: { id: string; code: string; status: string; trialDays: number } | null
  sourceType: string
  touchType: string
  isCanonical: boolean
  sourceCode?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  ipAddress?: string | null
  trialDaysOverride?: number | null
  createdAt: string
}

interface AttributionGraphProps {
  entries: AttributionEntry[]
}

function formatType(type: string): string {
  return type.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

const touchTypeIcons: Record<string, any> = {
  FIRST_TOUCH: MousePointer,
  LAST_TOUCH: Star,
  ASSIST: GitBranch,
  CANONICAL: Star,
}

export default function AttributionGraph({ entries }: AttributionGraphProps) {
  if (!entries || entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-5">
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Attribution Explorer</h3>
        </div>
        <p className="text-sm text-slate-400">No attribution records found.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-800">Attribution Explorer</h3>
        <span className="text-xs text-slate-500">{entries.length} touch(es)</span>
      </div>

      <div className="space-y-2" role="list" aria-label="Attribution touches">
        {entries.slice(0, 20).map((entry) => {
          const Icon = touchTypeIcons[entry.touchType] ?? User
          return (
            <div
              key={entry.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                entry.isCanonical ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/30'
              }`}
              role="listitem"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                entry.isCanonical ? 'bg-emerald-100' : 'bg-slate-100'
              }`}>
                <Icon className={`w-4 h-4 ${entry.isCanonical ? 'text-emerald-600' : 'text-slate-500'}`} aria-hidden="true" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-700">{entry.partnership.name}</span>
                  {entry.isCanonical && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                      Canonical
                    </span>
                  )}
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {formatType(entry.sourceType)}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                    {formatType(entry.touchType)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 mt-1 text-xs text-slate-500">
                  <div>
                    <span className="text-slate-400">Business:</span>{' '}
                    <span className="font-mono">{entry.businessId.slice(-12)}</span>
                  </div>
                  {entry.code && (
                    <div>
                      <span className="text-slate-400">Code:</span>{' '}
                      <span className="font-mono font-medium">{entry.code.code}</span>
                    </div>
                  )}
                  {entry.utmSource && (
                    <div>
                      <span className="text-slate-400">UTM Source:</span>{' '}
                      <span>{entry.utmSource}</span>
                    </div>
                  )}
                  {entry.trialDaysOverride != null && (
                    <div>
                      <span className="text-slate-400">Trial Override:</span>{' '}
                      <span>{entry.trialDaysOverride}d</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">Date:</span>{' '}
                    <time>{new Date(entry.createdAt).toLocaleDateString()}</time>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
