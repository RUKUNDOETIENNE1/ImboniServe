import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import { DocumentStatusBadge, ConfidenceBadge } from '@/components/die/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import {
  FileText, Upload, CheckCircle, AlertTriangle, Clock, Search,
  ChevronLeft, ChevronRight, Eye, Filter, X, ScanLine
} from 'lucide-react'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

function StatCard({ title, value, icon: Icon, color, sub }: any) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={`p-2 rounded-xl ${color}`}><Icon className="w-4 h-4" /></div>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function DIEDashboard() {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [stats, setStats] = useState({ processed: 0, review: 0, approved: 0, applied: 0, anomalies: 0 })
  const [filters, setFilters] = useState({ status: '', documentType: '', search: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const limit = 15

  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (filters.status) params.set('status', filters.status)
      if (filters.documentType) params.set('documentType', filters.documentType)
      if (filters.search) params.set('search', filters.search)

      const res = await fetch(`/api/die/documents?${params}`)
      if (res.ok) {
        const json = await res.json()
        setDocuments(json.data || [])
        setTotal(json.meta?.total || 0)
      }
    } catch {
      showError('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      const [rev, app, apd, anom] = await Promise.all([
        fetch('/api/die/documents?status=REVIEW&limit=1').then(r => r.json()),
        fetch('/api/die/documents?status=APPROVED&limit=1').then(r => r.json()),
        fetch('/api/die/documents?status=APPLIED&limit=1').then(r => r.json()),
        fetch('/api/die/anomalies?status=OPEN&limit=1').then(r => r.json()),
      ])
      setStats({
        processed: total,
        review: rev.meta?.total || 0,
        approved: app.meta?.total || 0,
        applied: apd.meta?.total || 0,
        anomalies: anom.meta?.total || 0,
      })
    } catch {}
  }, [total])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])
  useEffect(() => { fetchStats() }, [fetchStats])

  // SSE for real-time updates
  useEffect(() => {
    let es: EventSource | null = null
    try {
      es = new EventSource('/api/die/events/stream')
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          setStats(prev => ({
            ...prev,
            review: data.review || prev.review,
            anomalies: data.anomalies || prev.anomalies,
          }))
        } catch {}
      }
      es.onerror = () => { es?.close() }
    } catch {}
    return () => { es?.close() }
  }, [])

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('documentType', 'SUPPLIER_INVOICE')

        const res = await fetch('/api/die/upload', { method: 'POST', body: formData })
        if (res.ok) {
          success('Document uploaded', file.name)
        } else {
          const err = await res.json()
          showError(err.error || 'Upload failed')
        }
      } catch {
        showError(`Failed to upload ${file.name}`)
      }
    }

    setUploading(false)
    fetchDocuments()
    fetchStats()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files)
  }

  const pages = Math.ceil(total / limit)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ScanLine className="w-6 h-6" /> Document Intelligence
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Upload, process, and review supplier documents</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Total Processed" value={total} icon={FileText} color="bg-blue-100 text-blue-600" />
          <StatCard title="Pending Review" value={stats.review} icon={Clock} color="bg-amber-100 text-amber-600" />
          <StatCard title="Approved" value={stats.approved} icon={CheckCircle} color="bg-green-100 text-green-600" />
          <StatCard title="Applied" value={stats.applied} icon={CheckCircle} color="bg-emerald-100 text-emerald-700" />
          <StatCard title="Open Anomalies" value={stats.anomalies} icon={AlertTriangle} color="bg-red-100 text-red-600" />
        </div>

        {/* Upload Section */}
        <div
          className={`bg-white rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver ? 'border-imboni-blue bg-blue-50' : 'border-slate-300'
          } ${uploading ? 'opacity-60 pointer-events-none' : 'cursor-pointer'}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-imboni-blue' : 'text-slate-400'}`} />
          <p className="text-sm font-medium text-slate-700">
            {uploading ? 'Uploading...' : 'Drag & drop documents here, or click to browse'}
          </p>
          <p className="text-xs text-slate-400 mt-1">PDF, JPEG, PNG up to 25MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>

        {/* Filters + Search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoices, suppliers..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
              value={filters.search}
              onChange={(e) => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1) }}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <Filter className="w-4 h-4" /> Filters
          </button>

          {(filters.status || filters.documentType) && (
            <button
              onClick={() => { setFilters({ status: '', documentType: '', search: filters.search }); setPage(1) }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex gap-4 flex-wrap">
            <select
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
              value={filters.status}
              onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1) }}
            >
              <option value="">All Statuses</option>
              <option value="UPLOADED">Uploaded</option>
              <option value="OCR_PROCESSING">Processing</option>
              <option value="EXTRACTED">Extracted</option>
              <option value="INTELLIGENCE_DONE">Intelligence Done</option>
              <option value="REVIEW">Review</option>
              <option value="APPROVED">Approved</option>
              <option value="APPLIED">Applied</option>
              <option value="FAILED">Failed</option>
            </select>
            <select
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
              value={filters.documentType}
              onChange={(e) => { setFilters(f => ({ ...f, documentType: e.target.value })); setPage(1) }}
            >
              <option value="">All Types</option>
              <option value="SUPPLIER_INVOICE">Supplier Invoice</option>
              <option value="DELIVERY_NOTE">Delivery Note</option>
              <option value="GENERIC">Generic</option>
            </select>
          </div>
        )}

        {/* Documents Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-imboni-blue mx-auto" />
              <p className="text-sm text-slate-400 mt-3">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No documents found</p>
              <p className="text-xs text-slate-400 mt-1">Upload your first document to get started</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Invoice</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Supplier</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Confidence</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-800">{doc.invoiceNumber || 'N/A'}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{doc.documentType?.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-slate-600">{doc.supplier?.name || 'Unknown'}</td>
                        <td className="px-4 py-3"><DocumentStatusBadge status={doc.status} /></td>
                        <td className="px-4 py-3"><ConfidenceBadge score={doc.confidenceScore} /></td>
                        <td className="px-4 py-3 text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/dashboard/die/review/${doc.id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-imboni-blue hover:bg-blue-50 rounded"
                          >
                            <Eye className="w-3 h-3" /> Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-slate-600 px-2">{page}/{pages}</span>
                    <button
                      onClick={() => setPage(p => Math.min(pages, p + 1))}
                      disabled={page === pages}
                      className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                    >
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
