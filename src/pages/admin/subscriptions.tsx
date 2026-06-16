import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import AdminLayout from '@/components/AdminLayout'
import { CreditCard, Calendar, DollarSign, TrendingUp, Search, Eye, CheckCircle, XCircle } from 'lucide-react'

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

export default function AdminSubscriptions() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchSubscriptions()
    }
  }, [status])

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/admin/subscriptions')
      if (res.ok) {
        const data = await res.json()
        setSubscriptions(data.subscriptions || [])
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
    } finally {
      setLoading(false)
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

  const stats = [
    { label: 'Total Subscriptions', value: subscriptions.length, icon: CreditCard, color: 'blue' },
    { label: 'Active', value: subscriptions.filter(s => s.status === 'ACTIVE').length, icon: CheckCircle, color: 'green' },
    { label: 'Expired', value: subscriptions.filter(s => s.status === 'EXPIRED').length, icon: XCircle, color: 'red' },
    { label: 'MRR', value: `RWF ${(subscriptions.filter(s => s.status === 'ACTIVE').reduce((sum, s) => sum + (s.amountCents || 0), 0) / 100).toLocaleString()}`, icon: TrendingUp, color: 'purple' }
  ]

  const filteredSubscriptions = subscriptions.filter(s => 
    filterStatus === 'all' || s.status === filterStatus.toUpperCase()
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700'
      case 'PENDING': return 'bg-yellow-100 text-yellow-700'
      case 'EXPIRED': return 'bg-red-100 text-red-700'
      case 'CANCELLED': return 'bg-slate-100 text-slate-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Subscription Management</h1>
        <p className="text-sm text-slate-500 mt-1">Manage all platform subscriptions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">{stat.label}</p>
                <Icon className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div className="flex gap-2">
          {['all', 'active', 'pending', 'expired'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filterStatus === status
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Restaurant</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Plan</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Next Billing</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Auto-Renew</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSubscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800">{sub.restaurant?.name || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {sub.plan?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">RWF {(sub.amountCents / 100).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{new Date(sub.nextBillingDate).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      sub.isAutoRenew ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {sub.isAutoRenew ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No subscriptions found</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
