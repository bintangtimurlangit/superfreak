/**
 * Biteship shipping rates – used for checkout shipping cost calculation.
 * Replaces RajaOngkir (Komerce) for reliability.
 */

export interface ShippingService {
  courierCode?: string
  name: string
  code: string
  service: string
  description: string
  cost: number
  etd: string
}

export interface ShippingCostResponse {
  meta: {
    message: string
    code: number
    status: string
  }
  data: ShippingService[]
}

/**
 * Calculate shipping cost via Biteship for one or more couriers (by origin/destination postal code).
 * One request returns all services for all requested couriers.
 * @param destinationPostalCode - 5-digit destination postal code (from address)
 * @param weight - Total weight in grams
 * @param couriers - One courier code or array (e.g. ["jne", "jnt", "sicepat"])
 */
export async function calculateShippingCost(
  destinationPostalCode: string,
  weight: number,
  couriers: string | string[],
): Promise<ShippingCostResponse> {
  const body: { destinationPostalCode: string; weight: number; courier?: string; couriers?: string[] } = {
    destinationPostalCode: String(destinationPostalCode).replace(/\D/g, '').slice(0, 5),
    weight,
  }
  if (Array.isArray(couriers)) {
    body.couriers = couriers.map((c) => String(c).trim().toLowerCase()).filter(Boolean)
  } else {
    body.courier = String(couriers).trim().toLowerCase()
  }

  const { api, isUsingNestApi } = await import('@/lib/api-client')
  const { SHIPPING } = await import('@/lib/api/urls')
  if (!isUsingNestApi()) {
    throw new Error('Shipping rates require the Nest API (set NEXT_PUBLIC_API_URL).')
  }
  const res = await api.post(SHIPPING.biteshipRates, body)
  const response = typeof (res as { ok?: boolean }).ok === 'boolean' ? res as { ok: boolean; json: () => Promise<unknown> } : res as Response
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { error?: string; details?: string }
    const parts = [error.error || 'Failed to calculate shipping cost']
    if (error.details) parts.push(String(error.details))
    throw new Error(parts.join(' — '))
  }
  return response.json()
}

/**
 * If weight < 300g, add 300g for packaging.
 */
export function calculateShippingWeight(modelWeight: number): number {
  return modelWeight < 300 ? modelWeight + 300 : modelWeight
}
