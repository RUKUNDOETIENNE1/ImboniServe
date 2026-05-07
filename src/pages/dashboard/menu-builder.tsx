import { useEffect, useState, useRef } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Sparkles, Upload, CheckCircle, XCircle, Clock, FileText, Image as ImageIcon, Plus, ExternalLink } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useFeatureFlag } from '@/hooks/useFeatureFlag'
import { useToast } from '@/components/Toast'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  return { props: {} }
}

export default function MenuBuilderPage() {
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('PENDING')
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [extracting, setExtracting] = useState(false)
  const aiEnabled = useFeatureFlag('ai_menu_builder')

  async function fetchCandidates() {
    setLoading(true)
    try {
      const res = await fetch(`/api/menu-builder/candidates?status=${status}`)
      const data = await res.json()
      setCandidates(data.candidates || [])
    } catch { } finally { setLoading(false) }
  }

  async function handleExtractFromUrl() {
    if (!imageUrl) return
    setExtracting(true)
    try {
      const type = imageUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
      const res = await fetch('/api/menu-builder/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, type })
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Extraction failed')
      }
      showToast('success', 'Extraction started. Review items below.')
      setImageUrl('')
      setTimeout(() => fetchCandidates(), 1500)
    } catch (e: any) {
      showToast('error', e.message || 'Failed to start extraction')
    } finally {
      setExtracting(false)
    }
  }

  useEffect(() => { fetchCandidates() }, [status])

  async function act(candidateId: string, action: 'publish' | 'reject') {
    await fetch('/api/menu-builder/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, candidateId }),
    })
    fetchCandidates()
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      showToast('error', 'Please upload a valid image (JPG, PNG) or PDF file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'File size must be less than 10MB')
      return
    }

    setUploading(true)
    try {
      // Upload API not enabled yet. Guide user to URL flow.
      showToast('error', 'Local upload not yet enabled. Paste a public image/PDF URL and click "Use Image URL".')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      setUploading(false)
    }
  }

  if (!aiEnabled) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* AI Builder Locked */}
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border-2 border-slate-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-imboni-blue/10 mb-4">
              <Sparkles className="w-8 h-8 text-imboni-blue" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">AI Menu Builder (Premium)</h3>
            <p className="text-slate-600 mb-1">🔒 Unlocks at 20 active clients</p>
            <p className="text-sm text-slate-500 mb-4">Upload a menu image or PDF and let AI extract all items automatically</p>
            <div className="mt-4 space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-800 font-medium">Keep serving customers to unlock this feature</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <ImageIcon className="w-5 h-5 text-imboni-blue mb-2" />
                  <p className="text-xs font-medium text-slate-700">Upload Menu Image</p>
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG supported</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <FileText className="w-5 h-5 text-imboni-orange mb-2" />
                  <p className="text-xs font-medium text-slate-700">Upload Menu PDF</p>
                  <p className="text-xs text-slate-500 mt-1">Multi-page PDFs OK</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <Sparkles className="w-5 h-5 text-green-600 mb-2" />
                  <p className="text-xs font-medium text-slate-700">AI Auto-Extract</p>
                  <p className="text-xs text-slate-500 mt-1">Names, prices, categories</p>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Menu Creation - Always Available */}
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl border-2 border-imboni-blue/20 p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-imboni-blue rounded-xl">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Create Menu Manually (Available Now)</h3>
                <p className="text-slate-600 mb-4">Build your menu from scratch. Add items one by one with full control over names, prices, descriptions, and categories.</p>
                <div className="bg-white rounded-lg p-4 mb-4 border border-slate-200">
                  <p className="text-sm text-slate-700 mb-2 font-medium">💡 Quick Start Guide:</p>
                  <ol className="text-sm text-slate-600 space-y-1 list-decimal list-inside">
                    <li>Click "Add New Item" in Menu Management</li>
                    <li>Enter item name, price, and description</li>
                    <li>Select or create a category (e.g., "Appetizers", "Main Course")</li>
                    <li>Save and publish to your menu</li>
                  </ol>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/dashboard/menu"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-imboni-blue text-white rounded-lg hover:bg-imboni-blue/90 transition font-medium shadow-lg shadow-blue-200"
                  >
                    <Plus className="w-4 h-4" />
                    Add Menu Items Now
                  </a>
                  <a
                    href="/dashboard/inventory"
                    className="inline-flex items-center gap-2 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Manage Inventory
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const confidenceColor = (c: number) => c >= 0.8 ? 'text-green-600' : c >= 0.6 ? 'text-amber-600' : 'text-red-500'

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-imboni-orange" /> AI Menu Builder
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Upload menu documents or review AI-extracted items</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-imboni-orange text-white rounded-lg hover:bg-accent-dark transition font-medium disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Menu'}
          </button>
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="Paste image/PDF URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-64 px-3 py-2 border border-slate-300 rounded-lg"
            />
            <button
              onClick={handleExtractFromUrl}
              disabled={!imageUrl || extracting}
              className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              {extracting ? 'Processing…' : 'Use Image URL'}
            </button>
          </div>
          <a
            href="/dashboard/menu"
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Manually
          </a>
        </div>
        <div className="flex gap-1">
          {['PENDING', 'PUBLISHED', 'REJECTED'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${status === s ? 'bg-imboni-blue text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue" /></div>
      ) : candidates.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <Upload className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium mb-2">No {status.toLowerCase()} candidates</p>
          {status === 'PENDING' ? (
            <div className="max-w-md mx-auto">
              <p className="text-sm text-slate-500 mb-4">Upload a menu image or PDF to let AI extract items automatically</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-imboni-blue text-white rounded-lg hover:bg-imboni-blue/90 transition font-medium disabled:opacity-50"
              >
                <Upload className="w-5 h-5" />
                {uploading ? 'Uploading...' : 'Upload Menu Document'}
              </button>
              <p className="text-xs text-slate-400 mt-3">Supported: JPG, PNG, PDF (max 10MB)</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400 mt-1">No {status.toLowerCase()} items found</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Item', 'Category', 'Price (RWF)', 'Confidence', 'Source', status === 'PENDING' ? 'Actions' : 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{c.name}</p>
                    {c.description && <p className="text-xs text-slate-400 truncate max-w-xs">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{c.category || '—'}</td>
                  <td className="px-4 py-3 font-mono">{c.priceCents ? (c.priceCents / 100).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${confidenceColor(c.confidence)}`}>
                      {Math.round(c.confidence * 100)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{c.sourceDocument?.filename || '—'}</td>
                  <td className="px-4 py-3">
                    {status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => act(c.id, 'publish')} className="text-green-600 hover:text-green-800" title="Publish">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button onClick={() => act(c.id, 'reject')} className="text-red-500 hover:text-red-700" title="Reject">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full ${c.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {c.status}
                      </span>
                    )}
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
