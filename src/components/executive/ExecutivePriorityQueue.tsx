import { ListOrdered, ArrowRight } from 'lucide-react'

export interface PriorityQueueItem {
  title: string
  description: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  center: string
  action: string
  link: string
}

interface Props {
  data: PriorityQueueItem[] | null
  loading?: boolean
  onNavigate?: (link: string) => void
}

const severityConfig = {
  CRITICAL: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
  HIGH: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  MEDIUM: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  LOW: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
}

export default function ExecutivePriorityQueue({ data, loading, onNavigate }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-1/4 mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-xl mb-2" />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <ListOrdered className="w-5 h-5 text-indigo-500" />
          <h3 className="text-base font-bold text-slate-900">Priority Queue</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-slate-400">No items in the priority queue. All clear.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <ListOrdered className="w-5 h-5 text-indigo-500" />
        <h3 className="text-base font-bold text-slate-900">Priority Queue</h3>
        <span className="ml-auto text-xs font-medium text-slate-400">{data.length} items</span>
      </div>

      <ul className="space-y-2">
        {data.map((item, i) => {
          const cfg = severityConfig[item.priority]
          return (
            <li key={i} className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                      {item.priority}
                    </span>
                    <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                      {item.center}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{item.description}</p>
                  <button
                    type="button"
                    onClick={() => onNavigate?.(item.link)}
                    className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color} hover:underline`}
                  >
                    {item.action}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
