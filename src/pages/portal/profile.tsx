import { useState, useEffect, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import PortalLayout from '@/components/portal/PortalLayout'
import { Loader2, AlertCircle, RefreshCw, Save, FileText, Mail, Calendar } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface ProfileData {
  id: string
  name: string
  email: string
  phone: string | null
  partnerType: string
  organization: string | null
  region: string | null
  notes: string | null
  joinedAt: string
  currentAgreement: {
    id: string; status: string; startDate: string | null; endDate: string | null; version: string
  } | null
}

export default function PortalProfile() {
  const { showToast } = useToast()
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', organization: '', region: '' })

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/portal?section=profile')
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setData(json.data)
      if (json.data) {
        setForm({
          name: json.data.name || '',
          phone: json.data.phone || '',
          organization: json.data.organization || '',
          region: json.data.region || '',
        })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/portal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateProfile', ...form }),
      })
      if (!res.ok) {
        const err = await res.json()
        showToast('error', `Failed: ${err.error}`)
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      loadData()
    } catch (err: any) {
      showToast('error', `Failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" aria-hidden="true" />
          <span className="ml-2 text-sm text-slate-500">Loading profile...</span>
        </div>
      </PortalLayout>
    )
  }

  if (error) {
    return (
      <PortalLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" aria-hidden="true" />
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Retry
          </button>
        </div>
      </PortalLayout>
    )
  }

  if (!data) return null

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Profile</h1>
          <p className="text-sm text-slate-500">Manage your organization and contact details.</p>
        </div>

        {/* Profile info */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
              {data.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{data.name}</h3>
              <p className="text-xs text-emerald-600 font-medium">{data.partnerType}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
              <Mail className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <span className="text-sm text-slate-600">{data.email}</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
              <Calendar className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <span className="text-sm text-slate-600">Joined {new Date(data.joinedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Edit Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="text-xs font-medium text-slate-600">Name *</label>
              <input
                id="name" type="text" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="phone" className="text-xs font-medium text-slate-600">Phone</label>
              <input
                id="phone" type="tel" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="organization" className="text-xs font-medium text-slate-600">Organization</label>
              <input
                id="organization" type="text" value={form.organization}
                onChange={(e) => setForm({ ...form, organization: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="region" className="text-xs font-medium text-slate-600">Region</label>
              <input
                id="region" type="text" value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && <span className="text-sm text-emerald-600 font-medium">Saved!</span>}
          </div>
        </form>

        {/* Agreement */}
        {data.currentAgreement && (
          <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-slate-600" aria-hidden="true" />
              <h3 className="font-semibold text-slate-800">Agreement</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500">Status</p>
                <p className="text-sm font-medium text-slate-800">{data.currentAgreement.status}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50">
                <p className="text-xs text-slate-500">Version</p>
                <p className="text-sm font-medium text-slate-800">{data.currentAgreement.version}</p>
              </div>
              {data.currentAgreement.startDate && (
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-500">Start Date</p>
                  <p className="text-sm font-medium text-slate-800">{new Date(data.currentAgreement.startDate).toLocaleDateString()}</p>
                </div>
              )}
              {data.currentAgreement.endDate && (
                <div className="p-3 rounded-lg bg-slate-50">
                  <p className="text-xs text-slate-500">End Date</p>
                  <p className="text-sm font-medium text-slate-800">{new Date(data.currentAgreement.endDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session?.user?.email) return { redirect: { destination: '/login', permanent: false } }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return { redirect: { destination: '/login', permanent: false } }
  const partnership = await prisma.partnership.findUnique({ where: { userId: user.id }, select: { status: true } })
  if (!partnership || ['PROSPECT', 'REJECTED', 'TERMINATED'].includes(partnership.status)) {
    return { redirect: { destination: '/login', permanent: false } }
  }
  return { props: {} }
}
