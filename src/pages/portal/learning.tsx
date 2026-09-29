import { useState, useEffect, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import PortalLayout from '@/components/portal/PortalLayout'
import LearningCard from '@/components/portal/LearningCard'
import type { LearningArticle } from '@/components/portal/LearningCard'
import { Loader2, AlertCircle, RefreshCw, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'

interface LearningData {
  articles: LearningArticle[]
  faqs: Array<{ id: string; question: string; answer: string }>
}

export default function PortalLearning() {
  const [data, setData] = useState<LearningData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/portal?section=learning')
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setData(json.data)
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
          <span className="ml-2 text-sm text-slate-500">Loading learning center...</span>
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

  if (!data) return null

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Learning Center</h1>
          <p className="text-sm text-slate-500">Learn how to grow your partnership business.</p>
        </div>

        {/* Articles */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <h2 className="font-semibold text-slate-800">Articles</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.articles.map((a) => (
              <LearningCard key={a.id} article={a} />
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="font-semibold text-slate-800 mb-3">Frequently Asked Questions</h2>
          <div className="space-y-2" aria-label="Frequently asked questions">
            {data.faqs.map((f) => (
              <div key={f.id} className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === f.id ? null : f.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                  aria-expanded={expandedFaq === f.id}
                >
                  <span className="text-sm font-medium text-slate-800">{f.question}</span>
                  {expandedFaq === f.id ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  )}
                </button>
                {expandedFaq === f.id && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-slate-600">{f.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
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
