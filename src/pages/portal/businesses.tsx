import { useState, useEffect, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import PortalLayout from '@/components/portal/PortalLayout'
import { Loader2, AlertCircle, RefreshCw, Building2, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react'

interface BusinessData {
  id: string
  createdAt: string
  trialDaysGranted: number
  code: { code: string; campaign: { id: string; name: string } | null } | null
  business: {
    id: string
    name: string
    city: string | null
    businessType: string | null
    isActive: boolean
    trialStartDate: string | null
    trialEndDate: string | null
    approvalStatus: string
    createdAt: string
    hasSubscription: boolean
  }
  source: string
}

function getStatusBadge(b: BusinessData['business']) {
  const now = new Date()
  if (b.approvalStatus === 'REJECTED') return { label: 'Rejected', color: 'bg-red-100 text-red-600', icon: XCircle }
  if (b.hasSubscription) return { label: 'Subscribed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle }
  if (b.trialEndDate && new Date(b.trialEndDate) > now) return { label: 'On Trial', color: 'bg-amber-100 text-amber-700', icon: Clock }
  if (!b.isActive) return { label: 'Inactive', color: 'bg-slate-100 text-slate-600', icon: XCircle }
  return { label: 'Active', color: 'bg-blue-100 text-blue-700', icon: CheckCircle }
}

export default function PortalBusinesses() {
  const [businesses, setBusinesses] = useState<BusinessData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/portal?section=businesses')
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setBusinesses(json.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" aria-hidden="true" />
          <span className="ml-2 text-sm text-slate-500">Loading businesses...</span>
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

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">My Businesses</h1>
          <p className="text-sm text-slate-500">Businesses you&apos;ve referred to ImboniServe.</p>
        </div>

        {businesses.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-slate-200/60 shadow-sm text-center">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-slate-500">No businesses yet. Share your Founder Code to start acquiring restaurants.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Business</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Joined</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Code</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Subscription</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((b) => {
                    const status = getStatusBadge(b.business)
                    const StatusIcon = status.icon
                    return (
                      <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{b.business.name}</p>
                            {b.business.city && <p className="text-xs text-slate-400">{b.business.city}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            {new Date(b.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                            <StatusIcon className="w-3 h-3" aria-hidden="true" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {b.code ? (
                            <span className="text-xs font-mono text-slate-600">{b.code.code}</span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {b.business.hasSubscription ? (
                            <span className="text-xs text-emerald-600 font-medium">Active</span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
