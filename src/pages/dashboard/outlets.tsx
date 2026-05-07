import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Store, Plus, MapPin, TrendingUp, DollarSign, Users, QrCode } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

const OUTLET_ICONS: Record<string, string> = {
  RESTAURANT: '🍽️',
  BAR: '🍺',
  POOL_BAR: '🏊',
  CAFE: '☕',
  ROOM_SERVICE: '🛎️',
  LOUNGE: '🛋️',
  SPA: '💆',
  TERRACE: '🌿',
  BEACH_BAR: '🏖️'
}

const OUTLET_TYPES = [
  'RESTAURANT','BAR','POOL_BAR','CAFE','ROOM_SERVICE','LOUNGE','SPA','TERRACE','BEACH_BAR'
] as const
type OutletTypeKey = typeof OUTLET_TYPES[number]

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'RESTAURANT' as OutletTypeKey,
    description: '',
    address: '',
    city: '',
    phone: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchOutlets()
  }, [])

  async function fetchOutlets() {
    setLoading(true)
    try {
      const res = await fetch('/api/outlets')
      if (res.ok) {
        const data = await res.json()
        setOutlets(data.outlets || [])
      }
    } catch (error) {
      console.error('Failed to fetch outlets:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createOutlet() {
    if (!form.name.trim() || !form.type) {
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/outlets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (res.ok) {
        setShowForm(false)
        setForm({
          name: '',
          type: 'RESTAURANT',
          description: '',
          address: '',
          city: '',
          phone: ''
        })
        fetchOutlets()
      }
    } catch (error) {
      console.error('Failed to create outlet:', error)
    } finally {
      setSaving(false)
    }
  }

  const totalRevenue = outlets.reduce((sum, o) => sum + o.todayRevenueCents, 0)
  const totalTables = outlets.reduce((sum, o) => sum + o.tablesCount, 0)
  const activeOrders = outlets.reduce((sum, o) => sum + o.activeSalesCount, 0)

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Store className="w-6 h-6" /> Venue Outlets
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage multiple outlets within your venue</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-imboni-orange to-orange-500 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-200 flex items-center transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Outlet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-600">Total Outlets</p>
            <Store className="w-5 h-5 text-imboni-blue" />
          </div>
          <p className="text-3xl font-bold text-slate-800">{outlets.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-600">Total Tables</p>
            <Users className="w-5 h-5 text-imboni-green" />
          </div>
          <p className="text-3xl font-bold text-slate-800">{totalTables}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-600">Active Orders</p>
            <TrendingUp className="w-5 h-5 text-imboni-orange" />
          </div>
          <p className="text-3xl font-bold text-slate-800">{activeOrders}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-600">Today Revenue</p>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-slate-800">
            RWF {(totalRevenue / 100).toLocaleString()}
          </p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Add New Outlet</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Outlet Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                placeholder="e.g., Main Restaurant, Pool Bar"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as OutletTypeKey })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
              >
                {OUTLET_TYPES.map(type => (
                  <option key={type} value={type}>
                    {OUTLET_ICONS[type]} {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                rows={2}
                placeholder="Brief description of this outlet"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
                placeholder="+250..."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={createOutlet}
              disabled={saving || !form.name.trim()}
              className="bg-gradient-to-r from-imboni-green to-green-600 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-green-200 flex items-center transition-all disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Outlet'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {outlets.map((outlet) => (
            <div key={outlet.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{OUTLET_ICONS[outlet.type] || '🏪'}</div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{outlet.name}</h3>
                    <p className="text-xs text-slate-500">{outlet.type.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <QrCode className="w-5 h-5 text-imboni-blue" />
                </button>
              </div>

              {outlet.description && (
                <p className="text-sm text-slate-600 mb-4">{outlet.description}</p>
              )}

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <p className="text-xs text-slate-500">Tables</p>
                  <p className="text-lg font-bold text-slate-800">{outlet.tablesCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Active</p>
                  <p className="text-lg font-bold text-imboni-orange">{outlet.activeSalesCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Today</p>
                  <p className="text-lg font-bold text-green-600">
                    {(outlet.todayRevenueCents / 100).toFixed(0)}K
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-imboni-blue/10 text-imboni-blue rounded-lg text-sm font-medium hover:bg-imboni-blue/20 transition-colors">
                  Manage
                </button>
                <button className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                  View QR
                </button>
              </div>
            </div>
          ))}

          {outlets.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
              <Store className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium mb-2">No outlets yet</p>
              <p className="text-sm text-slate-500 mb-4">
                Create outlets to organize your venue (restaurant, bar, pool, etc.)
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-imboni-orange to-orange-500 text-white px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-200 inline-flex items-center transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Outlet
              </button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
