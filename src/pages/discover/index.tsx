import { useEffect, useState } from 'react'
import { Search, Star, MapPin, Utensils, Filter, TrendingUp, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n'

export default function DiscoverPage() {
  const { t } = useTranslation()
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  const categories = ['Restaurant', 'Cafe', 'Bar', 'Hotel', 'Fast Food', 'Fine Dining']
  const cities = ['Kigali', 'Musanze', 'Rubavu', 'Huye', 'Muhanga']
  const priceRanges = ['$', '$$', '$$$']

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (query) params.set('search', query)
    if (selectedCategory) params.set('cuisineType', selectedCategory)
    if (selectedPriceRange) params.set('priceRange', selectedPriceRange)
    params.set('limit', '24')
    
    fetch(`/api/discover?${params}`)
      .then(r => r.json())
      .then(d => {
        let results = d.profiles || []
        // Client-side city filter (if not supported by API)
        if (selectedCity) {
          results = results.filter((p: any) => p.business?.city === selectedCity)
        }
        setProfiles(results)
      })
      .finally(() => setLoading(false))
  }, [query, selectedCategory, selectedCity, selectedPriceRange])

  function doSearch() { setQuery(search) }

  return (
    <div className="min-h-screen bg-imboni-light font-sans flex flex-col">
      {/* NAV */}
      <nav className="bg-imboni-blue/95 backdrop-blur-sm sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-imboni-orange rounded-lg flex items-center justify-center">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Imboni Serve</span>
          </Link>
          <div className="flex-1 flex items-center gap-2 max-w-2xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                placeholder={t('discovery.searchPlaceholder')}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-imboni-orange focus:border-imboni-orange"
              />
            </div>
            <button onClick={doSearch} className="px-4 py-2 bg-imboni-orange text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition">Search</button>
            <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium hover:bg-slate-50 transition flex items-center gap-1.5">
              <Filter className="w-4 h-4" /> {t('discovery.filters')}
            </button>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-white/80 text-sm hover:text-white transition">Sign in</Link>
            <Link href="/signup" className="bg-white text-imboni-blue text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-100 transition">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold text-imboni-blue mb-2">{t('discovery.title')}</h1>
        <p className="text-gray-600 mb-6">{t('discovery.subtitle')}</p>

        {showFilters && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('discovery.category')}</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-imboni-orange focus:border-imboni-orange"
                >
                  <option value="">{t('discovery.allCategories')}</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('discovery.location')}</label>
                <select
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-imboni-orange focus:border-imboni-orange"
                >
                  <option value="">{t('discovery.allLocations')}</option>
                  {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{t('discovery.priceRange')}</label>
                <select
                  value={selectedPriceRange}
                  onChange={e => setSelectedPriceRange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-imboni-orange focus:border-imboni-orange"
                >
                  <option value="">{t('discovery.allPrices')}</option>
                  {priceRanges.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            {(selectedCategory || selectedCity) && (
              <button
                onClick={() => { setSelectedCategory(''); setSelectedCity(''); setSelectedPriceRange('') }}
                className="mt-3 text-sm text-imboni-blue hover:text-imboni-orange transition"
              >
                {t('discovery.clearFilters')}
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-imboni-blue" /></div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">{t('discovery.noResults')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map(p => {
              const isNew = p.createdAt && (Date.now() - new Date(p.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000 // 30 days
              const isPopular = (p.viewCount || 0) > 100 || (p.rating || 0) >= 4.5
              
              return (
                <Link key={p.id} href={`/discover/${p.slug}`} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-imboni-orange/30 transition-all duration-300">
                  <div className="relative">
                    {p.coverImageUrl ? (
                      <img src={p.coverImageUrl} alt={p.business?.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-imboni-blue/10 to-imboni-orange/10 flex items-center justify-center">
                        <span className="text-5xl">🍽️</span>
                      </div>
                    )}
                    {isNew && (
                      <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                        <Sparkles className="w-3 h-3" /> {t('discovery.new')}
                      </span>
                    )}
                    {isPopular && !isNew && (
                      <span className="absolute top-3 left-3 bg-imboni-orange text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                        <TrendingUp className="w-3 h-3" /> {t('discovery.popular')}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-lg text-slate-800 group-hover:text-imboni-orange transition-colors">{p.business?.name}</h3>
                      {p.rating && (
                        <span className="flex items-center gap-1 text-sm text-amber-600 font-semibold whitespace-nowrap bg-amber-50 px-2 py-1 rounded-lg">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />{p.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {p.tagline && <p className="text-sm text-slate-600 mb-3 line-clamp-2">{p.tagline}</p>}
                    {p.business?.city && (
                      <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-3">
                        <MapPin className="w-4 h-4 text-imboni-blue" />{p.business.city}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.cuisineTypes?.slice(0, 2).map((c: string) => (
                        <span key={c} className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">{c}</span>
                      ))}
                      {p.priceRange && <span className="text-xs text-green-600 font-semibold ml-auto bg-green-50 px-2.5 py-1 rounded-full">{p.priceRange}</span>}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-12">
          {t('discovery.poweredBy')} <a href="/" className="hover:underline font-medium text-imboni-blue">Imboni Serve</a>
        </p>
      </div>
      {/* FOOTER */}
      <footer className="bg-imboni-dark text-white/50 text-sm py-6 px-4 text-center mt-auto">
        <p>© {new Date().getFullYear()} Imboni Serve. Built for the hospitality industry.</p>
        <div className="flex justify-center gap-6 mt-2 flex-wrap">
          <Link href="/" className="hover:text-white transition">Home</Link>
          <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
          <Link href="/signup" className="hover:text-white transition">Sign Up</Link>
          <a href="https://wa.me/250735214496" className="hover:text-white transition">Contact</a>
        </div>
      </footer>
    </div>
  )
}
