/**
 * AchievementBadge — Circular badge for celebrating milestones.
 */

import { Trophy, Star, Rocket, Award, Cake, CreditCard, DollarSign } from 'lucide-react'

interface AchievementBadgeProps {
  type: string
  label: string
  size?: 'sm' | 'md' | 'lg'
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

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
}

const iconSizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

export default function AchievementBadge({ type, label, size = 'md' }: AchievementBadgeProps) {
  const Icon = iconMap[type] || Award
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${sizeMap[size]} rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md`}>
        <Icon className={`${iconSizeMap[size]} text-white`} aria-hidden="true" />
      </div>
      <span className="text-xs text-slate-600 text-center max-w-[80px]">{label}</span>
    </div>
  )
}
