import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { ReconciliationBadge, ConfidenceBadge } from '@/components/die/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import dynamic from 'next/dynamic'
import { Truck, ChevronLeft, ChevronRight, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

const ReconciliationChart = dynamic<{ data: { name: string; value: number }[] }>(
  () => import('@/components/die/ReconciliationChart'),
  { ssr: false }
)

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

function MetricCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={`p-2 rounded-xl ${color}`}><Icon className="w-4 h-4" /></div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  )
}

export default function ReconciliationDashboard() {
  const { error: showError } = useToast()
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState('')
  const [matchType, setMatchType] = useState('')
  const [metrics, setMetrics] = useState({ matched: 0, unmatched: 0, conflict: 0, avgConfidence: 0 })
  const limit = 20

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (state) params.set('state', state)
      if (matchType) params.set('matchType', matchType)

      const res = await fetch(`/api/die/reconciliation?${params}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data || [])
        setTotal(json.meta?.total || 0)
      }
    } catch { showError('Failed to load reconciliations') }
    finally { setLoading(false) }
  }, [page, state, matchType])

  const fetchMetrics = useCallback(async () => {
    try {
      const [mpo, mgrn, unm, conf] = await Promise.all([
        fetch('/api/die/reconciliation?state=MATCHED_PO&limit=1').then(r => r.json()),
        fetch('/api/die/reconciliation?state=MATCHED_GRN&limit=1').then(r => r.json()),
        fetch('/api/die/reconciliation?state=UNMATCHED&limit=1').then(r => r.json()),
        fetch('/api/die/reconciliation?state=CONFLICT&limit=1').then(r => r.json()),
      ])
      const matched = (mpo.meta?.total || 0) + (mgrn.meta?.total || 0)
      const unmatched = unm.meta?.total || 0
      const conflict = conf.meta?.total || 0
      const totalRecs = matched + unmatched + conflict
      setMetrics({
        matched,
        unmatched,
        conflict,
        avgConfidence: totalRecs > 0 ? Math.round((matched / totalRecs) * 100) : 0,
      })
    } catch {}
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { fetchMetrics() }, [fetchMetrics])

  const pages = Math.ceil(total / limit)

  const chartData = [
    { name: 'Matched PO', value: metrics.matched },
    { name: 'Unmatched', value: metrics.unmatched },
    { name: 'Conflict', value: metrics.conflict },
  ].filter(d => d.value > 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-6 h-6" /> Procurement Reconciliation
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Document-to-PO/GRN matching results</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="Matched" value={metrics.matched} icon={CheckCircle} color="bg-green-100 text-green-600" />
          <MetricCard title="Unmatched" value={metrics.unmatched} icon={XCircle} color="bg-slate-100 text-slate-600" />
          <MetricCard title="Conflicts" value={metrics.conflict} icon={AlertTriangle} color="bg-red-100 text-red-600" />
          <MetricCard title="Auto-Match Rate" value={`${metrics.avgConfidence}%`} icon={TrendingUp} color="bg-blue-100 text-blue-600" />
        </div>

        {/* Chart + Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Match Distribution</h2>
              <div className="h-48">
                <ReconciliationChart data={chartData} />
              </div>
            </div>
          )}

          {/* Table */}
          <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${chartData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="flex items-center gap-3 p-4 border-b border-slate-100">
              <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5" value={state} onChange={(e) => { setState(e.target.value); setPage(1) }}>
                <option value="">All States</option>
                <option value="MATCHED_PO">Matched PO</option>
                <option value="MATCHED_GRN">Matched GRN</option>
                <option value="UNMATCHED">Unmatched</option>
                <option value="CONFLICT">Conflict</option>
              </select>
              <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5" value={matchType} onChange={(e) => { setMatchType(e.target.value); setPage(1) }}>
                <option value="">All Match Types</option>
                <option value="EXACT_PO">Exact PO</option>
                <option value="FUZZY_PO">Fuzzy PO</option>
                <option value="GRN_MATCH">GRN Match</option>
                <option value="NO_MATCH">No Match</option>
                <option value="CONFLICT">Conflict</option>
              </select>
            </div>

            {loading ? (
              <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-imboni-blue mx-auto" /></div>
            ) : data.length === 0 ? (
              <div className="p-12 text-center">
                <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No reconciliation records</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Document</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Supplier</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Match Type</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">State</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Confidence</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.map((r: any) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <Link href={`/dashboard/die/review/${r.scannedDocumentId}`} className="text-xs font-medium text-imboni-blue hover:underline">
                              {r.scannedDocument?.invoiceNumber || r.scannedDocumentId?.slice(0, 8)}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">{r.scannedDocument?.supplier?.name || '-'}</td>
                          <td className="px-4 py-3 text-xs text-slate-600">{r.matchType?.replace(/_/g, ' ')}</td>
                          <td className="px-4 py-3"><ReconciliationBadge state={r.state} /></td>
                          <td className="px-4 py-3"><ConfidenceBadge score={r.confidence} /></td>
                          <td className="px-4 py-3 text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                    <p className="text-xs text-slate-500">Page {page}/{pages}</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
