import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import { Trophy, TrendingUp, Users, DollarSign, Award, Gift } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

export default function ReferralsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  useEffect(() => {
    fetchLeaderboard()
  }, [period])

  async function fetchLeaderboard() {
    setLoading(true)
    try {
      const res = await fetch(`/api/referrals/leaderboard?period=${period}&limit=20`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Referral Leaderboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">Top referrers and customer advocates</p>
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">Restaurant Referrals</p>
                <Users className="w-5 h-5 text-imboni-blue" />
              </div>
              <p className="text-3xl font-bold text-slate-800">
                {data?.restaurantReferrals?.totalReferrals || 0}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">Total Earned</p>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-slate-800">
                <CurrencyDisplay amount={(data?.restaurantReferrals?.totalEarned || 0) / 100} />
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">Customer Referrals</p>
                <Gift className="w-5 h-5 text-imboni-orange" />
              </div>
              <p className="text-3xl font-bold text-slate-800">
                {data?.customerReferrals?.totalReferrals || 0}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-600">Rewards Issued</p>
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-slate-800">
                <CurrencyDisplay amount={(data?.customerReferrals?.totalRewards || 0) / 100} />
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Top Restaurant Referrers
              </h2>
              <div className="space-y-3">
                {data?.restaurantReferrals?.leaderboard?.map((affiliate: any, idx: number) => (
                  <div key={affiliate.affiliateId} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                      idx === 1 ? 'bg-slate-200 text-slate-700' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{affiliate.name}</p>
                      <p className="text-xs text-slate-500">{affiliate.affiliateCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{affiliate.referralCount} referrals</p>
                      <p className="text-xs text-green-600">
                        <CurrencyDisplay amount={affiliate.totalEarnedCents / 100} />
                      </p>
                    </div>
                  </div>
                ))}
                {(!data?.restaurantReferrals?.leaderboard || data.restaurantReferrals.leaderboard.length === 0) && (
                  <p className="text-center text-slate-500 py-8">No referrals yet</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-imboni-orange" />
                Customer Referrals
              </h2>
              <div className="space-y-3">
                {data?.customerReferrals?.leaderboard?.map((ref: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{ref.referrerName || ref.referrerPhone}</p>
                      <p className="text-xs text-slate-500">Referred: {ref.businessName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        {new Date(ref.convertedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-bold text-green-600">
                        +<CurrencyDisplay amount={ref.rewardCents / 100} />
                      </p>
                    </div>
                  </div>
                ))}
                {(!data?.customerReferrals?.leaderboard || data.customerReferrals.leaderboard.length === 0) && (
                  <p className="text-center text-slate-500 py-8">No customer referrals yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
