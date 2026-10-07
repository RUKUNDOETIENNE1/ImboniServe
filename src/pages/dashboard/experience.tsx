import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import QRCode from 'qrcode'
import { toast } from 'react-hot-toast'
import DashboardLayout from '@/components/DashboardLayout'
import type { ExperienceDashboardState } from '@/lib/services/experience.service'
import {
  Eye, QrCode, Copy, ExternalLink, CheckCircle2, CircleSlash, Loader2,
  UtensilsCrossed, Wine, Home, MapPin, MessageSquare, ShoppingCart, Globe,
} from 'lucide-react'

/**
 * /dashboard/experience — Digital Business Experience management.
 *
 * The 3D layer is additive: it reads existing business data (profile,
 * menu, tables, location, QR flags) and only ever links into existing
 * product functionality. Nothing here duplicates menus, tables or
 * reservations.
 */

type AreaDraft = { enabled: boolean; label: string; description: string }

const AREA_META: { id: string; defaultLabel: string; hint: string }[] = [
  { id: 'entrance', defaultLabel: 'Entrance', hint: 'Welcome point, directions, business info' },
  { id: 'dining-area', defaultLabel: 'Dining Area', hint: 'Menu, ordering, table reservations' },
  { id: 'kitchen', defaultLabel: 'Kitchen', hint: 'Customer-safe note; KDS for staff only' },
  { id: 'bar', defaultLabel: 'Bar', hint: 'Drinks menu and ordering' },
  { id: 'terrace', defaultLabel: 'Terrace', hint: 'Outdoor seating and reservations' },
]

export default function ExperienceDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [state, setState] = useState<ExperienceDashboardState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [areas, setAreas] = useState<Record<string, AreaDraft>>({})
  const [qrDataUrl, setQrDataUrl] = useState('')

  const isManager = useMemo(() => {
    const roles = (session?.user as any)?.roles || []
    return roles.some((r: string) => ['OWNER', 'ADMIN', 'MANAGER'].includes(r))
  }, [session])

  const publicUrl = useMemo(() => {
    if (!state?.slug) return null
    const base =
      (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '') ||
      (typeof window !== 'undefined' ? window.location.origin : '')
    return `${base}/experience/${state.slug}`
  }, [state?.slug])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/business/experience')
      if (r.ok) {
        const data: ExperienceDashboardState = await r.json()
        setState(data)
        const next: Record<string, AreaDraft> = {}
        for (const meta of AREA_META) {
          const o = data.context?.areaOverrides?.[meta.id]
          next[meta.id] = {
            enabled: o?.enabled !== false,
            label: o?.label ?? meta.defaultLabel,
            description: o?.description ?? '',
          }
        }
        setAreas(next)
      } else if (r.status === 401) {
        router.push('/login')
      } else {
        toast.error('Could not load experience settings')
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (status === 'authenticated') load()
    if (status === 'unauthenticated') router.push('/login')
  }, [status, load, router])

  useEffect(() => {
    if (!publicUrl) { setQrDataUrl(''); return }
    QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
      scale: 8,
    }).then(setQrDataUrl).catch(() => setQrDataUrl(''))
  }, [publicUrl])

  const save = async (patch: Record<string, unknown>) => {
    setSaving(true)
    try {
      const r = await fetch('/api/business/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        toast.error(data.error || 'Save failed')
        return
      }
      setState(data)
      toast.success('Experience updated')
    } finally {
      setSaving(false)
    }
  }

  const saveAreas = () =>
    save({ areas: Object.fromEntries(Object.entries(areas).map(([k, v]) => [k, v])) })

  const copyLink = async () => {
    if (!publicUrl) return
    await navigator.clipboard.writeText(publicUrl)
    toast.success('Link copied')
  }

  const downloadQr = () => {
    if (!qrDataUrl || !state?.slug) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `experience-${state.slug}.png`
    a.click()
  }

  const ctx = state?.context
  const capabilities = ctx
    ? [
        { icon: UtensilsCrossed, label: 'Menu', on: ctx.hasMenu },
        { icon: Wine, label: 'Drinks', on: ctx.hasDrinks },
        { icon: Home, label: `${ctx.tableCount} tables`, on: ctx.tableCount > 0 },
        { icon: MapPin, label: 'Directions', on: ctx.latitude != null && ctx.longitude != null },
        { icon: MessageSquare, label: 'WhatsApp contact', on: Boolean(ctx.whatsappNumber) },
        { icon: ShoppingCart, label: 'Remote ordering', on: ctx.qrRemote },
      ]
    : []

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-1">
          <Globe className="w-7 h-7 text-imboni-orange" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Digital Business Experience
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          An interactive 3D layer on top of your existing business profile, menu and ordering.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : !state?.slug ? (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 text-sm text-amber-800 dark:text-amber-200">
            No public business profile found for this business. Publish your profile in{' '}
            <a href="/dashboard/profile" className="font-semibold underline">Business Profile</a>{' '}
            first — the experience builds on it.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status + publish */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {state.enabled ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-5 h-5" /> Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-gray-500 font-semibold">
                      <CircleSlash className="w-5 h-5" /> Draft — not public
                    </span>
                  )}
                  {!state.profilePublished && (
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-full px-3 py-1">
                      Business profile unpublished
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push('/dashboard/experience/preview')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                  {isManager && (
                    <button
                      disabled={saving}
                      onClick={() => save({ enabled: !state.enabled })}
                      className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                        state.enabled
                          ? 'bg-gray-600 hover:bg-gray-700'
                          : 'bg-imboni-orange hover:bg-accent-dark'
                      } disabled:opacity-50`}
                    >
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {state.enabled ? 'Unpublish' : 'Publish Experience'}
                    </button>
                  )}
                </div>
              </div>

              {/* Public URL + QR */}
              <div className="mt-6 grid md:grid-cols-[1fr_auto] gap-6 items-start">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Public URL
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 truncate text-sm bg-gray-100 dark:bg-gray-900 rounded-lg px-3 py-2.5 text-gray-700 dark:text-gray-300">
                      {publicUrl}
                    </code>
                    <button onClick={copyLink} className="p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700" title="Copy link">
                      <Copy className="w-4 h-4" />
                    </button>
                    {state.enabled && (
                      <a href={publicUrl!} target="_blank" rel="noreferrer" className="p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700" title="Open">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
                {qrDataUrl && (
                  <div className="text-center">
                    <img src={qrDataUrl} alt="Experience QR code" className="w-28 h-28 rounded-lg border border-gray-200 dark:border-gray-700" />
                    <button onClick={downloadQr} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-imboni-orange hover:underline">
                      <QrCode className="w-3.5 h-3.5" /> Download QR
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Auto-detected capabilities */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Detected capabilities</h2>
              <p className="text-xs text-gray-500 mb-4">
                Actions appear automatically based on your existing business data — nothing to configure.
              </p>
              <div className="flex flex-wrap gap-2">
                {capabilities.map(({ icon: Icon, label, on }) => (
                  <span
                    key={label}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 border ${
                      on
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Areas */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Areas</h2>
              <p className="text-xs text-gray-500 mb-4">
                Show or hide areas and adjust their customer-facing labels. Positions and the scene
                itself are standardized.
              </p>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {AREA_META.map((meta) => {
                  const a = areas[meta.id]
                  if (!a) return null
                  return (
                    <div key={meta.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <input
                            value={a.label}
                            onChange={(e) => setAreas({ ...areas, [meta.id]: { ...a, label: e.target.value } })}
                            disabled={!isManager}
                            className="font-medium text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-300 focus:border-imboni-orange focus:outline-none disabled:opacity-60"
                            maxLength={60}
                          />
                          <p className="text-xs text-gray-400 mt-0.5">{meta.hint}</p>
                        </div>
                        <button
                          onClick={() => isManager && setAreas({ ...areas, [meta.id]: { ...a, enabled: !a.enabled } })}
                          disabled={!isManager}
                          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                            a.enabled ? 'bg-imboni-orange' : 'bg-gray-300 dark:bg-gray-600'
                          } disabled:opacity-50`}
                          aria-label={`Toggle ${meta.defaultLabel}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${a.enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      <input
                        value={a.description}
                        onChange={(e) => setAreas({ ...areas, [meta.id]: { ...a, description: e.target.value } })}
                        disabled={!isManager || !a.enabled}
                        placeholder="Short customer-facing description (optional)"
                        maxLength={200}
                        className="mt-2 w-full text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 disabled:opacity-50"
                      />
                    </div>
                  )
                })}
              </div>
              {isManager && (
                <button
                  onClick={saveAreas}
                  disabled={saving}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-imboni-orange text-white text-sm font-semibold hover:bg-accent-dark disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Areas
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
