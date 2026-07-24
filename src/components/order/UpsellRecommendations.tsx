import { useState, useEffect } from 'react'
import { TrendingUp, Plus } from 'lucide-react'
import CurrencyDisplay from '@/components/CurrencyDisplay'

interface CartItem {
  menuItemId: string
  name: string
  priceCents: number
  quantity: number
}

interface MenuItem {
  id: string
  name: string
  priceCents: number
  category?: string | null
  isAvailable?: boolean
  imageReal?: string | null
}

interface UpsellRecommendationsProps {
  cartItems: CartItem[]
  menu: MenuItem[]
  onAddToCart: (item: MenuItem) => void
}

export default function UpsellRecommendations({ cartItems, menu, onAddToCart }: UpsellRecommendationsProps) {
  const [suggestions, setSuggestions] = useState<MenuItem[]>([])
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (cartItems.length === 0) {
      setSuggestions([])
      return
    }

    const cartItemIds = new Set(cartItems.map(i => i.menuItemId))
    const cartCategories = cartItems
      .map(i => menu.find(m => m.id === i.menuItemId)?.category)
      .filter(Boolean) as string[]

    const related = menu.filter(item => {
      if (item.isAvailable === false) return false
      if (cartItemIds.has(item.id)) return false
      if (item.category && cartCategories.includes(item.category)) return true
      const complementaryCategories = ['Drinks', 'Beverages', 'Sides', 'Desserts', 'Appetizers']
      if (item.category && complementaryCategories.some(cat =>
        item.category?.toLowerCase().includes(cat.toLowerCase())
      )) {
        return true
      }
      return false
    })

    const sorted = related
      .sort((a, b) => a.priceCents - b.priceCents)
      .slice(0, 3)

    setSuggestions(sorted)
  }, [cartItems, menu])

  const handleAdd = (item: MenuItem) => {
    onAddToCart(item)
    setAddedItems(prev => new Set(prev).add(item.id))

    try {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'upsell_converted',
          entityType: 'MenuItem',
          entityId: item.id,
          metadata: { source: 'cart_upsell' }
        })
      }).catch(() => {})
    } catch {}

    setTimeout(() => {
      setSuggestions(prev => prev.filter(s => s.id !== item.id))
    }, 500)
  }

  if (suggestions.length === 0) return null

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-300 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-amber-900" />
        <h3 className="text-base font-bold text-amber-900">
          Complete Your Meal
        </h3>
      </div>
      <p className="text-sm text-amber-800 mb-3">
        Popular add-ons with your order:
      </p>
      <div className="grid gap-2">
        {suggestions.map(item => {
          const isAdded = addedItems.has(item.id)
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between gap-2 p-3 bg-white rounded-lg border border-amber-200 transition-all ${isAdded ? 'opacity-60' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-imboni-dark truncate">
                  {item.name}
                </div>
                <div className="text-xs text-amber-800 mt-0.5">
                  +<CurrencyDisplay amount={item.priceCents} inCents />
                </div>
              </div>
              <button
                onClick={() => handleAdd(item)}
                disabled={isAdded}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-amber-400/30 ${
                  isAdded
                    ? 'bg-gray-300 cursor-default'
                    : 'bg-gradient-to-br from-amber-500 to-amber-600 hover:shadow-md active:scale-95'
                }`}
                aria-label={`Add ${item.name} to cart`}
              >
                {isAdded ? (
                  '✓ Added'
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-amber-800 mt-2.5 text-center italic">
        Tip: Adding sides or drinks often saves on delivery fees
      </p>
    </div>
  )
}
