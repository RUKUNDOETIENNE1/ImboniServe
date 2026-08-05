import { useState, useEffect, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import PortalLayout from '@/components/portal/PortalLayout'
import { Loader2, AlertCircle, RefreshCw, LifeBuoy, Send, MessageSquare, CheckCircle, Clock } from 'lucide-react'

interface Ticket {
  id: string
  type: string
  description: string | null
  metadata: any
  timestamp: string
}

const ticketStatusColors: Record<string, string> = {
  OPEN: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-600',
}

export default function PortalSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('general')

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/portal?section=support')
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setTickets(json.data?.tickets || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/portal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createSupportTicket',
          subject: subject.trim(),
          message: message.trim(),
          category,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(`Failed: ${err.error}`)
        return
      }
      setSubject('')
      setMessage('')
      setCategory('general')
      loadData()
    } catch (err: any) {
      alert(`Failed: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" aria-hidden="true" />
          <span className="ml-2 text-sm text-slate-500">Loading support...</span>
        </div>
      </PortalLayout>
    )
  }

  if (error) {
    return (
      <PortalLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" aria-hidden="true" />
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Retry
          </button>
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Support</h1>
          <p className="text-sm text-slate-500">Ask questions, report issues, or request help.</p>
        </div>

        {/* New ticket form */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <LifeBuoy className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            <h3 className="font-semibold text-slate-800">New Support Request</h3>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="subject" className="text-xs font-medium text-slate-600">Subject *</label>
              <input
                id="subject" type="text" required value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="category" className="text-xs font-medium text-slate-600">Category</label>
              <select
                id="category" value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="general">General Question</option>
                <option value="payout">Payout Clarification</option>
                <option value="campaign">Campaign Issue</option>
                <option value="technical">Technical Issue</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="text-xs font-medium text-slate-600">Message *</label>
              <textarea
                id="message" required rows={4} value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              {submitting ? 'Sending...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* Ticket history */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-slate-600" aria-hidden="true" />
            <h3 className="font-semibold text-slate-800">Ticket History</h3>
          </div>
          {tickets.length === 0 ? (
            <p className="text-sm text-slate-400">No support requests yet.</p>
          ) : (
            <div className="space-y-3" aria-label="Support tickets">
              {tickets.map((t) => {
                const status = (t.metadata as any)?.status || 'OPEN'
                const StatusIcon = status === 'RESOLVED' || status === 'CLOSED' ? CheckCircle : Clock
                return (
                  <div key={t.id} className="p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-800">{t.description || 'Support request'}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${ticketStatusColors[status] || 'bg-amber-100 text-amber-700'}`}>
                        <StatusIcon className="w-3 h-3" aria-hidden="true" />
                        {status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{new Date(t.timestamp).toLocaleString()}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!session?.user?.email) return { redirect: { destination: '/login', permanent: false } }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return { redirect: { destination: '/login', permanent: false } }
  const partnership = await prisma.partnership.findUnique({ where: { userId: user.id }, select: { status: true } })
  if (!partnership || ['PROSPECT', 'REJECTED', 'TERMINATED'].includes(partnership.status)) {
    return { redirect: { destination: '/login', permanent: false } }
  }
  return { props: {} }
}
