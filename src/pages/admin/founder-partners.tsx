import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import AdminLayout from '@/components/AdminLayout'
import { UserCog, Plus, Users2, CheckCircle, XCircle, Pause, Play, DollarSign, TrendingUp, Users, Award } from 'lucide-react'
import { useToast } from '@/components/Toast'
import DataFreshnessIndicator from '@/components/DataFreshnessIndicator'
import { useCurrency } from '@/contexts/LocaleContext'

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

export default function AdminFounderPartners() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showToast } = useToast()
  const { currency } = useCurrency()
  const [partners, setPartners] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPartner, setNewPartner] = useState({ name: '', email: '', phone: '', organization: '', region: '', partnerType: 'FOUNDER' })
  const [tab, setTab] = useState<'partners' | 'payouts'>('partners')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      loadData()
    }
  }, [status])

  const loadData = async () => {
    try {
      const [partnersRes, payoutsRes] = await Promise.all([
        fetch('/api/founder-partners'),
        fetch('/api/admin/founder-partners/payouts'),
      ])
      if (partnersRes.ok) {
        const data = await partnersRes.json()
        setPartners(data.partners)
      }
      if (payoutsRes.ok) {
        const data = await payoutsRes.json()
        setPayouts(data.payouts)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLastUpdated(new Date())
      setLoading(false)
    }
  }

  const createPartner = async () => {
    try {
      const res = await fetch('/api/founder-partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartner),
      })
      if (res.ok) {
        showToast('success', 'Partner created successfully!')
        setShowCreateForm(false)
        setNewPartner({ name: '', email: '', phone: '', organization: '', region: '', partnerType: 'FOUNDER' })
        loadData()
      } else {
        const error = await res.json()
        showToast('error', error.error || 'Failed to create partner')
      }
    } catch {
      showToast('error', 'Failed to create partner')
    }
  }

  const approvePartner = async (partnerId: string) => {
    const reviewNotes = prompt('Review notes (optional):')
    try {
      const res = await fetch(`/api/admin/founder-partners/${partnerId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNotes }),
      })
      if (res.ok) {
        showToast('success', 'Partner approved!')
        loadData()
      } else {
        const error = await res.json()
        showToast('error', error.error || 'Failed to approve partner')
      }
    } catch {
      showToast('error', 'Failed to approve partner')
    }
  }

  const suspendPartner = async (partnerId: string) => {
    const reason = prompt('Reason for suspension:')
    if (!reason) return
    try {
      const res = await fetch(`/api/admin/founder-partners/${partnerId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        showToast('success', 'Partner suspended!')
        loadData()
      }
    } catch {
      showToast('error', 'Failed to suspend partner')
    }
  }

  const reactivatePartner = async (partnerId: string) => {
    try {
      const res = await fetch(`/api/admin/founder-partners/${partnerId}/reactivate`, {
        method: 'POST',
      })
      if (res.ok) {
        showToast('success', 'Partner reactivated!')
        loadData()
      }
    } catch {
      showToast('error', 'Failed to reactivate partner')
    }
  }

  const processPayout = async (payoutId: string, action: string) => {
    const body: any = { action }
    if (action === 'mark_paid') {
      body.referenceId = prompt('Payment reference ID:')
      if (!body.referenceId) return
    }
    if (action === 'reject') {
      body.reason = prompt('Reason for rejection:')
      if (!body.reason) return
    }
    try {
      const res = await fetch(`/api/admin/founder-partners/payouts/${payoutId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        showToast('success', `Payout ${action === 'approve' ? 'approved' : action === 'mark_paid' ? 'marked as paid' : 'rejected'}!`)
        loadData()
      } else {
        const error = await res.json()
        showToast('error', error.error || 'Failed to process payout')
      }
    } catch {
      showToast('error', 'Failed to process payout')
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PROSPECT: 'bg-slate-100 text-slate-600',
      APPLIED: 'bg-blue-100 text-blue-700',
      ACTIVE: 'bg-green-100 text-green-700',
      SUSPENDED: 'bg-red-100 text-red-700',
      TERMINATED: 'bg-gray-200 text-gray-600',
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
            <h1 className="text-2xl font-bold text-slate-800">Founder Partner Management</h1>
            <p className="text-sm text-slate-500 mt-1">Manage founder partners, applications, and payouts</p>
            <DataFreshnessIndicator lastUpdated={lastUpdated} loading={loading} className="mt-1" />
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-purple-200 flex items-center transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showCreateForm ? 'Cancel' : 'Create Partner'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Create New Founder Partner</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Full Name *"
              value={newPartner.name}
              onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
            <input
              type="email"
              placeholder="Email *"
              value={newPartner.email}
              onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
            <input
              type="tel"
              placeholder="Phone *"
              value={newPartner.phone}
              onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
            <input
              type="text"
              placeholder="Organization"
              value={newPartner.organization}
              onChange={(e) => setNewPartner({ ...newPartner, organization: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
            <input
              type="text"
              placeholder="Region"
              value={newPartner.region}
              onChange={(e) => setNewPartner({ ...newPartner, region: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
            <select
              value={newPartner.partnerType}
              onChange={(e) => setNewPartner({ ...newPartner, partnerType: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            >
              <option value="FOUNDER">Founder</option>
              <option value="STRATEGIC">Strategic</option>
              <option value="CHANNEL">Channel</option>
            </select>
          </div>
          <button
            onClick={createPartner}
            disabled={!newPartner.name || !newPartner.email || !newPartner.phone}
            className="bg-purple-600 text-white px-6 py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Partner
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('partners')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${tab === 'partners' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          Partners ({partners.length})
        </button>
        <button
          onClick={() => setTab('payouts')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${tab === 'payouts' ? 'bg-purple-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          Payouts ({payouts.length})
        </button>
      </div>

      {tab === 'partners' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Codes</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Commissions</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p.partnerType}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p._count?.codes ?? 0}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p._count?.commissions ?? 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {p.status === 'APPLIED' && (
                          <button
                            onClick={() => approvePartner(p.id)}
                            className="text-green-600 hover:text-green-700"
                            title="Approve"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        {p.status === 'ACTIVE' && (
                          <button
                            onClick={() => suspendPartner(p.id)}
                            className="text-orange-600 hover:text-orange-700"
                            title="Suspend"
                          >
                            <Pause className="w-5 h-5" />
                          </button>
                        )}
                        {p.status === 'SUSPENDED' && (
                          <button
                            onClick={() => reactivatePartner(p.id)}
                            className="text-green-600 hover:text-green-700"
                            title="Reactivate"
                          >
                            <Play className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {partners.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No founder partners yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'payouts' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Partner</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Amount</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Method</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{p.partner?.name}</div>
                      <div className="text-xs text-slate-500">{p.partner?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {p.amountCents?.toLocaleString()} {currency}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{p.method}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        p.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                        p.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {p.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => processPayout(p.id, 'approve')}
                              className="text-green-600 hover:text-green-700"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => processPayout(p.id, 'reject')}
                              className="text-red-600 hover:text-red-700"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {p.status === 'APPROVED' && (
                          <button
                            onClick={() => processPayout(p.id, 'mark_paid')}
                            className="text-green-600 hover:text-green-700"
                            title="Mark as Paid"
                          >
                            <DollarSign className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {payouts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No payouts yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
