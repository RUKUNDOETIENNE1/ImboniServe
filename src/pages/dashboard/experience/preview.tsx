import React, { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import DashboardLayout from '@/components/DashboardLayout'
import { buildSceneForBusiness } from '@/config/businessExperience'
import type { ExperienceDashboardState } from '@/lib/services/experience.service'
import { ArrowLeft, Loader2 } from 'lucide-react'

/**
 * /dashboard/experience/preview — owner/staff preview of the Digital
 * Business Experience with REAL business data, regardless of publish
 * state. Uses the exact same BusinessExperience component as the public
 * route — no second implementation.
 */

const BusinessExperience = dynamic(
  () => import('@/components/experience/BusinessExperience'),
  { ssr: false },
)

export default function ExperiencePreviewPage() {
  const { status } = useSession()
  const router = useRouter()
  const [state, setState] = useState<ExperienceDashboardState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status !== 'authenticated') return
    fetch('/api/business/experience')
      .then((r) => (r.ok ? r.json() : null))
      .then(setState)
      .finally(() => setLoading(false))
  }, [status, router])

  const scene = useMemo(
    () => (state?.context ? buildSceneForBusiness(state.context) : null),
    [state],
  )

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <button
          onClick={() => router.push('/dashboard/experience')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Experience settings
        </button>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Experience Preview{state?.context ? ` — ${state.context.name}` : ''}
          </h1>
          {state && !state.enabled && (
            <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded-full px-3 py-1">
              Draft — customers can't see this yet
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 py-20 justify-center">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading preview…
          </div>
        ) : !scene || !state?.context ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 text-center text-sm text-gray-500">
            Nothing to preview yet — publish your business profile first.
          </div>
        ) : (
          <div className="rounded-2xl bg-gradient-imboni p-4 md:p-8">
            <BusinessExperience
              scene={scene}
              businessContext={{
                businessSlug: state.context.slug,
                businessId: state.context.businessId,
                latitude: state.context.latitude,
                longitude: state.context.longitude,
                qrRemote: state.context.qrRemote,
                whatsappNumber: state.context.whatsappNumber,
              }}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
