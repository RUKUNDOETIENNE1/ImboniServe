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

export default function VendorBalances() {
  const [balances, setBalances] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/admin/finance/vendor-balances')
      if (res.ok) {
        const d = await res.json()
        setBalances(d.balances || [])
      }
    }
    load()
  }, [])

  const fmt = (n: number) => new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format((n || 0) / 100)

  return (
    <DashboardLayout>
      <Head>
        <title>Vendor Balances</title>
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Vendor Settlement Balances</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Balance</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Payout</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {balances.map((b) => (
                <tr key={b.vendorId}>
                  <td className="px-4 py-3 text-sm font-semibold">{b.vendorName}</td>
                  <td className="px-4 py-3 text-sm text-right">{fmt(b.totalSalesCents)}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">-{fmt(b.totalCommissionCents)}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">{fmt(b.netBalanceCents)}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">{fmt(b.pendingPayoutCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>Note:</strong> Vendor settlement and payout processing is a foundation feature. Future enhancements will include payout scheduling, bank account management, and settlement history tracking.
        </div>
      </div>
    </DashboardLayout>
  )
}
