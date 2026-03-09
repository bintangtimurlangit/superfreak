/**
 * Fetches printing config (filament types, options, pricing).
 * When NEXT_PUBLIC_API_URL is set, uses NestJS; otherwise Payload-style endpoints.
 */

import { api, isUsingNestApi } from '@/lib/api-client'
import { PRINTING, PAYLOAD } from '@/lib/api/urls'

const PAYLOAD_BASE = '/api'

export interface PrintingDataSources {
  filamentTypes: { docs: any[] }
  printingOptions: { docs: any[] }
  pricing: { docs: any[] }
}

export async function fetchPrintingData(): Promise<PrintingDataSources> {
  if (isUsingNestApi()) {
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
}
