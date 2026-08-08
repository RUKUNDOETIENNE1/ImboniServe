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

export default function PaymentsOperations() {
  const [metrics, setMetrics] = useState<any>(null)
  const [webhooks, setWebhooks] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any>({ alerts: [] })

  useEffect(() => {
    const load = async () => {
      const [m, w, e, a] = await Promise.all([
        fetch('/api/admin/payments/ops/metrics').then(r => r.json()),
        fetch('/api/admin/payments/ops/webhooks').then(r => r.json()),
        fetch('/api/admin/payments/ops/events').then(r => r.json()),
        fetch('/api/admin/payments/ops/alerts').then(r => r.json()),
      ])
      setMetrics(m)
      setWebhooks(w.webhooks || [])
      setEvents(e.events || [])
      setAlerts(a)
    }
    load()
  }, [])

  const fmt = (n: number) => new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0 }).format((n || 0) / 100)

  return (
    <DashboardLayout>
      <Head>
        <title>Payments Operations</title>
      </Head>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold">Payments Operations</h1>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm text-gray-500">Sales Revenue</h3>
            <p className="text-2xl font-bold">{fmt(metrics?.revenue?.salesRevenueCents)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm text-gray-500">Marketplace Revenue</h3>
            <p className="text-2xl font-bold">{fmt(metrics?.revenue?.marketplaceRevenueCents)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm text-gray-500">Subscription Revenue</h3>
            <p className="text-2xl font-bold">{fmt(metrics?.revenue?.subscriptionRevenueCents)}</p>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Metrics (24h)</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {Object.entries(metrics?.payments24h?.countsByStatus || {}).map(([k, v]) => (
              <div key={k} className="text-center">
                <p className="text-sm text-gray-500">{k}</p>
                <p className="text-xl font-bold">{v as any}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {Object.entries(metrics?.payments24h?.countsByGateway || {}).map(([k, v]) => (
              <div key={k} className="text-center">
                <p className="text-sm text-gray-500">{k}</p>
                <p className="text-xl font-bold">{v as any}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Provider Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics?.health?.providers?.map((p: any) => (
              <div key={p.provider} className="border rounded p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.provider}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${p.healthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.healthy ? 'Healthy' : 'Degraded'}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Last webhook: {p.lastWebhookAt ? new Date(p.lastWebhookAt).toLocaleString() : 'n/a'}</p>
                <p className="text-sm text-gray-600 mt-1">Failure rate (1h): {(p.failureRate1h * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Alert Center</h2>
          <ul className="space-y-2">
            {alerts.alerts?.length === 0 && <li className="text-gray-500">No active alerts</li>}
            {alerts.alerts?.map((a: any, idx: number) => (
              <li key={idx} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{a.title}</span>
                  <span className={`px-2 py-1 text-xs rounded ${a.severity === 'error' ? 'bg-red-100 text-red-800' : a.severity === 'warn' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{a.severity}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Webhooks</h2>
            <div className="max-h-96 overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refs</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {webhooks.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/admin/payments/webhook/${w.id}`}>
                      <td className="px-4 py-2 text-sm">{new Date(w.updatedAt).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">{w.gateway}</td>
                      <td className="px-4 py-2 text-sm">{w.status}</td>
                      <td className="px-4 py-2 text-xs text-gray-600 break-all">{w.referenceId || w.transactionId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Billing Event Stream</h2>
            <div className="max-h-96 overflow-auto">
              <ul className="space-y-2">
                {events.map((e) => (
                  <li key={e.id} className="text-sm">
                    <span className="text-gray-500 mr-2">{new Date(e.occurredAt).toLocaleString()}</span>
                    <span className="font-semibold mr-2">{e.eventType}</span>
                    <span className="text-gray-700">{e.message || ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
