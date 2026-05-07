import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import AdminLayout from '@/components/AdminLayout'
import { Calendar, Clock, ClipboardList, MapPin, Phone, Save, CheckCircle2, Plus, AlertTriangle } from 'lucide-react'

interface AnalyticsSummary {
  ordersToday: number
  revenueToday: number
  ordersThisWeek: number
  revenueThisWeek: number
  totalOrders: number
  totalCustomers: number
  totalMenuItems: number
  totalTables: number
}

interface ActivityLogItem {
  id: string
  action: string
  details?: string
  createdAt: string
  actorId?: string
}

interface BusinessDetail {
  id: string
  name: string
  description?: string | null
  phone: string
  address?: string | null
  city: string
  district?: string | null
  country: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  businessType?: string | null
  salesStatus?: string | null
  trialStartDate?: string | null
  trialEndDate?: string | null
  nextAction?: string | null
  nextActionDate?: string | null
  nextActionCompleted: boolean
  followUpDay2Done: boolean
  followUpDay5Done: boolean
  followUpDay10Done: boolean
  followUpDay13Done: boolean
  salesNotes?: string | null
  owner?: {
    id: string
    name: string
    email: string
    phone: string
    lastLoginAt?: string | null
    createdAt: string
  } | null
  plan?: {
    name: string
    code: string
    priceCents?: number | null
  } | null
  activityLogs: ActivityLogItem[]
  sales: Array<{ id: string; totalAmountCents: number; createdAt: string; orderSource: string; status: string }>
  analytics: AnalyticsSummary
  daysLeft: number | null
}

export default function SalesPipelineDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const { status } = useSession()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'overview'|'trial'|'activity'|'performance'|'notes'>('overview')
  const [data, setData] = useState<BusinessDetail | null>(null)

  const fetchDetail = async () => {
    if (!id || typeof id !== 'string') return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/sales-pipeline/${id}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } catch (e) {
      console.error('Failed to fetch business detail', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated') fetchDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, id])

  const handleUpdate = async (partial: Partial<BusinessDetail>) => {
    if (!id || typeof id !== 'string') return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/sales-pipeline/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partial)
      })
      if (res.ok) await fetchDetail()
    } catch (e) {
      console.error('Failed to update business', e)
    } finally {
      setSaving(false)
    }
  }

  const logActivity = async (action: string, details?: string) => {
    if (!id || typeof id !== 'string') return
    try {
      const res = await fetch(`/api/admin/sales-pipeline/${id}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, details })
      })
      if (res.ok) await fetchDetail()
    } catch (e) {
      console.error('Failed to log activity', e)
    }
  }

  const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '—')

  const TrialPanel = useMemo(() => {
    if (!data) return null
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <p className="text-sm text-slate-600 mb-1">Trial Start</p>
            <input
              type="date"
              defaultValue={data.trialStartDate ? new Date(data.trialStartDate).toISOString().slice(0,10) : ''}
              onChange={(e) => handleUpdate({ trialStartDate: e.target.value })}
              className="mt-1 w-full bg-slate-100 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <p className="text-sm text-slate-600 mb-1">Trial End</p>
            <input
              type="date"
              defaultValue={data.trialEndDate ? new Date(data.trialEndDate).toISOString().slice(0,10) : ''}
              onChange={(e) => handleUpdate({ trialEndDate: e.target.value })}
              className="mt-1 w-full bg-slate-100 rounded-xl px-3 py-2 text-sm"
            />
            <p className={`mt-3 text-sm ${data.daysLeft !== null && data.daysLeft <= 3 ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
              {data.daysLeft !== null ? (data.daysLeft >= 0 ? `${data.daysLeft} days left` : 'Expired') : '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <p className="text-sm text-slate-600 mb-1">Status</p>
            <select
              defaultValue={data.salesStatus || 'Lead'}
              onChange={(e) => handleUpdate({ salesStatus: e.target.value })}
              className="mt-1 w-full bg-slate-100 rounded-xl px-3 py-2 text-sm"
            >
              {['Lead','Demo Done','Trial Active','Trial Ending Soon','Converted','Lost'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Next Action</p>
              <input
                type="text"
                defaultValue={data.nextAction || ''}
                onBlur={(e) => handleUpdate({ nextAction: e.target.value })}
                placeholder="e.g., Call owner to confirm demo"
                className="mt-1 w-full bg-slate-100 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Next Action Date</p>
              <input
                type="date"
                defaultValue={data.nextActionDate ? new Date(data.nextActionDate).toISOString().slice(0,10) : ''}
                onChange={(e) => handleUpdate({ nextActionDate: e.target.value })}
                className="mt-1 w-full bg-slate-100 rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" defaultChecked={data.nextActionCompleted} onChange={(e) => handleUpdate({ nextActionCompleted: e.target.checked })} />
              Mark next action as completed
            </label>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <p className="text-sm text-slate-600 mb-3">Follow-up Checkpoints</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Day 2', key: 'followUpDay2Done' as const },
              { label: 'Day 5', key: 'followUpDay5Done' as const },
              { label: 'Day 10', key: 'followUpDay10Done' as const },
              { label: 'Day 13', key: 'followUpDay13Done' as const },
            ].map(item => (
              <label key={item.key} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" defaultChecked={(data as any)[item.key]} onChange={(e) => handleUpdate({ [item.key]: e.target.checked } as any)} />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    )
  }, [data])

  if (loading || !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{data.name}</h1>
            <p className="text-sm text-slate-500 mt-1">{data.city}{data.district ? `, ${data.district}` : ''}, {data.country}</p>
          </div>
          <div className="flex items-center gap-2">
            <button disabled={saving} onClick={() => fetchDetail()} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm hover:bg-slate-200 transition-colors">Refresh</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'trial', label: 'Trial' },
            { key: 'activity', label: 'Activity Log' },
            { key: 'performance', label: 'Performance' },
            { key: 'notes', label: 'Notes' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === t.key ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <p className="text-sm text-slate-600 mb-3">Owner</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4" />
                  {data.owner?.phone || '—'}
                </div>
                <div className="text-slate-700">{data.owner?.name || '—'}</div>
                <div className="text-slate-700">{data.owner?.email || '—'}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <p className="text-sm text-slate-600 mb-3">Address</p>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <MapPin className="w-4 h-4" />
                {data.address || '—'}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <p className="text-sm text-slate-600 mb-1">Status</p>
              <div className="text-slate-800 font-medium">{data.salesStatus || 'Lead'}</div>
              <div className="mt-2 text-sm text-slate-600">Plan: {data.plan?.name || 'No Plan'}</div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <p className="text-sm text-slate-600 mb-1">Trial</p>
              <div className="text-sm text-slate-800">Start: {formatDate(data.trialStartDate)}</div>
              <div className="text-sm text-slate-800">End: {formatDate(data.trialEndDate)}</div>
              <div className={`mt-2 text-sm ${data.daysLeft !== null && data.daysLeft <= 3 ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                {data.daysLeft !== null ? (data.daysLeft >= 0 ? `${data.daysLeft} days left` : 'Expired') : '—'}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <p className="text-sm text-slate-600 mb-1">Performance (7d)</p>
              <div className="text-sm text-slate-800">Orders: {data.analytics.ordersThisWeek}</div>
              <div className="text-sm text-slate-800">Revenue: RWF {(data.analytics.revenueThisWeek/100).toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'trial' && TrialPanel}

      {tab === 'activity' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-slate-600" />
              <p className="text-sm font-medium text-slate-700">Log Activity</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => logActivity('Called owner')} className="px-3 py-2 bg-slate-100 rounded-xl text-sm hover:bg-slate-200">Call</button>
              <button onClick={() => logActivity('Demo done')} className="px-3 py-2 bg-slate-100 rounded-xl text-sm hover:bg-slate-200">Demo</button>
              <button onClick={() => logActivity('Follow-up complete')} className="px-3 py-2 bg-slate-100 rounded-xl text-sm hover:bg-slate-200">Follow-up</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <div className="space-y-3">
              {data.activityLogs.length === 0 && (
                <p className="text-sm text-slate-500">No activity yet</p>
              )}
              {data.activityLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-800">{log.action}</p>
                    {log.details && <p className="text-xs text-slate-500">{log.details}</p>}
                  </div>
                  <div className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <p className="text-sm text-slate-600 mb-2">Today</p>
            <div className="text-sm text-slate-800">Orders: {data.analytics.ordersToday}</div>
            <div className="text-sm text-slate-800">Revenue: RWF {(data.analytics.revenueToday/100).toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <p className="text-sm text-slate-600 mb-2">This Week</p>
            <div className="text-sm text-slate-800">Orders: {data.analytics.ordersThisWeek}</div>
            <div className="text-sm text-slate-800">Revenue: RWF {(data.analytics.revenueThisWeek/100).toLocaleString()}</div>
          </div>
        </div>
      )}

      {tab === 'notes' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <p className="text-sm text-slate-600 mb-2">Sales Notes</p>
          <textarea
            defaultValue={data.salesNotes || ''}
            onBlur={(e) => handleUpdate({ salesNotes: e.target.value })}
            placeholder="Internal notes about this business..."
            className="w-full bg-slate-100 rounded-xl px-3 py-2 text-sm min-h-[160px]"
          />
        </div>
      )}
    </AdminLayout>
  )
}
