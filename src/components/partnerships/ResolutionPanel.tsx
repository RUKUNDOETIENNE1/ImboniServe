import { Wrench, DollarSign, Pause, Play, Calendar, MessageSquare, UserCheck, FileText } from 'lucide-react'

export interface ResolutionAction {
  action: string
  label: string
  icon: string
  description: string
  requiresEntity?: boolean
}

const AVAILABLE_ACTIONS: ResolutionAction[] = [
  { action: 'validateCommission', label: 'Validate Commission', icon: 'dollar', description: 'Validate a pending commission', requiresEntity: true },
  { action: 'approveCommission', label: 'Approve Commission', icon: 'dollar', description: 'Approve a validated commission', requiresEntity: true },
  { action: 'triggerPayout', label: 'Trigger Payout', icon: 'wallet', description: 'Create a new payout for a partner', requiresEntity: true },
  { action: 'pauseCampaign', label: 'Pause Campaign', icon: 'pause', description: 'Pause an active campaign', requiresEntity: true },
  { action: 'resumeCampaign', label: 'Resume Campaign', icon: 'play', description: 'Resume a paused campaign', requiresEntity: true },
  { action: 'extendTrial', label: 'Extend Trial', icon: 'calendar', description: 'Extend trial period for a business', requiresEntity: true },
  { action: 'addInternalNote', label: 'Add Internal Note', icon: 'note', description: 'Add an internal note to a partnership', requiresEntity: true },
  { action: 'assignInvestigation', label: 'Assign Investigation', icon: 'user', description: 'Assign an investigation to a team member', requiresEntity: true },
]

const iconMap: Record<string, any> = {
  dollar: DollarSign,
  wallet: DollarSign,
  pause: Pause,
  play: Play,
  calendar: Calendar,
  note: MessageSquare,
  user: UserCheck,
  file: FileText,
}

interface ResolutionPanelProps {
  onAction: (action: string, payload?: any) => void
  canResolve?: boolean
  selectedEntityId?: string | null
}

export default function ResolutionPanel({ onAction, canResolve, selectedEntityId }: ResolutionPanelProps) {
  if (!canResolve) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Resolution Center</h3>
        </div>
        <p className="text-sm text-slate-400">You do not have permission to perform resolution actions.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-800">Resolution Center</h3>
      </div>

      {!selectedEntityId && (
        <p className="text-xs text-amber-600 mb-3 p-2 bg-amber-50 rounded">
          Select an entity from search results to enable entity-specific actions.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2" role="list" aria-label="Resolution actions">
        {AVAILABLE_ACTIONS.map((act) => {
          const Icon = iconMap[act.icon] ?? Wrench
          const disabled = act.requiresEntity && !selectedEntityId
          return (
            <button
              key={act.action}
              onClick={() => onAction(act.action, { entityId: selectedEntityId })}
              disabled={disabled}
              className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition text-left disabled:opacity-50 disabled:cursor-not-allowed"
              role="listitem"
              aria-label={act.label}
            >
              <Icon className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-700">{act.label}</p>
                <p className="text-xs text-slate-400 truncate">{act.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
