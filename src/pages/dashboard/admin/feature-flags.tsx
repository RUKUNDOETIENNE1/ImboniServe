import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Flag, Power, AlertTriangle, TrendingUp, Users } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  const roles = (session?.user as any)?.roles || []
  
  if (!session?.user || !roles.includes('ADMIN')) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }
  
  return { props: {} }
}

type FeatureFlag = {
  id: string
  key: string
  name: string
  enabled: boolean
  autoEnableThreshold: number | null
  planGated: boolean
  minimumPlan: string | null
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    fetchFlags()
  }, [])

  async function fetchFlags() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/feature-flags')
      if (res.ok) {
        const data = await res.json()
        const payload = (data && (data.data ?? data)) || {}
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.flags)
            ? payload.flags
            : []
        const clean = (list as any[]).filter(f => f && typeof f.key === 'string') as FeatureFlag[]
        setFlags(clean)
      } else {
        setFlags([])
      }
    } catch (error) {
      console.error('Failed to fetch flags:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleFlag(flagKey: string, enabled: boolean) {
    setMessage({ text: '', type: '' })
    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: flagKey, enabled })
      })

      if (res.ok) {
        setMessage({ text: `Flag ${enabled ? 'enabled' : 'disabled'} successfully`, type: 'success' })
        fetchFlags()
      } else {
        setMessage({ text: 'Failed to update flag', type: 'error' })
      }
    } catch {
      setMessage({ text: 'Network error', type: 'error' })
    }
  }

  const safeFlags = Array.isArray(flags) ? flags.filter(f => f && typeof f.key === 'string') : []
  const siteBuilderFlags = safeFlags.filter(f => f.key.startsWith('site_builder_'))
  const otherFlags = safeFlags.filter(f => !f.key.startsWith('site_builder_'))
  const killSwitch = safeFlags.find(f => f.key === 'site_builder_kill_switch')

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Flag className="w-6 h-6 text-imboni-blue" />
              Feature Flags
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage platform features and autopilot settings</p>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`mb-4 p-3 rounded-xl text-sm border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Kill Switch */}
      {killSwitch && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Emergency Kill Switch
            </CardTitle>
            <CardDescription>Immediately disable all site builder features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{killSwitch.name}</p>
                <p className="text-sm text-slate-600 mt-1">
                  Status: <span className={`font-semibold ${killSwitch.enabled ? 'text-red-600' : 'text-green-600'}`}>
                    {killSwitch.enabled ? 'ACTIVE - All features disabled' : 'Inactive'}
                  </span>
                </p>
              </div>
              <button
                onClick={() => toggleFlag(killSwitch.key, !killSwitch.enabled)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  killSwitch.enabled
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {killSwitch.enabled ? 'Deactivate Kill Switch' : 'Activate Kill Switch'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Site Builder Flags */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Site Builder Features</CardTitle>
          <CardDescription>Phased rollout with autopilot thresholds</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {siteBuilderFlags.map(flag => (
                <div key={flag.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-800">{flag.name}</p>
                      {flag.autoEnableThreshold && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          Autopilot @ {flag.autoEnableThreshold} sites
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Key: {flag.key}</p>
                  </div>
                  <button
                    onClick={() => toggleFlag(flag.key, !flag.enabled)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      flag.enabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Platform Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Features</CardTitle>
          <CardDescription>General feature toggles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {otherFlags.map(flag => (
              <div key={flag.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800">{flag.name}</p>
                    {flag.planGated && flag.minimumPlan && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {flag.minimumPlan}+ only
                      </span>
                    )}
                    {flag.autoEnableThreshold && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        Auto @ {flag.autoEnableThreshold} clients
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Key: {flag.key}</p>
                </div>
                <button
                  onClick={() => toggleFlag(flag.key, !flag.enabled)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    flag.enabled
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  {flag.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Autopilot Info */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 mb-2">Autopilot Feature Rollout</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Phase 2 auto-enables at: 30 sites, 1K visits, 98% AI success</li>
                <li>• Phase 3 auto-enables at: 100 sites, 25 domains, 10K visits, 95% verification</li>
                <li>• Checks run weekly on Sundays at 2 AM</li>
                <li>• Manual overrides persist until changed</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
