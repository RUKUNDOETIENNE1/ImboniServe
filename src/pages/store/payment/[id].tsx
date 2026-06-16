import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import DashboardLayout from '@/components/DashboardLayout'

export default function PaymentDetails() {
  const router = useRouter()
  const { id } = router.query
  const [payment, setPayment] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const res = await fetch(`/api/marketplace/payment/${id}`)
      if (res.ok) {
        const data = await res.json()
        setPayment(data.payment)
      }
    }
    load()
  }, [id])

  const fmt = (n: number, c = 'RWF') => new Intl.NumberFormat('en-RW', { style: 'currency', currency: c, minimumFractionDigits: 0 }).format((n || 0) / 100)
  const fdt = (d?: string) => (d ? new Date(d).toLocaleString() : '—')

  return (
    <DashboardLayout>
      <Head>
        <title>Payment Details</title>
      </Head>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Payment Details</h1>

        {payment && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Invoice</div>
                <div className="font-semibold">{payment.invoiceNumber}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div className="font-semibold">{payment.status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Amount</div>
                <div className="font-semibold">{fmt(payment.amountCents, payment.currency)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Provider</div>
                <div className="font-semibold">{payment.gateway}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Transaction ID</div>
                <div className="font-semibold break-all">{payment.transactionId}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Reference</div>
                <div className="font-semibold break-all">{payment.referenceId || '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Created</div>
                <div className="font-semibold">{fdt(payment.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Paid At</div>
                <div className="font-semibold">{fdt(payment.paidAt)}</div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Billing Events</h2>
              <ul className="space-y-2">
                {payment.billingEvents?.map((e: any) => (
                  <li key={e.id} className="text-sm">
                    <span className="text-gray-500 mr-2">{new Date(e.occurredAt).toLocaleString()}</span>
                    <span className="font-semibold mr-2">{e.eventType}</span>
                    <span className="text-gray-700">{e.message || ''}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t">
              <a href={`/api/marketplace/receipt/${payment.id}`} target="_blank" rel="noopener noreferrer" className="mr-4 text-gray-700 hover:text-gray-900">View Receipt</a>
              <a href={`/api/marketplace/receipt/${payment.id}/pdf`} className="text-green-600 hover:text-green-700">Download PDF</a>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
