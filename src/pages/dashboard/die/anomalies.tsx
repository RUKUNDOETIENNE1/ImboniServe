import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { SeverityBadge, ConfidenceBadge } from '@/components/die/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import {
  AlertTriangle, Eye, Check, XCircle, CheckCircle, ChevronLeft, ChevronRight, Filter
} from 'lucide-react'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

const TABS = [
  { key: 'OPEN', label: 'Open' },
  { key: 'ACKNOWLEDGED', label: 'Acknowledged' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'DISMISSED', label: 'Dismissed' },
]

export default function AnomalyCenter() {
  const { success, error: showError } = useToast()
  const [tab, setTab] = useState('OPEN')
  const [anomalies, setAnomalies] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [severity, setSeverity] = useState('')
  const [type, setType] = useState('')
  const limit = 20

  const fetchAnomalies = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), status: tab })
      if (severity) params.set('severity', severity)
      if (type) params.set('type', type)

      const res = await fetch(`/api/die/anomalies?${params}`)
      if (res.ok) {
        const json = await res.json()
        setAnomalies(json.data || [])
        setTotal(json.meta?.total || 0)
      }
    } catch { showError('Failed to load anomalies') }
    finally { setLoading(false) }
  }, [page, tab, severity, type])

  useEffect(() => { fetchAnomalies() }, [fetchAnomalies])

  const handleAction = async (id: string, action: 'acknowledge' | 'dismiss' | 'resolve') => {
    try {
      const res = await fetch(`/api/die/anomalies/${id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      if (res.ok) {
        success(`Anomaly ${action}d`)
        fetchAnomalies()
      } else {
        const err = await res.json()
        showError(err.error || `Failed to ${action}`)
      }
    } catch { showError(`Failed to ${action}`) }
  }

  const pages = Math.ceil(total / limit)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" /> Anomaly Center
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor and manage detected anomalies</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1) }}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${tab === t.key ? 'bg-white text-slate-800 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
            value={severity}
            onChange={(e) => { setSeverity(e.target.value); setPage(1) }}
          >
            <option value="">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1) }}
          >
            <option value="">All Types</option>
            <option value="PRICE_SPIKE">Price Spike</option>
            <option value="DUPLICATE_INVOICE">Duplicate Invoice</option>
            <option value="QUANTITY_MISMATCH">Quantity Mismatch</option>
            <option value="AMOUNT_DISCREPANCY">Amount Discrepancy</option>
            <option value="UNMATCHED_SUPPLIER">Unmatched Supplier</option>
            <option value="RECONCILIATION_CONFLICT">Reconciliation Conflict</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-imboni-blue mx-auto" />
            </div>
          ) : anomalies.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No {tab.toLowerCase()} anomalies</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Severity</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Document</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Supplier</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Confidence</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {anomalies.map((a: any) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-slate-700">{a.type?.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="px-4 py-3"><SeverityBadge severity={a.severity} /></td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {a.scannedDocument?.invoiceNumber || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{a.supplier?.name || '-'}</td>
                        <td className="px-4 py-3"><ConfidenceBadge score={a.confidence} /></td>
                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {a.scannedDocumentId && (
                              <Link
                                href={`/dashboard/die/review/${a.scannedDocumentId}`}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                                title="View Document"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            )}
                            {tab === 'OPEN' && (
                              <>
                                <button
                                  onClick={() => handleAction(a.id, 'acknowledge')}
                                  className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                                  title="Acknowledge"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleAction(a.id, 'dismiss')}
                                  className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                                  title="Dismiss"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            {(tab === 'OPEN' || tab === 'ACKNOWLEDGED') && (
                              <button
                                onClick={() => handleAction(a.id, 'resolve')}
                                className="p-1.5 hover:bg-green-50 rounded text-green-600"
                                title="Resolve"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-slate-600 px-2">{page}/{pages}</span>
                    <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-1 rounded hover:bg-slate-100 disabled:opacity-30">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
