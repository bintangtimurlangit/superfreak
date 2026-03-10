/**
 * Central list of all API URLs/paths used by the frontend.
 * Use these constants instead of string literals so paths are defined in one place.
 *
 * When NEXT_PUBLIC_API_URL is set, requests go to NestJS (these paths are relative to that base).
 * Otherwise they hit Next.js API routes (same paths under the app origin).
 */

// —— Auth (NestJS: /api/auth/*) ——
export const AUTH = {
  login: '/api/auth/login',
  register: '/api/auth/register',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
  changePassword: '/api/auth/change-password',
} as const

// —— Health ——
export const HEALTH = '/health' as const

// —— Cart ——
export const CART = '/api/cart' as const

// —— Printing (NestJS: /api/printing/*) ——
export const PRINTING = {
  filamentTypes: '/api/printing/filament-types',
  options: '/api/printing/options',
  pricing: '/api/printing/pricing',
} as const

// —— Settings ——
export const SETTINGS = {
  courier: '/api/settings/courier',
} as const

// —— Orders ——
export const ORDERS = {
  base: '/api/orders',
  byId: (id: string) => `/api/orders/${id}`,
  messages: (orderId: string) => `/api/orders/${orderId}/messages`,
  messagesStream: (orderId: string) => `/api/orders/${orderId}/messages/stream`,
  cancel: (orderId: string) => `/api/orders/${orderId}/cancel`,
  invoice: (orderId: string) => `/api/orders/${orderId}/invoice`,
} as const

// —— Payment ——
export const PAYMENT = {
  initialize: '/api/payment/initialize',
  verify: '/api/payment/verify',
} as const

// —— User addresses ——
export const USER_ADDRESSES = {
  base: '/api/user-addresses',
  byId: (id: string) => `/api/user-addresses/${id}`,
} as const

// —— Addresses (Nest: /api/addresses; Payload: /api/user-addresses) ——
export const ADDRESSES = {
  base: '/api/addresses',
  byId: (id: string) => `/api/addresses/${id}`,
} as const

// —— Wilayah ——
export const WILAYAH = {
  provinces: '/api/wilayah/provinces',
  regencies: (provinceCode: string) => `/api/wilayah/regencies/${provinceCode}`,
  districts: (regencyCode: string) => `/api/wilayah/districts/${regencyCode}`,
  villages: (districtCode: string) => `/api/wilayah/villages/${districtCode}`,
} as const

// —— Slice ——
export const SLICE = '/api/slice' as const

// —— Files ——
export const FILES = {
  temp: '/api/files/temp',
  finalize: '/api/files/finalize',
} as const

// —— Blog ——
export const BLOG = {
  base: '/api/blog',
  bySlug: (slug: string) => `/api/blog/${slug}`,
} as const

// —— Shipping (Nest: /api/shipping/*; Payload/Next: /api/rajaongkir/*, /api/biteship/*) ——
export const RAJAONGKIR = {
  searchDestination: '/api/rajaongkir/search-destination',
  calculateCost: '/api/rajaongkir/calculate-cost',
} as const
export const BITESHIP = {
  rates: '/api/biteship/rates',
} as const
export const SHIPPING = {
  biteshipRates: '/api/shipping/biteship/rates',
  rajaongkirCalculateCost: '/api/shipping/rajaongkir/calculate-cost',
  rajaongkirSearchDestination: '/api/shipping/rajaongkir/search-destination',
} as const

// —— Users (NestJS: /api/users/*) ——
export const USERS = {
  me: '/api/users/me',
  profileImage: '/api/users/profile-image',
} as const

// —— Profile (Payload/Next API fallback) ——
export const PROFILE = {
  image: '/api/profile-image',
} as const

// —— Payload-style endpoints (when not using Nest) ——
export const PAYLOAD = {
  printingPricing: '/api/printing-pricing',
  courierSettings: '/api/globals/courier-settings',
} as const

// —— Single export object if you prefer namespaced usage ——
export const API_URLS = {
  AUTH,
  HEALTH,
  CART,
  PRINTING,
  SETTINGS,
  ORDERS,
  PAYMENT,
  USER_ADDRESSES,
  ADDRESSES,
  WILAYAH,
  SLICE,
  FILES,
  BLOG,
  RAJAONGKIR,
  BITESHIP,
  SHIPPING,
  USERS,
  PROFILE,
  PAYLOAD,
} as const
