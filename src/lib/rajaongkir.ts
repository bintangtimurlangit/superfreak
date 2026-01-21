interface WilayahData {
  provinceName: string
  regencyName: string
  districtName: string
  villageName: string
}

export interface RajaOngkirResult {
  id: number
  label: string
  province_name: string
  city_name: string
  district_name: string
  subdistrict_name: string
  zip_code: string
}

interface RajaOngkirResponse {
  meta: {
    message: string
    code: number
    status: string
  }
  data: RajaOngkirResult[] | null
}

/**
 * Search RajaOngkir for a location match
 * @param query - Search query (e.g., "Senayan, Kebayoran Baru, Jakarta Selatan")
 * @returns RajaOngkir API response
 */
export async function searchRajaOngkirLocation(query: string): Promise<RajaOngkirResponse> {
  const response = await fetch(
    `/api/rajaongkir/search-destination?query=${encodeURIComponent(query)}&limit=20`,
  )

  if (!response.ok) {
    throw new Error('Failed to search RajaOngkir location')
  }

  return response.json()
}

/**
 * Find the best matching RajaOngkir location from search results
 * @param results - Array of RajaOngkir search results
 * @param wilayahData - Original location data from wilayah.id
 * @returns Best matching result or null
 */
export function findBestMatch(
  results: RajaOngkirResult[],
  wilayahData: WilayahData,
): RajaOngkirResult | null {
  if (!results || results.length === 0) return null

  // Normalize strings for comparison (lowercase, trim)
  const normalize = (str: string) => str.toLowerCase().trim()

  const normalizedWilayah = {
    province: normalize(wilayahData.provinceName),
    regency: normalize(wilayahData.regencyName),
    district: normalize(wilayahData.districtName),
    village: normalize(wilayahData.villageName),
  }

  // Try exact match (all fields)
  const exactMatch = results.find(
    (r) =>
      normalize(r.subdistrict_name || '') === normalizedWilayah.village &&
      normalize(r.district_name || '') === normalizedWilayah.district &&
      normalize(r.city_name || '') === normalizedWilayah.regency &&
      normalize(r.province_name || '') === normalizedWilayah.province,
  )

  if (exactMatch) return exactMatch

  // Try match without subdistrict (district + city + province)
  const districtMatch = results.find(
    (r) =>
      normalize(r.district_name || '') === normalizedWilayah.district &&
      normalize(r.city_name || '') === normalizedWilayah.regency &&
      normalize(r.province_name || '') === normalizedWilayah.province,
  )

  if (districtMatch) return districtMatch

  // Try match with city + province only
  const cityMatch = results.find(
    (r) =>
      normalize(r.city_name || '') === normalizedWilayah.regency &&
      normalize(r.province_name || '') === normalizedWilayah.province,
  )

  if (cityMatch) return cityMatch

  // Return first result as fallback
  return results[0] || null
}

/**
 * Match wilayah.id location data to RajaOngkir location
 * @param wilayahData - Location data from wilayah.id
 * @returns RajaOngkir location data or null if not found
 */
export async function matchRajaOngkirLocation(
  wilayahData: WilayahData,
): Promise<RajaOngkirResult | null> {
  try {
    // Try full query first: "Village, District, City"
    const fullQuery = `${wilayahData.villageName}, ${wilayahData.districtName}, ${wilayahData.regencyName}`
    let response = await searchRajaOngkirLocation(fullQuery)

    if (response.data && response.data.length > 0) {
      const match = findBestMatch(response.data, wilayahData)
      if (match) return match
    }

    // Try simpler query: "Village City"
    const simpleQuery = `${wilayahData.villageName} ${wilayahData.regencyName}`
    response = await searchRajaOngkirLocation(simpleQuery)

    if (response.data && response.data.length > 0) {
      const match = findBestMatch(response.data, wilayahData)
      if (match) return match
    }

    // Try district + city
    const districtQuery = `${wilayahData.districtName}, ${wilayahData.regencyName}`
    response = await searchRajaOngkirLocation(districtQuery)

    if (response.data && response.data.length > 0) {
      const match = findBestMatch(response.data, wilayahData)
      if (match) return match
    }

    return null
  } catch (error) {
    console.error('Error matching RajaOngkir location:', error)
    return null
  }
}

/**
 * Shipping cost calculation types
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
 * Calculate shipping cost for an order
 * @param destinationId - RajaOngkir destination ID
 * @param weight - Total weight in grams
 * @param courier - Courier code (jne, jnt, sicepat, etc.)
 * @returns Shipping cost data
 */
export async function calculateShippingCost(
  destinationId: number,
  weight: number,
  courier: string,
): Promise<ShippingCostResponse> {
  const response = await fetch('/api/rajaongkir/calculate-cost', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      destinationId,
      weight,
      courier,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to calculate shipping cost')
  }

  return response.json()
}

/**
 * Calculate total model weight with packaging offset
 * If weight < 300g, add 300g for packaging
 * @param modelWeight - Total weight of 3D models in grams
 * @returns Adjusted weight for shipping calculation
 */
export function calculateShippingWeight(modelWeight: number): number {
  return modelWeight < 300 ? modelWeight + 300 : modelWeight
}
