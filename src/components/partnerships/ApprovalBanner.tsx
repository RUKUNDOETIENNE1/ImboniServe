import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react'

interface ApprovalBannerProps {
  status: string
  message?: string
  actionLabel?: string
  onAction?: () => void
}

export default function ApprovalBanner({ status, message, actionLabel, onAction }: ApprovalBannerProps) {
  const config: Record<string, { bg: string; border: string; icon: typeof CheckCircle; iconColor: string; title: string }> = {
    SUBMITTED: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Clock,
      iconColor: 'text-blue-600',
      title: 'Application Submitted',
    },
    UNDER_REVIEW: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: Clock,
      iconColor: 'text-amber-600',
      title: 'Under Review',
    },
    APPROVED: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      title: 'Application Approved',
    },
    REJECTED: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: XCircle,
      iconColor: 'text-red-600',
      title: 'Application Rejected',
    },
    WITHDRAWN: {
      bg: 'bg-slate-100',
      border: 'border-slate-200',
      icon: XCircle,
      iconColor: 'text-slate-600',
      title: 'Application Withdrawn',
    },
  }

  const cfg = config[status]
  if (!cfg) return null

  const Icon = cfg.icon

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}
      role="alert"
      aria-label={cfg.title}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 ${cfg.iconColor}`} aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-slate-800">{cfg.title}</p>
          {message && <p className="text-xs text-slate-600 mt-0.5">{message}</p>}
        </div>
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-sm font-medium text-slate-700 hover:text-slate-900 underline-offset-4 hover:underline whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
