import { useState, useEffect } from 'react'
import { Heart, Share2, MessageCircle, MapPin, Phone, Utensils } from 'lucide-react'
import Link from 'next/link'
import VideoPlayer from '@/components/VideoPlayer'

type FeedItem = {
  id: string
  type: string
  title?: string | null
  body?: string | null
  mediaIds: string[]
  promoMeta?: any
  business: {
    id: string
    name: string
    city: string | null
    district: string | null
    country: string
  }
  profileSlug?: string | null
  cta: { whatsappUrl: string | null }
  createdAt: string
}

export default function DiscoveryFeedPage() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchFeed()
  }, [filter])

  const fetchFeed = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('filter', filter)
      
      // Try to get user location for nearby filter
      if (filter === 'nearby' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            params.set('lat', position.coords.latitude.toString())
            params.set('lng', position.coords.longitude.toString())
            params.set('radiusKm', '25')
            loadFeed(params)
          },
          () => loadFeed(params)
        )
      } else {
        loadFeed(params)
      }
    } catch (error) {
      console.error('Failed to fetch feed:', error)
      setLoading(false)
    }
  }

  const loadFeed = async (params: URLSearchParams) => {
    try {
      const res = await fetch(`/api/feed?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.data?.items || [])
      }
    } catch (error) {
      console.error('Failed to load feed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEngage = async (postId: string, type: string) => {
    try {
      await fetch('/api/feed/engage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, type }),
      })
    } catch (error) {
      console.error('Failed to engage:', error)
    }
  }

  const handleShare = (item: FeedItem) => {
    const url = `${window.location.origin}/discover/feed?post=${item.id}`
    if (navigator.share) {
      navigator.share({ title: item.title || 'Check this out!', url })
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
    handleEngage(item.id, 'SHARE')
  }

  return (
    <div className="min-h-screen bg-imboni-light font-sans flex flex-col">
      {/* NAV */}
      <nav className="bg-imboni-blue/95 backdrop-blur-sm sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-imboni-orange rounded-lg flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Imboni Serve</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <Link href="/discover" className="text-white font-medium">Discover</Link>
            <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-white/80 text-sm hover:text-white transition hidden md:block">Sign in</Link>
            <Link href="/signup" className="bg-imboni-orange text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-accent-dark transition">Start Free Trial</Link>
          </div>
        </div>
        {/* Filter tabs */}
        <div className="border-t border-white/10">
          <div className="max-w-2xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
            {['all', 'nearby', 'trending', 'featured'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filter === f
                    ? 'bg-imboni-orange text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4 py-6 flex-1 w-full">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600">No posts available yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                onClick={() => handleEngage(item.id, 'VIEW')}
              >
                {/* Business Header */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-imboni-blue">{item.business.name}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        {item.business.city}, {item.business.country}
                      </div>
                    </div>
                    {item.profileSlug && (
                      <Link href={`/discover/${item.profileSlug}`}>
                        <button className="text-xs text-imboni-orange font-medium hover:underline">
                          View Profile
                        </button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {item.title && <h2 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h2>}
                  {item.body && <p className="text-slate-600 text-sm mb-4">{item.body}</p>}

                  {/* Media Display */}
                  {item.mediaIds && item.mediaIds.length > 0 && (
                    <div className="mb-4">
                      {item.type === 'SHORT_VIDEO' ? (
                        <VideoPlayer
                          src={`/api/cms/media/${item.mediaIds[0]}`}
                          autoPlay={false}
                          muted={true}
                          loop={true}
                          className="w-full max-h-96"
                        />
                      ) : item.type === 'PHOTO' ? (
                        <img
                          src={`/api/cms/media/${item.mediaIds[0]}`}
                          alt={item.title || 'Post image'}
                          className="w-full rounded-xl object-cover max-h-96"
                        />
                      ) : null}
                    </div>
                  )}

                  {/* Promo Badge */}
                  {item.type === 'PROMO' && item.promoMeta && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium mb-4">
                      <span>🎉</span>
                      Special Offer
                    </div>
                  )}

                  {/* CTA */}
                  <div className="flex gap-3">
                    {item.cta.whatsappUrl && (
                      <a
                        href={`${item.cta.whatsappUrl}${item.cta.whatsappUrl.includes('?') ? '&' : '?'}ref_post=${item.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleEngage(item.id, 'CLICK')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                      >
                        <Phone className="w-4 h-4" />
                        Order via WhatsApp
                      </a>
                    )}
                    {item.profileSlug && (
                      <Link href={`/discover/${item.profileSlug}`}>
                        <button className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-all">
                          View Menu
                        </button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Engagement Actions */}
                <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-4">
                  <button
                    onClick={() => handleEngage(item.id, 'LIKE')}
                    className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition-colors"
                  >
                    <Heart className="w-5 h-5" />
                    <span className="text-sm">Like</span>
                  </button>
                  <button
                    onClick={() => handleEngage(item.id, 'COMMENT')}
                    className="flex items-center gap-2 text-slate-600 hover:text-imboni-orange transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">Comment</span>
                  </button>
                  <button
                    onClick={() => handleShare(item)}
                    className="flex items-center gap-2 text-slate-600 hover:text-imboni-blue transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* FOOTER */}
      <footer className="bg-imboni-dark text-white/50 text-sm py-6 px-4 text-center">
        <p>© {new Date().getFullYear()} Imboni Serve. Built for the hospitality industry.</p>
        <div className="flex justify-center gap-6 mt-2 flex-wrap">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <Link href="/discover" className="hover:text-white transition">Discover</Link>
          <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
          <Link href="/signup" className="hover:text-white transition">Sign Up</Link>
        </div>
      </footer>
    </div>
  )
}
