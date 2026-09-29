import { useMemo } from 'react'
import { CheckCircle, Circle, AlertCircle } from 'lucide-react'

type TimelineEvent = {
  id: string
  stage: string
  status: string
  metadata?: any
  createdAt: string
}

type ProcessingLog = {
  id?: string
  stage: string
  level: string
  message: string
  payload?: any
  createdAt: string
}

type StepKey =
  | 'UPLOADED'
  | 'OCR_PROCESSING'
  | 'EXTRACTED'
  | 'MATCHING'
  | 'RECONCILIATION'
  | 'ANOMALY_CHECK'
  | 'REVIEW'
  | 'APPROVED'
  | 'APPLIED'

type Step = {
  key: StepKey
  label: string
  statusMatch: string[]
}

function normalizeLifecycleState(value?: string | null): string {
  if (!value) return 'UPLOADED'
  if (value === 'OCR_PROCESSING') return 'UPLOADED'
  if (value === 'REVIEW') return 'REVIEW_REQUIRED'
  return value
}

function parseTs(v?: string | null) {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

function formatDuration(ms: number) {
  const minutes = Math.max(0, Math.round(ms / 60000))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export default function DocumentLifecycle(props: {
  status: string
  lifecycleState?: string | null
  scanJobStatus?: string | null
  timeline?: TimelineEvent[]
  processingLogs?: ProcessingLog[]
}) {
  const steps: Step[] = useMemo(
    () => [
      { key: 'UPLOADED', label: 'Uploaded', statusMatch: ['UPLOADED'] },
      { key: 'OCR_PROCESSING', label: 'OCR', statusMatch: ['OCR_PROCESSING'] },
      { key: 'EXTRACTED', label: 'Extracted', statusMatch: ['EXTRACTED'] },
      { key: 'MATCHING', label: 'Matching', statusMatch: ['MATCHED'] },
      { key: 'RECONCILIATION', label: 'Reconciliation', statusMatch: ['RECONCILED'] },
      { key: 'ANOMALY_CHECK', label: 'Anomaly Check', statusMatch: ['ANALYZED'] },
      { key: 'REVIEW', label: 'Review', statusMatch: ['REVIEW_REQUIRED'] },
      { key: 'APPROVED', label: 'Approved', statusMatch: ['APPROVED'] },
      { key: 'APPLIED', label: 'Applied', statusMatch: ['APPLIED'] },
    ],
    []
  )

  const normalized = normalizeLifecycleState(props.lifecycleState || props.status)
  const failed = normalized === 'FAILED' || props.status === 'FAILED'

  const timelineByStatus = useMemo(() => {
    const map = new Map<string, Date>()
    for (const ev of props.timeline || []) {
      const dt = parseTs(ev.createdAt)
      if (!dt) continue
      if (!map.has(ev.status)) {
        map.set(ev.status, dt)
      }
    }
    return map
  }, [props.timeline])

  const ocrStart = useMemo(() => {
    const start = (props.processingLogs || []).find((l) => l.stage === 'ocr' && l.message.includes('started'))
    return parseTs(start?.createdAt || null)
  }, [props.processingLogs])

  const ocrEnd = useMemo(() => {
    const end = (props.processingLogs || []).find((l) => l.stage === 'ocr' && l.message.includes('completed'))
    return parseTs(end?.createdAt || null)
  }, [props.processingLogs])

  const derivedCurrentKey: StepKey = useMemo(() => {
    if (failed) {
      const last = (props.timeline || []).slice().reverse().find((e) => e.status && e.status !== 'UPLOADED')
      const lastStatus = normalizeLifecycleState(last?.status)
      const matched = steps.find((s) => s.statusMatch.includes(lastStatus))
      return matched?.key || 'UPLOADED'
    }

    if (props.scanJobStatus === 'OCR_PROCESSING') return 'OCR_PROCESSING'

    const match = steps.find((s) => s.statusMatch.includes(normalized))
    if (match) return match.key

    if (normalized === 'INTELLIGENCE_DONE') return 'MATCHING'

    return 'UPLOADED'
  }, [failed, normalized, props.scanJobStatus, props.timeline, steps])

  const stepMeta = useMemo(() => {
    const meta = new Map<StepKey, { ts: Date | null; durationFromPrev: string | null }>()

    const tsForStep = (key: StepKey) => {
      if (key === 'OCR_PROCESSING') return ocrStart || ocrEnd || null
      const step = steps.find((s) => s.key === key)
      if (!step) return null
      for (const st of step.statusMatch) {
        const dt = timelineByStatus.get(st)
        if (dt) return dt
      }
      return null
    }

    let prevTs: Date | null = null
    for (const step of steps) {
      const ts = tsForStep(step.key)
      const duration = prevTs && ts ? formatDuration(ts.getTime() - prevTs.getTime()) : null
      meta.set(step.key, { ts, durationFromPrev: duration })
      if (ts) prevTs = ts
    }

    return meta
  }, [ocrEnd, ocrStart, steps, timelineByStatus])

  const currentIndex = steps.findIndex((s) => s.key === derivedCurrentKey)

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Lifecycle</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Canonical DIE pipeline state</p>
        </div>
        {failed ? (
          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200 inline-flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Failed
          </span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {derivedCurrentKey.replace('_', ' ')}
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="hidden md:flex items-stretch gap-2 overflow-x-auto">
          {steps.map((step, idx) => {
            const done = idx < currentIndex
            const current = idx === currentIndex
            const meta = stepMeta.get(step.key)
            const Icon = done ? CheckCircle : Circle

            const circleClass = done
              ? 'text-green-600 dark:text-green-400'
              : current
                ? failed
                  ? 'text-red-600 dark:text-red-300'
                  : 'text-imboni-blue'
                : 'text-slate-300 dark:text-slate-600'

            const labelClass = done
              ? 'text-slate-800 dark:text-slate-100'
              : current
                ? 'text-slate-900 dark:text-white font-semibold'
                : 'text-slate-500 dark:text-slate-400'

            return (
              <div key={step.key} className="min-w-[130px] flex-1">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${circleClass}`} />
                  <div className="min-w-0">
                    <p className={`text-xs truncate ${labelClass}`}>{step.label}</p>
                    {meta?.ts ? (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        {meta.ts.toLocaleTimeString()} {meta.durationFromPrev ? `· +${meta.durationFromPrev}` : ''}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-300 dark:text-slate-600">—</p>
                    )}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className="h-0.5 mt-3 bg-slate-100 dark:bg-slate-800" />
                )}
              </div>
            )
          })}
        </div>

        <div className="md:hidden space-y-3">
          {steps.map((step, idx) => {
            const done = idx < currentIndex
            const current = idx === currentIndex
            const meta = stepMeta.get(step.key)
            const Icon = done ? CheckCircle : Circle

            const circleClass = done
              ? 'text-green-600'
              : current
                ? failed
                  ? 'text-red-600'
                  : 'text-imboni-blue'
                : 'text-slate-300'

            return (
              <div key={step.key} className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-0.5 ${circleClass}`} />
                <div className="flex-1">
                  <p className={`text-sm ${current ? 'font-semibold text-slate-900 dark:text-white' : done ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {step.label}
                  </p>
                  {meta?.ts ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {meta.ts.toLocaleString()} {meta.durationFromPrev ? `· +${meta.durationFromPrev}` : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-300 dark:text-slate-600">—</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {ocrStart && ocrEnd && (
        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          OCR duration: {formatDuration(ocrEnd.getTime() - ocrStart.getTime())}
        </div>
      )}
    </div>
  )
}
