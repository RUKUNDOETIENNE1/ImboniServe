import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Filter, Info, AlertTriangle, Activity } from 'lucide-react'

type TimelineEvent = {
  id: string
  stage: string
  status: string
  metadata?: any
  createdAt: string
}

type ProcessingLog = {
  id: string
  stage: string
  level: string
  message: string
  payload?: any
  createdAt: string
}

type AnomalyAlert = {
  id: string
  type: string
  status: string
  severity: string
  title?: string | null
  confidence?: number | null
  details?: any
  createdAt: string
}

type RowType = 'lifecycle' | 'worker' | 'anomaly'

type Row = {
  id: string
  type: RowType
  ts: Date
  title: string
  subtitle?: string
  level?: 'info' | 'warn' | 'error'
  details?: any
  actor?: string
  source?: string
}

function safeJson(v: any) {
  try {
    return JSON.stringify(v ?? null, null, 2)
  } catch {
    return String(v)
  }
}

function formatWhen(ts: Date) {
  return ts.toLocaleString()
}

function levelColor(level?: string) {
  if (level === 'error') return 'text-red-600 dark:text-red-300'
  if (level === 'warn') return 'text-amber-600 dark:text-amber-300'
  return 'text-slate-600 dark:text-slate-300'
}

export default function DocumentTimeline(props: {
  timeline?: TimelineEvent[]
  processingLogs?: ProcessingLog[]
  anomalyAlerts?: AnomalyAlert[]
}) {
  const [filter, setFilter] = useState<Record<RowType, boolean>>({
    lifecycle: true,
    worker: true,
    anomaly: true,
  })

  const rows: Row[] = useMemo(() => {
    const out: Row[] = []

    for (const ev of props.timeline || []) {
      const ts = new Date(ev.createdAt)
      if (isNaN(ts.getTime())) continue

      const actor =
        (ev.metadata && (ev.metadata.approvedBy || ev.metadata.rejectedBy || ev.metadata.userId || ev.metadata.actor)) || undefined
      const source = (ev.metadata && (ev.metadata.stage || ev.stage)) || ev.stage

      out.push({
        id: `lifecycle:${ev.id}`,
        type: 'lifecycle',
        ts,
        title: `${String(ev.status).replaceAll('_', ' ')}`,
        subtitle: String(ev.stage).replaceAll('_', ' '),
        level: 'info',
        details: ev.metadata,
        actor: actor ? String(actor) : undefined,
        source: source ? String(source) : undefined,
      })
    }

    for (const log of props.processingLogs || []) {
      const ts = new Date(log.createdAt)
      if (isNaN(ts.getTime())) continue

      out.push({
        id: `worker:${log.id}`,
        type: 'worker',
        ts,
        title: log.message,
        subtitle: log.stage,
        level: (log.level as any) || 'info',
        details: log.payload,
        source: log.stage,
      })
    }

    for (const a of props.anomalyAlerts || []) {
      const ts = new Date(a.createdAt)
      if (isNaN(ts.getTime())) continue

      out.push({
        id: `anomaly:${a.id}`,
        type: 'anomaly',
        ts,
        title: a.title || String(a.type).replaceAll('_', ' '),
        subtitle: `${a.status} · ${a.severity}`,
        level: a.severity === 'CRITICAL' || a.severity === 'HIGH' ? 'warn' : 'info',
        details: a.details,
        source: 'anomaly',
      })
    }

    out.sort((a, b) => a.ts.getTime() - b.ts.getTime())
    return out
  }, [props.anomalyAlerts, props.processingLogs, props.timeline])

  const visible = useMemo(() => rows.filter((r) => filter[r.type]), [filter, rows])

  const iconForType = (t: RowType) => {
    if (t === 'lifecycle') return Info
    if (t === 'anomaly') return AlertTriangle
    return Activity
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Timeline</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lifecycle, worker events, anomalies</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filters
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-wrap gap-2">
        {(['lifecycle', 'worker', 'anomaly'] as RowType[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilter((prev) => ({ ...prev, [t]: !prev[t] }))}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter[t]
                ? 'bg-imboni-blue text-white border-imboni-blue'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-3">
        {visible.length === 0 ? (
          <div className="p-10 text-center text-slate-400 dark:text-slate-500">
            <p className="text-sm">No events to display</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visible.map((row) => (
              <TimelineRow key={row.id} row={row} iconForType={iconForType} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TimelineRow({ row, iconForType }: { row: Row; iconForType: (t: RowType) => any }) {
  const [open, setOpen] = useState(false)
  const Icon = iconForType(row.type)

  return (
    <div className="py-3 px-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 text-left"
      >
        <div className="mt-0.5">
          {open ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>

        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <Icon className="w-4 h-4 text-slate-500 dark:text-slate-300" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate ${levelColor(row.level)}`}>{row.title}</p>
              {row.subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{row.subtitle}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{formatWhen(row.ts)}</p>
              {(row.actor || row.source) && (
                <p className="text-[11px] text-slate-300 dark:text-slate-600 whitespace-nowrap">
                  {row.actor ? `actor:${row.actor}` : ''}{row.actor && row.source ? ' · ' : ''}{row.source ? `src:${row.source}` : ''}
                </p>
              )}
            </div>
          </div>

          {open && (
            <div className="mt-3">
              <pre className="text-[11px] leading-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 overflow-x-auto text-slate-600 dark:text-slate-300">
                {safeJson(row.details)}
              </pre>
            </div>
          )}
        </div>
      </button>
    </div>
  )
}
