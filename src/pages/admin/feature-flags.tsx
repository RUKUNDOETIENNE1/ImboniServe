import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Flag, RefreshCw, ToggleLeft, ToggleRight, Zap } from 'lucide-react'
import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  const roles: string[] = (session?.user as any)?.roles || []
  if (!session?.user || !roles.includes('ADMIN')) return { redirect: { destination: '/dashboard', permanent: false } }
  return { props: {} }
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<any[]>([])
  const [activeCount, setActiveCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

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
        const clean = (list as any[]).filter(f => f && typeof f.key === 'string')
        setFlags(clean)
        setActiveCount((payload && (payload.activeBusinessCount ?? payload.active_count ?? 0)) || 0)
      } else {
        setFlags([])
      }
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchFlags() }, [])

  async function toggle(flagKey: string, enabled: boolean) {
    await fetch('/api/admin/feature-flags', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: flagKey, enabled }),
    })
    fetchFlags()
  }

  async function checkThresholds() {
    const res = await fetch('/api/admin/feature-flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check' }),
    })
    if (res.ok) {
      setMessage('Auto-enable check complete')
      fetchFlags()
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Flag className="w-6 h-6 text-blue-500" /> Feature Flags
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Active businesses (last 30 days): <strong>{activeCount}</strong> — flags auto-enable at their threshold
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={checkThresholds} className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
            <Zap className="w-4 h-4 text-amber-500" /> Check Thresholds
          </button>
          <button onClick={fetchFlags} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {message && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{message}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Flag', 'Description', 'Auto-Enable At', 'Plan Gated', 'Status', 'Toggle'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flags.map(f => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">{f.key}</td>
                  <td className="px-4 py-3 text-slate-500">{f.name}</td>
                  <td className="px-4 py-3">
                    {f.autoEnableThreshold ? (
                      <span className={`text-xs px-2 py-1 rounded-full ${activeCount >= f.autoEnableThreshold ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {f.autoEnableThreshold} clients
                        {activeCount >= f.autoEnableThreshold ? ' ✓ reached' : ` (${activeCount}/${f.autoEnableThreshold})`}
                      </span>
                    ) : <span className="text-slate-400 text-xs">Manual</span>}
                  </td>
                  <td className="px-4 py-3">
                    {f.planGated ? (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{f.minimumPlan}+</span>
                    ) : <span className="text-slate-400 text-xs">All plans</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${f.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {f.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(f.key, !f.enabled)} className="text-slate-500 hover:text-slate-800">
                      {f.enabled
                        ? <ToggleRight className="w-6 h-6 text-green-500" />
                        : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}
