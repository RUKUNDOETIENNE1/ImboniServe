import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import AdminLayout from '@/components/AdminLayout'
import { Plus, Key, Pause, Play, XCircle, Copy } from 'lucide-react'

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

export default function AdminFounderCodes() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [codes, setCodes] = useState<any[]>([])
  const [partners, setPartners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCode, setNewCode] = useState({ code: '', partnerId: '', trialDays: 30, maxRedemptions: '', label: '', expiresAt: '' })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      loadData()
    }
  }, [status])

  const loadData = async () => {
    try {
      const [codesRes, partnersRes] = await Promise.all([
        fetch('/api/admin/founder-codes'),
        fetch('/api/founder-partners'),
      ])
      if (codesRes.ok) {
        const data = await codesRes.json()
        setCodes(data.codes)
      }
      if (partnersRes.ok) {
        const data = await partnersRes.json()
        setPartners(data.partners.filter((p: any) => p.status === 'ACTIVE'))
      }
    } catch (error) {
      console.error('Failed to load:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCode = async () => {
    try {
      const res = await fetch('/api/admin/founder-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.code,
          partnerId: newCode.partnerId,
          trialDays: parseInt(newCode.trialDays.toString()) || 30,
          maxRedemptions: newCode.maxRedemptions ? parseInt(newCode.maxRedemptions) : undefined,
          label: newCode.label || undefined,
          expiresAt: newCode.expiresAt || undefined,
        }),
      })
      if (res.ok) {
        alert('Founder Code created successfully!')
        setShowCreateForm(false)
        setNewCode({ code: '', partnerId: '', trialDays: 30, maxRedemptions: '', label: '', expiresAt: '' })
        loadData()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create code')
      }
    } catch {
      alert('Failed to create code')
    }
  }

  const updateCodeStatus = async (codeId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/founder-codes/${codeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        alert(`Code ${newStatus.toLowerCase()}!`)
        loadData()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update code')
      }
    } catch {
      alert('Failed to update code')
    }
  }

  const copyShareLink = (code: string) => {
    const link = `${window.location.origin}/f/${code}`
    navigator.clipboard.writeText(link)
    alert(`Share link copied: ${link}`)
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      PAUSED: 'bg-yellow-100 text-yellow-700',
      EXPIRED: 'bg-gray-200 text-gray-600',
      REVOKED: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-slate-100 text-slate-600'
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Founder Code Management</h1>
            <p className="text-sm text-slate-500 mt-1">Create and manage Founder referral codes</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-purple-200 flex items-center transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showCreateForm ? 'Cancel' : 'Create Code'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Create New Founder Code</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Code (e.g. ISIMBI30)</label>
              <input
                type="text"
                placeholder="ISIMBI30"
                value={newCode.code}
                onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 w-full"
              />
              <p className="text-xs text-slate-400 mt-1">2-8 letters + 0-3 digits</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Partner</label>
              <select
                value={newCode.partnerId}
                onChange={(e) => setNewCode({ ...newCode, partnerId: e.target.value })}
                className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 w-full"
              >
                <option value="">Select partner...</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Trial Days (default: 30)</label>
              <input
                type="number"
                min="1"
                max="90"
                value={newCode.trialDays}
                onChange={(e) => setNewCode({ ...newCode, trialDays: parseInt(e.target.value) || 30 })}
                className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Max Redemptions (optional)</label>
              <input
                type="number"
                placeholder="Unlimited"
                value={newCode.maxRedemptions}
                onChange={(e) => setNewCode({ ...newCode, maxRedemptions: e.target.value })}
                className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Label (optional)</label>
              <input
                type="text"
                placeholder="e.g. ISIMBI TV Campaign"
                value={newCode.label}
                onChange={(e) => setNewCode({ ...newCode, label: e.target.value })}
                className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Expires At (optional)</label>
              <input
                type="date"
                value={newCode.expiresAt}
                onChange={(e) => setNewCode({ ...newCode, expiresAt: e.target.value })}
                className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 w-full"
              />
            </div>
          </div>
          <button
            onClick={createCode}
            disabled={!newCode.code || !newCode.partnerId}
            className="bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Code
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Code</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Partner</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Trial Days</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Redemptions</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {codes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-purple-700">{c.code}</div>
                    {c.label && <div className="text-xs text-slate-500">{c.label}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{c.partner?.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{c.trialDays} days</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {c._count?.redemptions ?? 0}
                    {c.maxRedemptions ? ` / ${c.maxRedemptions}` : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyShareLink(c.code)}
                        className="text-slate-600 hover:text-slate-800"
                        title="Copy share link"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      {c.status === 'ACTIVE' && (
                        <button
                          onClick={() => updateCodeStatus(c.id, 'PAUSED')}
                          className="text-yellow-600 hover:text-yellow-700"
                          title="Pause"
                        >
                          <Pause className="w-5 h-5" />
                        </button>
                      )}
                      {c.status === 'PAUSED' && (
                        <button
                          onClick={() => updateCodeStatus(c.id, 'ACTIVE')}
                          className="text-green-600 hover:text-green-700"
                          title="Activate"
                        >
                          <Play className="w-5 h-5" />
                        </button>
                      )}
                      {c.status !== 'REVOKED' && c.status !== 'EXPIRED' && (
                        <button
                          onClick={() => {
                            if (confirm('Revoke this code? This cannot be undone.')) {
                              updateCodeStatus(c.id, 'REVOKED')
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                          title="Revoke"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {codes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No founder codes yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
