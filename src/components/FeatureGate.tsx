/**
 * Feature Gate Component
 * Wraps features and shows upgrade prompts for locked features
 */

import { ReactNode } from 'react'
import { Crown, Lock, ArrowRight } from 'lucide-react'
import { PlanCode, hasFeatureAccess, getUpgradePlanForFeature, PlanEntitlements } from '@/lib/plan-entitlements'
import { useRouter } from 'next/router'

interface FeatureGateProps {
  children: ReactNode
  feature: keyof PlanEntitlements
  userPlan?: PlanCode
  fallback?: ReactNode
  showInline?: boolean
  customMessage?: string
}

export default function FeatureGate({
  children,
  feature,
  userPlan,
  fallback,
  showInline = true,
  customMessage
}: FeatureGateProps) {
  const router = useRouter()
  const hasAccess = hasFeatureAccess(userPlan, feature)

  if (hasAccess) {
    return <>{children}</>
  }

  // If no inline prompt, just show fallback or nothing
  if (!showInline) {
    return <>{fallback || null}</>
  }

  const upgradePlan = getUpgradePlanForFeature(feature)
  const planNames: Record<PlanCode, string> = {
    ESSENTIALS: 'Essentials',
    STARTER: 'Essentials',
    PROFESSIONAL: 'Professional',
    BUSINESS: 'Business',
    PREMIUM: 'Premium',
    ENTERPRISE: 'Enterprise'
  }

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="pointer-events-none opacity-40 blur-sm select-none">
        {children}
      </div>

      {/* Overlay prompt */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl border-2 border-blue-200 p-6 max-w-md w-full">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
              <Crown className="w-7 h-7 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {customMessage || 'Upgrade Required'}
            </h3>
            
            <p className="text-slate-600 mb-4">
              This feature is available on the{' '}
              <span className="font-semibold text-blue-600">
                {upgradePlan ? planNames[upgradePlan] : 'higher'}
              </span>{' '}
              plan and above.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/pricing')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg flex items-center gap-2"
              >
                View Plans
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-4">
              ✓ 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Compact Feature Lock Badge
 * Shows a small lock icon with upgrade link
 */
export function FeatureLockBadge({ 
  feature, 
  userPlan 
}: { 
  feature: keyof PlanEntitlements
  userPlan?: PlanCode 
}) {
  const router = useRouter()
  const hasAccess = hasFeatureAccess(userPlan, feature)

  if (hasAccess) return null

  const upgradePlan = getUpgradePlanForFeature(feature)
  const planNames: Record<PlanCode, string> = {
    ESSENTIALS: 'Essentials',
    STARTER: 'Essentials',
    PROFESSIONAL: 'Pro',
    BUSINESS: 'Business',
    PREMIUM: 'Premium',
    ENTERPRISE: 'Enterprise'
  }

  return (
    <button
      onClick={() => router.push('/pricing')}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-full text-xs font-medium text-amber-800 hover:from-amber-100 hover:to-orange-100 transition"
    >
      <Lock className="w-3 h-3" />
      <span>
        {upgradePlan ? planNames[upgradePlan] : 'Upgrade'}
      </span>
    </button>
  )
}

/**
 * Feature Lock Button
 * Disabled button with upgrade prompt on click
 */
export function FeatureLockButton({
  feature,
  userPlan,
  children,
  className = ''
}: {
  feature: keyof PlanEntitlements
  userPlan?: PlanCode
  children: ReactNode
  className?: string
}) {
  const router = useRouter()
  const hasAccess = hasFeatureAccess(userPlan, feature)

  if (hasAccess) {
    return <>{children}</>
  }

  return (
    <button
      onClick={() => router.push('/pricing')}
      className={`relative ${className} opacity-60 cursor-pointer group`}
      title="Upgrade to unlock this feature"
    >
      {children}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/10 rounded">
        <Crown className="w-5 h-5 text-amber-500" />
      </div>
    </button>
  )
}
