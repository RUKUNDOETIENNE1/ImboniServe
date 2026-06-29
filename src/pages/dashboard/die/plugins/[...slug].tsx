import { useMemo } from 'react'
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import { ArrowLeft, Layers } from 'lucide-react'
import { renderPluginDashboardRoute } from '@/lib/die/plugins/runtime/plugin-platform'
// Unified plugin detail view – no plugin-specific imports

interface PageProps {
  plugin: {
    id: string
    name: string
    description?: string
    version: string
  }
  routeId: string
  data: Record<string, unknown> | null
}

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ params, query, locale, req, res }) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(req as any, res as any, authOptions)
  if (!session?.user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  const slugParam = params?.slug
  const slugSegments = Array.isArray(slugParam) ? slugParam : typeof slugParam === 'string' ? [slugParam] : []
  if (slugSegments.length === 0) {
    return {
      redirect: {
        destination: '/dashboard/die/plugins',
        permanent: false,
      },
    }
  }

  const userBusinessId = (session.user as { businessId?: string | null } | null)?.businessId ?? null

  const outcome = await renderPluginDashboardRoute({
    pathSegments: ['dashboard', 'die', 'plugins', ...slugSegments],
    query,
    locale: locale ?? undefined,
    businessId: userBusinessId,
  })

  if (outcome.kind === 'notFound') {
    return { notFound: true }
  }

  if (outcome.kind === 'redirect') {
    return {
      redirect: {
        destination: outcome.destination,
        permanent: outcome.permanent ?? false,
      },
    }
  }

  if (outcome.headers && res) {
    for (const [key, value] of Object.entries(outcome.headers)) {
      res.setHeader(key, value)
    }
  }

  return {
    props: {
      plugin: {
        id: outcome.plugin.id,
        name: outcome.plugin.name,
        description: outcome.plugin.description,
        version: outcome.plugin.version,
      },
      routeId: outcome.route.id,
      data: (outcome.props ?? null) as Record<string, unknown> | null,
    },
  }
}

function formatDate(input: string | null | undefined) {
  if (!input) return '—'
  try {
    return new Date(input).toLocaleString()
  } catch (error) {
    return input
  }
}

// unified page: no plugin-specific helpers

export default function PluginDashboardPage({
  plugin,
  routeId,
  data,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const payload = useMemo(() => (data?.data ?? data ?? null) as Record<string, unknown> | null, [data])

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-16">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/dashboard/die/plugins"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to plugins
          </Link>
        </div>

        <header className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {plugin.id}
            </div>
            <h1 className="text-3xl font-semibold text-slate-900 lg:text-4xl">{plugin.name}</h1>
            <p className="max-w-2xl text-sm text-slate-600">{plugin.description ?? 'No description available.'}</p>
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium">
                <Layers className="h-3.5 w-3.5" /> Route: {routeId}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium">
                v{plugin.version}
              </span>
            </div>
          </div>
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-900/10">
            <span className="text-lg font-semibold">{plugin.id.slice(0,2).toUpperCase()}</span>
          </div>
        </header>
        <section className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Plugin data</h2>
          <p className="mt-1 text-xs text-slate-500">Unified renderer preview of plugin-provided data.</p>
          <pre className="mt-4 max-h-[480px] overflow-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
{JSON.stringify(payload, null, 2)}
          </pre>
        </section>
      </div>
    </DashboardLayout>
  )
}
