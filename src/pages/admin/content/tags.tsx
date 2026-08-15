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

export default function TagsPage() {
  const [tags, setTags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', slug: '' })
  const [error, setError] = useState('')

  useEffect(() => { fetchTags() }, [])

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/admin/content/tags')
      if (res.ok) { const data = await res.json(); setTags(data.tags || []) }
    } catch {} finally { setLoading(false) }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    try {
      const res = await fetch('/api/admin/content/tags', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setForm({ name: '', slug: '' }); fetchTags() }
      else { const err = await res.json(); setError(err.error) }
    } catch { setError('Network error') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tag?')) return
    await fetch(`/api/admin/content/tags/${id}`, { method: 'DELETE' })
    fetchTags()
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tags</h1>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow-sm mb-6 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (optional)</label>
            <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">Add</button>
        </form>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : tags.length === 0 ? (
          <p className="text-gray-500">No tags yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <span key={t.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm">
                {t.name}
                <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700">×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
