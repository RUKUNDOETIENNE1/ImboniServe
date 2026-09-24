/**
 * MilestoneCard — Celebrates achieved milestones and shows progress toward next ones.
 */

import { Trophy, Star, Rocket, Award, Cake, CreditCard, DollarSign } from 'lucide-react'

export interface Milestone {
  key: string
  label: string
  icon?: string
}

export interface NextMilestone {
  key: string
  label: string
  progress: number
  target: number
}

interface MilestoneCardProps {
  achieved: Milestone[]
  next: NextMilestone[]
}

const iconMap: Record<string, typeof Trophy> = {
  first_restaurant: Star,
  ten_restaurants: Rocket,
  fifty_restaurants: Rocket,
  hundred_restaurants: Trophy,
  first_subscription: CreditCard,
  first_100k: DollarSign,
  one_year: Cake,
}

export default function MilestoneCard({ achieved, next }: MilestoneCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-500" aria-hidden="true" />
        <h3 className="font-semibold text-slate-800">Milestones</h3>
      </div>

      {achieved.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 mb-2">Achieved</p>
          <div className="flex flex-wrap gap-2">
            {achieved.map((m) => {
              const Icon = iconMap[m.key] || Award
              return (
                <div
                  key={m.key}
                  className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1"
                >
                  <Icon className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                  <span className="text-xs font-medium text-amber-800">{m.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {next.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Next Goals</p>
          <div className="space-y-3">
            {next.map((m) => {
              const Icon = iconMap[m.key] || Award
              const pct = m.target > 0 ? Math.min((m.progress / m.target) * 100, 100) : 0
              return (
                <div key={m.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <span className="text-xs text-slate-600">{m.label}</span>
                    </div>
                    <span className="text-xs text-slate-400">{m.progress}/{m.target}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                      role="progressbar"
                      aria-valuenow={m.progress}
                      aria-valuemin={0}
                      aria-valuemax={m.target}
                      aria-label={`Progress toward ${m.label}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {achieved.length === 0 && next.length === 0 && (
        <p className="text-sm text-slate-400">Start referring businesses to unlock milestones!</p>
      )}
    </div>
  )
}
