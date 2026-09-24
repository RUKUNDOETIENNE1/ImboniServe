/**
 * StaffGuestIntelligence — Compact guest context for waiter POS
 *
 * Fetches and displays concise returning guest intelligence:
 *   - VIP status, visit count, loyalty balance
 *   - Favorite dishes
 *   - Dietary alerts
 *
 * Designed to be non-intrusive and actionable for staff.
 */

import { useState, useEffect } from 'react'
import { Award, Star, AlertTriangle, Heart, Phone } from 'lucide-react'

interface StaffIntel {
  isReturning: boolean
  name: string
  visitCount: number
  vipTier: string
  tierLabel: string
  loyaltyPoints: number
  favorites: Array<{ name: string; orderCount: number }>
  allergies: string[]
  dietaryPreferences: string[]
  lastVisit: Date | null
}

interface StaffGuestIntelligenceProps {
  phone: string
  businessId: string
}

export default function StaffGuestIntelligence({ phone, businessId }: StaffGuestIntelligenceProps) {
  const [intel, setIntel] = useState<StaffIntel | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!phone || !businessId || phone.length < 8) {
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchIntel = async () => {
      try {
        const res = await fetch(
          `/api/guest/staff-intelligence?phone=${encodeURIComponent(phone)}&businessId=${encodeURIComponent(businessId)}`
        )
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data.data) {
          setIntel(data.data)
        }
      } catch {
        // Silent failure — staff intelligence is optional
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchIntel()
    return () => { cancelled = true }
  }, [phone, businessId])

  if (loading || !intel || !intel.isReturning) {
    return null
  }

  const tierColors: Record<string, { bg: string; border: string; text: string }> = {
    BRONZE: { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
    SILVER: { bg: '#f1f5f9', border: '#94a3b8', text: '#475569' },
    GOLD: { bg: '#fef3c7', border: '#f59e0b', text: '#78350f' },
    PLATINUM: { bg: '#ede9fe', border: '#a78bfa', text: '#5b21b6' },
    NONE: { bg: '#f0f9ff', border: '#bae6fd', text: '#0c4a6e' },
  }

  const style = tierColors[intel.vipTier] || tierColors.NONE
  const lastVisitStr = intel.lastVisit
    ? new Date(intel.lastVisit).toLocaleDateString('en', { day: 'numeric', month: 'short' })
    : null

  return (
    <div
      data-testid="staff-guest-intelligence"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Phone size={16} color={style.text} />
          <span style={{ fontWeight: 700, fontSize: 15, color: style.text }}>
            {intel.name}
          </span>
        </div>
        {intel.vipTier !== 'NONE' && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', background: style.border, color: 'white',
            borderRadius: 999, fontSize: 12, fontWeight: 600,
          }}>
            <Award size={12} />
            {intel.tierLabel}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: style.text, marginBottom: 8 }}>
        <span><strong>{intel.visitCount}</strong> visits</span>
        {lastVisitStr && <span>Last: <strong>{lastVisitStr}</strong></span>}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Star size={12} />
          <strong>{intel.loyaltyPoints.toLocaleString()}</strong> pts
        </span>
      </div>

      {/* Favorites */}
      {intel.favorites.length > 0 && (
        <div style={{ fontSize: 13, color: style.text, marginBottom: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
            <Heart size={12} />
            Regular order:
          </span>
          <span style={{ marginLeft: 16 }}>
            {intel.favorites.map(f => `${f.name} (${f.orderCount}×)`).join(', ')}
          </span>
        </div>
      )}

      {/* Dietary alerts */}
      {(intel.allergies.length > 0 || intel.dietaryPreferences.length > 0) && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: 6, padding: 8, marginTop: 6,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <AlertTriangle size={12} />
            Dietary Notes
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {intel.allergies.map(a => (
              <span key={a} style={{
                fontSize: 11, padding: '2px 8px', background: '#fee2e2',
                color: '#991b1b', borderRadius: 999,
              }}>
                Allergy: {a}
              </span>
            ))}
            {intel.dietaryPreferences.map(p => (
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
    </div>
  )
}
