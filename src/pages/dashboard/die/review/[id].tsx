import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import { DocumentStatusBadge, ConfidenceBadge, SeverityBadge, ReconciliationBadge } from '@/components/die/StatusBadge'
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

  const fetchDocument = useCallback(async () => {
    if (!id) return
    try {
      const res = await fetch(`/api/die/documents/${id}`)
      if (res.ok) {
        const json = await res.json()
        setDoc(json.data)
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

  const handleApply = async () => {
    setActionLoading('apply')
    try {
      const res = await fetch(`/api/die/documents/${id}/apply`, { method: 'POST' })
      if (res.ok) {
        success('Document applied to system')
        fetchDocument()
      } else {
        const err = await res.json()
        showError(err.error || 'Failed to apply')
      }
    } catch { showError('Failed to apply') }
    finally { setActionLoading('') }
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

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Document Viewer */}
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
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Document preview</p>
                  <p className="text-xs text-slate-400 mt-1">{doc.scanJob.sourceMime}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No preview available</p>
            )}
          </div>
        </div>

        {/* RIGHT: Extracted Data */}
        <div className="space-y-4">
          {/* Header Fields */}
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

          {/* Line Items */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Line Items ({doc.items?.length || 0})
            </h2>
            {doc.items?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-2 py-2 font-medium text-slate-500">#</th>
                      <th className="text-left px-2 py-2 font-medium text-slate-500">Product</th>
                      <th className="text-right px-2 py-2 font-medium text-slate-500">Qty</th>
                      <th className="text-left px-2 py-2 font-medium text-slate-500">Unit</th>
                      <th className="text-right px-2 py-2 font-medium text-slate-500">Unit Price</th>
                      <th className="text-right px-2 py-2 font-medium text-slate-500">Total</th>
                      <th className="text-left px-2 py-2 font-medium text-slate-500">Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doc.items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-2 py-2 text-slate-400">{item.lineNo}</td>
                        <td className="px-2 py-2 text-slate-800 font-medium">{item.productName}</td>
                        <td className="px-2 py-2 text-right text-slate-600">{item.quantity}</td>
                        <td className="px-2 py-2 text-slate-500">{item.unit}</td>
                        <td className="px-2 py-2 text-right text-slate-600">{item.unitPriceCents ? (item.unitPriceCents / 100).toLocaleString() : '-'}</td>
                        <td className="px-2 py-2 text-right text-slate-800">{item.totalPriceCents ? (item.totalPriceCents / 100).toLocaleString() : '-'}</td>
                        <td className="px-2 py-2">
                          {item.inventoryItem ? (
                            <span className="text-green-600 text-xs">{item.inventoryItem.name}</span>
                          ) : (
                            <span className="text-amber-600 text-xs">Unmatched</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No line items extracted</p>
            )}
          </div>

          {/* Entity Links */}
          {doc.entityLinks?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4" /> Entity Links
              </h2>
              <div className="space-y-2">
                {doc.entityLinks.map((link: any) => (
                  <div key={link.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-medium text-slate-700">{link.entityType}</span>
                      <span className="text-slate-400 ml-2">{link.linkType.replace('_', ' ')}</span>
                    </div>
                    <ConfidenceBadge score={link.confidence} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reconciliation */}
          {doc.reconciliation && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Reconciliation
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Field label="State" value={<ReconciliationBadge state={doc.reconciliation.state} />} />
                <Field label="Match Type" value={doc.reconciliation.matchType?.replace('_', ' ')} />
                <Field label="Confidence" value={doc.reconciliation.confidence ? `${Math.round(doc.reconciliation.confidence * 100)}%` : 'N/A'} />
                <Field label="PO" value={doc.matchedPurchaseOrder?.poNumber} />
              </div>
            </div>
          )}

          {/* Anomalies */}
          {doc.anomalyAlerts?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Anomalies ({doc.anomalyAlerts.length})
              </h2>
              <div className="space-y-2">
                {doc.anomalyAlerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={alert.severity} />
                      <span className="text-xs text-slate-700">{alert.title || alert.type?.replace('_', ' ')}</span>
                    </div>
                    <ConfidenceBadge score={alert.confidence} />
                  </div>
                ))}
              </div>
            </div>
          )}
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
