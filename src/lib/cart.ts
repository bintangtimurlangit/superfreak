/**
 * Cart persistence (sessionStorage). Cart holds serializable item data only (no File objects).
 * Used when user completes "Review Model" and cleared when order is created.
 */

const CART_STORAGE_KEY = 'cart'

export interface CartItem {
  id: string
  name: string
  size: number
  tempFileId?: string
  configuration?: {
    material?: string
    color?: string
    layerHeight?: string
    infill?: string
    wallCount?: string
    quantity?: number
    [key: string]: string | number | boolean | undefined
  }
  statistics?: {
    print_time_minutes: number
    print_time_formatted: string
    filament_length_mm: number
    filament_volume_cm3: number
    filament_weight_g: number
    filament_type: string
    layer_height: number
    infill_density: number
    wall_count: number
  }
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function setCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new Event('cart-updated'))
  } catch {
    // ignore
  }
}

export function clearCart(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(CART_STORAGE_KEY)
    window.dispatchEvent(new Event('cart-updated'))
  } catch {
    // ignore
  }
}
