/**
 * PartnerWelcomeCard — Personalized greeting for the partner.
 * Shows time-based greeting, name, and a motivational summary.
 */

import { Sparkles } from 'lucide-react'

interface PartnerWelcomeCardProps {
  name: string
  activeTrials: number
  payingBusinesses: number
  monthCommissionCents: number
  trendingCampaignName: string | null
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(cents / 100)
}

export default function PartnerWelcomeCard({
  name, activeTrials, payingBusinesses, monthCommissionCents, trendingCampaignName,
}: PartnerWelcomeCardProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm">{getGreeting()},</p>
          <h1 className="text-2xl font-bold mt-0.5">{name}</h1>
          <p className="text-white/70 text-sm mt-2">
            This month you&apos;ve helped{' '}
            <span className="font-semibold text-white">{activeTrials + payingBusinesses}</span>{' '}
            hospitality businesses begin their digital transformation.
          </p>
        </div>
        <div className="bg-white/20 rounded-xl p-3">
          <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        <div className="bg-white/15 rounded-lg p-3">
          <p className="text-white/70 text-xs">Active Trials</p>
          <p className="text-xl font-bold">{activeTrials}</p>
        </div>
        <div className="bg-white/15 rounded-lg p-3">
          <p className="text-white/70 text-xs">Paying Businesses</p>
          <p className="text-xl font-bold">{payingBusinesses}</p>
        </div>
        <div className="bg-white/15 rounded-lg p-3">
          <p className="text-white/70 text-xs">Commission Earned</p>
          <p className="text-xl font-bold">{formatCurrency(monthCommissionCents)}</p>
        </div>
        <div className="bg-white/15 rounded-lg p-3">
          <p className="text-white/70 text-xs">Trending</p>
          <p className="text-sm font-semibold truncate" title={trendingCampaignName ?? ''}>
            {trendingCampaignName ? '1 Campaign' : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
