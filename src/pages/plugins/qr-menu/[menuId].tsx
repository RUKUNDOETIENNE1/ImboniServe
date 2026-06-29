import { useMemo, useState } from 'react'
import Head from 'next/head'
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { renderPluginPublicRoute, resolveBusinessId } from '@/lib/die/plugins/runtime/plugin-platform'
import type { QRMenuPublicPayload } from '@/lib/die/plugins/built-in/qr-menu.plugin'

interface MenuItem {
  name: string
  category: string
  price: number
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

type PageProps = {
  payload: QRMenuPublicPayload
}

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ params, query, locale, res }) => {
  const menuId = typeof params?.menuId === 'string' ? params.menuId : Array.isArray(params?.menuId) ? params?.menuId[0] : null

  if (!menuId) {
    return { notFound: true }
  }

  const outcome = await renderPluginPublicRoute({
    pathSegments: ['plugins', 'qr-menu', menuId],
    query,
    locale: locale ?? undefined,
    businessId: resolveBusinessId(query.businessId),
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

  if (outcome.plugin.id !== 'qr-menu') {
    return { notFound: true }
  }

  if (outcome.headers && res) {
    for (const [key, value] of Object.entries(outcome.headers)) {
      res.setHeader(key, value)
    }
  }

  const props = outcome.props as { data?: QRMenuPublicPayload }

  if (!props?.data) {
    return { notFound: true }
  }

  return {
    props: {
      payload: props.data,
    },
  }
}

function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return '—'
  const formatter = new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    maximumFractionDigits: 0,
  })
  return formatter.format(Math.max(0, amount))
}

export default function QRMenuPage({ payload }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [copied, setCopied] = useState(false)

  const sections = useMemo<MenuSection[]>(() => {
    const items = Array.isArray(payload.menuItems) ? payload.menuItems : []

    const sectionsMap = new Map<string, MenuItem[]>()
    for (const item of items) {
      if (!item?.name) continue
      const key = item.category || 'Menu'
      const list = sectionsMap.get(key) ?? []
      list.push({
        name: item.name,
        category: key,
        price: Number.isFinite(item.price) ? item.price : 0,
      })
      sectionsMap.set(key, list)
    }

    return Array.from(sectionsMap.entries())
      .map(([title, entries]) => ({
        title,
        items: entries.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [payload.menuItems])

  const business = payload.business
    ? {
        name: payload.business.name,
        address: payload.business.address ?? undefined,
        phone: payload.business.phone ?? undefined,
        whatsapp: payload.business.whatsapp ?? undefined,
      }
    : null

  const qrCodeUrl = payload.qrCodeUrl
  const publicUrl = payload.publicUrl
  const updatedAt = payload.updatedAt

  const lastUpdated = useMemo(() => {
    try {
      return new Date(updatedAt).toLocaleString()
    } catch {
      return updatedAt
    }
  }, [updatedAt])

  const pageTitle = business ? `${business.name} · QR Menu` : 'QR Menu'
  const shareLink = useMemo(() => {
    if (publicUrl) return publicUrl
    if (typeof window !== 'undefined') {
      return window.location.href
    }
    return ''
  }, [publicUrl])

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: pageTitle,
          url: shareLink,
        })
        return
      }
    } catch (err) {
      console.warn('Share failed, falling back to clipboard', err)
    }

    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Clipboard copy failed', err)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content="Scan to explore the menu" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareLink} />
        {qrCodeUrl && <meta property="og:image" content={qrCodeUrl} />}
      </Head>

      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-slate-900 to-sky-500/20" />
        <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Digital QR Menu</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
              {business?.name ?? 'Your smart menu'}
            </h1>
            {business?.address && <p className="mt-3 text-sm text-slate-200/80">{business.address}</p>}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-200/80">
              {business?.phone && <span>📞 {business.phone}</span>}
              {business?.whatsapp && <span>💬 WhatsApp {business.whatsapp}</span>}
              <span>Updated: {lastUpdated}</span>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
            >
              <span>{copied ? 'Link copied!' : 'Share menu'}</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
          </div>
          {qrCodeUrl && (
            <div className="relative isolate flex h-56 w-56 items-center justify-center rounded-3xl border border-white/20 bg-white/5 p-6 shadow-xl shadow-emerald-500/20">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-emerald-500/20" />
              <img
                src={qrCodeUrl}
                alt="QR code"
                className="relative z-[1] h-full w-full rounded-xl border border-white/30 bg-white p-2"
              />
            </div>
          )}
        </div>
      </header>

      <main className="relative z-[1] mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-emerald-400/60 hover:bg-white/10"
            >
              <h2 className="text-lg font-semibold text-white">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4">
                {section.items.map((item) => (
                  <div key={`${section.title}-${item.name}`} className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-base font-medium text-white/90">{item.name}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-200">{formatCurrency(item.price)}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-16 flex flex-col items-center gap-2 text-xs text-slate-400">
          <p>Powered by Imboni Document Intelligence · Instant menu generation via DIE Plugins</p>
          <p className="text-slate-500">
            Looking for your own smart menu? Visit <a className="underline decoration-dotted" href="https://imboni.ai" target="_blank" rel="noreferrer">imboni.ai</a>
          </p>
        </footer>
      </main>
    </div>
  )
}
