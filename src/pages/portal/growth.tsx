import { useState, useEffect, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import PortalLayout from '@/components/portal/PortalLayout'
import OpportunityCard from '@/components/portal/OpportunityCard'
import { Loader2, AlertCircle, RefreshCw, TrendingUp, TrendingDown, Users, Target, DollarSign } from 'lucide-react'

interface GrowthData {
  currentMonth: { signups: number; conversions: number; commissionCents: number }
  previousMonth: { signups: number; conversions: number; commissionCents: number }
  conversionRate: number
  monthlyTrend: Array<{ month: string; signups: number; conversions: number; commissionCents: number }>
  opportunities: Array<{ type: string; label: string; action: string }>
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', maximumFractionDigits: 0 }).format(cents / 100)
}

export default function PortalGrowth() {
  const [data, setData] = useState<GrowthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/portal?section=growth')
      if (!res.ok) throw new Error('Failed to load')
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
          <span className="ml-2 text-sm text-slate-500">Loading growth data...</span>
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

  const signupChange = data.currentMonth.signups - data.previousMonth.signups
  const convChange = data.currentMonth.conversions - data.previousMonth.conversions
  const commissionChange = data.currentMonth.commissionCents - data.previousMonth.commissionCents

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">My Growth</h1>
          <p className="text-sm text-slate-500">Track your performance and find ways to grow.</p>
        </div>

        {/* Month-over-month comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-500" aria-hidden="true" />
              <span className="text-xs text-slate-500">Signups</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{data.currentMonth.signups}</p>
            <div className="flex items-center gap-1 text-xs mt-1">
              {signupChange >= 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" aria-hidden="true" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" aria-hidden="true" />
              )}
              <span className={signupChange >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                {signupChange >= 0 ? '+' : ''}{signupChange} vs last month
              </span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-500" aria-hidden="true" />
              <span className="text-xs text-slate-500">Conversions</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{data.currentMonth.conversions}</p>
            <div className="flex items-center gap-1 text-xs mt-1">
              {convChange >= 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" aria-hidden="true" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" aria-hidden="true" />
              )}
              <span className={convChange >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                {convChange >= 0 ? '+' : ''}{convChange} vs last month
              </span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-amber-500" aria-hidden="true" />
              <span className="text-xs text-slate-500">Commission</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(data.currentMonth.commissionCents)}</p>
            <div className="flex items-center gap-1 text-xs mt-1">
              {commissionChange >= 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" aria-hidden="true" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" aria-hidden="true" />
              )}
              <span className={commissionChange >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                {commissionChange >= 0 ? '+' : ''}{formatCurrency(Math.abs(commissionChange))} vs last month
              </span>
            </div>
          </div>
        </div>

        {/* Conversion rate */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-2">Conversion Rate</h3>
          <p className="text-3xl font-bold text-emerald-600">{data.conversionRate.toFixed(1)}%</p>
          <p className="text-sm text-slate-500 mt-1">
            {data.conversionRate >= 30 ? 'Great conversion rate! Keep it up.' : 'There\'s room to improve your conversion rate.'}
          </p>
        </div>

        {/* Monthly trend chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">6-Month Trend</h3>
          <div className="space-y-3" aria-label="Monthly trend">
            {data.monthlyTrend.map((m, idx) => {
              const maxSignups = Math.max(...data.monthlyTrend.map((t) => t.signups), 1)
              const pct = (m.signups / maxSignups) * 100
              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-500 w-10">{m.month}</span>
                  <div className="flex-1 h-6 bg-slate-50 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    >
                      <span className="text-xs text-white font-medium">{m.signups}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 w-20 text-right">{formatCurrency(m.commissionCents)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Growth opportunities */}
        {data.opportunities.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Growth Opportunities</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {data.opportunities.map((opp, idx) => (
                <OpportunityCard key={idx} opportunity={opp} />
              ))}
            </div>
          </div>
        )}
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
  if (!user) return { redirect: { destination: '/login', permanent: false } }
  const partnership = await prisma.partnership.findUnique({ where: { userId: user.id }, select: { status: true } })
  if (!partnership || ['PROSPECT', 'REJECTED', 'TERMINATED'].includes(partnership.status)) {
    return { redirect: { destination: '/login', permanent: false } }
  }
  return { props: {} }
}
