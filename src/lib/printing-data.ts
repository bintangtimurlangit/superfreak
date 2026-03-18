/**
 * Fetches printing config (filament types, options, pricing).
 * When NEXT_PUBLIC_API_URL is set, uses NestJS; otherwise Payload-style endpoints.
 */

import { api, isUsingNestApi } from '@/lib/api-client'
import { PRINTING, PAYLOAD } from '@/lib/api/urls'

const PAYLOAD_BASE = '/api'

// Cache printing config so multiple UI components (ConfigureModal, ReviewStep, CartPage)
// don't trigger repeated network calls during a single session.
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

type CacheEntry = {
  at: number
  promise: Promise<PrintingDataSources>
}

let nestCache: CacheEntry | null = null
let payloadCache: CacheEntry | null = null

export interface PrintingDataSources {
  filamentTypes: { docs: any[] }
  printingOptions: { docs: any[] }
  pricing: { docs: any[] }
}

export async function fetchPrintingData(): Promise<PrintingDataSources> {
  const useNest = isUsingNestApi()
  const cache = useNest ? nestCache : payloadCache

  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.promise
  }

  const promise: Promise<PrintingDataSources> = (async () => {
    if (useNest) {
      const [filamentTypes, printingOptions, pricing] = await Promise.all([
        api.get(`${PRINTING.filamentTypes}?isActive=true`).then((r) => r.json()),
        api.get(`${PRINTING.options}?isActive=true`).then((r) => r.json()),
        api.get(`${PRINTING.pricing}?isActive=true`).then((r) => r.json()),
      ])
      return {
        filamentTypes: { docs: Array.isArray(filamentTypes) ? filamentTypes : [] },
        printingOptions: { docs: Array.isArray(printingOptions) ? printingOptions : [] },
        pricing: { docs: Array.isArray(pricing) ? pricing : [] },
      }
    }

    const [filamentTypesRes, printingOptionsRes, pricingRes] = await Promise.all([
      fetch(`${PAYLOAD_BASE}/filament-types?where[isActive][equals]=true&limit=100&sort=name`),
      fetch(`${PAYLOAD_BASE}/printing-options?where[isActive][equals]=true&limit=100&sort=type`),
      fetch(`${PAYLOAD_BASE}/printing-pricing?where[isActive][equals]=true&limit=100`),
    ])
    if (!filamentTypesRes.ok || !printingOptionsRes.ok || !pricingRes.ok) {
      throw new Error('Failed to fetch printing options')
    }
    const [filamentTypes, printingOptions, pricing] = await Promise.all([
      filamentTypesRes.json(),
      printingOptionsRes.json(),
      pricingRes.json(),
    ])
    return {
      filamentTypes: filamentTypes?.docs != null ? filamentTypes : { docs: [] },
      printingOptions: printingOptions?.docs != null ? printingOptions : { docs: [] },
      pricing: pricing?.docs != null ? pricing : { docs: [] },
    }
  })()

  const entry: CacheEntry = { at: Date.now(), promise }
  if (useNest) nestCache = entry
  else payloadCache = entry

  // If it fails, clear cache so a retry works.
  promise.catch(() => {
    if (useNest) nestCache = null
    else payloadCache = null
  })

  return promise
}
