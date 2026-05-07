import { useState, useEffect } from 'react'
import { MapPin, Star, Navigation, Filter, Search } from 'lucide-react'
import { useRouter } from 'next/router'

export default function DiscoveryMap() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [radius, setRadius] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        (error) => {
          console.warn('Geolocation error:', error)
          fetchBusinesses()
        }
      )
    } else {
      fetchBusinesses()
    }
  }, [])

  useEffect(() => {
    if (userLocation) {
      fetchBusinesses()
    }
  }, [userLocation, radius])

  async function fetchBusinesses() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        ...(userLocation && { lat: userLocation.lat.toString(), lon: userLocation.lon.toString() }),
        radius: radius.toString(),
        limit: '50'
      })

      const res = await fetch(`/api/discover/nearby?${params}`)
      if (res.ok) {
        const data = await res.json()
        setBusinesses(data.businesses || [])
      }
    } catch (error) {
      console.error('Failed to fetch businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBusinesses = searchTerm
    ? businesses.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.cuisineTypes?.some((c: string) => c.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : businesses

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-imboni-orange" />
                Discover Nearby
              </h1>
              <p className="text-sm text-slate-500">Businesses using Imboni Serve near you</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-imboni-blue hover:text-imboni-orange"
            >
              Back to Home
            </button>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, city, or cuisine..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
              />
            </div>
            <select
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-imboni-blue/20 focus:border-imboni-blue"
            >
              <option value="5">5 km</option>
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="50">50 km</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-sm text-slate-600">
                Found <strong>{filteredBusinesses.length}</strong> businesses
                {userLocation && ` within ${radius} km`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((business) => (
                <div
                  key={business.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/discover/${business.slug}`)}
                >
                  {business.coverImageUrl && (
                    <img
                      src={business.coverImageUrl}
                      alt={business.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-800 mb-1">{business.name}</h3>
                        {business.tagline && (
                          <p className="text-sm text-slate-500">{business.tagline}</p>
                        )}
                      </div>
                      {business.qrOrderingEnabled && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                          QR Order
                        </span>
                      )}
                    </div>

                    {business.cuisineTypes && business.cuisineTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {business.cuisineTypes.slice(0, 3).map((cuisine: string, idx: number) => (
                          <span key={idx} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">
                            {cuisine}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        {business.rating && (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="font-medium">{business.rating.toFixed(1)}</span>
                            <span className="text-slate-400">({business.reviewCount})</span>
                          </div>
                        )}
                        {business.priceRange && (
                          <span className="text-slate-600">{business.priceRange}</span>
                        )}
                      </div>
                      {business.distance !== null && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Navigation className="w-4 h-4" />
                          <span>{business.distance.toFixed(1)} km</span>
                        </div>
                      )}
                    </div>

                    {business.address && (
                      <div className="mt-3 flex items-start gap-2 text-xs text-slate-500">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{business.address}, {business.city}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredBusinesses.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-12 text-center">
                <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 font-medium mb-2">No businesses found nearby</p>
                <p className="text-sm text-slate-500">Try increasing the search radius</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
