/**
 * EarningsCard — Transparent earnings breakdown card.
 */

import { Wallet, Clock, CheckCircle, DollarSign, TrendingUp } from 'lucide-react'

interface EarningsCardProps {
  currentMonthCents: number
  lifetimeCents: number
  pendingCents: number
  approvedCents: number
  paidCents: number
  upcomingPayoutCents: number
  compact?: boolean
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(cents / 100)
}

export default function EarningsCard({
  currentMonthCents, lifetimeCents, pendingCents, approvedCents, paidCents, upcomingPayoutCents, compact,
}: EarningsCardProps) {
  const items = [
    { label: 'Current Month', value: currentMonthCents, icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Lifetime Earnings', value: lifetimeCents, icon: Wallet, color: 'text-slate-700' },
    { label: 'Pending Commission', value: pendingCents, icon: Clock, color: 'text-amber-600' },
    { label: 'Approved Commission', value: approvedCents, icon: CheckCircle, color: 'text-emerald-600' },
    { label: 'Paid Commission', value: paidCents, icon: DollarSign, color: 'text-teal-600' },
    { label: 'Upcoming Payout', value: upcomingPayoutCents, icon: Wallet, color: 'text-purple-600' },
  ]

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-emerald-600" aria-hidden="true" />
        <h3 className="font-semibold text-slate-800">Earnings Overview</h3>
      </div>
      <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'}`}>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3.5 h-3.5 ${item.color}`} aria-hidden="true" />
                <span className="text-xs text-slate-500">{item.label}</span>
              </div>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(item.value)}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
