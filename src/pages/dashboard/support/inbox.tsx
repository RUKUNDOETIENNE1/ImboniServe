import { useEffect, useMemo, useRef, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { MessageSquare, Loader2, Filter, Users, ShieldCheck, ArrowLeft, Send, Paperclip, FileText, Image as ImageIcon, X, Zap } from 'lucide-react'
import { realtimeService } from '@/lib/realtime'

interface SupportConversation {
  id: string
  subject: string | null
  status: 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  createdAt: string
  updatedAt: string
  lastMessageAt: string | null
  createdBy?: { id: string; name: string | null; email: string | null }
  assignedTo?: { id: string; name: string | null; email: string | null } | null
}

interface SupportMessage {
  id: string
  conversationId: string
  body: string
  senderType: 'USER' | 'STAFF'
  senderUserId: string
  createdAt: string
  readAt?: string | null
  attachmentUrl?: string | null
  attachmentMimeType?: string | null
  attachmentSizeBytes?: number | null
}

interface CannedReply {
  id: string
  title: string
  body: string
  shortcut: string | null
}

export default function SupportInboxPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [reply, setReply] = useState('')
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED' | 'ALL'>('OPEN')
  const [assignedFilter, setAssignedFilter] = useState<'all' | 'me'>('all')
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const meId = (session?.user as any)?.id as string | undefined
  const [uploading, setUploading] = useState(false)
  const [attachmentPreview, setAttachmentPreview] = useState<{ url: string; mimeType: string; sizeBytes: number; filename: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cannedReplies, setCannedReplies] = useState<CannedReply[]>([])
  const [showCanned, setShowCanned] = useState(false)
  const businessId = (session?.user as any)?.businessId as string | undefined

  const isStaff = useMemo(() => {
    const roles: string[] = ((session?.user as any)?.roles || []) as string[]
    return roles.includes('ADMIN') || roles.includes('MANAGER')
  }, [session?.user])

  useEffect(() => {
    if (status !== 'authenticated') return
    const convFromQuery = typeof router.query.conv === 'string' ? router.query.conv : null
    if (convFromQuery) setActiveId(convFromQuery)
  }, [status, router.query.conv])

  useEffect(() => {
    if (!isStaff) return
    loadConversations()
    loadCannedReplies()
    if (businessId && process.env.NEXT_PUBLIC_PUSHER_KEY) {
      let unsub: (() => void) | null = null
      realtimeService.subscribe(`private-support-inbox-${businessId}`, 'conversation:new', () => {
        loadConversations()
      }).then(u => { unsub = u })
      realtimeService.subscribe(`private-support-inbox-${businessId}`, 'conversation:update', () => {
        loadConversations()
      }).then((u2) => {
        const prev = unsub
        unsub = () => { prev?.(); u2?.() }
      })
      return () => unsub?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, assignedFilter, isStaff, businessId])

  async function loadConversations() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      params.set('assigned', assignedFilter)
      params.set('limit', '50')
      const res = await fetch(`/api/support/conversations?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load')
      setConversations(data.items || [])
      if (!activeId && data.items?.length) setActiveId(data.items[0].id)
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function loadCannedReplies() {
    try {
      const res = await fetch('/api/support/canned-replies')
      if (res.ok) {
        const data = await res.json()
        setCannedReplies(data.items || [])
      }
    } catch {}
  }

  async function markAsRead() {
    if (!activeId) return
    try {
      await fetch(`/api/support/conversations/${activeId}/mark-read`, { method: 'POST' })
    } catch {}
  }

  useEffect(() => {
    if (!activeId) return
    let mounted = true
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/support/conversations/${activeId}/messages`)
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setMessages(data.items || [])
        scrollToBottom()
      } catch {}
    }
    fetchMessages()
    markAsRead()
    const intv = setInterval(fetchMessages, 4000)
    const channel = `private-support-${activeId}`
    let unsub: (() => void) | null = null
    if (process.env.NEXT_PUBLIC_PUSHER_KEY) {
      realtimeService.subscribe(channel, 'message:new', (msg: any) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        scrollToBottom()
        markAsRead()
      }).then(u => { unsub = u })
      realtimeService.subscribe(channel, 'message:read', () => {
        // Refetch to update readAt indicators
        fetchMessages()
      }).then((u2) => {
        const prev = unsub
        unsub = () => { prev?.(); u2?.() }
      })
    }
    return () => {
      mounted = false
      clearInterval(intv)
      unsub?.()
    }
  }, [activeId])

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      setError(null)
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/support/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setAttachmentPreview({ url: data.url, mimeType: data.mimeType, sizeBytes: data.sizeBytes, filename: data.filename })
    } catch (e: any) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function sendReply() {
    const text = reply.trim()
    if (!activeId || (!text && !attachmentPreview)) return
    setReply('')
    try {
      const res = await fetch(`/api/support/conversations/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: text || '',
          attachmentUrl: attachmentPreview?.url,
          attachmentMimeType: attachmentPreview?.mimeType,
          attachmentSizeBytes: attachmentPreview?.sizeBytes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to send')
      setMessages((prev) => [...prev, data])
      setAttachmentPreview(null)
      scrollToBottom()
    } catch (e: any) {
      setError(e.message || 'Failed to send')
    }
  }

  async function updateConversation(patch: { status?: 'OPEN'|'PENDING'|'RESOLVED'|'CLOSED'; priority?: 'LOW'|'NORMAL'|'HIGH'|'URGENT'; assignTo?: string | null | 'me' }) {
    if (!activeId) return
    try {
      const res = await fetch(`/api/support/conversations/${activeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const updated = await res.json()
      if (!res.ok) throw new Error(updated?.error || 'Failed to update')
      setConversations((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))
    } catch (e: any) {
      setError(e.message || 'Failed to update')
    }
  }

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="p-6 text-slate-600">Loading…</div>
      </DashboardLayout>
    )
  }

  if (!isStaff) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-xl mx-auto p-6 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <ShieldCheck className="w-5 h-5" />
              <h1 className="font-semibold">Support Inbox</h1>
            </div>
            <p className="text-sm text-slate-500 mt-2">You do not have permission to view the staff inbox.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-2 md:p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <MessageSquare className="w-5 h-5" />
            <h1 className="font-semibold">Support Inbox</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2 py-1 rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <Filter className="w-4 h-4 text-slate-500" />
              <select className="bg-transparent text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                <option value="OPEN">Open</option>
                <option value="PENDING">Pending</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="ALL">All</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <Users className="w-4 h-4 text-slate-500" />
              <select className="bg-transparent text-sm" value={assignedFilter} onChange={(e) => setAssignedFilter(e.target.value as any)}>
                <option value="all">All</option>
                <option value="me">Assigned to me</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden flex flex-col min-h-[60vh]">
            <div className="px-3 py-2 border-b border-slate-200 dark:border-gray-700 text-sm font-medium">Conversations</div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-gray-700">
              {loading && <div className="p-3 text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}
              {!loading && conversations.length === 0 && <div className="p-3 text-sm text-slate-500">No conversations</div>}
              <ul>
                {conversations.map((c) => (
                  <li key={c.id} className={`p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800 ${activeId === c.id ? 'bg-slate-50 dark:bg-gray-800' : ''}`} onClick={() => setActiveId(c.id)}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium truncate">{c.subject || 'No subject'}</div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{c.status}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{c.priority}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 truncate">By {c.createdBy?.name || c.createdBy?.email || 'User'} • {new Date(c.updatedAt).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="md:col-span-2 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden min-h-[60vh] flex flex-col">
            {!activeId ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Select a conversation</div>
            ) : (
              <>
                <div className="px-3 py-2 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveId(null)} className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back</button>
                    <div className="text-xs text-slate-500">#{activeId.slice(0, 6)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="px-2 py-1 rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      value={conversations.find(c => c.id === activeId)?.status || 'OPEN'}
                      onChange={(e) => updateConversation({ status: e.target.value as any })}
                    >
                      <option value="OPEN">Open</option>
                      <option value="PENDING">Pending</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    <select
                      className="px-2 py-1 rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      value={conversations.find(c => c.id === activeId)?.priority || 'NORMAL'}
                      onChange={(e) => updateConversation({ priority: e.target.value as any })}
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                    {(() => {
                      const c = conversations.find(x => x.id === activeId)
                      const assignedId = (c as any)?.assignedTo?.id
                      const isMine = assignedId && meId && assignedId === meId
                      return (
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateConversation({ assignTo: 'me' })} className="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            Assign to me
                          </button>
                          {assignedId && (
                            <button onClick={() => updateConversation({ assignTo: null })} className="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                              Unassign
                            </button>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>
                <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-gray-800/50">
                  {messages.map((m) => (
                    <div key={m.id} className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.senderType === 'USER' ? 'bg-white border border-slate-200 self-start' : 'bg-imboni-blue text-white self-end'}`}>
                      {m.body && <div>{m.body}</div>}
                      {m.attachmentUrl && (
                        <div className="mt-2">
                          {m.attachmentMimeType?.startsWith('image/') ? (
                            <img src={m.attachmentUrl} alt="Attachment" className="max-w-full rounded" />
                          ) : (
                            <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 ${m.senderType === 'USER' ? 'text-blue-600 hover:text-blue-800' : 'text-blue-100 hover:text-white'}`}>
                              <FileText className="w-4 h-4" />
                              <span className="text-xs underline">Download attachment</span>
                            </a>
                          )}
                        </div>
                      )}
                      <div className={`mt-1 text-[10px] ${m.senderType === 'USER' ? 'text-slate-400' : 'text-white/80'}`}>
                        {new Date(m.createdAt).toLocaleTimeString()}
                        {m.readAt && <span className="ml-2">✓ Read</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 dark:border-gray-700">
                  {attachmentPreview && (
                    <div className="p-2 flex items-center gap-2 text-xs bg-gray-100 dark:bg-gray-700 border-b border-slate-200 dark:border-gray-600">
                      {attachmentPreview.mimeType.startsWith('image/') ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      <span className="flex-1 truncate">{attachmentPreview.filename}</span>
                      <button onClick={() => setAttachmentPreview(null)} className="text-red-600 hover:text-red-800">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {showCanned && cannedReplies.length > 0 && (
                    <div className="p-2 border-b border-slate-200 dark:border-gray-600 max-h-40 overflow-y-auto">
                      <div className="text-xs font-medium mb-1 flex items-center justify-between">
                        <span>Canned Replies</span>
                        <button onClick={() => setShowCanned(false)} className="text-slate-500 hover:text-slate-700"><X className="w-3 h-3" /></button>
                      </div>
                      {cannedReplies.map((cr) => (
                        <button
                          key={cr.id}
                          onClick={() => { setReply(cr.body); setShowCanned(false); }}
                          className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <div className="font-medium">{cr.title}</div>
                          {cr.shortcut && <div className="text-[10px] text-slate-500">/{cr.shortcut}</div>}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="p-2 flex items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || !!attachmentPreview}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Attach file"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </button>
                    {cannedReplies.length > 0 && (
                      <button
                        onClick={() => setShowCanned(!showCanned)}
                        className="px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        title="Canned replies"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    )}
                    <input
                      className="flex-1 px-3 py-2 rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                      placeholder="Type a reply…"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendReply()
                        }
                      }}
                    />
                    <button onClick={sendReply} disabled={!reply.trim() && !attachmentPreview} className="px-3 py-2 rounded-md bg-imboni-blue text-white text-sm inline-flex items-center gap-1 disabled:opacity-50">
                      <Send className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">{error}</div>
        )}
      </div>
    </DashboardLayout>
  )
}
