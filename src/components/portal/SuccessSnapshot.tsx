/**
 * SuccessSnapshot — Performance summary cards for the home page.
 */

import { TrendingUp, TrendingDown, Users, CreditCard, DollarSign, Activity } from 'lucide-react'

interface SuccessSnapshotProps {
  metrics: {
    activeTrials: number
    payingBusinesses: number
    totalSignups: number
    totalConversions: number
    totalCommissionCents: number
    monthCommissionCents: number
    prevMonthCommissionCents: number
  }
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(cents / 100)
}

export default function SuccessSnapshot({ metrics }: SuccessSnapshotProps) {
  const commissionTrend = metrics.prevMonthCommissionCents > 0
    ? ((metrics.monthCommissionCents - metrics.prevMonthCommissionCents) / metrics.prevMonthCommissionCents) * 100
    : metrics.monthCommissionCents > 0 ? 100 : 0
  const isTrendingUp = commissionTrend >= 0

  const cards = [
    {
      label: 'Active Trials',
      value: metrics.activeTrials,
      icon: Activity,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Paying Businesses',
      value: metrics.payingBusinesses,
      icon: CreditCard,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Total Businesses Referred',
      value: metrics.totalSignups,
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Lifetime Commission',
      value: formatCurrency(metrics.totalCommissionCents),
      icon: DollarSign,
      color: 'text-amber-600 bg-amber-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{card.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
          </div>
        )
      })}
      <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-teal-600 bg-teal-50">
            <TrendingUp className="w-5 h-5" aria-hidden="true" />
          </div>
          {metrics.prevMonthCommissionCents > 0 && (
            <span className={`text-xs font-medium flex items-center gap-0.5 ${isTrendingUp ? 'text-emerald-600' : 'text-red-500'}`}>
              {isTrendingUp ? <TrendingUp className="w-3 h-3" aria-hidden="true" /> : <TrendingDown className="w-3 h-3" aria-hidden="true" />}
              {Math.abs(commissionTrend).toFixed(0)}%
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-slate-800">{formatCurrency(metrics.monthCommissionCents)}</p>
        <p className="text-xs text-slate-500 mt-0.5">This Month&apos;s Commission</p>
      </div>
    </div>
  )
}
