import { Shield, ShieldAlert, ShieldCheck, Info } from 'lucide-react'

interface RiskIndicatorProps {
  riskLevel?: string
  riskScore?: number
  flags?: string[]
}

const riskConfig: Record<string, { color: string; bg: string; border: string; icon: typeof Shield; label: string }> = {
  LOW: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: ShieldCheck, label: 'Low Risk' },
  MEDIUM: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Shield, label: 'Medium Risk' },
  HIGH: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: ShieldAlert, label: 'High Risk' },
}

const flagLabels: Record<string, string> = {
  fraud_suspected: 'Fraud Suspected',
  duplicate_detected: 'Duplicate Detected',
  high_chargeback_rate: 'High Chargeback Rate',
  unusual_activity: 'Unusual Activity',
  manual_review_required: 'Manual Review Required',
}

export default function RiskIndicator({ riskLevel, riskScore, flags = [] }: RiskIndicatorProps) {
  if (!riskLevel) {
    return (
      <div className="inline-flex items-center gap-2 text-sm text-slate-500" role="status">
        <Info className="w-4 h-4" aria-hidden="true" />
        <span>No risk assessment</span>
      </div>
    )
  }

  const config = riskConfig[riskLevel] || riskConfig.LOW
  const Icon = config.icon

  return (
    <div
      className={`inline-flex flex-col gap-1 rounded-lg border p-3 ${config.color} ${config.bg} ${config.border}`}
      role="status"
      aria-label={`Risk level: ${config.label}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" aria-hidden="true" />
        <span className="text-sm font-semibold">{config.label}</span>
        {typeof riskScore === 'number' && (
          <span className="text-xs opacity-75">(score: {riskScore})</span>
        )}
      </div>
      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {flags.map((flag) => (
            <span
              key={flag}
              className="text-xs px-1.5 py-0.5 rounded bg-white/60 font-medium"
            >
              {flagLabels[flag] || flag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
