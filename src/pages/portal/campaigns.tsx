import { useState, useEffect, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import PortalLayout from '@/components/portal/PortalLayout'
import CampaignPreview from '@/components/portal/CampaignPreview'
import type { CampaignData } from '@/components/portal/CampaignPreview'
import { Loader2, AlertCircle, RefreshCw, Plus, X } from 'lucide-react'

export default function PortalCampaigns() {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<string>('ALL')

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/portal?section=campaigns')
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setCampaigns(json.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleAction = async (action: string, campaignId: string) => {
    try {
      const res = await fetch('/api/portal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, campaignId }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(`Action failed: ${err.error || 'Unknown error'}`)
        return
      }
      loadData()
    } catch (err: any) {
      alert(`Action failed: ${err.message}`)
    }
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreating(true)
    const formData = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/portal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createCampaign',
          name: formData.get('name'),
          description: formData.get('description'),
          channel: formData.get('channel'),
          targetSignups: formData.get('targetSignups') ? Number(formData.get('targetSignups')) : undefined,
          targetConversions: formData.get('targetConversions') ? Number(formData.get('targetConversions')) : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(`Failed: ${err.error}`)
        return
      }
      setShowCreate(false)
      loadData()
    } catch (err: any) {
      alert(`Failed: ${err.message}`)
    } finally {
      setCreating(false)
    }
  }

  const filtered = filter === 'ALL' ? campaigns : campaigns.filter((c) => c.status === filter)

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" aria-hidden="true" />
          <span className="ml-2 text-sm text-slate-500">Loading campaigns...</span>
        </div>
      </PortalLayout>
    )
  }

  if (error) {
    return (
      <PortalLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" aria-hidden="true" />
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Retry
          </button>
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">My Campaigns</h1>
            <p className="text-sm text-slate-500">Create and manage your referral campaigns.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> New Campaign
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {['ALL', 'ACTIVE', 'PAUSED', 'DRAFT', 'COMPLETED', 'CANCELLED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                filter === f ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Campaigns */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-slate-200/60 shadow-sm text-center">
            <p className="text-sm text-slate-500 mb-3">No campaigns yet. Create your first campaign to start acquiring businesses.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" aria-hidden="true" /> Create Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((c) => (
              <CampaignPreview key={c.id} campaign={c} onAction={handleAction} />
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800">New Campaign</h2>
                <button onClick={() => setShowCreate(false)} aria-label="Close">
                  <X className="w-5 h-5 text-slate-400" aria-hidden="true" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label htmlFor="name" className="text-xs font-medium text-slate-600">Campaign Name *</label>
                  <input id="name" name="name" required type="text" className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label htmlFor="description" className="text-xs font-medium text-slate-600">Description</label>
                  <textarea id="description" name="description" rows={2} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label htmlFor="channel" className="text-xs font-medium text-slate-600">Channel</label>
                  <input id="channel" name="channel" type="text" placeholder="e.g. WhatsApp, Instagram" className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="targetSignups" className="text-xs font-medium text-slate-600">Target Signups</label>
                    <input id="targetSignups" name="targetSignups" type="number" min={0} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label htmlFor="targetConversions" className="text-xs font-medium text-slate-600">Target Conversions</label>
                    <input id="targetConversions" name="targetConversions" type="number" min={0} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Campaign'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session?.user?.email) return { redirect: { destination: '/login', permanent: false } }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return { redirect: { destination: '/login', permanent: false } }
  const partnership = await prisma.partnership.findUnique({ where: { userId: user.id }, select: { status: true } })
  if (!partnership || ['PROSPECT', 'REJECTED', 'TERMINATED'].includes(partnership.status)) {
    return { redirect: { destination: '/login', permanent: false } }
  }
  return { props: {} }
}
