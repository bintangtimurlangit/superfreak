/**
 * Biteship shipping rates – used for checkout shipping cost calculation.
 * Replaces RajaOngkir (Komerce) for reliability.
 */

export interface ShippingService {
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
 * Calculate shipping cost via Biteship (origin/destination by postal code).
 * @param destinationPostalCode - 5-digit destination postal code (from address)
 * @param weight - Total weight in grams
 * @param courier - Courier code (jne, jnt, sicepat, etc.)
 */
export async function calculateShippingCost(
  destinationPostalCode: string,
  weight: number,
  courier: string,
): Promise<ShippingCostResponse> {
  const response = await fetch('/api/biteship/rates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      destinationPostalCode: String(destinationPostalCode).replace(/\D/g, '').slice(0, 5),
      weight,
      courier,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error', details: null }))
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
