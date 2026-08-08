import { useState, useEffect, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import PortalLayout from '@/components/portal/PortalLayout'
import PartnerWelcomeCard from '@/components/portal/PartnerWelcomeCard'
import SuccessSnapshot from '@/components/portal/SuccessSnapshot'
import GrowthCoach from '@/components/portal/GrowthCoach'
import MilestoneCard from '@/components/portal/MilestoneCard'
import { Loader2, AlertCircle, RefreshCw, Activity } from 'lucide-react'

interface SnapshotData {
  partner: { name: string; partnerType: string; status: string; region: string | null; organization: string | null; joinedAt: string }
  metrics: {
    activeTrials: number; payingBusinesses: number; totalSignups: number; totalConversions: number
    totalRevenueCents: number; totalCommissionCents: number; totalPayoutsCents: number
    monthCommissionCents: number; prevMonthCommissionCents: number
  }
  trendingCampaign: { id: string; name: string; signups: number; conversions: number } | null
  trialsEndingSoon: number
  recommendations: Array<{ action: string; label: string; priority: 'high' | 'medium' | 'low' }>
  milestones: { achieved: Array<{ key: string; label: string; icon: string }>; next: Array<{ key: string; label: string; progress: number; target: number }> }
  recentActivity: Array<{ id: string; type: string; description: string | null; timestamp: string }>
}

interface Props {
  partnerName: string
}

export default function PortalHome({ partnerName }: Props) {
  const [data, setData] = useState<SnapshotData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/portal?section=snapshot')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to load')
      }
      const json = await res.json()
      setData(json.data)
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
          <span className="ml-2 text-sm text-slate-500">Loading your portal...</span>
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
        <PartnerWelcomeCard
          name={data.partner.name}
          activeTrials={data.metrics.activeTrials}
          payingBusinesses={data.metrics.payingBusinesses}
          monthCommissionCents={data.metrics.monthCommissionCents}
          trendingCampaignName={data.trendingCampaign?.name ?? null}
        />

        <SuccessSnapshot metrics={data.metrics} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GrowthCoach recommendations={data.recommendations} />
          <MilestoneCard achieved={data.milestones.achieved} next={data.milestones.next} />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-slate-600" aria-hidden="true" />
            <h3 className="font-semibold text-slate-800">Recent Activity</h3>
          </div>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400">No recent activity yet.</p>
          ) : (
            <ul className="space-y-2" aria-label="Recent activity">
              {data.recentActivity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{a.description || a.type}</p>
                    <p className="text-xs text-slate-400">{new Date(a.timestamp).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session?.user?.email) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  const partnership = await prisma.partnership.findUnique({
    where: { userId: user.id },
    select: { name: true, status: true },
  })

  if (!partnership || ['PROSPECT', 'REJECTED', 'TERMINATED'].includes(partnership.status)) {
    return { redirect: { destination: '/login', permanent: false } }
  }

  return { props: { partnerName: partnership.name } }
}
