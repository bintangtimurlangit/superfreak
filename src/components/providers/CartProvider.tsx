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

function tryParseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function normalizeConfiguration(raw: unknown): CartItem['configuration'] {
  const v = tryParseJson(raw) as Record<string, unknown> | null
  if (!v || typeof v !== 'object') return undefined

  const material =
    (v.material as string | undefined) ??
    (v.filament_type as string | undefined) ??
    (v.filamentType as string | undefined)
  const color =
    (v.color as string | undefined) ??
    (v.filament_color as string | undefined) ??
    (v.filamentColor as string | undefined)
  const layerHeightRaw = v.layerHeight ?? v.layer_height
  const infillRaw = v.infill ?? v.infill_density
  const wallCountRaw = v.wallCount ?? v.wall_count
  const quantityRaw = v.quantity

  const layerHeight =
    typeof layerHeightRaw === 'number'
      ? String(layerHeightRaw)
      : (layerHeightRaw as string | undefined)
  const infill =
    typeof infillRaw === 'number' ? `${infillRaw}%` : (infillRaw as string | undefined)
  const wallCount =
    typeof wallCountRaw === 'number' ? String(wallCountRaw) : (wallCountRaw as string | undefined)
  const quantity =
    typeof quantityRaw === 'number'
      ? quantityRaw
      : typeof quantityRaw === 'string'
        ? Number(quantityRaw)
        : undefined

  const hasAny =
    !!material || !!color || !!layerHeight || !!infill || !!wallCount || Number.isFinite(quantity)
  if (!hasAny) return undefined

  return {
    material,
    color,
    layerHeight,
    infill,
    wallCount,
    quantity: Number.isFinite(quantity) && (quantity as number) > 0 ? (quantity as number) : 1,
  }
}

function normalizeStatistics(raw: unknown): CartItem['statistics'] {
  const v = tryParseJson(raw) as Record<string, unknown> | null
  if (!v || typeof v !== 'object') return undefined

  const print_time_minutes = Number(v.print_time_minutes ?? v.printTime ?? 0)
  const filament_weight_g = Number(v.filament_weight_g ?? v.filamentWeight ?? 0)
  const hasAnyStats = Number.isFinite(print_time_minutes) && Number.isFinite(filament_weight_g) && filament_weight_g > 0
  if (!hasAnyStats) return undefined

  return {
    print_time_minutes,
    print_time_formatted: String(v.print_time_formatted ?? v.printTimeFormatted ?? ''),
    filament_length_mm: Number(v.filament_length_mm ?? v.filamentLength ?? 0),
    filament_volume_cm3: Number(v.filament_volume_cm3 ?? v.filamentVolume ?? 0),
    filament_weight_g,
    filament_type: String(v.filament_type ?? v.filamentType ?? ''),
    layer_height: Number(v.layer_height ?? v.layerHeight ?? 0),
    infill_density: Number(v.infill_density ?? v.infillDensity ?? 0),
    wall_count: Number(v.wall_count ?? v.wallCount ?? 0),
  }
}

function normalizeCartItem(raw: unknown): CartItem | null {
  const item = tryParseJson(raw) as Record<string, unknown> | null
  if (!item || typeof item !== 'object') return null

  const id = String(item.id ?? item._id ?? item.tempFileId ?? item.file ?? '')
  const name = String(item.name ?? item.fileName ?? 'Model')
  const size = Number(item.size ?? item.fileSize ?? 0)
  const tempFileId = (item.tempFileId ?? item.temp_file_id ?? item.file) as string | undefined

  const configuration =
    normalizeConfiguration(item.configuration) ??
    normalizeConfiguration(item.config) ??
    normalizeConfiguration(item.printConfig) ??
    undefined

  const statistics =
    normalizeStatistics(item.statistics) ??
    normalizeStatistics(item.sliceStats) ??
    undefined

  if (!id) return null

  return {
    id,
    name,
    size: Number.isFinite(size) ? size : 0,
    tempFileId: tempFileId ? String(tempFileId) : undefined,
    configuration,
    statistics,
  }
}

function normalizeCartItems(rawItems: unknown): CartItem[] {
  const list = Array.isArray(rawItems) ? rawItems : []
  return list.map(normalizeCartItem).filter((x): x is CartItem => !!x)
}

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
      setCartState(normalizeCartItems((data as { items?: unknown[] })?.items))
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
