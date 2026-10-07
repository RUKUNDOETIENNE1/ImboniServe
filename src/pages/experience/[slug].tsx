import React from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { GetServerSideProps } from 'next'
import PublicLayout from '@/components/PublicLayout'
import { ExperienceService, type ExperienceBusinessContext } from '@/lib/services/experience.service'
import { buildSceneForBusiness, type ExperienceScene } from '@/config/businessExperience'
import { Sparkles, MapPin, Star, ArrowRight, AlertTriangle } from 'lucide-react'

/**
 * /experience/[slug] — real-business Digital Business Experience.
 *
 * Server-side loads the business context in ONE query (profile + menu
 * capabilities + table count), builds the scene from real data, and hands
 * it to the same BusinessExperience component used by the demo.
 * The 3D scene stays a presentation layer — menus/orders/reservations
 * still live in the existing product.
 */

const BusinessExperience = dynamic(
  () => import('@/components/experience/BusinessExperience'),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full aspect-[4/3] md:aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-imboni-blue">
        <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-imboni-blue/70 to-transparent">
          <span className="text-white/80 text-sm font-medium">Loading interactive experience…</span>
        </div>
      </div>
    ),
  },
)

interface Props {
  context: ExperienceBusinessContext | null
  scene: ExperienceScene | null
  status: 'published' | 'disabled' | 'not_found'
  slug: string
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const slug = ctx.params?.slug
  if (!slug || typeof slug !== 'string') {
    return { props: { context: null, scene: null, status: 'not_found', slug: '' } }
  }
  try {
    const result = await ExperienceService.getContextBySlug(slug)
    if (result.status !== 'published') {
      return { props: { context: null, scene: null, status: result.status, slug } }
    }
    return { props: { context: result.context, scene: buildSceneForBusiness(result.context), status: 'published', slug } }
  } catch (err) {
    console.error('Experience page load error:', err)
    return { props: { context: null, scene: null, status: 'not_found', slug } }
  }
}

export default function BusinessExperiencePage({ context, scene, status, slug }: Props) {
  // ── Graceful states: business not found / experience disabled ──
  if (!context || !scene) {
    const disabled = status === 'disabled'
    return (
      <PublicLayout title="Experience not found — Imboni Serve">
        <section className="bg-gradient-imboni text-white py-24 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <AlertTriangle className="w-10 h-10 text-imboni-orange mx-auto mb-4" />
            <h1 className="text-3xl font-extrabold mb-3">
              {disabled ? 'This experience is currently unavailable' : "This experience isn't available"}
            </h1>
            <p className="text-white/80 mb-8">
              {disabled
                ? 'This business has paused its interactive experience. You can still visit its public page.'
                : 'The business may not have published an interactive experience yet, or the link is incorrect.'}
            </p>
            <Link
              href={disabled && slug ? `/discover/${slug}` : '/discover'}
              className="inline-flex items-center gap-2 bg-imboni-orange text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-accent-dark transition-all"
            >
              {disabled && slug ? 'View Business Page' : 'Browse Businesses'} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout title={`${context.name} — Interactive Experience — Imboni Serve`}>
      <section className="bg-gradient-imboni text-white py-12 px-4 pb-28">
        <div className="max-w-6xl mx-auto">
          {/* Real business identity */}
          <div className="flex items-start gap-4 mb-8">
            {context.logoUrl && (
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/20 shrink-0">
                <Image src={context.logoUrl} alt={context.name} fill className="object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-imboni-orange" />
                Interactive Business
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
                {context.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-white/80">
                {context.tagline && <span>{context.tagline}</span>}
                {context.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {context.address ? `${context.address}, ${context.city}` : context.city}
                  </span>
                )}
                {context.rating != null && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-imboni-orange" /> {context.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <BusinessExperience
            scene={scene}
            businessContext={{
              businessSlug: context.slug,
              businessId: context.businessId,
              latitude: context.latitude,
              longitude: context.longitude,
              qrRemote: context.qrRemote,
              whatsappNumber: context.whatsappNumber,
            }}
          />

          <div className="flex flex-wrap gap-4 mt-10">
            {context.hasMenu && (
              <Link
                href={`/discover/${context.slug}`}
                className="bg-imboni-orange text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-accent-dark hover:scale-105 transition-all shadow-lg shadow-orange-900/30 flex items-center gap-2"
              >
                View Full Menu <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <Link
              href={`/discover/${context.slug}`}
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-white/20 hover:scale-105 transition-all"
            >
              Business Profile
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
