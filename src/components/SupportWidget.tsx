import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { MessageSquare, X, Send, PlusCircle, Loader2, ArrowLeft, Paperclip, FileText, Image as ImageIcon } from 'lucide-react'
import { realtimeService } from '@/lib/realtime'

interface SupportConversation {
  id: string
  subject: string | null
  status: 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  createdAt: string
  updatedAt: string
  lastMessageAt: string | null
  unreadCount: number
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

export default function SupportWidget() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('support-widget-dismissed', 'true')
  }

  const handleRestore = () => {
    setDismissed(false)
    localStorage.removeItem('support-widget-dismissed')
  }
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [newSubject, setNewSubject] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'new' | 'chat'>('list')
  const [uploading, setUploading] = useState(false)
  const [attachmentPreview, setAttachmentPreview] = useState<{ url: string; mimeType: string; sizeBytes: number; filename: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const isAuthenticated = useMemo(() => status === 'authenticated' && !!session?.user, [status, session])

  useEffect(() => {
    setIsMounted(true)
    setDismissed(localStorage.getItem('support-widget-dismissed') === 'true')
  }, [])

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight
      }
    })
  }

  useEffect(() => {
    if (!open || !isAuthenticated) return
    loadConversations()
  }, [open, isAuthenticated])

  useEffect(() => {
    if (!open || !activeId) return
    let mounted = true
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/support/conversations/${activeId}/messages`)
        if (!res.ok) return
        const data = await res.json()
        if (mounted) {
          setMessages(data.items || [])
          scrollToBottom()
        }
      } catch {}
    }
    fetchMessages()
    // mark visible messages as read for this user
    fetch(`/api/support/conversations/${activeId}/mark-read`, { method: 'POST' }).catch(() => {})
    const intv = setInterval(fetchMessages, 5000)
    let unsub: (() => void) | null = null
    if (process.env.NEXT_PUBLIC_PUSHER_KEY) {
      const channel = `private-support-${activeId}`
      realtimeService.subscribe(channel, 'message:new', (msg: any) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        scrollToBottom()
      }).then(u => { unsub = u })
      realtimeService.subscribe(channel, 'message:read', () => {
        // refetch to get updated readAt values
        fetchMessages()
      }).then((u2) => {
        const prevUnsub = unsub
        unsub = () => { prevUnsub?.(); u2?.() }
      })
    }
    return () => {
      mounted = false
      clearInterval(intv)
      unsub?.()
    }
  }, [open, activeId])

  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = (document.activeElement as HTMLElement) || null
      setTimeout(() => dialogRef.current?.focus(), 0)
    } else {
      previouslyFocusedRef.current?.focus?.()
    }
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      return
    }
    if (e.key !== 'Tab') return
    const container = dialogRef.current
    if (!container) return
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])')
    ).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'))
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  async function loadConversations() {
    try {
      setLoading(true)
      const res = await fetch('/api/support/conversations?status=OPEN&limit=10')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setConversations(data.items || [])
      if (!activeId && data.items?.length) setActiveId(data.items[0].id)
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!newMessage.trim()) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/support/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: newSubject || undefined, message: newMessage }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to create')
      setConversations((prev) => [data, ...prev])
      setActiveId(data.id)
      setNewMessage('')
      setNewSubject('')
    } catch (e: any) {
      setError(e.message || 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  async function handleSend() {
    if (!activeId || !newMessage.trim()) return
    const text = newMessage
    setNewMessage('')
    try {
      const res = await fetch(`/api/support/conversations/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to send')
      setMessages((prev) => [...prev, data])
      scrollToBottom()
    } catch (e: any) {
      setError(e.message || 'Failed to send')
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      setError('')
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

  async function sendMessage() {
    if ((!newMessage.trim() && !attachmentPreview) || !activeId) return
    try {
      const res = await fetch(`/api/support/conversations/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: newMessage || '',
          attachmentUrl: attachmentPreview?.url,
          attachmentMimeType: attachmentPreview?.mimeType,
          attachmentSizeBytes: attachmentPreview?.sizeBytes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error('Failed to send')
      setMessages((prev) => [...prev, data])
      setNewMessage('')
      setAttachmentPreview(null)
      scrollToBottom()
    } catch (e: any) {
      setError(e.message || 'Failed to send message')
    }
  }

  function Header() {
    return (
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-imboni-blue" />
          <span id="support-title" className="text-sm font-semibold">Support</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleDismiss} className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded" title="Hide support widget">
            <X className="w-4 h-4" />
          </button>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-gray-700 rounded" aria-label="Close support chat">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  function TicketList() {
    return (
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        )}
        {!loading && conversations.length === 0 && (
          <div className="p-4 text-sm text-slate-500">No open tickets. Create one below.</div>
        )}
        <ul className="divide-y divide-slate-200 dark:divide-gray-700">
          {conversations.map((c) => (
            <li
              key={c.id}
              className={`p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800 ${activeId === c.id ? 'bg-slate-50 dark:bg-gray-800' : ''}`}
              onClick={() => setActiveId(c.id)}
              role="button"
              tabIndex={0}
              aria-current={activeId === c.id}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveId(c.id)
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{c.subject || 'No subject'}</div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{c.status}</span>
                {c.unreadCount > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">{c.unreadCount}</span>}
              </div>
              <div className="text-xs text-slate-500 mt-1">Updated {new Date(c.updatedAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  function MessagesView() {
    return (
      <div className="flex-1 flex flex-col">
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-3 pt-5 pb-3 space-y-3 bg-slate-50 dark:bg-gray-800/50"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Conversation messages"
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.senderType === 'USER' ? 'bg-white border border-slate-200 self-start' : 'bg-imboni-blue text-white self-end'}`}> 
              <div>{msg.body}</div>
              {msg.attachmentUrl && (
                <div className="mt-2">
                  {msg.attachmentMimeType?.startsWith('image/') ? (
                    <img src={msg.attachmentUrl} alt="Image attachment" className="max-w-full rounded" />
                  ) : (
                    <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 ${msg.senderType === 'USER' ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'}`} aria-label="Download attachment">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs underline">Download attachment</span>
                    </a>
                  )}
                </div>
              )}
              <div className={`mt-1 text-[10px] ${msg.senderType === 'USER' ? 'text-slate-400' : 'text-white/80'}`}>
                {new Date(msg.createdAt).toLocaleTimeString()}
                {msg.senderType === 'USER' && msg.readAt && <span className="ml-2">✓ Read</span>}
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
          <div className="p-2 flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
              id="support-file-input"
              aria-hidden="true"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !!attachmentPreview}
              className="px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-controls="support-file-input"
              aria-label="Attach file"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            </button>
            <input
              className="flex-1 px-3 py-2 rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              placeholder="Type a message…"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              aria-label="Message input"
            />
            <button onClick={sendMessage} disabled={!newMessage.trim() && !attachmentPreview} aria-disabled={!newMessage.trim() && !attachmentPreview} aria-label="Send message" className="px-3 py-2 rounded-md bg-imboni-blue text-white text-sm flex items-center gap-1 disabled:opacity-50">
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    )
  }

  function NewTicketForm() {
    const showBack = conversations.length > 0
    return (
      <div className="p-3 space-y-2">
        {showBack && (
          <button onClick={() => setActiveId(conversations[0]?.id || null)} className="mb-2 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-3 h-3" /> Back to ticket
          </button>
        )}
        <input
          className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          placeholder="Subject (optional)"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          aria-label="Subject"
        />
        <textarea
          className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm min-h-[100px]"
          placeholder="Describe your issue or question…"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          aria-label="Message"
        />
        <button disabled={creating || !newMessage.trim()} onClick={handleCreate} className="w-full px-3 py-2 rounded-md bg-imboni-blue text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60" aria-label="Create ticket" aria-disabled={creating || !newMessage.trim()}>
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
          Create ticket
        </button>
      </div>
    )
  }

  if (!isMounted || (dismissed && !open)) return null

  return (
    <div>
      {!open && (
        <div className="flex items-center gap-2 fixed z-40 bottom-16 right-6">
          <button
            onClick={() => setOpen(true)}
            className="rounded-full shadow-lg bg-imboni-blue text-white px-4 py-3 flex items-center gap-2 hover:shadow-xl"
            aria-label="Open support chat"
            aria-haspopup="dialog"
            aria-controls="support-dialog"
            aria-expanded={open}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Support</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-lg transition-colors"
            title="Hide this button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {open && (
        <div
          ref={dialogRef}
          id="support-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-title"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className="fixed z-50 bottom-16 right-6 w-[360px] max-w-[92vw] h-[520px] rounded-xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 shadow-2xl flex flex-col overflow-hidden"
        >
          <Header />

          {!isAuthenticated && (
            <div className="p-4 text-sm">
              <p className="text-slate-600 dark:text-slate-300 mb-3">Please sign in to chat with our support team.</p>
              <Link className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-imboni-blue text-white text-sm" href="/login">Go to Login</Link>
            </div>
          )}

          {isAuthenticated && (
            <div className="flex-1 flex flex-col">
              {error && <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border-b border-red-100">{error}</div>}

              {!activeId ? (
                <>
                  <TicketList />
                  <div className="p-3 border-t border-slate-200 dark:border-gray-700">
                    <button onClick={() => setActiveId('NEW')} className="w-full px-3 py-2 rounded-md bg-imboni-blue text-white text-sm inline-flex items-center gap-2 justify-center">
                      <PlusCircle className="w-4 h-4" /> New ticket
                    </button>
                  </div>
                </>
              ) : activeId === 'NEW' ? (
                <NewTicketForm />
              ) : (
                <>
                  <div className="border-b border-slate-200 dark:border-gray-700 px-3 py-2 flex items-center justify-between">
                    <button onClick={() => setActiveId(null)} className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back</button>
                    <div className="text-xs text-slate-500">#{activeId.slice(0, 6)}</div>
                  </div>
                  <MessagesView />
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
