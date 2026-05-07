import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useTranslation } from '@/lib/i18n'
import { Store, Search, ShoppingCart, MapPin, Star, Sparkles, Map, Moon, Sun, Globe } from 'lucide-react'
import { getTagline } from '@/utils/taglines'
import AISupplierRecommendations from '@/components/AISupplierRecommendations'
import RecentlyViewedSuppliers from '@/components/RecentlyViewedSuppliers'
import { useCart } from '@/contexts/CartContext'
import { useTheme } from '@/hooks/useTheme'
import CurrencyDisplay from '@/components/CurrencyDisplay'
import dynamic from 'next/dynamic'

const SupplierMap = dynamic(() => import('@/components/SupplierMap'), { ssr: false })

export default function Marketplace() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale, changeLocale } = useTranslation()
  const { cartCount } = useCart()
  const { darkMode, toggleDarkMode } = useTheme()
  const [products, setProducts] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'browse' | 'ai-recommendations' | 'map'>('browse')
  const [businessLocation, setBusinessLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [showLangMenu, setShowLangMenu] = useState(false)

  useEffect(() => {
    // Allow browsing without login, but features require authentication
    if (status === 'loading') return
    
    fetchProducts()
    fetchNearestSuppliers()
    
    if (status === 'authenticated') {
      fetchBusinessLocation()
    }
  }, [status, locale]) // Refetch when locale changes for localized data

  const handleLanguageChange = (newLocale: typeof locale) => {
    changeLocale(newLocale)
    setShowLangMenu(false)
    router.push({ pathname: router.pathname, query: router.query }, undefined, { locale: newLocale })
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/marketplace/products?isFeatured=true')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNearestSuppliers = async () => {
    try {
      const response = await fetch('/api/marketplace/suppliers/nearest?limit=20')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    }
  }

  const fetchBusinessLocation = async () => {
    try {
      const response = await fetch('/api/business/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.latitude && data.longitude) {
          setBusinessLocation({ lat: data.latitude, lon: data.longitude })
        }
      }
    } catch (error) {
      console.error('Failed to fetch business location:', error)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('loading', 'Loading...')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-imboni-blue to-blue-600 dark:from-gray-800 dark:to-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img src="/imgs/logo2.png" alt="Imboni Serve" className="h-14 w-auto drop-shadow-lg" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Marketplace</h1>
                <p className="text-blue-100 text-sm">{getTagline('hero')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-white/20 transition"
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {darkMode ? (
                  <Sun size={20} className="text-yellow-300" />
                ) : (
                  <Moon size={20} className="text-white" />
                )}
              </button>

              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="px-4 py-2 rounded-lg hover:bg-white/20 transition flex items-center gap-2 min-w-[100px]"
                  title="Change Language"
                >
                  <Globe size={20} className="text-white" />
                  <span className="text-white text-sm font-medium">
                    {locale === 'en' ? 'EN' : locale === 'rw' ? 'RW' : 'FR'}
                  </span>
                </button>
                
                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <button
                      onClick={() => handleLanguageChange('en')}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-t-lg flex items-center gap-2"
                    >
                      <span className="text-lg">🇬🇧</span> English
                    </button>
                    <button
                      onClick={() => handleLanguageChange('rw')}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white flex items-center gap-2"
                    >
                      <span className="text-lg">🇷🇼</span> Kinyarwanda
                    </button>
                    <button
                      onClick={() => handleLanguageChange('fr')}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-b-lg flex items-center gap-2"
                    >
                      <span className="text-lg">🇫🇷</span> Français
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => router.push('/store/cart')}
                className="relative p-2 text-white hover:text-blue-200"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-imboni-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-white hover:text-blue-200"
              >
                {t('dashboard', 'Dashboard')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('marketplace.store_title', 'Welcome to Store')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {t('marketplace.store_subtitle', 'Discover quality suppliers and products for your business')}
            </p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                placeholder={t('common.search', 'Search') + ' ' + t('marketplace.products', 'products')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-imboni-orange focus:border-imboni-orange transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 mb-8 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm">
            <button
              onClick={() => setActiveTab('browse')}
              className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'browse'
                  ? 'bg-gradient-to-r from-imboni-blue to-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Store className="w-5 h-5" />
              {t('marketplace.browse_products', 'Browse Products')}
            </button>
            <button
              onClick={() => setActiveTab('ai-recommendations')}
              className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'ai-recommendations'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              {t('marketplace.ai_recommendations', 'AI Recommendations')}
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 px-6 py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'map'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Map className="w-5 h-5" />
              {t('marketplace.map_view', 'Map View')}
            </button>
          </div>
        </div>

        {activeTab === 'ai-recommendations' && (
          <AISupplierRecommendations maxResults={10} showInsights={true} />
        )}

        {activeTab === 'map' && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Map className="w-5 h-5 text-imboni-orange" />
              Supplier Locations
            </h3>
            <SupplierMap
              suppliers={suppliers}
              businessLocation={businessLocation}
              onSupplierClick={(id) => router.push(`/store/supplier/${id}`)}
              height="600px"
            />
          </div>
        )}

        {activeTab === 'browse' && (
          <>
            {/* Recently Viewed Suppliers */}
            <RecentlyViewedSuppliers />

            <div className="mb-12">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-imboni-orange" />
                {t('marketplace.nearest_suppliers', 'Nearest Suppliers')}
              </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((supplier: any) => (
              <div key={supplier.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-lg text-gray-900 dark:text-white">{supplier.name}</h4>
                  {supplier.isVerified && (
                    <span className="text-green-600 text-xs bg-green-100 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded">
                      {t('marketplace.verified', 'Verified')}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{supplier.description}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{supplier.city}{supplier.district ? `, ${supplier.district}` : ''}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {supplier.marketplaceProducts?.length || 0} {t('marketplace.products', 'products')}
                </p>
                <button
                  onClick={() => router.push(`/store/supplier/${supplier.id}`)}
                  className="w-full bg-imboni-orange text-white py-2 rounded-lg hover:bg-accent-dark"
                >
                  {t('marketplace.view_details', 'View Details')}
                </button>
              </div>
            ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                {t('marketplace.featured_products', 'Featured Products')}
              </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                {product.imageUrl && (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h4 className="font-semibold mb-2">{product.name}</h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-imboni-orange">
                      <CurrencyDisplay amount={product.unitPriceCents} inCents={true} />
                    </span>
                    <span className="text-sm text-gray-500">/{product.unit}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    {t('marketplace.supplier', 'Supplier')}: {product.supplier?.name}
                  </p>
                  <button
                    onClick={() => router.push(`/store/supplier/${product.supplier?.id}`)}
                    className="w-full bg-imboni-orange text-white py-2 rounded-lg hover:bg-accent-dark flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    View Supplier
                  </button>
                </div>
              </div>
            ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
