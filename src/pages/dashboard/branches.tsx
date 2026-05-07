import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { MapPin, Plus, Star, Edit2, X } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useFeatureFlag } from '@/hooks/useFeatureFlag'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)
  const multiBranchEnabled = useFeatureFlag('multi_branch')

  async function fetchBranches() {
    setLoading(true)
    try {
      const res = await fetch('/api/branches')
      const data = await res.json()
      setBranches(data.branches || [])
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchBranches() }, [])

  async function createBranch() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setShowForm(false); setForm({ name: '', address: '', phone: '', email: '' }); fetchBranches() }
    } catch { } finally { setSaving(false) }
  }

  if (!multiBranchEnabled && !loading) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Multi-Branch unlocks at 15 active clients on Business plan+</p>
          <p className="text-sm text-slate-400 mt-1">Your branches will appear here once the feature is enabled</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-6 h-6" /> Branches
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your business locations</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-imboni-blue text-white rounded-lg text-sm hover:bg-primary-700 transition"
        >
          <Plus className="w-4 h-4" /> Add Branch
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">New Branch</h2>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Branch Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Main Branch, Kigali City" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Address</label>
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                placeholder="Street address" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+250 7xx xxx xxx" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
            <button onClick={createBranch} disabled={saving || !form.name.trim()}
              className="px-4 py-2 bg-imboni-blue text-white rounded-lg text-sm disabled:opacity-50 hover:bg-primary-700 transition">
              {saving ? 'Creating...' : 'Create Branch'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue" /></div>
      ) : branches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No branches yet</p>
          <p className="text-sm text-slate-400 mt-1">Add your first branch to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-800">{b.name}</h3>
                {b.isDefault && (
                  <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    <Star className="w-3 h-3" /> Default
                  </span>
                )}
              </div>
              {b.address && <p className="text-sm text-slate-500">{b.address}</p>}
              {b.phone && <p className="text-xs text-slate-400 mt-1">{b.phone}</p>}
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-xs px-2 py-1 rounded-full ${b.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {b.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
