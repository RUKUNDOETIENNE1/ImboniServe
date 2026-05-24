import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { AlertTriangle, CheckCircle, RefreshCw, Play } from 'lucide-react'
import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  const roles: string[] = (session?.user as any)?.roles || []
  if (!session?.user || !roles.includes('ADMIN')) return { redirect: { destination: '/dashboard', permanent: false } }
  return { props: {} }
}

export default function ReconciliationPage() {
  const [mismatches, setMismatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')

  async function fetchMismatches() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reconciliation')
      const data = await res.json()
      setMismatches(data.mismatches || [])
    } catch { } finally { setLoading(false) }
  }

  useEffect(() => { fetchMismatches() }, [])

  async function runReconciliation() {
    setRunning(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run' }),
      })
      const data = await res.json()
      setMessage(`Reconciliation complete: ${data.checked} checked, ${data.mismatches} mismatches`)
      fetchMismatches()
    } catch { setMessage('Error running reconciliation') } finally { setRunning(false) }
  }

  async function resolveLog(logId: string) {
    await fetch('/api/admin/reconciliation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolve', logId }),
    })
    fetchMismatches()
  }

  const statusColors: Record<string, string> = {
    STILL_PENDING: 'bg-amber-100 text-amber-700',
    EXPIRED: 'bg-red-100 text-red-700',
    AMOUNT_MISMATCH: 'bg-red-100 text-red-700',
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" /> Payment Reconciliation
          </h1>
          <p className="text-sm text-slate-500 mt-1">Review and resolve payment mismatches</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchMismatches} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={runReconciliation}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {running ? 'Running...' : 'Run Now'}
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">{message}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900" /></div>
      ) : mismatches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No unresolved mismatches</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Transaction', 'Invoice', 'Status', 'Expected', 'Notes', 'Created', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mismatches.map(m => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{m.transactionId?.slice(-8) || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{m.invoiceNumber || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[m.status] || 'bg-slate-100 text-slate-600'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{m.expectedAmountCents ? `${(m.expectedAmountCents / 100).toLocaleString()} RWF` : '—'}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{m.notes}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => resolveLog(m.id)}
                      className="text-xs text-green-600 hover:text-green-800 font-medium"
                    >
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}
