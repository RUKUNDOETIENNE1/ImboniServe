import { useState, useEffect } from 'react'
import { TrendingUp, Plus } from 'lucide-react'

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

    // Simple collaborative filtering
    const cartItemIds = new Set(cartItems.map(i => i.menuItemId))
    const cartCategories = cartItems
      .map(i => menu.find(m => m.id === i.menuItemId)?.category)
      .filter(Boolean) as string[]

    // Find complementary items from same or related categories
    const related = menu.filter(item => {
      if (item.isAvailable === false) return false
      if (cartItemIds.has(item.id)) return false
      
      // Prefer items from same categories
      if (item.category && cartCategories.includes(item.category)) {
        return true
      }
      
      // Also include popular categories that complement meals
      const complementaryCategories = ['Drinks', 'Beverages', 'Sides', 'Desserts', 'Appetizers']
      if (item.category && complementaryCategories.some(cat => 
        item.category?.toLowerCase().includes(cat.toLowerCase())
      )) {
        return true
      }
      
      return false
    })

    // Sort by price (prefer affordable add-ons) and limit to 3
    const sorted = related
      .sort((a, b) => a.priceCents - b.priceCents)
      .slice(0, 3)

    setSuggestions(sorted)
  }, [cartItems, menu])

  const handleAdd = (item: MenuItem) => {
    onAddToCart(item)
    setAddedItems(prev => new Set(prev).add(item.id))
    
    // Track upsell conversion
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

    // Remove from suggestions after adding
    setTimeout(() => {
      setSuggestions(prev => prev.filter(s => s.id !== item.id))
    }, 500)
  }

  if (suggestions.length === 0) return null

  return (
    <div style={{ 
      marginTop: 16, 
      padding: 16, 
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
      borderRadius: 12, 
      border: '2px solid #fbbf24',
      boxShadow: '0 4px 6px rgba(251, 191, 36, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <TrendingUp style={{ width: 20, height: 20, color: '#78350f' }} />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#78350f' }}>
          Complete Your Meal
        </h3>
      </div>
      <p style={{ fontSize: 13, color: '#92400e', marginBottom: 12, marginTop: 0 }}>
        ⭐ Popular add-ons with your order:
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {suggestions.map(item => {
          const isAdded = addedItems.has(item.id)
          return (
            <div 
              key={item.id} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 12,
                background: 'white',
                borderRadius: 8,
                border: '1px solid #fbbf24',
                transition: 'all 0.2s',
                opacity: isAdded ? 0.6 : 1
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: 12, color: '#78350f', marginTop: 2 }}>
                  +RWF {(item.priceCents / 100).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => handleAdd(item)}
                disabled={isAdded}
                style={{
                  padding: '8px 16px',
                  background: isAdded ? '#d1d5db' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: isAdded ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.2s',
                  boxShadow: isAdded ? 'none' : '0 2px 4px rgba(245, 158, 11, 0.3)'
                }}
              >
                {isAdded ? (
                  '✓ Added'
                ) : (
                  <>
                    <Plus style={{ width: 14, height: 14 }} />
                    Add
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>
      <p style={{ 
        fontSize: 11, 
        color: '#92400e', 
        marginTop: 10, 
        marginBottom: 0,
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        💡 Tip: Adding sides or drinks often saves on delivery fees
      </p>
    </div>
  )
}
