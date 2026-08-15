import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) return { redirect: { destination: '/login', permanent: false } }
  const roles = (session?.user as any)?.roles || []
  const editorialRoles = (session?.user as any)?.editorialRoles || []
  if (!roles.includes('ADMIN') && editorialRoles.length === 0) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }
  return { props: {} }
}

export default function MediaPage() {
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchMedia() }, [])

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/admin/content/media?page=1&pageSize=24')
      if (res.ok) { const data = await res.json(); setMedia(data.items || []) }
    } catch {} finally { setLoading(false) }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/content/media/upload', { method: 'POST', body: formData })
      if (res.ok) { fetchMedia() } else { const err = await res.json(); setError(err.error) }
    } catch { setError('Upload failed') } finally { setUploading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this media asset?')) return
    await fetch(`/api/admin/content/media/${id}`, { method: 'DELETE' })
    fetchMedia()
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Platform Media Library</h1>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
        <div className="mb-6">
          <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer">
            {uploading ? 'Uploading...' : '+ Upload Media'}
            <input type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : media.length === 0 ? (
          <p className="text-gray-500">No media assets yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {media.map((m) => (
              <div key={m.id} className="bg-white rounded-lg shadow-sm overflow-hidden group">
                <div className="aspect-square bg-gray-100">
                  {m.mimeType?.startsWith('image/') ? (
                    <img src={m.url || `/api/media/${m.id}`} alt={m.altText || m.filename} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">{m.mimeType}</div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-600 truncate">{m.filename}</p>
                  <button onClick={() => handleDelete(m.id)} className="text-xs text-red-500 hover:underline mt-1">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
