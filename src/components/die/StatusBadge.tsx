import { CheckCircle, Clock, AlertTriangle, XCircle, FileCheck, Loader2, Eye } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  UPLOADED: { label: 'Uploaded', color: 'bg-slate-100 text-slate-700', icon: Clock },
  OCR_PROCESSING: { label: 'Extracting', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  EXTRACTED: { label: 'Extracted', color: 'bg-indigo-100 text-indigo-700', icon: FileCheck },
  INTELLIGENCE_DONE: { label: 'Ready for Review', color: 'bg-amber-100 text-amber-700', icon: Eye },
  REVIEW: { label: 'In Review', color: 'bg-amber-100 text-amber-700', icon: Eye },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  APPLIED: { label: 'Applied', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
}

const SEVERITY_CONFIG: Record<string, { color: string }> = {
  LOW: { color: 'bg-slate-100 text-slate-700' },
  MEDIUM: { color: 'bg-amber-100 text-amber-700' },
  HIGH: { color: 'bg-orange-100 text-orange-700' },
  CRITICAL: { color: 'bg-red-100 text-red-700' },
}

const RECONCILIATION_CONFIG: Record<string, { label: string; color: string }> = {
  UNMATCHED: { label: 'Unmatched', color: 'bg-slate-100 text-slate-700' },
  MATCHED_PO: { label: 'Matched PO', color: 'bg-green-100 text-green-700' },
  MATCHED_GRN: { label: 'Matched GRN', color: 'bg-blue-100 text-blue-700' },
  CONFLICT: { label: 'Conflict', color: 'bg-red-100 text-red-700' },
}

export function DocumentStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-600', icon: Clock }
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

export function SeverityBadge({ severity }: { severity: string }) {
  const config = SEVERITY_CONFIG[severity] || { color: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {severity}
    </span>
  )
}

export function ReconciliationBadge({ state }: { state: string }) {
  const config = RECONCILIATION_CONFIG[state] || { label: state, color: 'bg-slate-100 text-slate-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

export function ConfidenceBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-xs text-slate-400">N/A</span>
  const pct = Math.round(score * 100)
  const color = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-amber-600' : 'text-red-600'
  return <span className={`text-xs font-medium ${color}`}>{pct}%</span>
}
