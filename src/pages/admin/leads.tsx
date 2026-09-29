import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import type { GetServerSideProps } from 'next'
import AdminLayout from '@/components/AdminLayout'
import { useTranslation } from '@/lib/i18n'
import { useToast } from '@/components/Toast'
import { Calendar, Building2, Phone, MessageSquare, Check, X, Clock } from 'lucide-react'

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

export default function LeadsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'CONTACTED' | 'COMPLETED'>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status, filter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [requestsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/growth/demo-requests?${filter !== 'all' ? `status=${filter}` : ''}`),
        fetch('/api/admin/growth/stats')
      ])

      if (requestsRes.ok) {
        const data = await requestsRes.json()
        setRequests(data.requests)
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.demo)
      }
    } catch (e) {
      showToast('error', 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/growth/demo-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      if (!res.ok) throw new Error('Failed to update status')

      showToast('success', 'Status updated')
      fetchData()
    } catch (e) {
      showToast('error', 'Failed to update status')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Demo Requests</h1>
        <p className="text-sm text-slate-500 mt-1">Manage inbound demo requests</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="text-sm text-slate-500 mb-1">Total Requests</div>
            <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="text-sm text-slate-500 mb-1">Pending</div>
            <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="text-sm text-slate-500 mb-1">Contacted</div>
            <div className="text-3xl font-bold text-blue-600">{stats.contacted}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="text-sm text-slate-500 mb-1">Completed</div>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-imboni-blue text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'PENDING' ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('CONTACTED')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'CONTACTED' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Contacted
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'COMPLETED' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Business</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{req.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Building2 className="w-4 h-4" />
                      {req.businessName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Phone className="w-4 h-4" />
                      {req.contact}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {req.message ? (
                      <div className="text-sm text-slate-600 max-w-xs truncate" title={req.message}>
                        {req.message}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      req.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                      req.status === 'CONTACTED' ? 'bg-blue-100 text-blue-700' :
                      req.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {req.status === 'PENDING' && <Clock className="w-3 h-3" />}
                      {req.status === 'CONTACTED' && <MessageSquare className="w-3 h-3" />}
                      {req.status === 'COMPLETED' && <Check className="w-3 h-3" />}
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {req.status === 'PENDING' && (
                        <button
                          onClick={() => updateStatus(req.id, 'CONTACTED')}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600"
                        >
                          Mark Contacted
                        </button>
                      )}
                      {req.status === 'CONTACTED' && (
                        <button
                          onClick={() => updateStatus(req.id, 'COMPLETED')}
                          className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs hover:bg-green-600"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {requests.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No demo requests found
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
