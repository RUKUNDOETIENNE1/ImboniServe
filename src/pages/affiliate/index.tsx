import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { Users, DollarSign, CheckCircle, Clock } from 'lucide-react'

export default function AffiliatePortal() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [affiliate, setAffiliate] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [commissions, setCommissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      loadAffiliateData()
    }
  }, [status])

  const loadAffiliateData = async () => {
    try {
      const res = await fetch('/api/affiliate/dashboard')
      if (res.ok) {
        const data = await res.json()
        setAffiliate(data.affiliate)
        setStats(data.stats)
        setCommissions(data.commissions)
      }
    } catch (error) {
      console.error('Failed to load affiliate data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = () => {
    const link = `${window.location.origin}/?ref=${affiliate.code}`
    navigator.clipboard.writeText(link)
    alert('Referral link copied!')
  }

  const requestPayout = async () => {
    if (!confirm('Request payout for approved earnings?')) return

    try {
      const res = await fetch('/api/affiliate/payout', { method: 'POST' })
      if (res.ok) {
        alert('Payout requested successfully!')
        loadAffiliateData()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to request payout')
      }
    } catch (error) {
      alert('Failed to request payout')
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  if (!affiliate) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Affiliate Portal</h1>
        <p className="mb-2">You are not registered as a B2B affiliate yet.</p>
        <p>
          To join the program and get access to your affiliate dashboard, please apply via our{' '}
          <a href="/affiliate/program" className="text-blue-600 hover:underline">B2B Affiliate Program page</a>.
        </p>
      </div>
    )
  }

  const displayName = affiliate?.name || affiliate?.code || 'Affiliate'

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Affiliate Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Referrals</div>
            <div className="text-3xl font-bold">{stats?.totalReferrals || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Active Customers</div>
            <div className="text-3xl font-bold">{stats?.activeReferrals || 0}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Pending Earnings</div>
            <div className="text-3xl font-bold">{((stats?.pendingEarnings || 0) / 100).toLocaleString()} RWF</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Approved Earnings</div>
            <div className="text-3xl font-bold text-green-600">{((stats?.approvedEarnings || 0) / 100).toLocaleString()} RWF</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold mb-4">Your Referral Link</h2>
          <div className="flex gap-4">
            <input
              type="text"
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${affiliate.code}`}
              className="flex-1 px-4 py-2 border rounded"
            />
            <button
              onClick={copyReferralLink}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Copy Link
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Commission: {affiliate.commissionRatePercent || 20}% recurring for 12 months</p>
            <p>Share this link to earn commissions on new signups!</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Earnings Summary</h2>
            <button
              onClick={requestPayout}
              disabled={(stats?.approvedEarnings || 0) < 1_000_000}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Request Payout
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Earned</div>
              <div className="text-2xl font-bold">{((stats?.totalEarnings || 0) / 100).toLocaleString()} RWF</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Paid Out</div>
              <div className="text-2xl font-bold">{((stats?.paidEarnings || 0) / 100).toLocaleString()} RWF</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Available</div>
              <div className="text-2xl font-bold text-green-600">{((stats?.approvedEarnings || 0) / 100).toLocaleString()} RWF</div>
            </div>
          </div>
          {(stats?.approvedEarnings || 0) < 1_000_000 && (
            <p className="mt-4 text-sm text-orange-600">Minimum payout: 10,000 RWF</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Commission History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Restaurant</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((comm) => (
                  <tr key={comm.id} className="border-b">
                    <td className="py-2">{new Date(comm.createdAt).toLocaleDateString()}</td>
                    <td className="py-2">{comm.restaurant?.name || 'N/A'}</td>
                    <td className="py-2 capitalize">{comm.type.replace('_', ' ')}</td>
                    <td className="py-2">{(comm.amountCents / 100).toLocaleString()} RWF</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        comm.status === 'paid' ? 'bg-green-100 text-green-800' :
                        comm.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {comm.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {commissions.length === 0 && (
              <p className="text-center py-8 text-gray-500">No commissions yet. Start sharing your referral link!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
