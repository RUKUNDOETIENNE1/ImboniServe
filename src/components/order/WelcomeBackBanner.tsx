/**
 * WelcomeBackBanner — Hospitality-focused returning guest greeting
 *
 * Displays a premium, non-intrusive welcome experience for recognized guests.
 * Shows: name, visit count, VIP tier, last visit, favorite dishes, recommendations.
 *
 * Used in: QR ordering page, waiter POS
 */

import { useState, useEffect } from 'react'
import { Sparkles, Award, Clock, Heart, TrendingUp, X } from 'lucide-react'

interface GuestIntelligence {
  isReturning: boolean
  customer: {
    id: string
    name: string
    visitCount: number
    lastVisit: Date | null
    loyaltyPoints: number
    vipTier: string
    preferences: Record<string, any> | null
    lifetimeSpendCents: number
  }
  favorites: Array<{
    menuItemId: string
    name: string
    orderCount: number
  }>
  loyalty: {
    tier: string
    tierLabel: string
    pointsBalance: number
    nextTierThreshold: number | null
  }
  recommendationContext: {
    favoriteItemIds: string[]
    preferredCategoryNames: string[]
  }
}

interface WelcomeBackBannerProps {
  phone: string
  businessId: string
  onRecognized?: (intelligence: GuestIntelligence) => void
  onDismiss?: () => void
  variant?: 'customer' | 'staff'
}

export default function WelcomeBackBanner({
  phone,
  businessId,
  onRecognized,
  onDismiss,
  variant = 'customer',
}: WelcomeBackBannerProps) {
  const [intelligence, setIntelligence] = useState<GuestIntelligence | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!phone || !businessId || phone.length < 8) {
      setLoading(false)
      return
    }

    let cancelled = false

    const recognize = async () => {
      try {
        const res = await fetch('/api/guest/recognize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, businessId }),
        })

        if (!res.ok) {
          if (!cancelled) setError(true)
          return
        }

        const data = await res.json()

        if (cancelled) return

        if (data.data?.recognized && data.data.intelligence) {
          setIntelligence(data.data.intelligence)
          onRecognized?.(data.data.intelligence)
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    recognize()
    return () => { cancelled = true }
  }, [phone, businessId])

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  if (loading || error || dismissed || !intelligence || !intelligence.isReturning) {
    return null
  }

  const { customer, loyalty, favorites } = intelligence
  const isStaff = variant === 'staff'

  const tierColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    BRONZE: { bg: '#fef3c7', border: '#fbbf24', text: '#92400e', icon: '🥉' },
    SILVER: { bg: '#f1f5f9', border: '#94a3b8', text: '#475569', icon: '🥈' },
    GOLD: { bg: '#fef3c7', border: '#f59e0b', text: '#78350f', icon: '🥇' },
    PLATINUM: { bg: '#ede9fe', border: '#a78bfa', text: '#5b21b6', icon: '💎' },
    NONE: { bg: '#f0f9ff', border: '#bae6fd', text: '#0c4a6e', icon: '✨' },
  }

  const tierStyle = tierColors[loyalty.tier] || tierColors.NONE
  const lastVisitStr = customer.lastVisit
    ? new Date(customer.lastVisit).toLocaleDateString('en', { day: 'numeric', month: 'short' })
    : null

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${tierStyle.bg} 0%, white 100%)`,
        border: `2px solid ${tierStyle.border}`,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        position: 'relative',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      }}
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          opacity: 0.5,
          padding: 4,
        }}
      >
        <X size={18} color={tierStyle.text} />
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 28 }}>{tierStyle.icon}</span>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: tierStyle.text }}>
            {isStaff ? `Returning: ${customer.name}` : `Welcome back, ${customer.name}!`}
          </h2>
          <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: tierStyle.text, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={14} />
              {customer.visitCount} {customer.visitCount === 1 ? 'visit' : 'visits'}
            </span>
            {loyalty.tier !== 'NONE' && (
              <span style={{
                fontSize: 12, fontWeight: 600, padding: '2px 10px',
                background: tierStyle.border, color: 'white', borderRadius: 999,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Award size={12} />
                {loyalty.tierLabel}
              </span>
            )}
            {lastVisitStr && (
              <span style={{ fontSize: 13, color: tierStyle.text, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={14} />
                Last: {lastVisitStr}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Loyalty points */}
      {loyalty.pointsBalance > 0 && (
        <div style={{
          background: 'white', borderRadius: 10, padding: '8px 14px',
          marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
          border: `1px solid ${tierStyle.border}`,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: tierStyle.text }}>
            {loyalty.pointsBalance.toLocaleString()} loyalty points
          </span>
        </div>
      )}

      {/* Favorite dishes */}
      {favorites.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: tierStyle.text,
            marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Heart size={14} />
            {isStaff ? 'Regular order:' : 'Your favorites:'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {favorites.slice(0, 3).map(f => (
              <span
                key={f.menuItemId}
                style={{
                  fontSize: 12, padding: '4px 10px',
                  background: 'white', border: `1px solid ${tierStyle.border}`,
                  borderRadius: 999, color: tierStyle.text, fontWeight: 500,
                }}
              >
                {f.name} {isStaff && `(${f.orderCount}×)`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Staff-only: dietary alerts */}
      {isStaff && customer.preferences && (
        (customer.preferences.allergies?.length > 0 || customer.preferences.dietaryPreferences?.length > 0)
      ) && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: 8, padding: 10, marginBottom: 12,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>
            ⚠️ Dietary Notes
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {customer.preferences.allergies?.map((a: string) => (
              <span key={a} style={{
                fontSize: 11, padding: '2px 8px', background: '#fee2e2',
                color: '#991b1b', borderRadius: 999,
              }}>
                Allergy: {a}
              </span>
            ))}
            {customer.preferences.dietaryPreferences?.map((p: string) => (
              <span key={p} style={{
                fontSize: 11, padding: '2px 8px', background: '#dcfce7',
                color: '#166534', borderRadius: 999,
              }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommended today */}
      {!isStaff && intelligence.recommendationContext.preferredCategoryNames.length > 0 && (
        <div style={{
          fontSize: 13, color: tierStyle.text, display: 'flex',
          alignItems: 'center', gap: 4, fontStyle: 'italic',
        }}>
          <TrendingUp size={14} />
          Recommended today: items from {intelligence.recommendationContext.preferredCategoryNames.slice(0, 2).join(' & ')}
        </div>
      )}
    </div>
  )
}
