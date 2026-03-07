/**
 * Cart types. Persistence is handled by the backend (Payload `carts` collection)
 * via GET/PUT/DELETE /api/cart and CartProvider. Use useCart() for reading/updating the cart.
 */

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
