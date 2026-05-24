import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Tag, Plus, X, Clock } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { useFeatureFlag } from '@/hooks/useFeatureFlag'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

const PROMO_TYPES = [
  { value: 'DISCOUNT_PERCENT', label: 'Percentage Discount' },
  { value: 'DISCOUNT_FIXED', label: 'Fixed Amount Off' },
  { value: 'HAPPY_HOUR', label: 'Happy Hour' },
]

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', type: 'DISCOUNT_PERCENT', description: '',
    percentOrAmount: '', startDate: '', endDate: '',
    timeStart: '', timeEnd: '', usageLimit: '',
  })
  const promotionsEnabled = useFeatureFlag('promotions_engine')

  async function fetchPromotions() {
    setLoading(true)
    try {
      const res = await fetch('/api/promotions')
      const data = await res.json()
      setPromotions(data.promotions || [])
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchPromotions() }, [])

  async function createPromotion() {
    if (!form.name || !form.startDate || !form.endDate) return
    setSaving(true)
    try {
      const config: Record<string, unknown> = {}
      if (form.type === 'DISCOUNT_PERCENT' || form.type === 'HAPPY_HOUR') {
        config.percent = Number(form.percentOrAmount)
      } else if (form.type === 'DISCOUNT_FIXED') {
        config.amountCents = Math.round(Number(form.percentOrAmount) * 100)
      }

      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          type: form.type,
          config,
          startDate: form.startDate,
          endDate: form.endDate,
          timeStart: form.timeStart || undefined,
          timeEnd: form.timeEnd || undefined,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setForm({ name: '', type: 'DISCOUNT_PERCENT', description: '', percentOrAmount: '', startDate: '', endDate: '', timeStart: '', timeEnd: '', usageLimit: '' })
        fetchPromotions()
      }
    } catch { } finally { setSaving(false) }
  }

  if (!promotionsEnabled) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Promotions Engine unlocks at 25 active clients on Professional plan+</p>
          <p className="text-sm text-slate-400 mt-1">Create discounts, happy hours, and time-based promotions</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Tag className="w-6 h-6 text-imboni-orange" /> Promotions
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Discounts, happy hours, and time-based offers</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-imboni-blue text-white rounded-lg text-sm hover:bg-primary-700 transition">
          <Plus className="w-4 h-4" /> New Promotion
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Create Promotion</h2>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Happy Hour 20% Off" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
                {PROMO_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {form.type === 'DISCOUNT_FIXED' ? 'Amount (RWF)' : 'Percent (%)'}
              </label>
              <input type="number" value={form.percentOrAmount} onChange={e => setForm(p => ({ ...p, percentOrAmount: e.target.value }))}
                placeholder={form.type === 'DISCOUNT_FIXED' ? '1000' : '20'} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">End Date *</label>
              <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            </div>
            {(form.type === 'HAPPY_HOUR') && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Time Start</label>
                  <input type="time" value={form.timeStart} onChange={e => setForm(p => ({ ...p, timeStart: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Time End</label>
                  <input type="time" value={form.timeEnd} onChange={e => setForm(p => ({ ...p, timeEnd: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm">Cancel</button>
            <button onClick={createPromotion} disabled={saving || !form.name || !form.startDate || !form.endDate}
              className="px-4 py-2 bg-imboni-blue text-white rounded-lg text-sm disabled:opacity-50 hover:bg-primary-700 transition">
              {saving ? 'Creating...' : 'Create Promotion'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue" /></div>
      ) : promotions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No promotions yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Promotion', 'Type', 'Validity', 'Used', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {promotions.map(p => {
                const now = new Date()
                const start = new Date(p.startDate)
                const end = new Date(p.endDate)
                const status = !p.isActive ? 'Inactive' : now < start ? 'Scheduled' : now > end ? 'Expired' : 'Active'
                const statusColor = { Active: 'bg-green-100 text-green-700', Scheduled: 'bg-blue-100 text-blue-700', Expired: 'bg-slate-100 text-slate-500', Inactive: 'bg-red-100 text-red-600' }
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{p.name}</p>
                      {p.description && <p className="text-xs text-slate-400">{p.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{start.toLocaleDateString()} → {end.toLocaleDateString()}</div>
                      {p.timeStart && <div className="text-slate-400">{p.timeStart} – {p.timeEnd}</div>}
                    </td>
                    <td className="px-4 py-3">{p.usageCount || 0}{p.usageLimit ? `/${p.usageLimit}` : ''}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${(statusColor as any)[status] || 'bg-slate-100 text-slate-500'}`}>{status}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}
