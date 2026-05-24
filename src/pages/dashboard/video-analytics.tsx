import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Video, Eye, TrendingUp, Clock, ChevronDown } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { useTranslation } from '@/lib/i18n'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

type AnalyticsData = {
  totalViews: number
  uniquePosts: number
  avgWatchSec: number | null
  topVideos: {
    postId: string
    title: string
    status: string
    createdAt: string
    views: number
    avgWatchSec: number
  }[]
  viewsByDay: { date: string; count: number }[]
}

const RANGE_OPTIONS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
]

function fmtSeconds(sec: number | null) {
  if (sec === null || sec === 0) return '—'
  if (sec < 60) return `${sec}s`
  return `${Math.floor(sec / 60)}m ${sec % 60}s`
}

export default function VideoAnalyticsDashboard() {
  const { t } = useTranslation()
  const [days, setDays] = useState(30)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/cms/analytics?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [days])

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Video className="w-6 h-6 text-imboni-orange" />
            Video Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">Performance of your Short Videos on the Imboni feed</p>
        </div>

        {/* Range picker */}
        <div className="relative">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="appearance-none pl-4 pr-10 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-imboni-blue/20 cursor-pointer"
          >
            {RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">Loading…</div>
      ) : !data ? null : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<Eye className="w-5 h-5 text-imboni-blue" />}
              label="Total Views"
              value={data.totalViews.toLocaleString()}
            />
            <StatCard
              icon={<Video className="w-5 h-5 text-imboni-orange" />}
              label="Videos with Views"
              value={data.uniquePosts.toLocaleString()}
            />
            <StatCard
              icon={<Clock className="w-5 h-5 text-green-600" />}
              label="Avg Watch Time"
              value={fmtSeconds(data.avgWatchSec)}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-violet-600" />}
              label="Period"
              value={`Last ${days}d`}
            />
          </div>

          {/* Views over time chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Views Over Time</h2>
            {data.viewsByDay.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
                No views recorded in this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.viewsByDay} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(v) => {
                      const d = new Date(v)
                      return `${d.getDate()}/${d.getMonth() + 1}`
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 13 }}
                    formatter={(v: any) => [`${v} views`, 'Views']}
                    labelFormatter={(l) => new Date(l).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  />
                  <Bar dataKey="count" fill="#3b6cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top videos table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Top Videos</h2>
            {data.topVideos.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No video view data yet. Share your videos to start collecting analytics.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                      <th className="pb-3 font-medium">Video</th>
                      <th className="pb-3 font-medium text-right">Views</th>
                      <th className="pb-3 font-medium text-right">Avg Watch</th>
                      <th className="pb-3 font-medium text-right">Status</th>
                      <th className="pb-3 font-medium text-right">Posted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.topVideos.map((v) => (
                      <tr key={v.postId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 font-medium text-slate-800 max-w-[200px] truncate">
                          {v.title || 'Untitled video'}
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-800">
                          {v.views.toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-slate-600">
                          {fmtSeconds(v.avgWatchSec)}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            v.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="py-3 text-right text-slate-500">
                          {new Date(v.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-xs text-slate-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-slate-800" suppressHydrationWarning>{value}</p>
    </div>
  )
}
