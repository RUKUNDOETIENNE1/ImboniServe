import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import AdminLayout from '@/components/AdminLayout'
import { Building2, Search, AlertCircle, Calendar, Phone, MapPin, TrendingUp, Eye } from 'lucide-react'
import Link from 'next/link'

type Business = {
  id: string
  name: string
  ownerName: string
  ownerEmail: string
  phone: string
  location: string
  businessType: string
  salesStatus: string
  trialStartDate: string | null
  trialEndDate: string | null
  daysLeft: number | null
  nextAction: string | null
  nextActionDate: string | null
  nextActionCompleted: boolean
  ordersToday: number
  revenueToday: number
  totalOrders: number
  planName: string
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

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

export default function SalesPipelinePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [alerts, setAlerts] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [pipelineRes, alertsRes] = await Promise.all([
        fetch('/api/admin/sales-pipeline'),
        fetch('/api/admin/sales-pipeline/alerts')
      ])

      if (pipelineRes.ok) {
        const data = await pipelineRes.json()
        setBusinesses(data.data || [])
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json()
        setAlerts(data.data || null)
      }
    } catch (error) {
      console.error('Failed to fetch pipeline data:', error)
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

  const filteredBusinesses = businesses.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         b.phone.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || b.salesStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusOptions = ['all', 'Lead', 'Demo Done', 'Trial Active', 'Trial Ending Soon', 'Converted', 'Lost']

  const stats = [
    { label: 'Total Businesses', value: businesses.length, color: 'blue' },
    { label: 'Trial Active', value: businesses.filter(b => b.salesStatus === 'Trial Active').length, color: 'green' },
    { label: 'Ending Soon', value: businesses.filter(b => b.salesStatus === 'Trial Ending Soon').length, color: 'orange' },
    { label: 'Converted', value: businesses.filter(b => b.salesStatus === 'Converted').length, color: 'purple' }
  ]

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Lead': 'bg-slate-100 text-slate-700',
      'Demo Done': 'bg-blue-100 text-blue-700',
      'Trial Active': 'bg-green-100 text-green-700',
      'Trial Ending Soon': 'bg-orange-100 text-orange-700',
      'Converted': 'bg-purple-100 text-purple-700',
      'Lost': 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-slate-100 text-slate-700'
  }

  const getDaysLeftColor = (days: number | null) => {
    if (days === null) return 'text-slate-500'
    if (days <= 3) return 'text-red-600 font-semibold'
    if (days <= 7) return 'text-orange-600 font-medium'
    return 'text-green-600'
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Sales Pipeline</h1>
        <p className="text-sm text-slate-500 mt-1">Manage trials, follow-ups, and business conversions</p>
      </div>

      {/* Alerts Banner */}
      {alerts && (alerts.actionsDue.length > 0 || alerts.trialsEndingSoon.length > 0) && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-orange-800 mb-2">Actions Required Today</p>
              {alerts.actionsDue.length > 0 && (
                <p className="text-sm text-orange-700 mb-1">
                  <strong>{alerts.actionsDue.length}</strong> follow-up action{alerts.actionsDue.length > 1 ? 's' : ''} due today
                </p>
              )}
              {alerts.trialsEndingSoon.length > 0 && (
                <p className="text-sm text-orange-700">
                  <strong>{alerts.trialsEndingSoon.length}</strong> trial{alerts.trialsEndingSoon.length > 1 ? 's' : ''} ending in 3 days or less
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <p className="text-sm text-slate-600 mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl font-medium transition-all text-sm ${
                  statusFilter === status
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search businesses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 w-64"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Business</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Owner</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Location</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Trial</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Next Action</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Orders Today</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBusinesses.map((business) => (
                <tr key={business.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-imboni-blue to-blue-600 flex items-center justify-center text-white font-semibold">
                        {business.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{business.name}</p>
                        <p className="text-xs text-slate-500">{business.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-800">{business.ownerName}</p>
                    <p className="text-xs text-slate-500">{business.ownerEmail}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4" />
                      {business.location}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700">{business.businessType}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(business.salesStatus || 'Lead')}`}>
                      {business.salesStatus || 'Lead'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {business.trialStartDate ? (
                      <div className="text-sm">
                        <p className={getDaysLeftColor(business.daysLeft)}>
                          {business.daysLeft !== null 
                            ? business.daysLeft >= 0 
                              ? `${business.daysLeft} days left`
                              : 'Expired'
                            : 'N/A'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(business.trialEndDate!).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">Not started</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {business.nextAction ? (
                      <div className="text-sm">
                        <p className="text-slate-800">{business.nextAction}</p>
                        {business.nextActionDate && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(business.nextActionDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-slate-800">{business.ordersToday}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/sales-pipeline/${business.id}`}>
                      <button className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBusinesses.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No businesses found</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
