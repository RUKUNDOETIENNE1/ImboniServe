import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import AdminLayout from '@/components/AdminLayout'
import { useTranslation } from '@/lib/i18n'
import { useToast } from '@/components/Toast'
import { Mail, Download, TrendingUp } from 'lucide-react'

export default function NewsletterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation()
  const { showToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [subscribers, setSubscribers] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'unsubscribed'>('all')

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
      const isActiveParam = filter === 'active' ? 'true' : filter === 'unsubscribed' ? 'false' : ''
      const [subscribersRes, statsRes] = await Promise.all([
        fetch(`/api/admin/growth/newsletter?${isActiveParam ? `isActive=${isActiveParam}` : ''}`),
        fetch('/api/admin/growth/stats')
      ])

      if (subscribersRes.ok) {
        const data = await subscribersRes.json()
        setSubscribers(data.subscribers)
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.newsletter)
      }
    } catch (e) {
      showToast('error', 'Failed to load subscribers')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = async () => {
    try {
      const isActiveParam = filter === 'active' ? 'true' : filter === 'unsubscribed' ? 'false' : ''
      const res = await fetch(`/api/admin/growth/newsletter?export=true${isActiveParam ? `&isActive=${isActiveParam}` : ''}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `newsletter-subscribers-${Date.now()}.csv`
      a.click()
      showToast('success', 'CSV exported')
    } catch (e) {
      showToast('error', 'Failed to export CSV')
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Newsletter Subscribers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your newsletter audience</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-imboni-blue text-white rounded-xl hover:shadow-lg transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="text-sm text-slate-500 mb-1">Total Subscribers</div>
            <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="text-sm text-slate-500 mb-1">Active</div>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="text-sm text-slate-500 mb-1">Unsubscribed</div>
            <div className="text-3xl font-bold text-slate-600">{stats.unsubscribed}</div>
          </div>
        </div>
      )}

      {/* By Source */}
      {stats?.bySource && stats.bySource.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-imboni-blue" />
            <h2 className="text-lg font-semibold text-slate-800">By Source</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.bySource.map((item: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                <div className="text-sm text-slate-600 mb-1">{item.source}</div>
                <div className="text-2xl font-bold text-slate-800">{item.count}</div>
              </div>
            ))}
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
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'active' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('unsubscribed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'unsubscribed' ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Unsubscribed
          </button>
        </div>
      </div>

      {/* Subscribers List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email / Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Subscribed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-800">{sub.emailOrPhone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {sub.sourcePage || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      sub.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {sub.isActive ? 'Active' : 'Unsubscribed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {subscribers.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No subscribers found
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
