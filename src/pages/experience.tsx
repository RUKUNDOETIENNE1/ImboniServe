import React from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import PublicLayout from '@/components/PublicLayout'
import { DEMO_RESTAURANT_SCENE } from '@/config/businessExperience'
import { Sparkles, ArrowRight } from 'lucide-react'

/**
 * /experience — public demo of the Interactive Digital Business experience.
 *
 * The interactive component is dynamically imported (no SSR) so it never
 * blocks initial page load. While it loads — or if it fails — visitors see
 * the high-quality static poster, so the concept is always communicated.
 */
const BusinessExperience = dynamic(
  () => import('@/components/experience/BusinessExperience'),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full aspect-[4/3] md:aspect-[16/10] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-imboni-blue">
        <Image
          src={DEMO_RESTAURANT_SCENE.posterImage}
          alt="Interactive restaurant experience preview"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-imboni-blue/70 to-transparent">
          <span className="text-white/80 text-sm font-medium">Loading interactive experience…</span>
        </div>
      </div>
    ),
  },
)

export default function ExperiencePage() {
  return (
    <PublicLayout title="Interactive Business Experience — Imboni Serve">
      <section className="bg-gradient-imboni text-white pt-14 pb-28 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5 text-imboni-orange" />
            Interactive Digital Business
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-3 tracking-tight">
            Your Business,<br />
            <span className="text-imboni-orange">Now Interactive.</span>
          </h1>
          <p className="text-lg text-white/85 max-w-2xl mb-8">
            Explore the restaurant below. Tap a hotspot to see what customers can do —
            browse the menu, order, reserve, or find directions. Every action connects to
            real Imboni Serve functionality.
          </p>

          <BusinessExperience scene={DEMO_RESTAURANT_SCENE} />

          <div className="flex flex-wrap gap-4 mt-10">
            <Link
              href="/signup"
              className="bg-imboni-orange text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-accent-dark hover:scale-105 transition-all shadow-lg shadow-orange-900/30 flex items-center gap-2"
            >
              Make My Business Interactive <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/discover"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-white/20 hover:scale-105 transition-all"
            >
              Browse Real Businesses
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
