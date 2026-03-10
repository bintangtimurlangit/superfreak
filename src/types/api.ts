/**
 * Shared API types (replaces payload-types for frontend).
 * Aligned with NestJS API and existing frontend usage.
 */

export type OrderStatus =
  | 'unpaid'
  | 'in-review'
  | 'needs-discussion'
  | 'printing'
  | 'shipping'
  | 'in-delivery'
  | 'delivered'
  | 'completed'
  | 'canceled'

export interface OrderItem {
  file: string
  fileName: string
  fileSize?: number | null
  quantity: number
  configuration: {
    material: string
    color: string
    layerHeight: string
    infill: string
    wallCount: string
  }
  statistics?: {
    printTime?: number | null
    filamentWeight?: number | null
  }
  pricing: {
    pricePerGram: number
  }
  totalPrice: number
  id?: string | null
}

export interface OrderPaymentInfo {
  paymentMethod?: 'bank_transfer' | 'credit_card' | 'e_wallet' | null
  specificPaymentMethod?: string | null
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded' | null
  transactionId?: string | null
  paidAt?: string | null
  midtransOrderId?: string | null
  midtransSnapToken?: string | null
  midtransSnapUrl?: string | null
  paymentExpiry?: string | null
}

export interface OrderSummary {
  subtotal: number
  shippingCost: number
  totalAmount: number
  totalWeight?: number | null
  totalPrintTime?: number | null
}

export interface OrderShipping {
  addressId?: string | null
  recipientName?: string | null
  phoneNumber?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  villageName?: string | null
  districtName?: string | null
  regencyName?: string | null
  provinceName?: string | null
  postalCode?: string | null
  courier?: string | null
  service?: string | null
  estimatedDelivery?: string | null
  shippingCost?: number | null
  totalWeight?: number | null
  trackingNumber?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
}

export interface Order {
  id: string
  orderNumber?: string | null
  user?: string | null
  status: OrderStatus
  items: OrderItem[]
  paymentInfo?: OrderPaymentInfo | null
  summary: OrderSummary
  shipping?: OrderShipping | null
  adminNotes?: string | null
  customerNotes?: string | null
  statusHistory?: { status: string; changedAt: string; changedBy?: string | null; id?: string | null }[] | null
  updatedAt: string
  createdAt: string
}

// Printing (NestJS /api/printing/*)
export interface FilamentTypeColor {
  name: string
  hexCode?: string | null
  id?: string | null
}

export interface FilamentType {
  id: string
  name: string
  colors?: FilamentTypeColor[] | null
  isActive?: boolean | null
  description?: string | null
  updatedAt?: string
  createdAt?: string
}

export interface PrintingPricingTableRow {
  layerHeight: number
  pricePerGram: number
  id?: string | null
}

export interface PrintingPricing {
  id: string
  filamentType: string | FilamentType
  pricingTable: PrintingPricingTableRow[]
  isActive?: boolean | null
  title?: string | null
  updatedAt?: string
  createdAt?: string
}

export interface PrintingOptionValue {
  label: string
  value: string
  isActive?: boolean | null
  id?: string | null
}

export interface PrintingOption {
  id: string
  type: 'infill' | 'wallCount'
  values?: PrintingOptionValue[] | null
  maxValue?: number | null
  isActive?: boolean | null
  description?: string | null
  updatedAt?: string
  createdAt?: string
}
