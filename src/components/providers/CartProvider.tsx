'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getCart, setCart as setCartStorage, clearCart as clearCartStorage, type CartItem } from '@/lib/cart'

type CartContextValue = {
  cart: CartItem[]
  setCart: (items: CartItem[]) => void
  clearCart: () => void
  cartCount: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCartState] = useState<CartItem[]>([])

  const loadCart = useCallback(() => {
    setCartState(getCart())
  }, [])

  useEffect(() => {
    loadCart()
    window.addEventListener('cart-updated', loadCart)
    return () => window.removeEventListener('cart-updated', loadCart)
  }, [loadCart])

  const setCart = useCallback((items: CartItem[]) => {
    setCartState(items)
    setCartStorage(items)
  }, [])

  const clearCart = useCallback(() => {
    setCartState([])
    clearCartStorage()
  }, [])

  const cartCount = cart.reduce((sum, item) => sum + (item.configuration?.quantity ?? 1), 0)

  return (
    <CartContext.Provider value={{ cart, setCart, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider')
  }
  return ctx
}
