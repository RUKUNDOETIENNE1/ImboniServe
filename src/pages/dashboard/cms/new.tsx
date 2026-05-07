import { useState, useRef } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/DashboardLayout'
import { FileText, Image, Video, Tag, Calendar, Save, Upload, X, AlertCircle } from 'lucide-react'

export default function NewPostPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [type, setType] = useState<'MICROBLOG' | 'PHOTO' | 'SHORT_VIDEO' | 'PROMO' | 'COMBO'>('MICROBLOG')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [publishAt, setPublishAt] = useState('')
  const [expireAt, setExpireAt] = useState('')
  const [mediaIds, setMediaIds] = useState<string[]>([])
  const [mediaPreview, setMediaPreview] = useState<{ id: string; url: string; type: string }[]>([])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    try {
      // Client-side validation for videos
      if (type === 'SHORT_VIDEO') {
        if (!file.type.startsWith('video/')) {
          throw new Error('Please select a video file')
        }

        // Validate duration using HTML5 video element
        const duration = await new Promise<number>((resolve, reject) => {
          const video = document.createElement('video')
          video.preload = 'metadata'
          video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src)
            resolve(video.duration)
          }
          video.onerror = () => reject(new Error('Failed to load video'))
          video.src = URL.createObjectURL(file)
        })

        if (duration > 30) {
          throw new Error(`Video too long (${Math.round(duration)}s). Maximum: 30 seconds`)
        }
      } else if (type === 'PHOTO') {
        if (!file.type.startsWith('image/')) {
          throw new Error('Please select an image file')
        }
      }

      // Upload file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type === 'SHORT_VIDEO' ? 'VIDEO' : 'IMAGE')

      const res = await fetch('/api/cms/media/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await res.json()
      const mediaAsset = data.data

      // Add to mediaIds and preview
      setMediaIds([...mediaIds, mediaAsset.id])
      setMediaPreview([...mediaPreview, {
        id: mediaAsset.id,
        url: mediaAsset.publicUrl,
        type: mediaAsset.type
      }])
    } catch (e: any) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeMedia = (id: string) => {
    setMediaIds(mediaIds.filter(mid => mid !== id))
    setMediaPreview(mediaPreview.filter(m => m.id !== id))
  }

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/cms/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title || null,
          body: body || null,
          mediaIds,
          publishAt: publishAt || null,
          expireAt: expireAt || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create post')
      }

      const data = await res.json()
      router.push(`/dashboard/cms/${data.data.id}`)
    } catch (e: any) {
      setError(e.message || 'Failed to create post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-6 h-6 text-imboni-blue" />
          New Post
        </h1>
        <p className="text-sm text-slate-500 mt-1">Create content for your discovery feed</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm border bg-red-50 border-red-200 text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 mb-6">
        <div className="space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Post Type</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { value: 'MICROBLOG', label: 'Microblog', icon: FileText },
                { value: 'PHOTO', label: 'Photo', icon: Image },
                { value: 'SHORT_VIDEO', label: 'Video', icon: Video },
                { value: 'PROMO', label: 'Promotion', icon: Tag },
                { value: 'COMBO', label: 'Combo', icon: Tag },
              ].map((t) => {
                const Icon = t.icon
                return (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value as any)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      type === t.value
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${type === t.value ? 'text-purple-600' : 'text-slate-400'}`} />
                    <div className={`text-sm font-medium ${type === t.value ? 'text-purple-600' : 'text-slate-700'}`}>
                      {t.label}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Content</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your post content..."
              rows={6}
              className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Media Upload */}
          {(type === 'PHOTO' || type === 'SHORT_VIDEO') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {type === 'SHORT_VIDEO' ? 'Upload Video (max 30 seconds)' : 'Upload Photo'}
              </label>
              
              {type === 'SHORT_VIDEO' && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      <strong>Video Requirements:</strong> Maximum 30 seconds, MP4/MOV/WebM format, up to 50MB
                    </div>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept={type === 'SHORT_VIDEO' ? 'video/*' : 'image/*'}
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-slate-300 rounded-xl hover:border-purple-400 hover:bg-purple-50/50 transition-all disabled:opacity-50"
              >
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-600">
                  {uploading ? 'Uploading...' : `Click to upload ${type === 'SHORT_VIDEO' ? 'video' : 'photo'}`}
                </span>
              </button>

              {/* Media Preview */}
              {mediaPreview.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {mediaPreview.map((media) => (
                    <div key={media.id} className="relative group">
                      {media.type === 'VIDEO' ? (
                        <video
                          src={media.url}
                          className="w-full h-32 object-cover rounded-lg"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={media.url}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      )}
                      <button
                        onClick={() => removeMedia(media.id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Publish At (optional)
              </label>
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <p className="text-xs text-slate-500 mt-1">Leave empty to publish immediately after approval</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Expire At (optional)
              </label>
              <input
                type="datetime-local"
                value={expireAt}
                onChange={(e) => setExpireAt(e.target.value)}
                className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <p className="text-xs text-slate-500 mt-1">Leave empty for no expiration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/cms')}
          className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Draft'}
        </button>
      </div>
    </DashboardLayout>
  )
}
