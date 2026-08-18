import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { QrCode, Sparkles, Puzzle, ShieldCheck, Globe2, Building2, Filter, Search } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import type { DIEPluginType } from '@/lib/die/plugins/core/plugin-types'

type DashboardPluginEntry = {
  pluginId: string
  name: string
  description?: string
  version: string
  type: DIEPluginType
  businessScoped: boolean
  guard: 'business' | 'public'
  icon?: string | null
  order: number
  path: string
}

type PageProps = {
  entries: DashboardPluginEntry[]
}

type IconComponent = React.ComponentType<{ className?: string }>

const iconLibrary: Record<string, IconComponent> = {
  'qr-code': QrCode,
  sparkles: Sparkles,
  shield: ShieldCheck,
  globe: Globe2,
  business: Building2,
}

function resolveIcon(icon?: string | null): IconComponent {
  if (!icon) return Puzzle
  return iconLibrary[icon] ?? Puzzle
}

function guardCopy(entry: DashboardPluginEntry) {
  if (entry.guard === 'business') {
    return 'Business scoped access'
  }
  return 'Publicly accessible'
}

function typeBadge(type: DIEPluginType) {
  if (type === 'PUBLIC') return 'Public'
  if (type === 'SYSTEM') return 'System'
  return 'Internal'
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const { getServerSession } = await import('next-auth/next')
  const { authOptions } = await import('@/pages/api/auth/[...nextauth]')
  const session = await getServerSession(ctx.req as any, ctx.res as any, authOptions)
  if (!session?.user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  const { listDashboardPluginEntries } = await import('@/lib/die/plugins/runtime/plugin-platform')
  const entries = listDashboardPluginEntries()
    .map(({ plugin, route }) => ({
      pluginId: plugin.id,
      name: plugin.name,
      description: plugin.description,
      version: plugin.version,
      type: plugin.type,
      businessScoped: plugin.businessScoped,
      guard: (route.guard ?? (plugin.businessScoped ? 'business' : 'public')) as 'business' | 'public',
      icon: (route as any).icon ?? null,
      order: (route as any).order ?? 0,
      path: route.path,
    }))
    .sort((a, b) => {
      if (a.order === b.order) {
        return a.name.localeCompare(b.name)
      }
      return a.order - b.order
    })

  return {
    props: {
      entries,
    },
  }
}

const audienceFilters = [
  { id: 'all', label: 'All audiences' },
  { id: 'business', label: 'Business scoped' },
  { id: 'public', label: 'Public' },
] as const

export default function DIEPluginsIndexPage({ entries }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [audience, setAudience] = useState<(typeof audienceFilters)[number]['id']>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return entries
      .filter((entry) => {
        if (audience === 'all') return true
        if (audience === 'business') return entry.guard === 'business'
        return entry.guard !== 'business'
      })
      .filter((entry) => {
        if (!search.trim()) return true
        const term = search.trim().toLowerCase()
        return (
          entry.name.toLowerCase().includes(term) ||
          (entry.description ?? '').toLowerCase().includes(term) ||
          entry.pluginId.toLowerCase().includes(term)
        )
      })
  }, [entries, audience, search])

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-16">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-slate-50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950" />
          <div className="relative z-[1] px-8 py-12 lg:px-12">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-200">DIE Plugin Platform</p>
            <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-4">
                <h1 className="text-3xl font-semibold leading-tight text-white lg:text-4xl">
                  Discover intelligent automations for your documents
                </h1>
                <p className="text-sm text-slate-200/80">
                  Plugins extend the Document Intelligence Engine with new capabilities. Install business-scoped tools,
                  publish public experiences, and orchestrate AI flows without leaving the dashboard.
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-medium">
                    <Sparkles className="h-3.5 w-3.5" /> AI-ready hooks
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" /> Multi-tenant safe
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-medium">
                    <Globe2 className="h-3.5 w-3.5" /> Public + dashboard routes
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 px-6 py-5 text-sm shadow-xl shadow-sky-500/10">
                <p className="text-slate-200">Currently activated plugins</p>
                <p className="mt-1 text-3xl font-semibold text-white">{entries.length}</p>
                <p className="mt-3 text-xs text-slate-400">
                  Need something custom? Reach out to the core team to author bespoke DIE plugins and expose them here.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {audienceFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setAudience(filter.id)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                    audience === filter.id
                      ? 'bg-slate-900 text-slate-50 shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search plugins"
                className="w-full rounded-full border border-slate-200 bg-white px-9 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
                <Filter className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 font-medium">No plugins found</p>
                <p className="mt-1 text-xs text-slate-400">Try adjusting the audience filter or clearing your search.</p>
              </div>
            )}

            {filtered.map((entry) => {
              const Icon = resolveIcon(entry.icon)
              const isDynamicRoute = entry.path.includes('[')
              return (
                <article
                  key={entry.pluginId}
                  className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-sm transition hover:shadow-xl hover:ring-2 hover:ring-slate-200"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-50 group-hover:scale-105 group-hover:bg-slate-800">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">{entry.name}</h2>
                          <p className="text-xs uppercase tracking-wide text-slate-400">{entry.pluginId}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        v{entry.version}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600">{entry.description || 'No description provided.'}</p>

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                        {typeBadge(entry.type)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                        {guardCopy(entry)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                      <p className="font-medium text-slate-600">Dashboard route</p>
                      <code className="mt-1 block truncate rounded bg-white px-2 py-1 text-[11px] text-slate-700">
                        {entry.path}
                      </code>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3 text-sm">
                    <Link
                      href={isDynamicRoute ? '#' : entry.path}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition ${
                        isDynamicRoute
                          ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                      aria-disabled={isDynamicRoute}
                      prefetch={!isDynamicRoute}
                    >
                      Open plugin
                    </Link>
                    <Link
                      href={`/docs/plugins/${entry.pluginId}`}
                      className="text-xs font-medium text-slate-500 underline-offset-4 hover:text-slate-800 hover:underline"
                    >
                      View integration guide
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
