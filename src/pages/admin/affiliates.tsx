import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/AdminLayout'
import { UserCog, Plus, DollarSign, Users, TrendingUp, Download } from 'lucide-react'

export default function AdminAffiliates() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newAffiliate, setNewAffiliate] = useState({ code: '', name: '', commissionRate: 20 })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      loadData()
    }
  }, [status])

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/affiliates')
      if (res.ok) {
        const data = await res.json()
        setAffiliates(data.affiliates)
        setPayouts(data.payouts)
      }
    } catch (error) {
      console.error('Failed to load affiliates:', error)
    } finally {
      setLoading(false)
    }
  }

  const createAffiliate = async () => {
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAffiliate),
      })
      if (res.ok) {
        alert('Affiliate created successfully!')
        setShowCreateForm(false)
        setNewAffiliate({ code: '', name: '', commissionRate: 20 })
        loadData()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create affiliate')
      }
    } catch (error) {
      alert('Failed to create affiliate')
    }
  }

  const markPayoutPaid = async (payoutId: string) => {
    const method = prompt('Payment method (MTN_MOBILE_MONEY, AIRTEL_MONEY, BANK):')
    if (!method) return
    
    const reference = prompt('Payment reference/transaction ID:')
    if (!reference) return

    try {
      const res = await fetch(`/api/admin/affiliates/payout/${payoutId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, reference }),
      })
      if (res.ok) {
        alert('Payout marked as paid!')
        loadData()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to mark payout as paid')
      }
    } catch (error) {
      alert('Failed to mark payout as paid')
    }
  }

  const suspendAffiliate = async (affiliateId: string) => {
    if (!confirm('Suspend this affiliate?')) return

    try {
      const res = await fetch(`/api/admin/affiliates/${affiliateId}/suspend`, {
        method: 'POST',
      })
      if (res.ok) {
        alert('Affiliate suspended!')
        loadData()
      }
    } catch (error) {
      alert('Failed to suspend affiliate')
    }
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
            <h1 className="text-2xl font-bold text-slate-800">Affiliate Management</h1>
            <p className="text-sm text-slate-500 mt-1">Manage affiliate partners and track commissions</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-purple-200 flex items-center transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showCreateForm ? 'Cancel' : 'Create Affiliate'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Create New Affiliate</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Affiliate Code (e.g., PARTNER123)"
              value={newAffiliate.code}
              onChange={(e) => setNewAffiliate({ ...newAffiliate, code: e.target.value.toUpperCase() })}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
            <input
              type="text"
              placeholder="Affiliate Name"
              value={newAffiliate.name}
              onChange={(e) => setNewAffiliate({ ...newAffiliate, name: e.target.value })}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
            <input
              type="number"
              placeholder="Commission Rate %"
              value={newAffiliate.commissionRate}
              onChange={(e) => setNewAffiliate({ ...newAffiliate, commissionRate: parseFloat(e.target.value) })}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
            />
          </div>
          <button
            onClick={createAffiliate}
            className="bg-gradient-to-r from-imboni-green to-green-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-green-200 transition-all"
          >
            Create Affiliate
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Affiliates</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Code</th>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Referrals</th>
                  <th className="text-left py-2">Commission Rate</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((aff) => (
                  <tr key={aff.id} className="border-b">
                    <td className="py-2 font-mono">{aff.code}</td>
                    <td className="py-2">{aff.name}</td>
                    <td className="py-2">{aff._count?.referrals || 0}</td>
                    <td className="py-2">{aff.commissionRatePercent || 20}%</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        aff.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {aff.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {aff.status === 'ACTIVE' && (
                        <button
                          onClick={() => suspendAffiliate(aff.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {affiliates.length === 0 && (
              <p className="text-center py-8 text-gray-500">No affiliates yet</p>
            )}
          </div>
        </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Pending Payouts</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Affiliate</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.filter(p => p.status !== 'paid').map((payout) => (
                  <tr key={payout.id} className="border-b">
                    <td className="py-2">{new Date(payout.createdAt).toLocaleDateString()}</td>
                    <td className="py-2">{payout.affiliate?.name || 'N/A'}</td>
                    <td className="py-2 font-bold">{(payout.totalAmountCents / 100).toLocaleString()} RWF</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        payout.status === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payout.status}
                      </span>
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => markPayoutPaid(payout.id)}
                        className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        Mark Paid
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payouts.filter(p => p.status !== 'paid').length === 0 && (
              <p className="text-center py-8 text-gray-500">No pending payouts</p>
            )}
          </div>
        </div>
    </AdminLayout>
  )
}
