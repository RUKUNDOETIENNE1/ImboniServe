import { useState, useEffect, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import PortalLayout from '@/components/portal/PortalLayout'
import { Loader2, AlertCircle, RefreshCw, Mail, Bell, Megaphone, TrendingUp, LifeBuoy, Wallet, FileText } from 'lucide-react'

interface Message {
  id: string
  type: string
  description: string | null
  metadata: any
  timestamp: string
}

const typeIcons: Record<string, typeof Mail> = {
  ANNOUNCEMENT: Bell,
  PRODUCT_UPDATE: Megaphone,
  CAMPAIGN_SUGGESTION: Megaphone,
  PERFORMANCE_MILESTONE: TrendingUp,
  SUPPORT_REPLY: LifeBuoy,
  FINANCE_MESSAGE: Wallet,
  AGREEMENT_NOTIFICATION: FileText,
}

const typeColors: Record<string, string> = {
  ANNOUNCEMENT: 'bg-blue-50 text-blue-600',
  PRODUCT_UPDATE: 'bg-purple-50 text-purple-600',
  CAMPAIGN_SUGGESTION: 'bg-emerald-50 text-emerald-600',
  PERFORMANCE_MILESTONE: 'bg-amber-50 text-amber-600',
  SUPPORT_REPLY: 'bg-teal-50 text-teal-600',
  FINANCE_MESSAGE: 'bg-emerald-50 text-emerald-600',
  AGREEMENT_NOTIFICATION: 'bg-slate-50 text-slate-600',
}

const typeLabels: Record<string, string> = {
  ANNOUNCEMENT: 'Announcement',
  PRODUCT_UPDATE: 'Product Update',
  CAMPAIGN_SUGGESTION: 'Campaign Suggestion',
  PERFORMANCE_MILESTONE: 'Milestone',
  SUPPORT_REPLY: 'Support Reply',
  FINANCE_MESSAGE: 'Finance',
  AGREEMENT_NOTIFICATION: 'Agreement',
}

export default function PortalMessages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('ALL')

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/portal?section=messages')
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setMessages(json.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" aria-hidden="true" />
          <span className="ml-2 text-sm text-slate-500">Loading messages...</span>
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

  const types = ['ALL', ...Array.from(new Set(messages.map((m) => m.type)))]
  const filtered = filter === 'ALL' ? messages : messages.filter((m) => m.type === filter)

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Messages</h1>
          <p className="text-sm text-slate-500">Announcements, updates, and notifications.</p>
        </div>

        {types.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  filter === t ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t === 'ALL' ? 'All' : typeLabels[t] || t}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-slate-200/60 shadow-sm text-center">
            <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-slate-500">No messages yet.</p>
          </div>
        ) : (
          <div className="space-y-3" aria-label="Messages">
            {filtered.map((m) => {
              const Icon = typeIcons[m.type] || Mail
              return (
                <div key={m.id} className="bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${typeColors[m.type] || 'bg-slate-50 text-slate-600'}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-500">{typeLabels[m.type] || m.type}</span>
                      <span className="text-xs text-slate-400">{new Date(m.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-700">{m.description || 'No description'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
