import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { Star, MapPin, Phone, ArrowLeft, Utensils } from 'lucide-react'

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sessionId = sessionStorage.getItem('imboni_session_id')
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem('imboni_session_id', sessionId)
  }
  return sessionId
}

export default function BusinessProfilePage() {
  const router = useRouter()
  const { slug } = router.query
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    fetch(`/api/discover/${slug}`)
      .then(r => { if (!r.ok) { setNotFound(true); return null } return r.json() })
      .then(d => {
        if (d) {
          setProfile(d)
          // Track view
          const sessionId = getOrCreateSessionId()
          fetch('/api/track/business-view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessId: d.business?.id,
              profileId: d.id,
              sessionId,
            }),
          }).catch(() => {}) // Silent fail on tracking
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="min-h-screen bg-imboni-light flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue" />
    </div>
  )

  if (notFound || !profile) return (
    <div className="min-h-screen bg-imboni-light flex flex-col items-center justify-center">
      <p className="text-slate-600 font-medium mb-3">Business not found</p>
      <Link href="/discover" className="text-sm text-imboni-blue hover:text-imboni-orange">← Back to Discover</Link>
    </div>
  )

  const business = profile.business

  return (
    <>
    <Head><title>{business?.name} — Imboni Serve</title></Head>
    <div className="min-h-screen bg-imboni-light font-sans flex flex-col">
      {/* NAV */}
      <nav className="bg-imboni-blue/95 backdrop-blur-sm sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <Link href="/discover" className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-imboni-orange rounded-md flex items-center justify-center">
              <Utensils className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-white">{business?.name}</span>
          </div>
          <div className="ml-auto">
            <Link href="/signup" className="bg-imboni-orange text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-accent-dark transition">List Your Business</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {profile.coverImageUrl ? (
          <img src={profile.coverImageUrl} alt={business?.name} className="w-full h-48 object-cover rounded-2xl mb-6" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-6xl">🍽️</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{business?.name}</h1>
              {profile.tagline && <p className="text-slate-500 mt-1">{profile.tagline}</p>}
            </div>
            <div className="flex flex-col items-end gap-1">
              {profile.rating && (
                <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {profile.rating.toFixed(1)}
                </span>
              )}
              {profile.priceRange && <span className="text-sm text-green-600 font-medium">{profile.priceRange}</span>}
            </div>
          </div>

          {profile.description && <p className="text-slate-600 text-sm mb-4">{profile.description}</p>}

          <div className="space-y-2">
            {business?.address && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="w-4 h-4" />{business.address}{business.city ? `, ${business.city}` : ''}
              </div>
            )}
            {business?.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Phone className="w-4 h-4" />{business.phone}
              </div>
            )}
          </div>

          {profile.cuisineTypes?.length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {profile.cuisineTypes.map((c: string) => (
                <span key={c} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{c}</span>
              ))}
            </div>
          )}
        </div>

        {business?.menuItems?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
            <h2 className="font-semibold text-slate-800 mb-4">Menu Highlights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {business.menuItems.slice(0, 8).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{item.name}</p>
                    {item.category && <p className="text-xs text-slate-400">{item.category}</p>}
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{(item.priceCents / 100).toLocaleString()} RWF</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.reviews?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Reviews</h2>
            <div className="space-y-4">
              {profile.reviews.map((r: any) => (
                <div key={r.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                    ))}
                    <span className="text-xs text-slate-400 ml-1">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p className="text-sm text-slate-600">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-8">
          Powered by <a href="/" className="hover:underline font-medium text-imboni-blue">Imboni Serve</a>
        </p>
      </div>
      {/* FOOTER */}
      <footer className="bg-imboni-dark text-white/50 text-sm py-6 px-4 text-center mt-auto">
        <p>© {new Date().getFullYear()} Imboni Serve. Built for the hospitality industry.</p>
        <div className="flex justify-center gap-6 mt-2 flex-wrap">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <Link href="/discover" className="hover:text-white transition">Discover</Link>
          <Link href="/signup" className="hover:text-white transition">Sign Up</Link>
        </div>
      </footer>
    </div>
    </>
  )
}
