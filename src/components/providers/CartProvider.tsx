'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuthSession } from '@/lib/auth/use-auth-session'
import { type CartItem } from '@/lib/cart'
import { CART } from '@/lib/api/urls'

type CartContextValue = {
  cart: CartItem[]
  setCart: (items: CartItem[]) => void
  clearCart: () => void
  cartCount: number
  isLoading: boolean
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCartState] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { data: session, isPending: sessionLoading } = useAuthSession()
  const isAuthenticated = !!session?.user

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartState([])
      setIsLoading(false)
      return
    }
    try {
      const { api, isUsingNestApi } = await import('@/lib/api-client')
      const res = isUsingNestApi() ? await api.get(CART) : await fetch(CART, { credentials: 'include' })
      const data = await res.json()
      setCartState(Array.isArray(data?.items) ? data.items : [])
    } catch {
      setCartState([])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (sessionLoading) return
    loadCart()
  }, [loadCart, sessionLoading])

  const setCart = useCallback(
    async (items: CartItem[]) => {
      setCartState(items)
      if (!isAuthenticated) return
      try {
        const { api, isUsingNestApi } = await import('@/lib/api-client')
        if (isUsingNestApi()) {
          await api.post(CART, { items })
        } else {
          await fetch(CART, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ items }),
          })
        }
      } catch (e) {
        console.error('Failed to persist cart', e)
      }
    },
    [isAuthenticated],
  )

  const clearCart = useCallback(async () => {
    setCartState([])
    if (!isAuthenticated) return
    try {
      const { api, isUsingNestApi } = await import('@/lib/api-client')
      if (isUsingNestApi()) {
        await api.delete(CART)
      } else {
        await fetch(CART, { method: 'DELETE', credentials: 'include' })
      }
    } catch (e) {
      console.error('Failed to clear cart', e)
    }
  }, [isAuthenticated])

  const cartCount = cart.reduce((sum, item) => sum + (item.configuration?.quantity ?? 1), 0)

  return (
    <CartContext.Provider value={{ cart, setCart, clearCart, cartCount, isLoading }}>
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
