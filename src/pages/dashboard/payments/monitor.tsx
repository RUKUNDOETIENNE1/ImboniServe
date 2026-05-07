import { useState, useEffect } from 'react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import type { GetServerSideProps } from 'next'
import DashboardLayout from '@/components/DashboardLayout'
import { AlertCircle, CheckCircle, Clock, DollarSign, TrendingUp, RefreshCw } from 'lucide-react'

interface PaymentStats {
  todayTotal: number
  todayCount: number
  pendingCount: number
  failedCount: number
  recentPayments: Array<{
    id: string
    amount: number
    method: string
    status: string
    createdAt: string
    businessName?: string
  }>
}

export default function PaymentMonitor() {
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/payments/monitor/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch payment stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (cents: number) => {
    return `RWF ${(cents / 100).toLocaleString()}`
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'PAID':
        return 'text-green-600 bg-green-50'
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50'
      case 'FAILED':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getMethodDisplay = (method: string) => {
    switch (method) {
      case 'WEB': return 'IremboPay'
      case 'MTN_MOBILE_MONEY': return 'MTN MoMo'
      case 'AIRTEL_MONEY': return 'Airtel Money'
      case 'CASH': return 'Cash'
      case 'BANK_TRANSFER': return 'Bank'
      default: return method
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Monitor</h1>
            <p className="text-sm text-gray-600 mt-1">
              Real-time payment tracking • Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading && !stats ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Today's Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(stats?.todayTotal || 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Transactions</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats?.todayCount || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                      {stats?.pendingCount || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {stats?.failedCount || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Payments Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats?.recentPayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No recent payments
                        </td>
                      </tr>
                    ) : (
                      stats?.recentPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatTime(payment.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {getMethodDisplay(payment.method)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {payment.id.slice(0, 8)}...
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alert Section */}
            {(stats?.failedCount || 0) > 0 && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <p className="font-medium">
                    {stats?.failedCount} failed payment{stats?.failedCount !== 1 ? 's' : ''} need attention
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
