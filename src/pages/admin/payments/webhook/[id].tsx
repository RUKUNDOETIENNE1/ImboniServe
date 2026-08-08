import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import type { GetServerSideProps } from 'next'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'

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

export default function WebhookDetail() {
  const router = useRouter()
  const { id } = router.query
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      const res = await fetch(`/api/admin/payments/ops/webhook/${id}`)
      if (res.ok) {
        const d = await res.json()
        setData(d.transaction)
      }
    }
    load()
  }, [id])

  const fmt = (n: number, c = 'RWF') => new Intl.NumberFormat('en-RW', { style: 'currency', currency: c, minimumFractionDigits: 0 }).format((n || 0) / 100)
  const fdt = (d?: string) => (d ? new Date(d).toLocaleString() : '—')

  return (
    <DashboardLayout>
      <Head>
        <title>Webhook Detail</title>
      </Head>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Webhook Detail</h1>
          <Link href="/admin/payments/operations" className="text-blue-600 hover:text-blue-700">← Back</Link>
        </div>

        {data && (
          <>
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Transaction Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Transaction ID</div>
                  <div className="font-semibold break-all">{data.transactionId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Reference</div>
                  <div className="font-semibold break-all">{data.referenceId || '—'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Amount</div>
                  <div className="font-semibold">{fmt(data.amountCents, data.currency)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="font-semibold">{data.status}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Gateway</div>
                  <div className="font-semibold">{data.gateway}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Payment Method</div>
                  <div className="font-semibold">{data.paymentMethod}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="font-semibold">{fdt(data.createdAt)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Paid At</div>
                  <div className="font-semibold">{fdt(data.paidAt)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Webhook Verified</div>
                  <div className="font-semibold">{data.webhookVerified ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Webhook Timestamp</div>
                  <div className="font-semibold">{data.webhookTimestamp ? fdt(new Date(Number(data.webhookTimestamp)).toISOString()) : '—'}</div>
                </div>
              </div>
            </div>

            {data.subscription && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold border-b pb-2 mb-4">Linked Subscription</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Subscription ID</div>
                    <div className="font-semibold">{data.subscription.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Status</div>
                    <div className="font-semibold">{data.subscription.status}</div>
                  </div>
                </div>
              </div>
            )}

            {data.marketplaceOrder && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold border-b pb-2 mb-4">Linked Marketplace Order</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Order Number</div>
                    <div className="font-semibold">{data.marketplaceOrder.orderNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Payment Status</div>
                    <div className="font-semibold">{data.marketplaceOrder.paymentStatus}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Billing Events</h2>
              <ul className="space-y-2">
                {data.billingEvents?.map((e: any) => (
                  <li key={e.id} className="text-sm">
                    <span className="text-gray-500 mr-2">{fdt(e.occurredAt)}</span>
                    <span className="font-semibold mr-2">{e.eventType}</span>
                    <span className="text-gray-700">{e.message || ''}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Raw Webhook Payload</h2>
              <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">{JSON.stringify(data.rawCallback, null, 2)}</pre>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4">Raw Initiation Metadata</h2>
              <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">{JSON.stringify(data.rawStatus, null, 2)}</pre>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
