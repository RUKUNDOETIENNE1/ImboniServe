import { useState, useEffect, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import PortalLayout from '@/components/portal/PortalLayout'
import EarningsCard from '@/components/portal/EarningsCard'
import { Loader2, AlertCircle, RefreshCw, Wallet, Clock, CheckCircle, DollarSign } from 'lucide-react'
import DataFreshnessIndicator from '@/components/DataFreshnessIndicator'
import { useCurrency } from '@/contexts/LocaleContext'

interface EarningsData {
  currentMonth: { commissionCents: number; count: number }
  lifetime: { commissionCents: number }
  pending: { commissionCents: number; count: number }
  validated: { commissionCents: number; count: number }
  approved: { commissionCents: number; count: number }
  paid: { commissionCents: number; count: number }
  upcomingPayout: { commissionCents: number; count: number }
  payouts: Array<{
    id: string; amountCents: number; currency: string; method: string; status: string
    createdAt: string; processedAt: string | null; paidAt: string | null
    recipientPhone: string | null; referenceId: string | null
  }>
}

const payoutStatusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-red-100 text-red-600',
  REJECTED: 'bg-red-100 text-red-600',
}

export default function PortalEarnings() {
  const { currency } = useCurrency()
  const formatCurrency = (cents: number): string =>
    new Intl.NumberFormat('en-RW', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100)
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/portal?section=earnings')
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setData(json.data)
      setLastUpdated(new Date())
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
          <span className="ml-2 text-sm text-slate-500">Loading earnings...</span>
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
          <h1 className="text-xl font-bold text-slate-800">My Earnings</h1>
          <p className="text-sm text-slate-500">Transparent breakdown of your commission and payouts.</p>
          <DataFreshnessIndicator lastUpdated={lastUpdated} loading={loading} className="mt-1" />
        </div>

        <EarningsCard
          currentMonthCents={data.currentMonth.commissionCents}
          lifetimeCents={data.lifetime.commissionCents}
          pendingCents={data.pending.commissionCents}
          approvedCents={data.approved.commissionCents}
          paidCents={data.paid.commissionCents}
          upcomingPayoutCents={data.upcomingPayout.commissionCents}
        />

        {/* Commission breakdown */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Commission Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" aria-hidden="true" />
                <span className="text-sm text-slate-700">Pending</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{formatCurrency(data.pending.commissionCents)}</p>
                <p className="text-xs text-slate-400">{data.pending.count} commissions</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span className="text-sm text-slate-700">Validated</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{formatCurrency(data.validated.commissionCents)}</p>
                <p className="text-xs text-slate-400">{data.validated.count} commissions</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span className="text-sm text-slate-700">Approved</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{formatCurrency(data.approved.commissionCents)}</p>
                <p className="text-xs text-slate-400">{data.approved.count} commissions</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-teal-50 border border-teal-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-600" aria-hidden="true" />
                <span className="text-sm text-slate-700">Paid</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{formatCurrency(data.paid.commissionCents)}</p>
                <p className="text-xs text-slate-400">{data.paid.count} commissions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming payout */}
        {data.upcomingPayout.commissionCents > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              <h3 className="font-semibold text-slate-800">Upcoming Payout</h3>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(data.upcomingPayout.commissionCents)}</p>
            <p className="text-xs text-slate-500 mt-1">{data.upcomingPayout.count} approved commissions ready for payout.</p>
          </div>
        )}

        {/* Payment history */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Payment History</h3>
          {data.payouts.length === 0 ? (
            <p className="text-sm text-slate-400">No payouts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-medium text-slate-500 px-3 py-2">Date</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-3 py-2">Amount</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-3 py-2">Method</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payouts.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-3 py-2 text-xs text-slate-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-sm font-medium text-slate-800">{formatCurrency(p.amountCents)}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{p.method}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${payoutStatusColors[p.status] || 'bg-slate-100 text-slate-600'}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
