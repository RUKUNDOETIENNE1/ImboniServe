import { ArrowRight, Store, Gift, CheckCircle, CreditCard, DollarSign, RefreshCw, User } from 'lucide-react'

interface JourneyStep {
  step: string
  timestamp: string | null
  status: string
  details?: any
}

interface JourneyExplorerProps {
  journey: {
    business: {
      id: string
      name: string
      phone: string
      city: string
      approvalStatus: string
      trialStartDate?: string | null
      trialEndDate?: string | null
      createdAt: string
      isActive: boolean
    }
    steps: JourneyStep[]
    attribution?: any
    redemptions: Array<{ code: string; trialDaysGranted: number; redeemedAt: string }>
    subscriptions: Array<{ id: string; status: string; createdAt: string }>
    ledgerEntries: Array<{ id: string; eventType: string; amountCents: number; currency: string; occurredAt: string; status?: string | null }>
    commissions: Array<{ id: string; partnership: string; status: string; amountCents: number; type: string }>
    events: Array<{ type: string; timestamp: string; triggeredBy?: string | null }>
  } | null
}

const stepIcons: Record<string, any> = {
  Signup: Store,
  Attribution: User,
  'Code Redemption': Gift,
  'Trial Started': Gift,
  'Trial Expired': RefreshCw,
  Approval: CheckCircle,
  Subscription: CreditCard,
  Revenue: DollarSign,
  Commission: DollarSign,
}

const statusColors: Record<string, string> = {
  Completed: 'text-green-600 bg-green-50',
  Active: 'text-blue-600 bg-blue-50',
  PENDING: 'text-amber-600 bg-amber-50',
  APPROVED: 'text-green-600 bg-green-50',
  ACTIVE: 'text-green-600 bg-green-50',
  EXPIRED: 'text-red-600 bg-red-50',
  CANCELLED: 'text-red-600 bg-red-50',
  PAID: 'text-green-600 bg-green-50',
  SUSPENDED: 'text-red-600 bg-red-50',
}

function formatCurrency(cents: number): string {
  return `${(cents / 100).toLocaleString()} RWF`
}

export default function JourneyExplorer({ journey }: JourneyExplorerProps) {
  if (!journey) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Customer Journey Explorer</h3>
        <p className="text-sm text-slate-400">Search for a business to view its complete journey.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Customer Journey</h3>
          <p className="text-xs text-slate-500">{journey.business.name} · {journey.business.phone}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded ${journey.business.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-600'}`}>
          {journey.business.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Journey Steps */}
      <div className="space-y-0" role="list" aria-label="Customer journey steps">
        {journey.steps.map((step, idx) => {
          const Icon = stepIcons[step.step] ?? ArrowRight
          const statusColor = statusColors[step.status] ?? 'text-slate-600 bg-slate-50'
          const isLast = idx === journey.steps.length - 1

          return (
            <div key={idx} className="flex gap-3" role="listitem">
              {/* Icon + connector */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-slate-600" aria-hidden="true" />
                </div>
                {!isLast && <div className="w-px h-full bg-slate-200" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700">{step.step}</p>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${statusColor}`}>
                    {step.status}
                  </span>
                </div>
                {step.timestamp && (
                  <time className="text-xs text-slate-400">
                    {new Date(step.timestamp).toLocaleString()}
                  </time>
                )}
                {step.details && (
                  <div className="mt-1 text-xs text-slate-500">
                    {Object.entries(step.details).map(([key, val]) => (
                      <span key={key} className="mr-3">
                        <span className="text-slate-400">{key}:</span>{' '}
                        {typeof val === 'number' && key.includes('Cents') ? formatCurrency(val) : String(val)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
        <div>
          <p className="text-slate-500">Redemptions</p>
          <p className="font-bold text-slate-700">{journey.redemptions.length}</p>
        </div>
        <div>
          <p className="text-slate-500">Subscriptions</p>
          <p className="font-bold text-slate-700">{journey.subscriptions.length}</p>
        </div>
        <div>
          <p className="text-slate-500">Revenue Entries</p>
          <p className="font-bold text-slate-700">{journey.ledgerEntries.length}</p>
        </div>
        <div>
          <p className="text-slate-500">Commissions</p>
          <p className="font-bold text-slate-700">{journey.commissions.length}</p>
        </div>
      </div>
    </div>
  )
}
