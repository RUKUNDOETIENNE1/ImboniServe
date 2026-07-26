import { useEffect, useState, useRef } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Sparkles, Upload, CheckCircle, XCircle, Clock, FileText, Image as ImageIcon, Plus, ExternalLink } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { useToast } from '@/components/Toast'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
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
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      showToast('error', 'Please upload a valid image (JPG, PNG, WebP) or PDF file')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validate file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      showToast('error', 'File size must be less than 25MB')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    try {
      // Upload file to the server using multipart form data
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/menu-builder/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      // Check if extraction succeeded
      if (data.data?.status === 'FAILED') {
        throw new Error(data.data?.error || 'AI extraction failed. Please try again with a clearer image.')
      }

      const count = data.data?.candidatesCount || 0
      showToast('success', `Upload successful! AI extracted ${count} menu item${count === 1 ? '' : 's'}. Review below.`)

      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''

      // Refresh candidates to show the new ones
      setStatus('PENDING')
      setTimeout(() => fetchCandidates(), 500)
    } catch (err: any) {
      showToast('error', err.message || 'Failed to upload menu')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } finally {
      setUploading(false)
    }
  }

  const confidenceColor = (c: number) => c >= 0.8 ? 'text-green-600' : c >= 0.6 ? 'text-amber-600' : 'text-red-500'

  return (
    <DashboardLayout>
      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-orange" />
            <p className="text-slate-700 font-medium">AI is reading your menu...</p>
            <p className="text-sm text-slate-500">Extracting items, prices, and categories</p>
          </div>
        </div>
      )}
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
            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-imboni-orange text-white rounded-lg hover:bg-accent-dark transition font-medium disabled:opacity-50"
          >
            <Upload className={`w-4 h-4 ${uploading ? 'animate-pulse' : ''}`} />
            {uploading ? 'Processing with AI...' : 'Upload Menu'}
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
                <Upload className={`w-5 h-5 ${uploading ? 'animate-pulse' : ''}`} />
                {uploading ? 'Processing with AI...' : 'Upload Menu Document'}
              </button>
              <p className="text-xs text-slate-400 mt-3">Supported: JPG, PNG, WebP, PDF (max 25MB)</p>
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
