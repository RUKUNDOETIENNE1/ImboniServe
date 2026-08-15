import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { ARTICLE_STATUS_LABELS, ARTICLE_STATUS_COLORS, ARTICLE_TYPE_LABELS } from '@/lib/content/constants'
import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  const roles = (session?.user as any)?.roles || []
  const editorialRoles = (session?.user as any)?.editorialRoles || []
  if (!roles.includes('ADMIN') && editorialRoles.length === 0) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }
  return { props: {} }
}

export default function EditorialDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [filter])

  const fetchData = async () => {
    try {
      const [statsRes, articlesRes] = await Promise.all([
        fetch('/api/admin/content/articles?page=1&pageSize=5'),
        fetch(`/api/admin/content/articles?page=1&pageSize=20${filter ? `&status=${filter}` : ''}`),
      ])
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        // Use the first article list for stats overview
        if (!stats) setStats({ total: statsData.total, items: statsData.items.slice(0, 5) })
      }
      if (articlesRes.ok) {
        const data = await articlesRes.json()
        setArticles(data.items)
        setStats((prev: any) => prev ? { ...prev, total: data.total } : { total: data.total, items: [] })
      }
    } catch (err) {
      console.error('Failed to fetch editorial data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">Loading editorial dashboard...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editorial Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage platform editorial content</p>
          </div>
          <Link
            href="/admin/content/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            + New Article
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Articles', value: stats?.total || 0, color: 'bg-blue-50 text-blue-700' },
            { label: 'Published', value: articles.filter(a => a.status === 'PUBLISHED').length, color: 'bg-green-50 text-green-700' },
            { label: 'In Review', value: articles.filter(a => a.status === 'REVIEW').length, color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Drafts', value: articles.filter(a => a.status === 'DRAFT').length, color: 'bg-gray-50 text-gray-700' },
          ].map((stat) => (
            <div key={stat.label} className={`p-4 rounded-lg ${stat.color}`}>
              <p className="text-sm font-medium opacity-80">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {['', 'DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                filter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Articles table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No articles found. <Link href="/admin/content/new" className="text-blue-600 hover:underline">Create one</Link>
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{article.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{ARTICLE_TYPE_LABELS[article.type as keyof typeof ARTICLE_TYPE_LABELS] || article.type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${ARTICLE_STATUS_COLORS[article.status as keyof typeof ARTICLE_STATUS_COLORS] || 'bg-gray-100 text-gray-700'}`}>
                        {ARTICLE_STATUS_LABELS[article.status as keyof typeof ARTICLE_STATUS_LABELS] || article.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{article.author?.name || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(article.updatedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <Link href={`/admin/content/${article.id}`} className="text-blue-600 hover:underline">Edit</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}
