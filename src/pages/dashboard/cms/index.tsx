import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import { FileText, Plus, Search, Filter, Eye, Edit, Trash2, Send, Settings } from 'lucide-react'
import Link from 'next/link'

type Post = {
  id: string
  type: string
  title?: string | null
  body?: string | null
  status: string
  publishAt?: string | null
  expireAt?: string | null
  createdAt: string
}

export default function CmsIndexPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchPosts()
    }
  }, [status, statusFilter])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (searchTerm) params.set('q', searchTerm)
      const res = await fetch(`/api/cms/posts?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.data?.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchPosts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return
    try {
      const res = await fetch(`/api/cms/posts/${id}`, { method: 'DELETE' })
      if (res.ok) fetchPosts()
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-slate-100 text-slate-700',
      PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-blue-100 text-blue-700',
      SCHEDULED: 'bg-purple-100 text-purple-700',
      PUBLISHED: 'bg-green-100 text-green-700',
      EXPIRED: 'bg-red-100 text-red-700',
      REJECTED: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-slate-100 text-slate-700'
  }

  const statusOptions = ['all', 'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'EXPIRED']

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-imboni-blue" />
              Content Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">Create and manage posts for your discovery feed</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/cms/settings">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </Link>
            <Link href="/dashboard/cms/new">
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg transition-all">
                <Plus className="w-4 h-4" />
                New Post
              </button>
            </Link>
          </div>
        </div>
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
                {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 w-64"
              />
            </div>
            <button onClick={handleSearch} className="px-4 py-2 bg-slate-100 rounded-xl text-sm hover:bg-slate-200">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Title</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Publish At</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Created</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-700">{post.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-800">{post.title || '(No title)'}</div>
                    {post.body && <div className="text-xs text-slate-500 truncate max-w-xs">{post.body}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                      {post.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">
                      {post.publishAt ? new Date(post.publishAt).toLocaleString() : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/cms/${post.id}`}>
                        <button className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </Link>
                      {post.status === 'DRAFT' && (
                        <button
                          onClick={() => {
                            fetch(`/api/cms/posts/${post.id}/submit`, { method: 'POST' }).then(() => fetchPosts())
                          }}
                          className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {posts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No posts found</p>
              <Link href="/dashboard/cms/new">
                <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm">
                  Create your first post
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
