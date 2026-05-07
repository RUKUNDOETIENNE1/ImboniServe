import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardLayout from '@/components/DashboardLayout'
import { Package, MapPin, Phone, Mail, CheckCircle, Star, ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { addRecentlyViewed } from '@/lib/utils/recentlyViewed'
import CurrencyDisplay from '@/components/CurrencyDisplay'

interface Product {
  id: string
  name: string
  category: string
  unit: string
  unitPriceCents: number
  isAvailable: boolean
}

interface Supplier {
  id: string
  name: string
  description?: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  city: string
  district?: string
  country: string
  latitude?: number
  longitude?: number
  isVerified: boolean
  isActive: boolean
  marketplaceProducts: Product[]
}

export default function SupplierDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: session } = useSession()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addedToCart, setAddedToCart] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!id) return

    const fetchSupplier = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/marketplace/supplier/${id}`)
        if (!response.ok) {
          throw new Error('Supplier not found')
        }
        const data = await response.json()
        setSupplier(data.supplier)
        
        // Track in recently viewed
        addRecentlyViewed({
          id: data.supplier.id,
          name: data.supplier.name,
          city: data.supplier.city,
          isVerified: data.supplier.isVerified
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load supplier')
      } finally {
        setLoading(false)
      }
    }

    fetchSupplier()
  }, [id])

  const { addToCart: addToCartContext } = useCart()

  const addToCart = (product: Product) => {
    // Require login to add to cart
    if (!session) {
      router.push('/login?redirect=/store/supplier/' + id)
      return
    }

    addToCartContext({
      productId: product.id,
      productName: product.name,
      supplierId: supplier!.id,
      supplierName: supplier!.name,
      category: product.category,
      unit: product.unit,
      unitPriceCents: product.unitPriceCents
    })

    setAddedToCart(prev => new Set(prev).add(product.id))

    setTimeout(() => {
      setAddedToCart(prev => {
        const newSet = new Set(prev)
        newSet.delete(product.id)
        return newSet
      })
    }, 2000)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imboni-blue"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !supplier) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Supplier Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This supplier does not exist.'}</p>
          <button
            onClick={() => router.push('/store')}
            className="bg-imboni-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Marketplace
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const availableProducts = supplier.marketplaceProducts.filter(p => p.isAvailable)

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-imboni-blue to-blue-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold">{supplier.name}</h1>
                {supplier.isVerified && (
                  <span className="flex items-center gap-1 bg-green-500 text-white text-sm px-3 py-1 rounded-full">
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </span>
                )}
              </div>
              {supplier.description && (
                <p className="text-blue-100 mb-4">{supplier.description}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{supplier.city}{supplier.district ? `, ${supplier.district}` : ''}, {supplier.country}</span>
                </div>
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{supplier.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Package className="w-6 h-6 text-imboni-orange" />
            Available Products ({availableProducts.length})
          </h2>

          {availableProducts.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No products available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{product.name}</h3>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-2xl font-bold text-imboni-orange">
                      <CurrencyDisplay amount={product.unitPriceCents} inCents={true} />
                    </div>
                    <div className="text-sm text-gray-600">per {product.unit}</div>
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    className={`w-full font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${
                      addedToCart.has(product.id)
                        ? 'bg-green-500 text-white'
                        : 'bg-gradient-to-r from-imboni-orange to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {addedToCart.has(product.id) ? 'Added to Cart!' : 'Add to Cart'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => router.push('/store')}
            className="text-imboni-blue hover:text-blue-700 font-semibold"
          >
            ← Back to Marketplace
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
