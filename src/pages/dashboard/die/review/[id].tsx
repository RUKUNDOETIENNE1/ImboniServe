import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import { DocumentStatusBadge, ConfidenceBadge, SeverityBadge, ReconciliationBadge } from '@/components/die/StatusBadge'
import DocumentLifecycle from '@/components/die/DocumentLifecycle'
import DocumentTimeline from '@/components/die/DocumentTimeline'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import {
  ArrowLeft, CheckCircle, XCircle, FileText, Package, Truck,
  AlertTriangle, Link2, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight,
  Save, Loader2
} from 'lucide-react'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

export default function ReviewWorkbench() {
  const router = useRouter()
  const { id } = router.query
  const { success, error: showError } = useToast()

  const [doc, setDoc] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  const [inventoryItems, setInventoryItems] = useState<any[]>([])
  const [lineDraft, setLineDraft] = useState<Record<string, { apply: boolean; productId: string | null; quantity: string; unit: string }>>({})

  const fetchDocument = useCallback(async () => {
    if (!id) return
    try {
      const res = await fetch(`/api/die/documents/${id}`)
      if (res.ok) {
        const json = await res.json()
        setDoc(json.data)

        const items = json.data?.items || []
        const draft: Record<string, { apply: boolean; productId: string | null; quantity: string; unit: string }> = {}
        for (const it of items) {
          draft[it.id] = {
            apply: !!it.productId,
            productId: it.productId || null,
            quantity: String(it.quantity ?? ''),
            unit: String(it.unit ?? ''),
          }
        }
        setLineDraft(draft)
      } else {
        showError('Document not found')
        router.push('/dashboard/die')
      }
    } catch {
      showError('Failed to load document')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchDocument() }, [fetchDocument])

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory?limit=100&page=1')
      if (!res.ok) return
      const json = await res.json()
      setInventoryItems(json.data || [])
    } catch {
    }
  }, [])

  useEffect(() => { fetchInventory() }, [fetchInventory])

  const handleApprove = async () => {
    setActionLoading('approve')
    try {
      const res = await fetch(`/api/die/documents/${id}/approve`, { method: 'POST' })
      if (res.ok) {
        success('Document approved')
        fetchDocument()
      } else {
        const err = await res.json()
        showError(err.error || 'Failed to approve')
      }
    } catch { showError('Failed to approve') }
    finally { setActionLoading('') }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) { showError('Please provide a reason'); return }
    setActionLoading('reject')
    try {
      const res = await fetch(`/api/die/documents/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
      if (res.ok) {
        success('Document rejected')
        setShowRejectModal(false)
        fetchDocument()
      } else {
        const err = await res.json()
        showError(err.error || 'Failed to reject')
      }
    } catch { showError('Failed to reject') }
    finally { setActionLoading('') }
  }

  const handleSaveLineItems = async () => {
    if (!id) return
    setActionLoading('save')
    try {
      const patches = Object.entries(lineDraft)
        .map(([itemId, d]) => ({
          id: itemId,
          productId: d.productId,
          quantity: parseFloat(d.quantity),
          unit: d.unit,
        }))
        .filter((p) => Number.isFinite(p.quantity) && !!p.unit)

      const res = await fetch(`/api/die/documents/${id}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: patches }),
      })

      if (res.ok) {
        success('Changes saved')
        fetchDocument()
      } else {
        const err = await res.json().catch(() => ({}))
        showError(err.error || 'Failed to save changes')
      }
    } catch {
      showError('Failed to save changes')
    } finally {
      setActionLoading('')
    }
  }

  const handleApply = async () => {
    if (!id) return
    setActionLoading('apply')
    try {
      const applyItemIds = Object.entries(lineDraft)
        .filter(([, d]) => d.apply)
        .map(([itemId]) => itemId)

      const doApply = async (confirmOutliers?: boolean) => {
        const res = await fetch(`/api/die/documents/${id}/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ applyItemIds, confirmOutliers }),
        })

        if (res.ok) {
          success('Receipt applied to inventory')
          fetchDocument()
          return
        }

        const err = await res.json().catch(() => ({}))
        if (res.status === 409 && err.error === 'Outlier confirmation required') {
          const ok = window.confirm('Large quantity detected. Apply anyway?')
          if (ok) return void doApply(true)
          return
        }

        showError(err.error || 'Failed to apply')
      }

      await doApply()
    } catch {
      showError('Failed to apply')
    } finally {
      setActionLoading('')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue" />
        </div>
      </DashboardLayout>
    )
  }

  if (!doc) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Document not found</p>
          <Link href="/dashboard/die" className="text-sm text-imboni-blue mt-2 inline-block">Back to Documents</Link>
        </div>
      </DashboardLayout>
    )
  }

  const canApprove = doc.status === 'REVIEW' || doc.status === 'INTELLIGENCE_DONE'
  const canReject = doc.status === 'REVIEW' || doc.status === 'INTELLIGENCE_DONE'
  const canApply = doc.status === 'APPROVED'

  return (
    <DashboardLayout>
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/die" className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {doc.invoiceNumber || 'Document Review'}
            </h1>
            <p className="text-xs text-slate-500">
              {doc.documentType?.replace('_', ' ')} &middot; {new Date(doc.createdAt).toLocaleDateString()}
            </p>
          </div>
          <DocumentStatusBadge status={doc.status} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveLineItems}
            disabled={!!actionLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            {actionLoading === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
          {canApprove && (
            <button
              onClick={handleApprove}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Approve
            </button>
          )}
          {canReject && (
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          )}
          {canApply && (
            <button
              onClick={handleApply}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-imboni-blue text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {actionLoading === 'apply' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              Apply to System
            </button>
          )}
        </div>
      </div>

      {/* Workspace layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-slate-700">Document Preview</h2>
              <div className="flex items-center gap-1">
                <button onClick={() => setZoom(z => Math.max(50, z - 25))} className="p-1.5 hover:bg-slate-100 rounded">
                  <ZoomOut className="w-4 h-4 text-slate-500" />
                </button>
                <span className="text-xs text-slate-500 w-10 text-center">{zoom}%</span>
                <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="p-1.5 hover:bg-slate-100 rounded">
                  <ZoomIn className="w-4 h-4 text-slate-500" />
                </button>
                <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-1.5 hover:bg-slate-100 rounded">
                  <RotateCw className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl min-h-[500px] flex items-center justify-center overflow-hidden">
              {doc.scanJob?.sourceFileKey ? (
                <div
                  style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)`, transition: 'transform 0.2s' }}
                  className="flex items-center justify-center"
                >
                  {doc.scanJob?.sourceMime?.startsWith('image/') ? (
                    <img
                      src={`/api/die/documents/${id}/preview`}
                      alt="Receipt preview"
                      className="max-w-full max-h-[650px] object-contain"
                    />
                  ) : doc.scanJob?.sourceMime === 'application/pdf' ? (
                    <iframe
                      src={`/api/die/documents/${id}/preview`}
                      className="w-full h-[650px]"
                      title="Receipt PDF"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <FileText className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">Unsupported preview type</p>
                      <p className="text-xs text-slate-400 mt-1">{doc.scanJob?.sourceMime}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No preview available</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Header Fields</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Invoice Number" value={doc.invoiceNumber} />
              <Field label="Supplier" value={doc.supplier?.name} />
              <Field label="PO Number" value={doc.purchaseOrderNumber} />
              <Field label="Document Date" value={doc.documentDate ? new Date(doc.documentDate).toLocaleDateString() : null} />
              <Field label="Currency" value={doc.currency} />
              <Field label="Total" value={doc.totalCents ? `${(doc.totalCents / 100).toLocaleString()} ${doc.currency || 'RWF'}` : null} />
              <Field label="Tax" value={doc.taxCents ? `${(doc.taxCents / 100).toLocaleString()} ${doc.currency || 'RWF'}` : null} />
              <Field label="Confidence" value={doc.confidenceOverall ? `${Math.round(doc.confidenceOverall * 100)}%` : null} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Line Items ({doc.items?.length || 0})
            </h2>
            {doc.items?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-2 py-2 font-medium text-slate-500">Apply</th>
                      <th className="text-left px-2 py-2 font-medium text-slate-500">#</th>
                      <th className="text-left px-2 py-2 font-medium text-slate-500">Receipt Item</th>
                      <th className="text-right px-2 py-2 font-medium text-slate-500">Qty</th>
                      <th className="text-left px-2 py-2 font-medium text-slate-500">Unit</th>
                      <th className="text-right px-2 py-2 font-medium text-slate-500">Unit Price</th>
                      <th className="text-right px-2 py-2 font-medium text-slate-500">Total</th>
                      <th className="text-left px-2 py-2 font-medium text-slate-500">Inventory Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doc.items.map((item: any) => {
                      const d = lineDraft[item.id] || { apply: !!item.productId, productId: item.productId || null, quantity: String(item.quantity ?? ''), unit: String(item.unit ?? '') }
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-2 py-2">
                            <input
                              type="checkbox"
                              checked={!!d.apply}
                              onChange={(e) => setLineDraft(prev => ({ ...prev, [item.id]: { ...d, apply: e.target.checked } }))}
                            />
                          </td>
                          <td className="px-2 py-2 text-slate-400">{item.lineNo}</td>
                          <td className="px-2 py-2 text-slate-800 font-medium">{item.productName}</td>
                          <td className="px-2 py-2 text-right text-slate-600">
                            <input
                              value={d.quantity}
                              onChange={(e) => setLineDraft(prev => ({ ...prev, [item.id]: { ...d, quantity: e.target.value } }))}
                              className="w-20 border border-slate-200 rounded px-2 py-1 text-right"
                              inputMode="decimal"
                            />
                          </td>
                          <td className="px-2 py-2 text-slate-600">
                            <input
                              value={d.unit}
                              onChange={(e) => setLineDraft(prev => ({ ...prev, [item.id]: { ...d, unit: e.target.value } }))}
                              className="w-16 border border-slate-200 rounded px-2 py-1"
                            />
                          </td>
                          <td className="px-2 py-2 text-right text-slate-600">{item.unitPriceCents ? (item.unitPriceCents / 100).toLocaleString() : '-'}</td>
                          <td className="px-2 py-2 text-right text-slate-800">{item.totalPriceCents ? (item.totalPriceCents / 100).toLocaleString() : '-'}</td>
                          <td className="px-2 py-2">
                            <select
                              className="w-full text-xs border border-slate-200 rounded px-2 py-1"
                              value={d.productId || ''}
                              onChange={(e) => {
                                const next = e.target.value || null
                                setLineDraft(prev => ({
                                  ...prev,
                                  [item.id]: {
                                    ...d,
                                    productId: next,
                                    apply: next ? true : d.apply,
                                  },
                                }))
                              }}
                            >
                              <option value="">Unmatched</option>
                              {inventoryItems.map((inv: any) => (
                                <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                              ))}
                            </select>
                            {item.inventoryItem ? (
                              <div className="text-[11px] text-green-700 mt-1">Matched: {item.inventoryItem.name}</div>
                            ) : (
                              <div className="text-[11px] text-amber-700 mt-1">Not matched</div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No line items extracted</p>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          <DocumentLifecycle
            status={doc.status}
            lifecycleState={doc.lifecycleState}
            scanJobStatus={doc.scanJob?.status}
            timeline={doc.eventTimelines || []}
            processingLogs={doc.processingLogs || []}
          />

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Reconciliation Summary
              </h2>
              {doc.reconciliation ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="State" value={<ReconciliationBadge state={doc.reconciliation.state} />} />
                  <Field label="Match Type" value={doc.reconciliation.matchType?.replace('_', ' ')} />
                  <Field label="Confidence" value={doc.reconciliation.confidence ? `${Math.round(doc.reconciliation.confidence * 100)}%` : 'N/A'} />
                  <Field label="PO" value={doc.matchedPurchaseOrder?.poNumber} />
                </div>
              ) : (
                <p className="text-xs text-slate-400">No reconciliation record yet</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Anomaly Summary
              </h2>
              {doc.anomalyAlerts?.length > 0 ? (
                <div className="space-y-2">
                  {doc.anomalyAlerts.slice(0, 6).map((alert: any) => (
                    <div key={alert.id} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={alert.severity} />
                        <span className="text-xs text-slate-700">{alert.title || alert.type?.replace('_', ' ')}</span>
                      </div>
                      <ConfidenceBadge score={alert.confidence} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No anomalies detected</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4" /> Entity Link Summary
              </h2>
              {doc.entityLinks?.length > 0 ? (
                <div className="space-y-2">
                  {doc.entityLinks.slice(0, 8).map((link: any) => (
                    <div key={link.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                      <div>
                        <span className="font-medium text-slate-700">{link.entityType}</span>
                        <span className="text-slate-400 ml-2">{link.linkType.replace('_', ' ')}</span>
                      </div>
                      <ConfidenceBadge score={link.confidence} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No entity links recorded</p>
              )}
            </div>
          </div>

          <DocumentTimeline
            timeline={doc.eventTimelines || []}
            processingLogs={doc.processingLogs || []}
            anomalyAlerts={doc.anomalyAlerts || []}
          />
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Reject Document</h3>
            <p className="text-sm text-slate-500 mb-4">Please provide a reason for rejection.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 min-h-[100px]"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!!actionLoading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm text-slate-800 font-medium mt-0.5">{value || <span className="text-slate-300">N/A</span>}</p>
    </div>
  )
}
