import { LucideIcon } from 'lucide-react'
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Pause,
  FileText,
  X,
  RefreshCw,
} from 'lucide-react'

type StatusType =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'ACTIVE'
  | 'ONBOARDED'
  | 'SUSPENDED'
  | 'TERMINATED'
  | 'PROSPECT'
  | 'APPLIED'
  | 'DRAFT'
  | 'SENT'
  | 'SIGNED'
  | 'EXPIRED'
  | 'AMENDED'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PENDING'
  | 'VALIDATED'
  | 'PAID'
  | 'VOID'
  | 'CLAWED_BACK'
  | 'PROCESSING'
  | 'FAILED'
  | 'REJECTED'
  | 'REVOKED'
  | 'EXHAUSTED'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<
  string,
  { color: string; bg: string; border: string; icon: LucideIcon; label: string }
> = {
  SUBMITTED: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: FileText, label: 'Submitted' },
  UNDER_REVIEW: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock, label: 'Under Review' },
  APPROVED: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, label: 'Approved' },
  REJECTED: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, label: 'Rejected' },
  WITHDRAWN: { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: X, label: 'Withdrawn' },
  ACTIVE: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, label: 'Active' },
  ONBOARDED: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: CheckCircle, label: 'Onboarded' },
  SUSPENDED: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: Pause, label: 'Suspended' },
  TERMINATED: { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: XCircle, label: 'Terminated' },
  PROSPECT: { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: Clock, label: 'Prospect' },
  APPLIED: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: FileText, label: 'Applied' },
  DRAFT: { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: FileText, label: 'Draft' },
  SENT: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: FileText, label: 'Sent' },
  SIGNED: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, label: 'Signed' },
  EXPIRED: { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: Clock, label: 'Expired' },
  AMENDED: { color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', icon: RefreshCw, label: 'Amended' },
  PAUSED: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Pause, label: 'Paused' },
  COMPLETED: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: CheckCircle, label: 'Completed' },
  CANCELLED: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, label: 'Cancelled' },
  PENDING: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock, label: 'Pending' },
  VALIDATED: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: CheckCircle, label: 'Validated' },
  PAID: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, label: 'Paid' },
  VOID: { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: X, label: 'Void' },
  CLAWED_BACK: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, label: 'Clawed Back' },
  PROCESSING: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: RefreshCw, label: 'Processing' },
  FAILED: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, label: 'Failed' },
  REVOKED: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle, label: 'Revoked' },
  EXHAUSTED: { color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', icon: X, label: 'Exhausted' },
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
}

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    icon: FileText,
    label: status,
  }
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.color} ${config.bg} ${config.border} ${sizeClasses[size]}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <Icon className={iconSizes[size]} aria-hidden="true" />
      {config.label}
    </span>
  )
}
