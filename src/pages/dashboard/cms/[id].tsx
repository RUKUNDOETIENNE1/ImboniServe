import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import { FileText, Save, Send, CheckCircle, XCircle } from 'lucide-react'

export default function EditPostPage() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [post, setPost] = useState<any>(null)

  useEffect(() => {
    if (id && typeof id === 'string') fetchPost()
  }, [id])

  const fetchPost = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/cms/posts/${id}`)
      if (res.ok) {
        const data = await res.json()
        setPost(data.data)
      }
    } catch (e) {
      console.error('Failed to fetch post:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      const res = await fetch(`/api/cms/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title,
          body: post.body,
          publishAt: post.publishAt,
          expireAt: post.expireAt,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update post')
      }

      await fetchPost()
    } catch (e: any) {
      setError(e.message || 'Failed to update post')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch(`/api/cms/posts/${id}/submit`, { method: 'POST' })
      if (res.ok) await fetchPost()
    } catch (e) {
      console.error('Failed to submit post:', e)
    }
  }

  if (loading || !post) {
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
              Edit Post
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Status: <span className="font-medium">{post.status}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {post.status === 'DRAFT' && (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <Send className="w-4 h-4" />
                Submit for Review
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm border bg-red-50 border-red-200 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
            <div className="px-4 py-2 bg-slate-100 rounded-xl text-sm text-slate-700">{post.type}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={post.title || ''}
              onChange={(e) => setPost({ ...post, title: e.target.value })}
              className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Content</label>
            <textarea
              value={post.body || ''}
              onChange={(e) => setPost({ ...post, body: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Publish At</label>
              <input
                type="datetime-local"
                value={post.publishAt ? new Date(post.publishAt).toISOString().slice(0, 16) : ''}
                onChange={(e) => setPost({ ...post, publishAt: e.target.value })}
                className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Expire At</label>
              <input
                type="datetime-local"
                value={post.expireAt ? new Date(post.expireAt).toISOString().slice(0, 16) : ''}
                onChange={(e) => setPost({ ...post, expireAt: e.target.value })}
                className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/cms')}
          className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all"
        >
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </DashboardLayout>
  )
}
