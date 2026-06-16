import { useEffect, useState } from 'react'
import Head from 'next/head'
import type { GetServerSideProps } from 'next'
import DashboardLayout from '@/components/DashboardLayout'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  const roles = (session?.user as any)?.roles || []
  if (!session?.user || !roles.includes('ADMIN')) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }
  return { props: {} }
}

export default function RevenueReport() {
  const [data, setData] = useState<any>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const load = async () => {
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    const res = await fetch(`/api/admin/finance/revenue?${params}`)
    if (res.ok) {
      const d = await res.json()
      setData(d)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const fmt = (n: number, c = 'RWF') => new Intl.NumberFormat('en-RW', { style: 'currency', currency: c, minimumFractionDigits: 0 }).format((n || 0) / 100)

  return (
    <DashboardLayout>
      <Head>
        <title>Revenue Report</title>
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Revenue Report</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Date Range</h2>
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded px-3 py-2" />
            </div>
            <button onClick={load} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Apply</button>
          </div>
        </div>

        {data && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
                <div className="text-2xl font-bold text-green-600">{fmt(data.totalRevenue, data.currency)}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500 mb-1">Subscription Revenue</div>
                <div className="text-2xl font-bold text-blue-600">{fmt(data.subscriptionRevenue, data.currency)}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm text-gray-500 mb-1">Marketplace Revenue</div>
                <div className="text-2xl font-bold text-purple-600">{fmt(data.marketplaceRevenue, data.currency)}</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Revenue by Gateway</h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gateway</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(data.byGateway || {}).map(([gw, amt]: [string, any]) => (
                    <tr key={gw}>
                      <td className="px-4 py-2 text-sm font-semibold">{gw}</td>
                      <td className="px-4 py-2 text-sm text-right">{fmt(amt, data.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Daily Revenue</h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(data.dailyRevenue || {}).sort(([a], [b]) => b.localeCompare(a)).map(([day, amt]: [string, any]) => (
                    <tr key={day}>
                      <td className="px-4 py-2 text-sm">{day}</td>
                      <td className="px-4 py-2 text-sm text-right">{fmt(amt, data.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Revenue by Source</h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(data.bySource || {}).map(([src, amt]: [string, any]) => (
                    <tr key={src}>
                      <td className="px-4 py-2 text-sm font-semibold">{src}</td>
                      <td className="px-4 py-2 text-sm text-right">{fmt(amt, data.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.weeklyRevenue && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Weekly Revenue</h2>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(data.weeklyRevenue || {}).sort(([a], [b]) => b.localeCompare(a)).map(([w, amt]: [string, any]) => (
                      <tr key={w}>
                        <td className="px-4 py-2 text-sm">{w}</td>
                        <td className="px-4 py-2 text-sm text-right">{fmt(amt, data.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data.monthlyRevenue && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(data.monthlyRevenue || {}).sort(([a], [b]) => b.localeCompare(a)).map(([m, amt]: [string, any]) => (
                      <tr key={m}>
                        <td className="px-4 py-2 text-sm">{m}</td>
                        <td className="px-4 py-2 text-sm text-right">{fmt(amt, data.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {data.annualRevenue && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Annual Revenue</h2>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(data.annualRevenue || {}).sort(([a], [b]) => b.localeCompare(a)).map(([y, amt]: [string, any]) => (
                      <tr key={y}>
                        <td className="px-4 py-2 text-sm">{y}</td>
                        <td className="px-4 py-2 text-sm text-right">{fmt(amt, data.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </>
        )}
      </div>
    </DashboardLayout>
  )
}
