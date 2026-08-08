import { useEffect, useState } from 'react'
import Head from 'next/head'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'

export default function MarketplacePayments() {
  const [payments, setPayments] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/marketplace/payments')
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
      }
    }
    load()
  }, [])

  const fmt = (n: number, c = 'RWF') => new Intl.NumberFormat('en-RW', { style: 'currency', currency: c, minimumFractionDigits: 0 }).format((n || 0) / 100)
  const fdt = (d: string) => new Date(d).toLocaleString()

  return (
    <DashboardLayout>
      <Head>
        <title>Marketplace Payments</title>
      </Head>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Marketplace Payments</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.invoiceNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fdt(p.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fmt(p.amountCents, p.currency)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.gateway}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 break-all">
                    <div>Txn: {p.transactionId}</div>
                    {p.referenceId && <div>Ref: {p.referenceId}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                    <Link href={`/store/payment/${p.id}`} className="text-blue-600 hover:text-blue-700">Details</Link>
                    <a href={`/api/marketplace/receipt/${p.id}`} className="text-gray-600 hover:text-gray-800" target="_blank" rel="noopener noreferrer">View</a>
                    <a href={`/api/marketplace/receipt/${p.id}/pdf`} className="text-green-600 hover:text-green-700">Download PDF</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
