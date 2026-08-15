import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
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

export default function TopicsPage() {
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', description: '', parentId: '' })
  const [error, setError] = useState('')

  useEffect(() => { fetchTopics() }, [])

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/admin/content/topics?includeInactive=true')
      if (res.ok) { const data = await res.json(); setTopics(data.topics || []) }
    } catch {} finally { setLoading(false) }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    try {
      const res = await fetch('/api/admin/content/topics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setShowForm(false); setForm({ name: '', slug: '', description: '', parentId: '' }); fetchTopics() }
      else { const err = await res.json(); setError(err.error) }
    } catch { setError('Network error') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this topic?')) return
    await fetch(`/api/admin/content/topics/${id}`, { method: 'DELETE' })
    fetchTopics()
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Topics</h1>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            {showForm ? 'Cancel' : '+ New Topic'}
          </button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow-sm mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (optional, auto-generated)</label>
              <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Topic</label>
              <select value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">— None —</option>
                {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Create</button>
          </form>
        )}
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : topics.length === 0 ? (
          <p className="text-gray-500">No topics yet.</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
            {topics.map(t => (
              <div key={t.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">/{t.slug} {t.description ? `— ${t.description}` : ''}</p>
                </div>
                <button onClick={() => handleDelete(t.id)} className="text-sm text-red-600 hover:underline">Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
