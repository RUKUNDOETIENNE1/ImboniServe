import { useState, useEffect, useCallback } from 'react'
import type { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import PortalLayout from '@/components/portal/PortalLayout'
import FounderCodeCard from '@/components/portal/FounderCodeCard'
import type { FounderCodeData } from '@/components/portal/FounderCodeCard'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'

export default function PortalCodes() {
  const [codes, setCodes] = useState<FounderCodeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch('/api/portal?section=codes')
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setCodes(json.data || [])
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
          <span className="ml-2 text-sm text-slate-500">Loading your codes...</span>
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
          <h1 className="text-xl font-bold text-slate-800">My Founder Codes</h1>
          <p className="text-sm text-slate-500">Share your codes with restaurants to earn commissions.</p>
        </div>

        {codes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-slate-200/60 shadow-sm text-center">
            <p className="text-sm text-slate-500">You don&apos;t have any Founder Codes yet. Codes are generated when you create campaigns.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {codes.map((c) => (
              <FounderCodeCard key={c.id} code={c} />
            ))}
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
