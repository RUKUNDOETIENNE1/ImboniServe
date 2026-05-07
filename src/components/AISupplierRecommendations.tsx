import { useState, useEffect } from 'react'
import { Sparkles, MapPin, DollarSign, Package, Award, TrendingUp, Loader2 } from 'lucide-react'
import { useRouter } from 'next/router'

interface SupplierScore {
  supplierId: string
  supplier: {
    id: string
    name: string
    city: string
    district?: string | null
    isVerified: boolean
    description?: string | null
  }
  totalScore: number
  scores: {
    proximity: number
    pricing: number
    availability: number
    reliability: number
  }
  distance?: number
  reasoning: string
  simpleReasoning?: string
  isBestChoice?: boolean
  userPreferenceBoost?: number
}

interface AISupplierRecommendationsProps {
  category?: string
  maxResults?: number
  showInsights?: boolean
}

export default function AISupplierRecommendations({
  category,
  maxResults = 5,
  showInsights = true
}: AISupplierRecommendationsProps) {
  const router = useRouter()
  const [recommendations, setRecommendations] = useState<SupplierScore[]>([])
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecommendations()
  }, [category])

  const fetchRecommendations = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (showInsights) params.append('detailed', 'true')

      const response = await fetch(`/api/marketplace/recommendations?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const data = await response.json()
      
      if (showInsights && data.recommendations) {
        setRecommendations(data.recommendations.slice(0, maxResults))
        setInsights(data.insights)
      } else {
        setRecommendations(data.slice(0, maxResults))
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-orange-600 bg-orange-100'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-green-500' }
    if (score >= 80) return { label: 'Very Good', color: 'bg-green-400' }
    if (score >= 70) return { label: 'Good', color: 'bg-yellow-500' }
    if (score >= 60) return { label: 'Fair', color: 'bg-yellow-400' }
    return { label: 'Average', color: 'bg-orange-500' }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-imboni-blue" />
        <p className="text-gray-600">Analyzing suppliers with AI...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p>{error}</p>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600">No supplier recommendations available at the moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">AI-Powered Supplier Recommendations</h3>
          <p className="text-sm text-gray-600">
            Smart suggestions based on location, pricing, availability & reliability
          </p>
        </div>
      </div>

      {showInsights && insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {insights.nearestSupplier && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Nearest Supplier</span>
              </div>
              <p className="text-sm text-blue-800">{insights.nearestSupplier.supplier.name}</p>
              {insights.nearestSupplier.distance && (
                <p className="text-xs text-blue-600 mt-1">
                  {insights.nearestSupplier.distance.toFixed(1)} km away
                </p>
              )}
            </div>
          )}

          {insights.bestPriceSupplier && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-900">Best Pricing</span>
              </div>
              <p className="text-sm text-green-800">{insights.bestPriceSupplier.supplier.name}</p>
              <p className="text-xs text-green-600 mt-1">
                Score: {insights.bestPriceSupplier.scores.pricing.toFixed(0)}/100
              </p>
            </div>
          )}

          {insights.mostReliable && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-900">Most Reliable</span>
              </div>
              <p className="text-sm text-purple-800">{insights.mostReliable.supplier.name}</p>
              <p className="text-xs text-purple-600 mt-1">
                Score: {insights.mostReliable.scores.reliability.toFixed(0)}/100
              </p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {recommendations.map((rec, index) => {
          const badge = getScoreBadge(rec.totalScore)
          return (
            <div
              key={rec.supplierId}
              className={`bg-white rounded-lg p-5 hover:shadow-lg transition-shadow cursor-pointer ${
                rec.isBestChoice
                  ? 'border-2 border-gradient-to-r from-purple-500 to-pink-500 shadow-md'
                  : 'border border-gray-200'
              }`}
              onClick={() => router.push(`/store/supplier/${rec.supplierId}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-imboni-blue to-imboni-orange text-white font-bold text-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-bold text-lg text-gray-900">{rec.supplier.name}</h4>
                      {rec.isBestChoice && (
                        <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full font-bold animate-pulse">
                          🏆 RECOMMENDED FOR YOU
                        </span>
                      )}
                      {rec.supplier.isVerified && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {rec.supplier.city}
                        {rec.supplier.district ? `, ${rec.supplier.district}` : ''}
                      </span>
                      {rec.distance && (
                        <span className="text-imboni-orange font-medium">
                          • {rec.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                    {rec.simpleReasoning && (
                      <p className="text-sm font-medium text-imboni-blue">
                        💡 {rec.simpleReasoning}
                      </p>
                    )}
                    {rec.userPreferenceBoost && rec.userPreferenceBoost > 0 && (
                      <p className="text-xs text-purple-600 mt-1">
                        ⭐ You've ordered from this supplier before
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.color} text-white`}>
                    <TrendingUp className="w-3 h-3" />
                    {badge.label}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Score: {rec.totalScore.toFixed(0)}/100
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className={`text-xs font-semibold px-2 py-1 rounded ${getScoreColor(rec.scores.proximity)}`}>
                    {rec.scores.proximity.toFixed(0)}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Proximity</p>
                </div>
                <div className="text-center">
                  <div className={`text-xs font-semibold px-2 py-1 rounded ${getScoreColor(rec.scores.pricing)}`}>
                    {rec.scores.pricing.toFixed(0)}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Pricing</p>
                </div>
                <div className="text-center">
                  <div className={`text-xs font-semibold px-2 py-1 rounded ${getScoreColor(rec.scores.availability)}`}>
                    {rec.scores.availability.toFixed(0)}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Stock</p>
                </div>
                <div className="text-center">
                  <div className={`text-xs font-semibold px-2 py-1 rounded ${getScoreColor(rec.scores.reliability)}`}>
                    {rec.scores.reliability.toFixed(0)}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Reliability</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
