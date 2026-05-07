import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Clock, MapPin, CheckCircle } from 'lucide-react'
import { getRecentlyViewed } from '@/lib/utils/recentlyViewed'

export default function RecentlyViewedSuppliers() {
  const router = useRouter()
  const [recentSuppliers, setRecentSuppliers] = useState<any[]>([])

  useEffect(() => {
    setRecentSuppliers(getRecentlyViewed())
  }, [])

  if (recentSuppliers.length === 0) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-600" />
        <h2 className="text-xl font-bold text-gray-900">Recently Viewed</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {recentSuppliers.map((supplier) => (
          <button
            key={supplier.id}
            onClick={() => router.push(`/store/supplier/${supplier.id}`)}
            className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-imboni-blue hover:shadow-md transition-all text-left"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                {supplier.name}
              </h3>
              {supplier.isVerified && (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 ml-1" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <MapPin className="w-3 h-3" />
              <span className="line-clamp-1">{supplier.city}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
