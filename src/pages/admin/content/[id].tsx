import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { ARTICLE_TYPES, ARTICLE_TYPE_LABELS, ARTICLE_STATUS_LABELS, ARTICLE_STATUS_COLORS } from '@/lib/content/constants'
import { EditorialService } from '@/lib/content/editorial.service'
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
  const { id } = ctx.params as { id: string }
  const article = await EditorialService.getArticle(id)
  if (!article) return { notFound: true }
  return { props: { article: JSON.parse(JSON.stringify(article)) } }
}

export default function EditArticlePage({ article }: any) {
  const router = useRouter()
  const [topics, setTopics] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [transitionNote, setTransitionNote] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [form, setForm] = useState({
    type: article.type,
    title: article.title,
    subtitle: article.subtitle || '',
    excerpt: article.excerpt || '',
    body: article.body,
    topicId: article.topicId || '',
    tags: (article.tags || []).join(', '),
  })

  useEffect(() => { fetchTopics() }, [])

  const fetchTopics = async () => {
    try {
      const res = await fetch('/api/admin/content/topics')
      if (res.ok) { const data = await res.json(); setTopics(data.topics || []) }
    } catch {}
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const tags = form.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      const res = await fetch(`/api/admin/content/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tags, topicId: form.topicId || undefined }),
      })
      if (res.ok) { router.reload() } else { const err = await res.json(); setError(err.error) }
    } catch { setError('Network error') } finally { setSaving(false) }
  }

  const handleTransition = async (toStatus: string) => {
    setError('')
    try {
      const res = await fetch(`/api/admin/content/articles/${article.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus, note: transitionNote || undefined, scheduledAt: scheduledAt || undefined }),
      })
      if (res.ok) { router.reload() } else { const err = await res.json(); setError(err.error) }
    } catch { setError('Network error') }
  }

  const validTransitions = EditorialService.getValidTransitions(article.status)

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin/content" className="text-sm text-blue-600 hover:underline">← Back</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Edit Article</h1>
            <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${ARTICLE_STATUS_COLORS[article.status as keyof typeof ARTICLE_STATUS_COLORS] || ''}`}>
              {ARTICLE_STATUS_LABELS[article.status as keyof typeof ARTICLE_STATUS_LABELS] || article.status}
            </span>
          </div>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSave} className="space-y-5 bg-white p-6 rounded-lg shadow-sm mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              {ARTICLE_TYPES.map(t => <option key={t} value={t}>{ARTICLE_TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
            <input type="text" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
            <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <select value={form.topicId} onChange={e => setForm({ ...form, topicId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">— None —</option>
              {topics.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body (Markdown)</label>
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={16} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" />
          </div>
          <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Transition panel */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Editorial Workflow</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {validTransitions.map((t) => (
              <button key={t.to} onClick={() => handleTransition(t.to)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-sm font-medium rounded-lg transition">
                → {ARTICLE_STATUS_LABELS[t.to as keyof typeof ARTICLE_STATUS_LABELS] || t.to}
              </button>
            ))}
            {validTransitions.length === 0 && <p className="text-sm text-gray-500">No transitions available from {article.status}.</p>}
          </div>
          {article.status === 'APPROVED' && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule for (required for SCHEDULED)</label>
              <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transition Note (required for REJECTED)</label>
            <input type="text" value={transitionNote} onChange={e => setTransitionNote(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>

        {/* Transition history */}
        {article.transitions && article.transitions.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transition History</h2>
            <div className="space-y-2">
              {article.transitions.map((t: any) => (
                <div key={t.id} className="text-sm text-gray-600 border-b border-gray-100 pb-2">
                  <span className="font-medium">{t.fromStatus || '—'} → {t.toStatus}</span>
                  <span className="text-gray-400 ml-2">{new Date(t.createdAt).toLocaleString()}</span>
                  {t.note && <p className="text-gray-500 mt-1">Note: {t.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
