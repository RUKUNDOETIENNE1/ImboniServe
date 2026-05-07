import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useToast } from '@/components/Toast'

interface CartItem {
  productId: string
  productName: string
  supplierId: string
  supplierName: string
  category: string
  unit: string
  unitPriceCents: number
  quantity: number
}

interface CartContextType {
  cart: CartItem[]
  cartCount: number
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  refreshCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const { showToast } = useToast()

  useEffect(() => {
    refreshCart()
  }, [])

  const refreshCart = () => {
    const savedCart = localStorage.getItem('marketplace_cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem('marketplace_cart', JSON.stringify(newCart))
  }

  const addToCart = (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    const existingItem = cart.find(i => i.productId === item.productId)
    
    if (existingItem) {
      const newCart = cart.map(i =>
        i.productId === item.productId
          ? { ...i, quantity: i.quantity + quantity }
          : i
      )
      saveCart(newCart)
      showToast('success', `Updated ${item.productName} quantity`)
    } else {
      saveCart([...cart, { ...item, quantity }])
      showToast('success', `${item.productName} added to cart!`)
    }
  }

  const removeFromCart = (productId: string) => {
    const item = cart.find(i => i.productId === productId)
    saveCart(cart.filter(item => item.productId !== productId))
    if (item) {
      showToast('info', `${item.productName} removed from cart`)
    }
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      saveCart(cart.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ))
    }
  }

  const clearCart = () => {
    const itemCount = cart.length
    saveCart([])
    if (itemCount > 0) {
      showToast('info', 'Cart cleared')
    }
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
