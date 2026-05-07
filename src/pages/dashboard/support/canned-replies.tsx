import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { Loader2, Plus, Pencil, Trash2, Save, X } from 'lucide-react'

interface CannedReply {
  id: string
  title: string
  body: string
  shortcut: string | null
  isActive: boolean
}

export default function CannedRepliesPage() {
  const { status } = useSession()
  const [items, setItems] = useState<CannedReply[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<{ title: string; body: string; shortcut: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    load()
  }, [status])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/support/canned-replies')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load')
      setItems(data.items || [])
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function create() {
    if (!form || !form.title.trim() || !form.body.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/support/canned-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, body: form.body, shortcut: form.shortcut || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create')
      setItems((prev) => [...prev, data])
      setForm(null)
    } catch (e: any) {
      setError(e.message || 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  async function update(id: string, patch: Partial<CannedReply>) {
    const res = await fetch(`/api/support/canned-replies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Failed to update')
    setItems((prev) => prev.map((i) => (i.id === id ? data : i)))
  }

  async function softDelete(id: string) {
    const res = await fetch(`/api/support/canned-replies/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Failed to delete')
    setItems((prev) => prev.map((i) => (i.id === id ? data : i)))
  }

  return (
    <DashboardLayout>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold">Canned Replies</h1>
          {!form ? (
            <button onClick={() => setForm({ title: '', body: '', shortcut: '' })} className="px-3 py-2 rounded-md bg-imboni-blue text-white text-sm inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> New
            </button>
          ) : (
            <button onClick={() => setForm(null)} className="px-3 py-2 rounded-md border text-sm inline-flex items-center gap-2">
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>

        {form && (
          <div className="mb-4 p-3 rounded-lg border">
            <div className="grid gap-2">
              <input className="px-3 py-2 rounded-md border" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea className="px-3 py-2 rounded-md border min-h-[120px]" placeholder="Body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
              <input className="px-3 py-2 rounded-md border" placeholder="Shortcut (optional)" value={form.shortcut} onChange={(e) => setForm({ ...form, shortcut: e.target.value })} />
              <div>
                <button disabled={creating} onClick={create} className="px-3 py-2 rounded-md bg-imboni-blue text-white text-sm inline-flex items-center gap-2 disabled:opacity-60">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && <div className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md mb-3">{error}</div>}

        <div className="grid gap-2">
          {items.map((it) => (
            <div key={it.id} className="p-3 rounded-lg border flex items-start gap-3">
              <div className="flex-1">
                {editingId === it.id ? (
                  <EditRow item={it} onCancel={() => setEditingId(null)} onSave={async (patch) => { await update(it.id, patch); setEditingId(null) }} />
                ) : (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{it.title}</div>
                      <div className="text-xs">{it.isActive ? 'Active' : 'Inactive'}</div>
                    </div>
                    {it.shortcut && <div className="text-xs text-slate-500">/{it.shortcut}</div>}
                    <div className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{it.body}</div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editingId !== it.id && (
                  <button onClick={() => setEditingId(it.id)} className="px-2 py-1 border rounded-md text-xs inline-flex items-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                )}
                <button onClick={() => softDelete(it.id)} className="px-2 py-1 border rounded-md text-xs inline-flex items-center gap-1 text-red-600"><Trash2 className="w-3 h-3" /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

function EditRow({ item, onCancel, onSave }: { item: CannedReply; onCancel: () => void; onSave: (patch: Partial<CannedReply>) => Promise<void> }) {
  const [title, setTitle] = useState(item.title)
  const [body, setBody] = useState(item.body)
  const [shortcut, setShortcut] = useState(item.shortcut || '')
  const [isActive, setIsActive] = useState(!!item.isActive)
  const [saving, setSaving] = useState(false)

  return (
    <div className="grid gap-2">
      <input className="px-3 py-2 rounded-md border" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="px-3 py-2 rounded-md border min-h-[120px]" value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex items-center gap-2">
        <input className="px-3 py-2 rounded-md border" placeholder="Shortcut" value={shortcut} onChange={(e) => setShortcut(e.target.value)} />
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onCancel} className="px-3 py-2 rounded-md border text-sm inline-flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
        <button disabled={saving} onClick={async () => { setSaving(true); try { await onSave({ title, body, shortcut: shortcut || null, isActive }) } finally { setSaving(false) } }} className="px-3 py-2 rounded-md bg-imboni-blue text-white text-sm inline-flex items-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </button>
      </div>
    </div>
  )
}
